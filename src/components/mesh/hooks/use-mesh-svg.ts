import { useMemo } from 'react'
import type { BlobShape, CanvasSettings, Filters, RgbHex } from '@/store/store-mesh'
import { generateNoisePngDataUri, svgDataUrl, svgStringFromState } from '@/lib/mesh-svg'

type UseMeshSvgArgs = {
  canvas: CanvasSettings
  shapes: BlobShape[]
  palette: RgbHex[]
  filters: Filters
}

export function useMeshSvg({ canvas, shapes, palette, filters }: UseMeshSvgArgs) {
  // Generate once per mount. Small PNG used in pattern; OK to memo forever.
  const noise = useMemo(() => generateNoisePngDataUri(64, 0.35), [])

  // Create the SVG string for current state; heavy work is string concat, keep memoized.
  const svg = useMemo(
    () =>
      svgStringFromState({
        canvas,
        shapes,
        palette,
        filters,
        noiseDataUri: noise,
      }),
    [canvas, shapes, palette, filters, noise],
  )

  // Data URL derivative, memoized from svg
  const svgUrl = useMemo(() => svgDataUrl(svg), [svg])

  return { svg, svgUrl, noise }
}


