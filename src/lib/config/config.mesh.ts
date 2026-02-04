import type { CanvasSettings, Filters } from "@/types/types.mesh";

export const DEFAULT_CANVAS_SIZE = {
	width: 1920,
	height: 1080,
};

export const DEFAULT_CANVAS: CanvasSettings = {
	width: DEFAULT_CANVAS_SIZE.width,
	height: DEFAULT_CANVAS_SIZE.height,
	background: { id: crypto.randomUUID(), color: "#ffffff" },
};

export const DEFAULT_FILTERS: Filters = {
	blur: 75,
	grainEnabled: true,
	grain: 0.65,
	opacity: 100,
	spread: 100,
};

// Generation configuration (tweak here later)
export const GEN_CONFIG = {
	overscan: 0.4, // how far centers can spawn outside the canvas (fraction of size)
	insideFraction: 4 / 6, // for 6 shapes => 4 inside, rest outside
	insideRadius: { min: 0.3, max: 0.55 },
	outsideRadius: { min: 0.34, max: 0.62 },
	maxPlacementTries: 300,
	insidePadding: 0.06, // fraction of min side kept clear for inside centers
	bestCandidateSamples: { min: 12, max: 48 },
	compositionBiasWeight: 0.7,
	shapeVariety: {
		sizeJitter: { min: 0.85, max: 1.15 },
		aspect: { min: 0.7, max: 1.4 },
		angleJitter: { min: 0.05, max: 0.28 },
		radiusJitter: { min: 0.15, max: 0.45 },
	},
};
