import type {
	BlobShape,
	CanvasSettings,
	Filters,
	RgbHex,
} from "@/types/types.mesh";

// Decode base64 share string to plain state object for preview
function base64Decode(encoded: string): string {
	if (typeof window === "undefined") {
		// SSR / Node
		return Buffer.from(encoded, "base64").toString("utf-8");
	}
	// Browser - ensure Unicode-safe decode
	// eslint-disable-next-line deprecation/deprecation
	return decodeURIComponent(escape(atob(encoded)));
}

export function decodeShareString(encoded: string): {
	palette: RgbHex[];
	shapes: BlobShape[];
	filters: Filters;
	canvas: CanvasSettings;
} | null {
	try {
		const json = base64Decode(encoded);
		const data = JSON.parse(json);
		return {
			palette: data.palette,
			shapes: data.shapes,
			filters: data.filters,
			canvas: data.canvas,
		};
	} catch {
		return null;
	}
}
