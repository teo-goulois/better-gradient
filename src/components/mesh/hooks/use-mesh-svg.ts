import { svgDataUrl, svgStringFromState } from "@/lib/mesh-svg";
import type {
	BlobShape,
	CanvasSettings,
	Filters,
	RgbHex,
} from "@/types/types.mesh";
import { useMemo } from "react";

type UseMeshSvgArgs = {
	canvas: CanvasSettings;
	shapes: BlobShape[];
	palette: RgbHex[];
	filters: Filters;
};

export function useMeshSvg({
	canvas,
	shapes,
	palette,
	filters,
}: UseMeshSvgArgs) {
	// Create the SVG string for current state; heavy work is string concat, keep memoized.
	const svg = useMemo(
		() =>
			svgStringFromState({
				canvas,
				shapes,
				palette,
				filters,
			}),
		[canvas, shapes, palette, filters],
	);

	// Data URL derivative, memoized from svg
	const svgUrl = useMemo(() => svgDataUrl(svg), [svg]);

	return { svg, svgUrl };
}
