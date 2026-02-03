import { configPreset } from "@/lib/config/config.preset";
import { DEFAULT_CANVAS_SIZE, DEFAULT_FILTERS } from "@/lib/config/config.mesh";
import { cssBackgroundFromState, svgStringFromState } from "@/lib/mesh-svg";
import { clamp, generateShapes, prng } from "@/lib/utils/utils.mesh";
import type { CanvasSettings, Filters, RgbHex } from "@/types/types.mesh";
import { createServerFileRoute } from "@tanstack/react-start/server";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

type SeedSource = "seed" | "email" | "random";

type SeedResult = {
	seed: string;
	source: SeedSource;
	email?: string;
};

function parseNumber(value: string | null): number | undefined {
	if (!value) return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

async function hash(value: string): Promise<string> {
	if (globalThis.crypto?.subtle) {
		const data = new TextEncoder().encode(value);
		const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
		return Array.from(new Uint8Array(digest))
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join("");
	}
	let hashValue = 2166136261;
	for (let i = 0; i < value.length; i++) {
		hashValue ^= value.charCodeAt(i);
		hashValue = Math.imul(hashValue, 16777619);
	}
	return `fnv1a_${(hashValue >>> 0).toString(16)}`;
}

async function resolveSeed(
	seedParam: string | null,
	emailParam: string | null,
): Promise<SeedResult> {
	const seed = seedParam?.trim();
	if (seed) {
		return { seed, source: "seed" };
	}
	const email = emailParam?.trim();
	if (email) {
		const normalizedEmail = email.toLowerCase();
		return {
			seed: await hash(normalizedEmail),
			source: "email",
			email: normalizedEmail,
		};
	}
	const randomSeed =
		globalThis.crypto?.randomUUID?.() ??
		`seed_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
	return { seed: randomSeed, source: "random" };
}

function pickPalette(seed: string): { index: number; palette: RgbHex[] } {
	const presets = configPreset;
	const rng = prng(`${seed}:palette`);
	const index = rng.int(0, Math.max(0, presets.length - 1));
	const preset = presets[index]?.config.palette ?? presets[0]?.config.palette ?? [];
	return {
		index,
		palette:
			preset.length > 0
				? preset.map((entry) => ({ ...entry }))
				: [{ id: "color_0", color: "#ffffff" }],
	};
}

function buildCanvas(
	palette: RgbHex[],
	width: number,
	height: number,
): CanvasSettings {
	const fallback: RgbHex = { id: "bg", color: "#ffffff" };
	return {
		width,
		height,
		background: palette[0] ?? fallback,
	};
}

function buildFilters(): Filters {
	return { ...DEFAULT_FILTERS };
}

function encodeShare(state: {
	palette: RgbHex[];
	shapes: ReturnType<typeof generateShapes>;
	filters: Filters;
	canvas: CanvasSettings;
	seed: string;
}): string {
	return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

function cacheControl(source: SeedSource): string {
	return source === "random"
		? "no-store"
		: "public, max-age=31536000, immutable";
}

export const ServerRoute = createServerFileRoute("/api/gradient").methods({
	OPTIONS: async () => {
		return new Response(null, {
			status: 204,
			headers: CORS_HEADERS,
		});
	},
	GET: async ({ request }) => {
		const url = new URL(request.url);
		const params = url.searchParams;
		const format = (params.get("format") ?? "svg").toLowerCase();
		const size = parseNumber(params.get("size"));
		const widthRaw = parseNumber(params.get("width")) ?? size;
		const heightRaw = parseNumber(params.get("height")) ?? size;
		const width = clamp(
			Math.round(widthRaw ?? DEFAULT_CANVAS_SIZE.width),
			64,
			6000,
		);
		const height = clamp(
			Math.round(heightRaw ?? DEFAULT_CANVAS_SIZE.height),
			64,
			6000,
		);
		const countRaw = parseNumber(params.get("count"));
		const count = clamp(Math.round(countRaw ?? 6), 3, 10);
		const seedResult = await resolveSeed(params.get("seed"), params.get("email"));
		const paletteResult = pickPalette(seedResult.seed);
		const canvas = buildCanvas(paletteResult.palette, width, height);
		const filters = buildFilters();
		const shapes = generateShapes({
			seed: `${seedResult.seed}:shapes`,
			count,
			canvas,
			palette: paletteResult.palette,
		});
		const share = encodeShare({
			palette: paletteResult.palette,
			shapes,
			filters,
			canvas,
			seed: seedResult.seed,
		});
		const shareUrl = `${url.origin}/share/${share}`;
		const headers = {
			...CORS_HEADERS,
			"Cache-Control": cacheControl(seedResult.source),
		};

		switch (format) {
			case "svg": {
				const svg = svgStringFromState({
					canvas,
					shapes,
					palette: paletteResult.palette,
					filters,
				});
				return new Response(svg, {
					headers: {
						...headers,
						"Content-Type": "image/svg+xml; charset=utf-8",
					},
				});
			}
			case "css": {
				const css = cssBackgroundFromState({
					canvas,
					shapes,
					palette: paletteResult.palette,
					filters,
				});
				return new Response(css, {
					headers: {
						...headers,
						"Content-Type": "text/css; charset=utf-8",
					},
				});
			}
			case "share": {
				return new Response(share, {
					headers: {
						...headers,
						"Content-Type": "text/plain; charset=utf-8",
					},
				});
			}
			case "json":
			default:
				return Response.json(
					{
						seed: seedResult.seed,
						seedSource: seedResult.source,
						presetIndex: paletteResult.index,
						canvas,
						filters,
						palette: paletteResult.palette,
						shapes,
						share,
						shareUrl,
					},
					{ headers },
				);
		}
	},
});
