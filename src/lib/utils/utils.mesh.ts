import type { MeshState, MeshStoreActions } from "@/store/store-mesh";
import type {
	BlobShape,
	CanvasSettings,
	Point,
	RgbHex,
} from "@/types/types.mesh";
import seedrandom from "seedrandom";
import { GEN_CONFIG } from "../config/config.mesh";

// Helpers
export function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
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

export function prng(seed: string) {
	const rng = seedrandom(seed);
	return {
		int: (min: number, max: number) =>
			Math.floor(rng() * (max - min + 1)) + min,
		float: (min: number, max: number) => rng() * (max - min) + min,
		pick: <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)],
	};
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
	const vertexCount = rng.int(6, 10);
	const minScale = Math.max(0.05, radiusScale?.min ?? 0.3);
	const maxScale = Math.max(minScale, radiusScale?.max ?? 0.55);
	const baseRadius =
		Math.min(bounds.w, bounds.h) * rng.float(minScale, maxScale);
	for (let i = 0; i < vertexCount; i++) {
		const angle = (i / vertexCount) * Math.PI * 2;
		const radius = baseRadius * rng.float(0.6, 1);
		points.push({
			x: cx + Math.cos(angle) * radius,
			y: cy + Math.sin(angle) * radius,
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

	const isInside = (p: Point) =>
		p.x >= 0 && p.x <= bounds.w && p.y >= 0 && p.y <= bounds.h;
	const regionOk = (p: Point) =>
		region === "any" ? true : region === "inside" ? isInside(p) : !isInside(p);

	for (let i = 0; i < count; i++) {
		let placed = false;
		for (
			let tries = 0;
			tries < GEN_CONFIG.maxPlacementTries && !placed;
			tries++
		) {
			const candidate = { x: rng.float(xMin, xMax), y: rng.float(yMin, yMax) };
			if (!regionOk(candidate)) continue;
			let ok = true;
			for (let j = 0; j < centers.length; j++) {
				if (distanceSq(candidate, centers[j]) < minDistSq) {
					ok = false;
					break;
				}
			}
			if (ok) {
				centers.push(candidate);
				added.push(candidate);
				placed = true;
			}
		}
		if (!placed) {
			// Fallback: place without region constraint
			const candidate = { x: rng.float(xMin, xMax), y: rng.float(yMin, yMax) };
			centers.push(candidate);
			added.push(candidate);
		}
	}
	return added;
}

export function generateShapes(args: {
	seed: string;
	count: number;
	canvas: CanvasSettings;
	palette: RgbHex[];
}): BlobShape[] {
	const r = prng(args.seed);
	const shapes: BlobShape[] = [];
	const { width: w, height: h } = args.canvas;

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
	);
	const centersOutside = sampleCentersWithMinDistance(
		r,
		outsideCount,
		{ w, h },
		GEN_CONFIG.overscan,
		"outside",
		centersInside,
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
