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

export function svgStringFromState(args: {
  canvas: CanvasSettings
  shapes: BlobShape[]
  palette: RgbHex[]
  filters: Filters
  noiseDataUri?: string | null
  outputSize?: { width: number; height: number }
}): string {
  const { canvas, shapes, palette, filters } = args
  const blur = Math.max(0, Math.min(filters.blur, 256))
  const wCanvas = canvas.width
  const hCanvas = canvas.height
  const wOut = args.outputSize?.width ?? wCanvas
  const hOut = args.outputSize?.height ?? hCanvas
  const pad = filterPaddingPx(blur)

  const svgParts: string[] = []
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${wOut}" height="${hOut}" viewBox="0 0 ${wCanvas} ${hCanvas}">`)
  // defs
  svgParts.push('<defs>')
  svgParts.push(
    `<filter id="blur" x="${-pad}" y="${-pad}" width="${wCanvas + pad * 2}" height="${hCanvas + pad * 2}" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="${blur}"/></filter>`,
  )

  if (args.noiseDataUri && filters.grainEnabled) {
    svgParts.push(
      `<pattern id="noise" patternUnits="userSpaceOnUse" width="64" height="64">` +
        `<image href="${args.noiseDataUri}" x="0" y="0" width="64" height="64" />` +
      `</pattern>`,
    )
  }
  svgParts.push('</defs>')

  // Background rect to ensure coverage after blur
  svgParts.push(`<rect width="${wCanvas}" height="${hCanvas}" fill="${canvas.background}"/>`)

  // Shapes under blur
  svgParts.push(`<g filter="url(#blur)">`)
  // Use palette[0] as background; shape colors start from palette[1]
  const fillPalette = palette.slice(1)
  for (const s of shapes) {
    const color = fillPalette[s.fillIndex] ?? fillPalette[0] ?? palette[0] ?? '#000000'
    svgParts.push(`<path d="${pathDataFromPoints(s.points)}" fill="${color}"/>`)
  }
  svgParts.push('</g>')

  if (args.noiseDataUri && filters.grainEnabled) {
    const opacity = Math.max(0, Math.min(filters.grain, 1))
    svgParts.push(`<rect width="${wCanvas}" height="${hCanvas}" fill="url(#noise)" opacity="${opacity}"/>`)
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
export function generateNoisePngDataUri(size = 64, alpha = 0.6): string {
  if (typeof document === 'undefined') {
    return ''
  }
  const s = Math.max(4, Math.min(256, size))
  const canvas = document.createElement('canvas')
  canvas.width = s
  canvas.height = s
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(s, s)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.floor(Math.random() * 256)
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
    data[i + 3] = Math.floor(255 * alpha)
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

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


