import { envServer } from "@/env-server";
import { API_LIMITS, type ApiTier } from "@/lib/config/api-limits";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult = {
	allowed: boolean;
	headers: Record<string, string>;
};

type RatelimitContext = {
	publicMinute: Ratelimit;
	publicDay: Ratelimit;
	verifiedMinute: Ratelimit;
	verifiedDay: Ratelimit;
	keyRequest: Ratelimit;
};

const globalForRateLimit = globalThis as typeof globalThis & {
	__rateLimit?: RatelimitContext;
};

function createRateLimiters(): RatelimitContext {
	const redis = new Redis({
		url: envServer.UPSTASH_REDIS_REST_URL,
		token: envServer.UPSTASH_REDIS_REST_TOKEN,
	});

	return {
		publicMinute: new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(API_LIMITS.public.perMinute, "1 m"),
			prefix: "ratelimit:public:minute",
		}),
		publicDay: new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(API_LIMITS.public.perDay, "1 d"),
			prefix: "ratelimit:public:day",
		}),
		verifiedMinute: new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(API_LIMITS.verified.perMinute, "1 m"),
			prefix: "ratelimit:verified:minute",
		}),
		verifiedDay: new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(API_LIMITS.verified.perDay, "1 d"),
			prefix: "ratelimit:verified:day",
		}),
		keyRequest: new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(3, "1 h"),
			prefix: "ratelimit:key-request",
		}),
	};
}

const rateLimiters =
	globalForRateLimit.__rateLimit ?? createRateLimiters();

globalForRateLimit.__rateLimit = rateLimiters;

function toResetSeconds(reset: number): string {
	const resetMs = reset < 10_000_000_000 ? reset * 1000 : reset;
	const seconds = Math.max(0, Math.ceil((resetMs - Date.now()) / 1000));
	return seconds.toString();
}

function buildHeaders(
	minute: Awaited<ReturnType<Ratelimit["limit"]>>,
	day: Awaited<ReturnType<Ratelimit["limit"]>>,
) {
	return {
		"X-RateLimit-Limit": minute.limit.toString(),
		"X-RateLimit-Remaining": minute.remaining.toString(),
		"X-RateLimit-Reset": minute.reset.toString(),
		"X-RateLimit-Limit-Minute": minute.limit.toString(),
		"X-RateLimit-Remaining-Minute": minute.remaining.toString(),
		"X-RateLimit-Reset-Minute": minute.reset.toString(),
		"X-RateLimit-Limit-Day": day.limit.toString(),
		"X-RateLimit-Remaining-Day": day.remaining.toString(),
		"X-RateLimit-Reset-Day": day.reset.toString(),
	};
}

export async function applyRateLimit(
	tier: ApiTier,
	identifier: string,
): Promise<RateLimitResult> {
	const minuteLimiter =
		tier === "public" ? rateLimiters.publicMinute : rateLimiters.verifiedMinute;
	const dayLimiter =
		tier === "public" ? rateLimiters.publicDay : rateLimiters.verifiedDay;

	const [minute, day] = await Promise.all([
		minuteLimiter.limit(identifier),
		dayLimiter.limit(identifier),
	]);

	const headers = buildHeaders(minute, day);

	if (!minute.success || !day.success) {
		const failing = minute.success ? day : minute;
		return {
			allowed: false,
			headers: {
				...headers,
				"Retry-After": toResetSeconds(failing.reset),
			},
		};
	}

	return { allowed: true, headers };
}

export async function applyKeyRequestLimit(
	identifier: string,
): Promise<RateLimitResult> {
	const result = await rateLimiters.keyRequest.limit(identifier);
	const headers = {
		"X-RateLimit-Limit": result.limit.toString(),
		"X-RateLimit-Remaining": result.remaining.toString(),
		"X-RateLimit-Reset": result.reset.toString(),
	};

	if (!result.success) {
		return {
			allowed: false,
			headers: { ...headers, "Retry-After": toResetSeconds(result.reset) },
		};
	}

	return { allowed: true, headers };
}
