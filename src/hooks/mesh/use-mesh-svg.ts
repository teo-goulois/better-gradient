import { svgDataUrl, svgStringFromState } from "@/lib/mesh-svg";
import { useMeshStore } from "@/store/store-mesh";
import { useMemo } from "react";

export function useMeshSvg() {
	const canvas = useMeshStore((s) => s.canvas);
	const shapes = useMeshStore((s) => s.shapes);
	const shapesLive = useMeshStore((s) => s.shapesLive);
	const palette = useMeshStore((s) => s.palette);
	const filters = useMeshStore((s) => s.filters);
	// Create the SVG string for current state; heavy work is string concat, keep memoized.
	const svg = useMemo(
		() =>
			svgStringFromState({
				canvas,
				shapes: shapesLive ?? shapes,
				palette,
				filters,
			}),
		[canvas, shapes, shapesLive, palette, filters],
	);

	// Data URL derivative, memoized from svg
	const svgUrl = useMemo(() => svgDataUrl(svg), [svg]);

	return { svg, svgUrl, canvas };
}
