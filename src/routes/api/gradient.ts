import { extractApiKey, getClientIp, hashToken, validateApiKey } from "@/lib/api/api-keys";
import { gradientCache, getGradientCacheKey } from "@/lib/api/gradient-cache";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { API_LIMITS, type ApiTier } from "@/lib/config/api-limits";
import { configPreset } from "@/lib/config/config.preset";
import { DEFAULT_CANVAS_SIZE, DEFAULT_FILTERS } from "@/lib/config/config.mesh";
import { cssBackgroundFromState, svgStringFromState } from "@/lib/mesh-svg";
import { clamp, generateShapes, prng } from "@/lib/utils/utils.mesh";
import type { CanvasSettings, Filters, RgbHex } from "@/types/types.mesh";
import { createServerFileRoute } from "@tanstack/react-start/server";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Authorization, X-API-Key, If-None-Match",
	"Access-Control-Expose-Headers":
		"ETag, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Limit-Minute, X-RateLimit-Remaining-Minute, X-RateLimit-Reset-Minute, X-RateLimit-Limit-Day, X-RateLimit-Remaining-Day, X-RateLimit-Reset-Day, Retry-After",
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
	allowRandom: boolean,
): Promise<SeedResult | null> {
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
	if (!allowRandom) return null;
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

function cacheControl(tier: ApiTier, source: SeedSource): string {
	if (tier === "verified") {
		return source === "random" ? "no-store" : "private, max-age=0, must-revalidate";
	}
	return source === "random"
		? "no-store"
		: "public, max-age=31536000, s-maxage=31536000, immutable";
}

const API_VERSION = "v1";

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
		const apiKey = extractApiKey(request);
		let tier: ApiTier = "public";
		let apiKeyRecord: Awaited<ReturnType<typeof validateApiKey>> | null = null;

		if (apiKey) {
			apiKeyRecord = await validateApiKey(apiKey);
			if (!apiKeyRecord) {
				console.warn("Invalid API key", { prefix: apiKey.slice(0, 8) });
				return Response.json(
					{ error: "invalid_api_key" },
					{
						status: 401,
						headers: {
							...CORS_HEADERS,
							"Cache-Control": "no-store",
						},
					},
				);
			}
			tier = "verified";
		}

		const identifier =
			tier === "public"
				? `ip:${getClientIp(request)}`
				: `key:${apiKeyRecord?.id ?? "unknown"}`;

		const rateLimit = await applyRateLimit(tier, identifier);
		if (!rateLimit.allowed) {
			console.warn("Rate limit exceeded", { tier, identifier });
			return Response.json(
				{ error: "rate_limited" },
				{
					status: 429,
					headers: {
						...CORS_HEADERS,
						...rateLimit.headers,
						"Cache-Control": "no-store",
					},
				},
			);
		}

		const formatParam = (params.get("format") ?? "svg").toLowerCase();
		const allowedFormats =
			tier === "verified" ? ["svg", "css", "share", "json"] : ["svg", "css", "share"];
		if (!allowedFormats.includes(formatParam)) {
			if (formatParam === "json") {
				return Response.json(
					{
						error: "format_not_available",
						message: "JSON format is reserved for Better Gradient.",
					},
					{
						status: 403,
						headers: {
							...CORS_HEADERS,
							...rateLimit.headers,
							"Cache-Control": "no-store",
						},
					},
				);
			}
			return Response.json(
				{
					error: "invalid_format",
					message: "Format must be svg, css, or share.",
				},
				{
					status: 400,
					headers: {
						...CORS_HEADERS,
						...rateLimit.headers,
						"Cache-Control": "no-store",
					},
				},
			);
		}

		const format = formatParam as "svg" | "css" | "share" | "json";

		const tierLimits = API_LIMITS[tier];
		const size = parseNumber(params.get("size"));
		const widthRaw = parseNumber(params.get("width")) ?? size;
		const heightRaw = parseNumber(params.get("height")) ?? size;
		const width = clamp(
			Math.round(widthRaw ?? DEFAULT_CANVAS_SIZE.width),
			64,
			tierLimits.maxSize,
		);
		const height = clamp(
			Math.round(heightRaw ?? DEFAULT_CANVAS_SIZE.height),
			64,
			tierLimits.maxSize,
		);
		const countRaw = parseNumber(params.get("count"));
		const count = clamp(Math.round(countRaw ?? 6), 3, tierLimits.maxCount);
		const seedResult = await resolveSeed(
			params.get("seed"),
			params.get("email"),
			tier === "verified",
		);

		if (!seedResult) {
			return Response.json(
				{
					error: "seed_required",
					message:
						"Public requests require a deterministic seed or email. Use the API key tier for random seeds.",
				},
				{
					status: 400,
					headers: {
						...CORS_HEADERS,
						...rateLimit.headers,
						"Cache-Control": "no-store",
					},
				},
			);
		}

		const isSeeded = seedResult.source !== "random";
		const cacheKey = getGradientCacheKey({
			version: API_VERSION,
			seed: seedResult.seed,
			width,
			height,
			count,
			format,
		});
		const etag = isSeeded ? `W/"${await hashToken(cacheKey)}"` : undefined;
		if (etag && request.headers.get("if-none-match") === etag) {
			return new Response(null, {
				status: 304,
				headers: {
					...CORS_HEADERS,
					...rateLimit.headers,
					ETag: etag,
					"Cache-Control": cacheControl(tier, seedResult.source),
					Vary: "Authorization, X-API-Key",
				},
			});
		}

		const cached = isSeeded ? gradientCache.get(cacheKey) : undefined;
		if (cached) {
			const headers = {
				...CORS_HEADERS,
				...rateLimit.headers,
				"Cache-Control": cacheControl(tier, seedResult.source),
				ETag: cached.etag,
				Vary: "Authorization, X-API-Key",
			};
			if (cached.format === "json") {
				const body = cached.body as Record<string, unknown>;
				const shareValue = typeof body.share === "string" ? body.share : "";
				return Response.json(
					{
						...body,
						shareUrl: `${url.origin}/share/${shareValue}`,
					},
					{ headers },
				);
			}
			return new Response(cached.body as string, {
				headers: {
					...headers,
					"Content-Type": cached.contentType ?? "text/plain; charset=utf-8",
				},
			});
		}

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
			...rateLimit.headers,
			"Cache-Control": cacheControl(tier, seedResult.source),
			...(etag ? { ETag: etag } : {}),
			Vary: "Authorization, X-API-Key",
		};

		switch (format) {
			case "svg": {
				const svg = svgStringFromState({
					canvas,
					shapes,
					palette: paletteResult.palette,
					filters,
				});
				if (isSeeded && etag) {
					gradientCache.set(cacheKey, {
						etag,
						format: "svg",
						contentType: "image/svg+xml; charset=utf-8",
						body: svg,
					});
				}
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
				if (isSeeded && etag) {
					gradientCache.set(cacheKey, {
						etag,
						format: "css",
						contentType: "text/css; charset=utf-8",
						body: css,
					});
				}
				return new Response(css, {
					headers: {
						...headers,
						"Content-Type": "text/css; charset=utf-8",
					},
				});
			}
			case "share": {
				if (isSeeded && etag) {
					gradientCache.set(cacheKey, {
						etag,
						format: "share",
						contentType: "text/plain; charset=utf-8",
						body: share,
					});
				}
				return new Response(share, {
					headers: {
						...headers,
						"Content-Type": "text/plain; charset=utf-8",
					},
				});
			}
			case "json":
			default:
				const jsonBody = {
					seed: seedResult.seed,
					seedSource: seedResult.source,
					presetIndex: paletteResult.index,
					canvas,
					filters,
					palette: paletteResult.palette,
					shapes,
					share,
				};
				if (isSeeded && etag) {
					gradientCache.set(cacheKey, {
						etag,
						format: "json",
						body: jsonBody,
					});
				}
				return Response.json(
					{
						...jsonBody,
						shareUrl,
					},
					{ headers },
				);
		}
	},
});
