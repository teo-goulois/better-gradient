import type { MeshState, MeshStoreActions } from "@/store/store-mesh";
import type {
	BlobShape,
	CanvasSettings,
	Point,
	RgbHex,
} from "@/types/types.mesh";
import { GEN_CONFIG } from "../config/config.mesh";

// Helpers
export function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number) {
	return clamp(value, 0, 1);
}

export function serialize(state: Omit<MeshState, keyof MeshStoreActions>) {
	return JSON.stringify(state);
}

export function deserialize(
	text: string,
): Omit<MeshState, keyof MeshStoreActions> {
	return JSON.parse(text);
}

export function createId(prefix = "id"): string {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function xmur3(input: string) {
	let h = 1779033703 ^ input.length;
	for (let i = 0; i < input.length; i++) {
		h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	return () => {
		h = Math.imul(h ^ (h >>> 16), 2246822507);
		h = Math.imul(h ^ (h >>> 13), 3266489909);
		h ^= h >>> 16;
		return h >>> 0;
	};
}

function mulberry32(seed: number) {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let value = Math.imul(t ^ (t >>> 15), t | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export function prng(seed: string) {
	const seedFactory = xmur3(seed);
	const rng = mulberry32(seedFactory());
	return {
		int: (min: number, max: number) =>
			Math.floor(rng() * (max - min + 1)) + min,
		float: (min: number, max: number) => rng() * (max - min) + min,
		pick: <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)],
	};
}

export type CompositionMood =
	| "balanced"
	| "centered"
	| "diagonal"
	| "corner"
	| "horizon"
	| "orbit"
	| "triad";

const MOOD_WEIGHTS: { mood: CompositionMood; weight: number }[] = [
	{ mood: "balanced", weight: 0.2 },
	{ mood: "centered", weight: 0.16 },
	{ mood: "diagonal", weight: 0.16 },
	{ mood: "corner", weight: 0.14 },
	{ mood: "horizon", weight: 0.14 },
	{ mood: "orbit", weight: 0.1 },
	{ mood: "triad", weight: 0.1 },
];

function pickCompositionMood(rng: ReturnType<typeof prng>): CompositionMood {
	const total = MOOD_WEIGHTS.reduce((acc, item) => acc + item.weight, 0);
	const roll = rng.float(0, total);
	let acc = 0;
	for (const item of MOOD_WEIGHTS) {
		acc += item.weight;
		if (roll <= acc) return item.mood;
	}
	return "balanced";
}

type BiasFn = (p: Point) => number;

function makeBiasHelpers(bounds: { w: number; h: number }) {
	const center = { x: 0.5, y: 0.5 };
	const normalize = (p: Point) => ({ x: p.x / bounds.w, y: p.y / bounds.h });
	const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
	const distanceToLine = (p: Point, a: Point, b: Point) => {
		const apx = p.x - a.x;
		const apy = p.y - a.y;
		const abx = b.x - a.x;
		const aby = b.y - a.y;
		const abLenSq = abx * abx + aby * aby || 1;
		const t = clamp01((apx * abx + apy * aby) / abLenSq);
		const proj = { x: a.x + abx * t, y: a.y + aby * t };
		return dist(p, proj);
	};
	const edgeBias = (p: Point) => {
		const n = normalize(p);
		const dx = n.x < 0 ? -n.x : n.x > 1 ? n.x - 1 : 0;
		const dy = n.y < 0 ? -n.y : n.y > 1 ? n.y - 1 : 0;
		const d = Math.hypot(dx, dy);
		return clamp01(1 - d / (GEN_CONFIG.overscan ?? 0.4));
	};
	return { center, normalize, dist, distanceToLine, edgeBias };
}

function createMoodBias(
	rng: ReturnType<typeof prng>,
	bounds: { w: number; h: number },
	mood: CompositionMood,
): { inside: BiasFn; outside: BiasFn; name: CompositionMood } {
	const { center, normalize, dist, distanceToLine, edgeBias } =
		makeBiasHelpers(bounds);

	let baseBias: BiasFn = () => 0;

	switch (mood) {
		case "centered": {
			baseBias = (p) => {
				const n = normalize(p);
				const d = dist(n, center) / 0.72;
				return clamp01(1 - d);
			};
			break;
		}
		case "diagonal": {
			const flip = rng.float(0, 1) < 0.5;
			const a = flip ? { x: 0, y: 1 } : { x: 0, y: 0 };
			const b = flip ? { x: 1, y: 0 } : { x: 1, y: 1 };
			baseBias = (p) => {
				const n = normalize(p);
				const d = distanceToLine(n, a, b);
				return clamp01(1 - d / 0.35);
			};
			break;
		}
		case "corner": {
			const anchors = [
				{ x: 0.2, y: 0.2 },
				{ x: 0.8, y: 0.2 },
				{ x: 0.8, y: 0.8 },
				{ x: 0.2, y: 0.8 },
			];
			const anchor = rng.pick(anchors);
			baseBias = (p) => {
				const n = normalize(p);
				const d = dist(n, anchor) / 0.9;
				return clamp01(1 - d);
			};
			break;
		}
		case "horizon": {
			const bandY = rng.float(0.3, 0.7);
			const bandWidth = rng.float(0.18, 0.28);
			baseBias = (p) => {
				const n = normalize(p);
				return clamp01(1 - Math.abs(n.y - bandY) / bandWidth);
			};
			break;
		}
		case "orbit": {
			const radius = rng.float(0.32, 0.48);
			const band = rng.float(0.12, 0.2);
			baseBias = (p) => {
				const n = normalize(p);
				const d = Math.hypot(n.x - center.x, n.y - center.y);
				return clamp01(1 - Math.abs(d - radius) / band);
			};
			break;
		}
		case "triad": {
			const offset = rng.float(0, Math.PI * 2);
			const radial = rng.float(0.28, 0.38);
			const anchors = new Array(3).fill(0).map((_, i) => ({
				x: center.x + Math.cos(offset + (i * Math.PI * 2) / 3) * radial,
				y: center.y + Math.sin(offset + (i * Math.PI * 2) / 3) * radial,
			}));
			baseBias = (p) => {
				const n = normalize(p);
				let best = 0;
				for (const anchor of anchors) {
					const d = dist(n, anchor) / 0.8;
					best = Math.max(best, clamp01(1 - d));
				}
				return best;
			};
			break;
		}
		case "balanced":
		default: {
			baseBias = () => 0;
			break;
		}
	}

	const inside = (p: Point) => clamp01(baseBias(p));
	const outside = (p: Point) => clamp01(baseBias(p) * 0.7 + edgeBias(p) * 0.3);

	return { inside, outside, name: mood };
}

export function generatePolygon(
	rng: ReturnType<typeof prng>,
	bounds: { w: number; h: number },
	center?: Point,
	radiusScale?: { min: number; max: number },
): Point[] {
	const cx = center?.x ?? rng.float(bounds.w * 0.0, bounds.w * 1.0);
	const cy = center?.y ?? rng.float(bounds.h * 0.0, bounds.h * 1.0);
	const points: Point[] = [];
	const minScale = Math.max(0.05, radiusScale?.min ?? 0.3);
	const maxScale = Math.max(minScale, radiusScale?.max ?? 0.55);
	const minSide = Math.min(bounds.w, bounds.h);
	const variety = GEN_CONFIG.shapeVariety ?? {
		sizeJitter: { min: 0.85, max: 1.15 },
		aspect: { min: 0.7, max: 1.4 },
		angleJitter: { min: 0.05, max: 0.28 },
		radiusJitter: { min: 0.15, max: 0.45 },
	};

	// Pick a shape style to diversify silhouettes
	const styleRoll = rng.float(0, 1);
	const isRound = styleRoll < 0.33;
	const isAngular = styleRoll > 0.72;
	const vertexCount = isRound
		? rng.int(9, 13)
		: isAngular
			? rng.int(5, 8)
			: rng.int(7, 11);

	const rotation = rng.float(0, Math.PI * 2);
	const angleJitter = rng.float(
		isRound ? variety.angleJitter.min * 0.6 : variety.angleJitter.min,
		isAngular ? variety.angleJitter.max : variety.angleJitter.max * 0.8,
	);
	const radiusJitter = rng.float(
		isRound ? variety.radiusJitter.min : variety.radiusJitter.min * 1.15,
		isAngular ? variety.radiusJitter.max : variety.radiusJitter.max * 0.85,
	);

	const sizeJitter = rng.float(variety.sizeJitter.min, variety.sizeJitter.max);
	const baseRadius = minSide * rng.float(minScale, maxScale) * sizeJitter;

	const aspect = rng.float(variety.aspect.min, variety.aspect.max);
	let scaleX = aspect >= 1 ? aspect : 1;
	let scaleY = aspect >= 1 ? 1 : 1 / aspect;
	if (rng.float(0, 1) < 0.5) {
		[scaleX, scaleY] = [scaleY, scaleX];
	}

	const full = Math.PI * 2;
	const angles: number[] = [];
	for (let i = 0; i < vertexCount; i++) {
		const baseAngle = (i / vertexCount) * full;
		const jitter = rng.float(-angleJitter, angleJitter);
		angles.push(baseAngle + jitter + rotation);
	}
	angles.sort((a, b) => a - b);

	for (const angle of angles) {
		const rawRadius =
			baseRadius * rng.float(1 - radiusJitter, 1 + radiusJitter * 0.2);
		const radius = Math.max(baseRadius * 0.55, rawRadius);
		points.push({
			x: cx + Math.cos(angle) * radius * scaleX,
			y: cy + Math.sin(angle) * radius * scaleY,
		});
	}
	return points;
}

export function distanceSq(a: Point, b: Point): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}

export function sampleCentersWithMinDistance(
	rng: ReturnType<typeof prng>,
	count: number,
	bounds: { w: number; h: number },
	overscan = GEN_CONFIG.overscan,
	region: "any" | "inside" | "outside" = "any",
	existing: Point[] = [],
	biasFn?: BiasFn,
): Point[] {
	const centers: Point[] = [...existing];
	const added: Point[] = [];
	const minSide = Math.min(bounds.w, bounds.h);
	// Base spacing scales down with higher counts; empirically tuned
	const base = minSide * 0.22;
	const scale = Math.sqrt(6 / Math.max(1, count + existing.length));
	const minDist = Math.max(24, Math.min(minSide * 0.45, base * scale));
	const minDistSq = minDist * minDist;
	const xMin = -overscan * bounds.w;
	const xMax = (1 + overscan) * bounds.w;
	const yMin = -overscan * bounds.h;
	const yMax = (1 + overscan) * bounds.h;
	const pad = clamp(
		minSide * (GEN_CONFIG.insidePadding ?? 0),
		0,
		minSide * 0.25,
	);
	const insideBounds = {
		xMin: pad,
		xMax: bounds.w - pad,
		yMin: pad,
		yMax: bounds.h - pad,
	};

	const isInsideCanvas = (p: Point) =>
		p.x >= 0 && p.x <= bounds.w && p.y >= 0 && p.y <= bounds.h;
	const isInsidePadded = (p: Point) =>
		p.x >= insideBounds.xMin &&
		p.x <= insideBounds.xMax &&
		p.y >= insideBounds.yMin &&
		p.y <= insideBounds.yMax;
	const regionOk = (p: Point) =>
		region === "any"
			? true
			: region === "inside"
				? isInsidePadded(p)
				: !isInsideCanvas(p);

	const sampleCandidate = () => ({
		x: rng.float(xMin, xMax),
		y: rng.float(yMin, yMax),
	});

	const minDistanceSqToCenters = (p: Point) => {
		if (centers.length === 0) return Number.POSITIVE_INFINITY;
		let minSq = Number.POSITIVE_INFINITY;
		for (let j = 0; j < centers.length; j++) {
			const d = distanceSq(p, centers[j]);
			if (d < minSq) minSq = d;
		}
		return minSq;
	};

	const candidatesMin = GEN_CONFIG.bestCandidateSamples?.min ?? 12;
	const candidatesMax = GEN_CONFIG.bestCandidateSamples?.max ?? 48;
	const candidateCount = clamp(
		Math.round(12 + count * 2),
		candidatesMin,
		candidatesMax,
	);
	const biasWeight = minDistSq * (GEN_CONFIG.compositionBiasWeight ?? 0.7);

	for (let i = 0; i < count; i++) {
		let best: Point | null = null;
		let bestScore = -1;

		for (let tries = 0; tries < candidateCount; tries++) {
			const candidate = sampleCandidate();
			if (!regionOk(candidate)) continue;
			const minSq = minDistanceSqToCenters(candidate);
			const bias = clamp01(biasFn ? biasFn(candidate) : 0);
			const score = minSq + bias * biasWeight;
			if (score > bestScore) {
				bestScore = score;
				best = candidate;
			}
			if (minSq >= minDistSq && bias >= 0.65) {
				best = candidate;
				break;
			}
		}

		if (!best) {
			for (let tries = 0; tries < 24 && !best; tries++) {
				const candidate = sampleCandidate();
				if (regionOk(candidate)) best = candidate;
			}
			best ??= sampleCandidate();
		}

		centers.push(best);
		added.push(best);
	}
	return added;
}

export function generateShapes(args: {
	seed: string;
	count: number;
	canvas: CanvasSettings;
	palette: RgbHex[];
	mood?: CompositionMood;
}): BlobShape[] {
	const r = prng(args.seed);
	const shapes: BlobShape[] = [];
	const { width: w, height: h } = args.canvas;
	const mood = args.mood ?? pickCompositionMood(r);
	const moodBias = createMoodBias(r, { w, h }, mood);

	// Compute inside/outside split (easily adjustable via GEN_CONFIG)
	const insideCount = Math.max(
		0,
		Math.min(args.count, Math.round(args.count * GEN_CONFIG.insideFraction)),
	);
	const outsideCount = Math.max(0, args.count - insideCount);

	const centersInside = sampleCentersWithMinDistance(
		r,
		insideCount,
		{ w, h },
		GEN_CONFIG.overscan,
		"inside",
		[],
		moodBias.inside,
	);
	const centersOutside = sampleCentersWithMinDistance(
		r,
		outsideCount,
		{ w, h },
		GEN_CONFIG.overscan,
		"outside",
		centersInside,
		moodBias.outside,
	);
	const centers = [...centersInside, ...centersOutside];

	// Helper: pick a palette index with reduced probability for index 0
	const pickWeightedPaletteIndex = (
		rng: ReturnType<typeof prng>,
		length: number,
	) => {
		const len = Math.max(1, length);
		if (len === 1) return 0;
		const weights: number[] = new Array(len).fill(1);
		weights[0] = 0.5; // downweight background/first color
		const sum = weights.reduce((acc, v) => acc + v, 0);
		const target = rng.float(0, sum);
		let acc = 0;
		for (let idx = 0; idx < len; idx++) {
			acc += weights[idx];
			if (target <= acc) return idx;
		}
		return len - 1;
	};

	for (let i = 0; i < args.count; i++) {
		const c = centers[i];
		const radiusCfg =
			i < insideCount ? GEN_CONFIG.insideRadius : GEN_CONFIG.outsideRadius;
		const pts = generatePolygon(r, { w, h }, c, radiusCfg);
		const paletteLength = Math.max(1, args.palette?.length ?? 0);
		shapes.push({
			id: createId("blob"),
			points: pts,
			fillIndex: pickWeightedPaletteIndex(r, paletteLength),
		});
	}
	return shapes;
}

// Shape helpers for contextual insertion
export function makeRegularPolygonPoints(
	center: Point,
	radius: number,
	sides: number,
): Point[] {
	const points: Point[] = [];
	const safeSides = Math.max(3, Math.floor(sides));
	for (let i = 0; i < safeSides; i++) {
		const angle = (i / safeSides) * Math.PI * 2;
		points.push({
			x: center.x + Math.cos(angle) * radius,
			y: center.y + Math.sin(angle) * radius,
		});
	}
	return points;
}

export function makeCirclePoints(center: Point, radius: number, segments = 24) {
	return makeRegularPolygonPoints(center, radius, Math.max(8, segments));
}

export function makeSquarePoints(center: Point, size: number): Point[] {
	const half = size / 2;
	return [
		{ x: center.x - half, y: center.y - half },
		{ x: center.x + half, y: center.y - half },
		{ x: center.x + half, y: center.y + half },
		{ x: center.x - half, y: center.y + half },
	];
}

export function makeDiamondPoints(center: Point, size: number): Point[] {
	const half = size / 2;
	return [
		{ x: center.x, y: center.y - half },
		{ x: center.x + half, y: center.y },
		{ x: center.x, y: center.y + half },
		{ x: center.x - half, y: center.y },
	];
}

export function makeRandomBlobPoints(
	seed: string,
	canvas: CanvasSettings,
	center: Point,
): Point[] {
	const r = prng(`${seed}-ctx`);
	// Use inside radius config by default
	const radiusCfg = GEN_CONFIG.insideRadius;
	return generatePolygon(
		r,
		{ w: canvas.width, h: canvas.height },
		center,
		radiusCfg,
	);
}
