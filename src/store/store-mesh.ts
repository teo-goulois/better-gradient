import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import seedrandom from 'seedrandom'

// Types
export type RgbHex = {
  id: string
  color: `#${string}`
}

export type Point = { x: number; y: number }

export type BlobShape = {
  id: string
  points: Point[]
  fillIndex: number // index in palette (includes background at index 0)
}

export type CanvasSettings = {
  width: number
  height: number
  background: RgbHex
}

export type Filters = {
  blur: number
  grainEnabled: boolean
  grain: number // 0..1
}

export type MeshState = {
  palette: RgbHex[]
  shapes: BlobShape[]
  filters: Filters
  canvas: CanvasSettings
  seed: string
  selectedShapeId?: string
  ui: {
    showCenters: boolean
    showVertices: boolean
    containerWidth?: number
    containerHeight?: number
    frameWidth?: number
    frameHeight?: number
    maintainAspectRatio: boolean
    aspectRatio?: number
  }

  // History
  _past: string[]
  _future: string[]

  // Actions
  randomize: (opts?: { seed?: string; count?: number }) => void
  setPalette: (palette: RgbHex[]) => void
  setFilters: (filters: Partial<Filters>) => void
  setCanvas: (canvas: Partial<CanvasSettings>) => void
  setShapes: (shapes: BlobShape[]) => void
  moveShapeUp: (shapeId: string) => void
  moveShapeDown: (shapeId: string) => void
  shuffleColors: () => void
  setSelectedShape: (id?: string) => void
  setUi: (ui: Partial<MeshState['ui']>) => void
  setUiFrameSize: (size: { width?: number; height?: number }) => void
  toggleAspectLock: (locked: boolean) => void
  updateShape: (id: string, updater: (s: BlobShape) => BlobShape) => void
  undo: () => void
  redo: () => void
  toShareString: () => string
  fromShareString: (encoded: string) => void
}

// Helpers
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function serialize(state: Omit<MeshState, keyof MeshStoreActions>) {
  return JSON.stringify(state)
}

function deserialize(text: string): Omit<MeshState, keyof MeshStoreActions> {
  return JSON.parse(text)
}

type MeshStoreActions = Pick<
  MeshState,
  | 'randomize'
  | 'setPalette'
  | 'setFilters'
  | 'setCanvas'
  | 'setShapes'
  | 'moveShapeUp'
  | 'moveShapeDown'
  | 'shuffleColors'
  | 'setSelectedShape'
  | 'setUi'
  | 'updateShape'
  | 'undo'
  | 'redo'
  | 'toShareString'
  | 'fromShareString'
  | 'setUiFrameSize'
  | 'toggleAspectLock'
>

const DEFAULT_CANVAS: CanvasSettings = {
  width: 1024,
  height: 768,
  background: { id: crypto.randomUUID(), color: '#6d1d82' },
}

export const DEFAULT_FILTERS: Filters = {
  blur: 75,
  grainEnabled: true,
  grain: 0.65,
}

// Generation configuration (tweak here later)
const GEN_CONFIG = {
  overscan: 0.4, // how far centers can spawn outside the canvas (fraction of size)
  insideFraction: 4 / 6, // for 6 shapes => 4 inside, rest outside
  insideRadius: { min: 0.30, max: 0.55 },
  outsideRadius: { min: 0.34, max: 0.62 },
  maxPlacementTries: 300,
}

function createId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function prng(seed: string) {
  const rng = seedrandom(seed)
  return {
    int: (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min,
    float: (min: number, max: number) => rng() * (max - min) + min,
    pick: <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)],
  }
}

function generatePolygon(
  rng: ReturnType<typeof prng>,
  bounds: { w: number; h: number },
  center?: Point,
  radiusScale?: { min: number; max: number },
): Point[] {
  const cx = center?.x ?? rng.float(bounds.w * 0.0, bounds.w * 1.0)
  const cy = center?.y ?? rng.float(bounds.h * 0.0, bounds.h * 1.0)
  const points: Point[] = []
  const vertexCount = rng.int(6, 10)
  const minScale = Math.max(0.05, radiusScale?.min ?? 0.30)
  const maxScale = Math.max(minScale, radiusScale?.max ?? 0.55)
  const baseRadius = Math.min(bounds.w, bounds.h) * rng.float(minScale, maxScale)
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2
    const radius = baseRadius * rng.float(0.6, 1)
    points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  }
  return points
}

function distanceSq(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

function sampleCentersWithMinDistance(
  rng: ReturnType<typeof prng>,
  count: number,
  bounds: { w: number; h: number },
  overscan = GEN_CONFIG.overscan,
  region: 'any' | 'inside' | 'outside' = 'any',
  existing: Point[] = [],
): Point[] {
  const centers: Point[] = [...existing]
  const added: Point[] = []
  const minSide = Math.min(bounds.w, bounds.h)
  // Base spacing scales down with higher counts; empirically tuned
  const base = minSide * 0.22
  const scale = Math.sqrt(6 / Math.max(1, count + existing.length))
  const minDist = Math.max(24, Math.min(minSide * 0.45, base * scale))
  const minDistSq = minDist * minDist
  const xMin = -overscan * bounds.w
  const xMax = (1 + overscan) * bounds.w
  const yMin = -overscan * bounds.h
  const yMax = (1 + overscan) * bounds.h

  const isInside = (p: Point) => p.x >= 0 && p.x <= bounds.w && p.y >= 0 && p.y <= bounds.h
  const regionOk = (p: Point) =>
    region === 'any' ? true : region === 'inside' ? isInside(p) : !isInside(p)

  for (let i = 0; i < count; i++) {
    let placed = false
    for (let tries = 0; tries < GEN_CONFIG.maxPlacementTries && !placed; tries++) {
      const candidate = { x: rng.float(xMin, xMax), y: rng.float(yMin, yMax) }
      if (!regionOk(candidate)) continue
      let ok = true
      for (let j = 0; j < centers.length; j++) {
        if (distanceSq(candidate, centers[j]) < minDistSq) {
          ok = false
          break
        }
      }
      if (ok) {
        centers.push(candidate)
        added.push(candidate)
        placed = true
      }
    }
    if (!placed) {
      // Fallback: place without region constraint
      const candidate = { x: rng.float(xMin, xMax), y: rng.float(yMin, yMax) }
      centers.push(candidate)
      added.push(candidate)
    }
  }
  return added
}

function generateShapes(args: {
  seed: string
  count: number
  canvas: CanvasSettings
  palette: RgbHex[]
}): BlobShape[] {
  const r = prng(args.seed)
  const shapes: BlobShape[] = []
  const { width: w, height: h } = args.canvas

  // Compute inside/outside split (easily adjustable via GEN_CONFIG)
  const insideCount = Math.max(0, Math.min(args.count, Math.round(args.count * GEN_CONFIG.insideFraction)))
  const outsideCount = Math.max(0, args.count - insideCount)

  const centersInside = sampleCentersWithMinDistance(r, insideCount, { w, h }, GEN_CONFIG.overscan, 'inside')
  const centersOutside = sampleCentersWithMinDistance(r, outsideCount, { w, h }, GEN_CONFIG.overscan, 'outside', centersInside)
  const centers = [...centersInside, ...centersOutside]

  for (let i = 0; i < args.count; i++) {
    const c = centers[i]
    const radiusCfg = i < insideCount ? GEN_CONFIG.insideRadius : GEN_CONFIG.outsideRadius
    const pts = generatePolygon(r, { w, h }, c, radiusCfg)
    const paletteLength = Math.max(1, (args.palette?.length ?? 0))
    shapes.push({ id: createId('blob'), points: pts, fillIndex: i % paletteLength })
  }
  return shapes
}

// Default initial content so the preview renders immediately on first load
const INITIAL_PALETTE = [{ id: crypto.randomUUID(), color: '#6d1d82'}, { id: crypto.randomUUID(), color: '#ef4444'}, { id: crypto.randomUUID(), color: '#ffffff'}] as RgbHex[]
const INITIAL_SEED = 'seed-1'
const INITIAL_SHAPES: BlobShape[] = generateShapes({
  seed: INITIAL_SEED,
  count: 6,
  canvas: DEFAULT_CANVAS,
  palette: INITIAL_PALETTE,
})

const initialStateBase = {
  palette: INITIAL_PALETTE,
  filters: DEFAULT_FILTERS,
  canvas: DEFAULT_CANVAS,
  seed: INITIAL_SEED,
  shapes: INITIAL_SHAPES,
  selectedShapeId: undefined as string | undefined,
  ui: { showCenters: true, showVertices: false, frameWidth: undefined, frameHeight: undefined, maintainAspectRatio: false, aspectRatio: undefined },
  _past: [] as string[],
  _future: [] as string[],
}

export const useMeshStore = create<MeshState>()(
  persist(
    (set, get) => {
      const commit = (next: Partial<MeshState>) => {
        const curr = get()
        const snapshot = serialize({
          palette: curr.palette,
          shapes: curr.shapes,
          filters: curr.filters,
          canvas: curr.canvas,
          seed: curr.seed,
          selectedShapeId: curr.selectedShapeId,
          ui: curr.ui,
          _past: [],
          _future: [],
        })
        set({ _past: [...curr._past, snapshot], _future: [] })
        set(next)
      }

      const api: MeshStoreActions = {
        randomize: (opts) => {
          const curr = get()
          const nextSeed = opts?.seed ?? `${Date.now()}`
          const count = clamp(opts?.count ?? Math.max(3, curr.shapes.length || 6), 3, 10)
          const shapes = generateShapes({ seed: nextSeed, count, canvas: curr.canvas, palette: curr.palette })
          commit({ seed: nextSeed, shapes })
        },
        setPalette: (palette) => {
          const curr = get()
          // clamp shape fill indices in case palette shrunk
          const clampedShapes = curr.shapes.map((s) => ({
            ...s,
            // Shapes index directly into full palette [0..length-1]
            fillIndex: Math.max(0, Math.min(s.fillIndex, Math.max(0, palette.length - 1))),
          }))
          commit({ palette, shapes: clampedShapes, canvas: { ...curr.canvas, background: palette[0] ?? curr.canvas.background } })
        },
        
        setFilters: (filters) => {
          const curr = get()
          commit({ filters: { ...curr.filters, ...filters, blur: clamp(filters.blur ?? curr.filters.blur, 0, 256), grain: clamp(filters.grain ?? curr.filters.grain, 0, 1) } })
        },
        setCanvas: (canvas) => {
          const curr = get()
          const width = clamp(canvas.width ?? curr.canvas.width, 64, 6000)
          const height = clamp(canvas.height ?? curr.canvas.height, 64, 6000)
          commit({ canvas: { ...curr.canvas, ...canvas, width, height } })
        },
        setShapes: (shapes) => commit({ shapes }),
        moveShapeUp: (shapeId) => {
          const curr = get()
          const index = curr.shapes.findIndex(s => s.id === shapeId)
          if (index > 0) {
            const shapes = [...curr.shapes]
            const [shape] = shapes.splice(index, 1)
            shapes.splice(index - 1, 0, shape)
            commit({ shapes })
          }
        },
        moveShapeDown: (shapeId) => {
          const curr = get()
          const index = curr.shapes.findIndex(s => s.id === shapeId)
          if (index < curr.shapes.length - 1) {
            const shapes = [...curr.shapes]
            const [shape] = shapes.splice(index, 1)
            shapes.splice(index + 1, 0, shape)
            commit({ shapes })
          }
        },
        shuffleColors: () => {
          const curr = get()
          // Include changing entropy so repeated shuffles produce different results
          const entropy = `${curr._past.length}-${Date.now()}`
          const r = prng(`${curr.seed}-shuffle-${entropy}`)
          // Shapes index into full palette; range is [0, palette.length - 1]
          const maxIndex = Math.max(0, curr.palette.length - 1)
          const shapes = curr.shapes.map((s) => ({ ...s, fillIndex: r.int(0, maxIndex) }))
          commit({ shapes })
        },
        setSelectedShape: (id) => set({ selectedShapeId: id }),
        setUi: (ui) => set((s) => ({ ui: { ...s.ui, ...ui } })),
        setUiFrameSize: (size) =>
          set((s) => {
            const curr = s as MeshState
            const next: Partial<MeshState['ui']> = {}
            const min = 50
            const max = 6000
            const w = size.width ?? curr.ui.frameWidth ?? curr.canvas.width
            const h = size.height ?? curr.ui.frameHeight ?? curr.canvas.height
            const locked = curr.ui.maintainAspectRatio
            const ar = curr.ui.aspectRatio ?? (curr.ui.frameWidth && curr.ui.frameHeight ? curr.ui.frameWidth / curr.ui.frameHeight : curr.canvas.width / curr.canvas.height)
            let nextW = clamp(w, min, max)
            let nextH = clamp(h, min, max)
            if (locked) {
              if (size.width !== undefined && size.height === undefined) {
                nextH = Math.round(nextW / Math.max(0.01, ar))
              } else if (size.height !== undefined && size.width === undefined) {
                nextW = Math.round(nextH * Math.max(0.01, ar))
              }
            }
            next.frameWidth = nextW
            next.frameHeight = nextH
            return { ui: { ...curr.ui, ...next } }
          }),
        toggleAspectLock: (locked: boolean) =>
          set((s) => {
            const curr = s as MeshState
            const w = curr.ui.frameWidth ?? curr.canvas.width
            const h = curr.ui.frameHeight ?? curr.canvas.height
            const ar = Math.max(0.01, w / h)
            return { ui: { ...curr.ui, maintainAspectRatio: locked, aspectRatio: locked ? ar : curr.ui.aspectRatio } }
          }),
        updateShape: (id, updater) => {
          const curr = get()
          const shapes = curr.shapes.map((s) => (s.id === id ? updater(s) : s))
          commit({ shapes })
        },
        undo: () => {
          const curr = get()
          const prev = curr._past.at(-1)
          if (!prev) return
          const rest = curr._past.slice(0, -1)
          const present = serialize({
            palette: curr.palette,
            shapes: curr.shapes,
            filters: curr.filters,
            canvas: curr.canvas,
            seed: curr.seed,
            selectedShapeId: curr.selectedShapeId,
            ui: curr.ui,
            _past: [],
            _future: [],
          })
          const parsed = deserialize(prev)
          set({ ...parsed, _past: rest, _future: [present, ...curr._future] } as Partial<MeshState> as MeshState)
        },
        redo: () => {
          const curr = get()
          const next = curr._future.at(0)
          if (!next) return
          const future = curr._future.slice(1)
          const present = serialize({
            palette: curr.palette,
            shapes: curr.shapes,
            filters: curr.filters,
            canvas: curr.canvas,
            seed: curr.seed,
            selectedShapeId: curr.selectedShapeId,
            ui: curr.ui,
            _past: [],
            _future: [],
          })
          const parsed = deserialize(next)
          set({ ...parsed, _past: [...curr._past, present], _future: future } as Partial<MeshState> as MeshState)
        },
        toShareString: () => {
          const curr = get()
          const json = serialize({
            palette: curr.palette,
            shapes: curr.shapes,
            filters: curr.filters,
            canvas: curr.canvas,
            seed: curr.seed,
            selectedShapeId: undefined,
            ui: curr.ui,
            _past: [],
            _future: [],
          })
          return btoa(unescape(encodeURIComponent(json)))
        },
        fromShareString: (encoded: string) => {
          try {
            const json = decodeURIComponent(escape(atob(encoded)))
            const data = JSON.parse(json)
            set({ ...initialStateBase, ...data })
          } catch (e) {
            // ignore malformed state
          }
        },
      }

      return {
        ...initialStateBase,
        ...api,
      } as unknown as MeshState
    },
    {
      name: 'mesh-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        palette: state.palette,
        shapes: state.shapes,
        filters: state.filters,
        canvas: state.canvas,
        seed: state.seed,
        ui: state.ui,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize shapes if empty
        const s = state as unknown as MeshState
        if (s && (!s.shapes || s.shapes.length === 0)) {
          const shapes = generateShapes({ seed: s.seed, count: 6, canvas: s.canvas ?? DEFAULT_CANVAS, palette: s.palette ?? [] })
          ;(state as any).shapes = shapes
        }
      },
    },
  ),
)

export type { MeshState as MeshStore, BlobShape as MeshBlob, Point as MeshPoint }

