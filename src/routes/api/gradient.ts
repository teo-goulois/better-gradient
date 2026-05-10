import { createHash } from "node:crypto";
import { DEFAULT_CANVAS_SIZE, DEFAULT_FILTERS } from "@/lib/config/config.mesh";
import { configPreset } from "@/lib/config/config.preset";
import { db } from "@/lib/db";
import { apiKeysTable, apiRateLimitsTable } from "@/lib/db/schema";
import { rasterizeSvg } from "@/lib/mesh-raster.server";
import { cssBackgroundFromState, svgStringFromState } from "@/lib/mesh-svg";
import { trackPostHogServerEvent } from "@/lib/posthog.server";
import { trackUmamiServerEvent } from "@/lib/umami.server";
import { clamp, generateShapes, prng } from "@/lib/utils/utils.mesh";
import type { CanvasSettings, Filters, RgbHex } from "@/types/types.mesh";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { eq, sql } from "drizzle-orm";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const WINDOW_MS = 60_000;
const PUBLIC_LIMIT = 30;
const KEY_LIMIT = 300;
const SUPPORTED_FORMATS = new Set(["svg", "png", "webp", "css"]);

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

function parseQuality(value: string | null): number | undefined {
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
	const preset =
		presets[index]?.config.palette ?? presets[0]?.config.palette ?? [];
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

function cacheControl(source: SeedSource): string {
	return source === "random"
		? "no-store"
		: "public, max-age=31536000, immutable";
}

function hashKey(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
	const view = new Uint8Array(
		buffer.buffer,
		buffer.byteOffset,
		buffer.byteLength,
	);
	const copy = new Uint8Array(view.byteLength);
	copy.set(view);
	return copy.buffer;
}

function parseBearerToken(header: string | null): string | null {
	if (!header) return null;
	const match = header.match(/^Bearer\s+(.+)$/i);
	return match?.[1]?.trim() ?? null;
}

function getRequestIp(request: Request): string {
	const forwarded =
		request.headers.get("x-forwarded-for") ||
		request.headers.get("x-real-ip") ||
		request.headers.get("cf-connecting-ip") ||
		request.headers.get("x-vercel-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0]?.trim() || "unknown";
	}
	return "unknown";
}

async function checkRateLimit(args: {
	scope: "public" | "key";
	identifier: string;
	limit: number;
	now: number;
}) {
	const windowStart = Math.floor(args.now / WINDOW_MS) * WINDOW_MS;
	const bucket = `${args.scope}:${args.identifier}:${windowStart}`;
	await db
		.insert(apiRateLimitsTable)
		.values({
			bucket,
			scope: args.scope,
			identifier: args.identifier,
			windowStart,
			count: 1,
			updatedAt: args.now,
		})
		.onConflictDoUpdate({
			target: apiRateLimitsTable.bucket,
			set: {
				// Atomic increment avoids insert race conditions.
				count: sql<number>`${apiRateLimitsTable.count} + 1`,
				updatedAt: args.now,
			},
		});
	const existing = await db
		.select({ count: apiRateLimitsTable.count })
		.from(apiRateLimitsTable)
		.where(eq(apiRateLimitsTable.bucket, bucket))
		.limit(1);
	const nextCount = existing[0]?.count ?? 1;
	const remaining = Math.max(0, args.limit - nextCount);
	return {
		allowed: nextCount <= args.limit,
		remaining,
		limit: args.limit,
		resetAt: windowStart + WINDOW_MS,
	};
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
		if (!SUPPORTED_FORMATS.has(format)) {
			return new Response(`Unsupported format: ${format}`, {
				status: 400,
				headers: {
					...CORS_HEADERS,
					"Content-Type": "text/plain; charset=utf-8",
				},
			});
		}
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
		const quality = parseQuality(params.get("quality"));

		const now = Date.now();
		const authHeader = request.headers.get("authorization");
		const token = parseBearerToken(authHeader);
		let rateLimitScope: "public" | "key" = "public";
		let rateIdentifier = getRequestIp(request);
		let limit = PUBLIC_LIMIT;
		if (token) {
			const keyHash = hashKey(token);
			const keyRecord = await db
				.select()
				.from(apiKeysTable)
				.where(eq(apiKeysTable.keyHash, keyHash))
				.limit(1);
			const key = keyRecord[0];
			if (!key || key.status !== "active" || key.revokedAt) {
				return new Response("Invalid API key", {
					status: 401,
					headers: {
						...CORS_HEADERS,
						"Content-Type": "text/plain; charset=utf-8",
					},
				});
			}
			rateLimitScope = "key";
			rateIdentifier = key.id;
			limit = KEY_LIMIT;
		}

		const rate = await checkRateLimit({
			scope: rateLimitScope,
			identifier: rateIdentifier,
			limit,
			now,
		});
		const rateHeaders = {
			"X-RateLimit-Limit": String(rate.limit),
			"X-RateLimit-Remaining": String(rate.remaining),
			"X-RateLimit-Reset": String(Math.floor(rate.resetAt / 1000)),
		};
		if (!rate.allowed) {
			const retryAfter = Math.max(1, Math.ceil((rate.resetAt - now) / 1000));
			return new Response("Rate limit exceeded", {
				status: 429,
				headers: {
					...CORS_HEADERS,
					...rateHeaders,
					"Retry-After": String(retryAfter),
					"Content-Type": "text/plain; charset=utf-8",
				},
			});
		}

		const seedResult = await resolveSeed(
			params.get("seed"),
			params.get("email"),
		);
		const paletteResult = pickPalette(seedResult.seed);
		const canvas = buildCanvas(paletteResult.palette, width, height);
		const filters = buildFilters();

		await trackUmamiServerEvent({
			name: "API Gradient",
			title: "API Gradient",
			url: "/api/gradient",
			request,
			data: {
				auth: rateLimitScope,
				format,
				width,
				height,
				count,
				quality: quality ?? null,
				seed_source: seedResult.source,
				palette_index: paletteResult.index,
			},
		});
		await trackPostHogServerEvent({
			event: "api_gradient_generated",
			distinctId: `${rateLimitScope}:${rateIdentifier}`,
			request,
			properties: {
				format,
				auth_scope: rateLimitScope === "key" ? "verified" : "anonymous",
				width,
				height,
				shape_count: count,
				palette_count: paletteResult.palette.length,
				quality: quality ?? null,
				seed_source: seedResult.source,
			},
		});
		const shapes = generateShapes({
			seed: `${seedResult.seed}:shapes`,
			count,
			canvas,
			palette: paletteResult.palette,
		});
		const headers = {
			...CORS_HEADERS,
			...rateHeaders,
			"Cache-Control": cacheControl(seedResult.source),
		};
		const svg =
			format === "svg" || format === "png" || format === "webp"
				? svgStringFromState({
						canvas,
						shapes,
						palette: paletteResult.palette,
						filters,
					})
				: null;

		switch (format) {
			case "svg": {
				return new Response(svg, {
					headers: {
						...headers,
						"Content-Type": "image/svg+xml; charset=utf-8",
					},
				});
			}
			case "png": {
				if (!svg) {
					return new Response("SVG generation failed", {
						status: 500,
						headers,
					});
				}
				const png = await rasterizeSvg(svg, { format: "png" });
				return new Response(bufferToArrayBuffer(png), {
					headers: {
						...headers,
						"Content-Type": "image/png",
					},
				});
			}
			case "webp": {
				if (!svg) {
					return new Response("SVG generation failed", {
						status: 500,
						headers,
					});
				}
				const webp = await rasterizeSvg(svg, {
					format: "webp",
					quality: quality ?? 0.95,
				});
				return new Response(bufferToArrayBuffer(webp), {
					headers: {
						...headers,
						"Content-Type": "image/webp",
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
			default:
				return new Response("Unsupported format", {
					status: 400,
					headers: {
						...headers,
						"Content-Type": "text/plain; charset=utf-8",
					},
				});
		}
	},
});
