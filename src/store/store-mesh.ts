import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import seedrandom from 'seedrandom'

// Types
export type RgbHex = `#${string}`

export type Point = { x: number; y: number }

export type BlobShape = {
  id: string
  points: Point[]
  fillIndex: number // index in palette
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
    frameWidth?: number
    frameHeight?: number
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
  shuffleColors: () => void
  setSelectedShape: (id?: string) => void
  setUi: (ui: Partial<MeshState['ui']>) => void
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
  | 'shuffleColors'
  | 'setSelectedShape'
  | 'setUi'
  | 'updateShape'
  | 'undo'
  | 'redo'
  | 'toShareString'
  | 'fromShareString'
>

const DEFAULT_CANVAS: CanvasSettings = {
  width: 1024,
  height: 768,
  background: '#6d1d82',
}

export const DEFAULT_FILTERS: Filters = {
  blur: 96,
  grainEnabled: true,
  grain: 0.15,
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
): Point[] {
  const center: Point = { x: rng.float(bounds.w * 0.2, bounds.w * 0.8), y: rng.float(bounds.h * 0.2, bounds.h * 0.8) }
  const points: Point[] = []
  const vertexCount = rng.int(6, 10)
  const baseRadius = Math.min(bounds.w, bounds.h) * rng.float(0.25, 0.45)
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2
    const radius = baseRadius * rng.float(0.6, 1)
    points.push({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius })
  }
  return points
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
  for (let i = 0; i < args.count; i++) {
    const pts = generatePolygon(r, { w, h })
    // Use palette[0] as background; shape fills index into palette.slice(1)
    const fillPaletteLength = Math.max(1, (args.palette?.length ?? 0) - 1)
    shapes.push({ id: createId('blob'), points: pts, fillIndex: i % fillPaletteLength })
  }
  return shapes
}

const initialStateBase = {
  palette: ['#6d1d82', '#ef4444', '#ffffff'] as RgbHex[],
  filters: DEFAULT_FILTERS,
  canvas: DEFAULT_CANVAS,
  seed: 'seed-1',
  shapes: [] as BlobShape[],
  selectedShapeId: undefined as string | undefined,
  ui: { showCenters: true, showVertices: false, frameWidth: undefined, frameHeight: undefined },
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
            // Shapes use palette.slice(1); max index is (palette.length - 2)
            fillIndex: Math.max(0, Math.min(s.fillIndex, Math.max(0, palette.length - 2))),
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
        shuffleColors: () => {
          const curr = get()
          const r = prng(curr.seed + '-shuffle')
          // Shapes use palette.slice(1); range is [0, maxIndex]
          const maxIndex = Math.max(0, curr.palette.length - 2)
          const shapes = curr.shapes.map((s) => ({ ...s, fillIndex: r.int(0, maxIndex) }))
          commit({ shapes })
        },
        setSelectedShape: (id) => set({ selectedShapeId: id }),
        setUi: (ui) => set((s) => ({ ui: { ...s.ui, ...ui } })),
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

