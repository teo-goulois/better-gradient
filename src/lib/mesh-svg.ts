import type { BlobShape, CanvasSettings, Filters, Point, RgbHex } from '@/store/store-mesh'

// Convert points to SVG path data
export function pathDataFromPoints(points: Point[]): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  const move = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
  const lines = rest.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  return `${move} ${lines} Z`
}

// Filter padding to avoid clipping
export function filterPaddingPx(blurPx: number): number {
  // 2x blur radius padding is generally safe
  return Math.max(blurPx * 2, 64)
}

// Generate an SVG string from the state
export function svgStringFromState(args: {
  canvas: CanvasSettings
  shapes: BlobShape[]
  palette: RgbHex[]
  filters: Filters
  outputSize?: { width: number; height: number }
  includeVertices?: boolean
  vertexSizePx?: number
}): string {
  const { canvas, shapes, palette, filters } = args
  const blur = Math.max(0, Math.min(filters.blur, 256))
  const wCanvas = canvas.width
  const hCanvas = canvas.height
  const wOut = args.outputSize?.width ?? wCanvas
  const hOut = args.outputSize?.height ?? hCanvas
  const pad = filterPaddingPx(blur)
  const includeVertices = !!args.includeVertices
  const vertexSizePx = Math.max(2, Math.min(64, args.vertexSizePx ?? 16))
  const scaleX = wOut / wCanvas
  const scaleY = hOut / hCanvas
  const avgScale = (scaleX + scaleY) / 2

  const svgParts: string[] = []
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${wOut}" height="${hOut}" viewBox="0 0 ${wCanvas} ${hCanvas}" preserveAspectRatio="none">`)
  // defs
  svgParts.push('<defs>')
  // Expand blur region to include off-canvas shapes so their blur bleeds correctly into the viewport
  let minX = 0
  let minY = 0
  let maxX = wCanvas
  let maxY = hCanvas
  if (shapes.length > 0) {
    minX = Math.min(0, ...shapes.flatMap((s) => s.points.map((p) => p.x)))
    minY = Math.min(0, ...shapes.flatMap((s) => s.points.map((p) => p.y)))
    maxX = Math.max(wCanvas, ...shapes.flatMap((s) => s.points.map((p) => p.x)))
    maxY = Math.max(hCanvas, ...shapes.flatMap((s) => s.points.map((p) => p.y)))
  }
  const filterX = Math.floor(Math.min(-pad, minX - pad))
  const filterY = Math.floor(Math.min(-pad, minY - pad))
  const filterW = Math.ceil(Math.max(wCanvas + pad * 2, maxX + pad) - filterX)
  const filterH = Math.ceil(Math.max(hCanvas + pad * 2, maxY + pad) - filterY)
  svgParts.push(
    `<filter id="blur" x="${filterX}" y="${filterY}" width="${filterW}" height="${filterH}" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="${blur}"/></filter>`,
  )

  if (filters.grainEnabled) {
    // Procedural grain filter using turbulence + specular lighting
    svgParts.push(
      `<filter id="grain" x="${filterX}" y="${filterY}" width="${filterW}" height="${filterH}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">` +
        `<feTurbulence type="fractalNoise" baseFrequency=".2" numOctaves="4" seed="15" stitchTiles="no-stitch" x="0" y="0" width="${wCanvas}" height="${hCanvas}" result="turbulence"/>` +
        `<feSpecularLighting surfaceScale="10" specularConstant="1.21" specularExponent="20" lighting-color="#fff" x="0" y="0" width="${wCanvas}" height="${hCanvas}" in="turbulence" result="specularLighting">` +
          `<feDistantLight azimuth="3" elevation="100"/>` +
        `</feSpecularLighting>` +
      `</filter>`,
    )
  }
  svgParts.push('</defs>')

  // Background rect to ensure coverage after blur
  svgParts.push(`<rect width="${wCanvas}" height="${hCanvas}" fill="${canvas.background.color}"/>`)

  // Shapes under blur
  svgParts.push(`<g filter="url(#blur)">`)
  for (const s of shapes) {
    // Shapes can use any entry of the palette, including background at index 0
    const color = palette[s.fillIndex].color ?? palette[0].color ?? '#000000'
    svgParts.push(`<path d="${pathDataFromPoints(s.points)}" fill="${color}"/>`)
  }
  svgParts.push('</g>')

  // Optional vertices overlay (drawn on top)
  if (includeVertices) {
    const r = (vertexSizePx / 2) / avgScale
    for (const s of shapes) {
      for (const p of s.points) {
        const cx = p.x
        const cy = p.y
        // white filled circle with black stroke to match overlay style
        svgParts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>`)
      }
    }
  }

  if (filters.grainEnabled) {
    const opacity = Math.max(0, Math.min(filters.grain, 1))
    svgParts.push(`<rect width="${wCanvas}" height="${hCanvas}" fill="#FFFFFF" filter="url(#grain)" opacity="${opacity}"/>`)
  }

  svgParts.push('</svg>')
  return svgParts.join('')
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function cssBackgroundFromState(args: {
  canvas: CanvasSettings
  shapes: BlobShape[]
  palette: RgbHex[]
  filters: Filters
}): string {
  const svg = svgStringFromState({ ...args })
  const data = svgDataUrl(svg)
  return `background-image: url("${data}");\nbackground-size: cover;\nbackground-position: center;`
}

// Generate a tiny noise PNG data URI (synchronous)
// Removed PNG noise in favor of SVG procedural grain filter

export async function svgToPngDataUrl(svg: string, scaleOrSize: number | { width: number; height: number; scale?: number } = 1): Promise<string> {
  const img = new Image()
  const url = svgDataUrl(svg)
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = (e) => reject(e)
    img.src = url
  })

  let width: number
  let height: number
  let scale = 1
  if (typeof scaleOrSize === 'number') {
    scale = scaleOrSize
    width = Math.max(1, Math.round((img.width || 1) * scale))
    height = Math.max(1, Math.round((img.height || 1) * scale))
  } else {
    scale = scaleOrSize.scale ?? 1
    width = Math.max(1, Math.round(scaleOrSize.width * scale))
    height = Math.max(1, Math.round(scaleOrSize.height * scale))
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}


