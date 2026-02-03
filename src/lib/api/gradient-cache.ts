import { LRUCache } from "lru-cache";

export type GradientCacheEntry = {
	etag: string;
	format: "svg" | "css" | "share" | "json";
	contentType?: string;
	body: string | Record<string, unknown>;
};

type GradientCache = LRUCache<string, GradientCacheEntry>;

const globalForGradientCache = globalThis as typeof globalThis & {
	__gradientCache?: GradientCache;
};

const gradientCache =
	globalForGradientCache.__gradientCache ??
	new LRUCache<string, GradientCacheEntry>({
		max: 500,
		ttl: 1000 * 60 * 60 * 24 * 365,
	});

globalForGradientCache.__gradientCache = gradientCache;

export function getGradientCacheKey(args: {
	version: string;
	seed: string;
	width: number;
	height: number;
	count: number;
	format: string;
}) {
	const { version, seed, width, height, count, format } = args;
	return `${version}|${seed}|${width}|${height}|${count}|${format}`;
}

export { gradientCache };
