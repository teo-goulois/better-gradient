import {
	QUOTA_WINDOW_DAYS,
	DYNAMIC_REQUEST_LIMIT,
	BROWSER_BUDGET_MS,
	BROWSER_RESERVATION_MS,
} from "../src/lib/config/config.api";
import { CONTACT_URL } from "../src/lib/config/config.contact";
export const DAY_MS = 24 * 60 * 60 * 1000;
export type UsageDay = { day: number; requests: number; browserMs: number };
export type UsageLedger = {
	days: UsageDay[];
	active?: { id: string; day: number; expires: number };
};
export function recentLedger(ledger: UsageLedger, now: number): UsageLedger {
	const today = Math.floor(now / DAY_MS);
	return {
		days: ledger.days.filter((entry) => entry.day >= today - QUOTA_WINDOW_DAYS),
		active:
			ledger.active && ledger.active.expires > now ? ledger.active : undefined,
	};
}
export function usageDay(ledger: UsageLedger, now: number): UsageDay {
	const day = Math.floor(now / DAY_MS);
	let entry = ledger.days.find((entry) => entry.day === day);
	if (!entry) {
		entry = { day, requests: 0, browserMs: 0 };
		ledger.days.push(entry);
	}
	return entry;
}
export function allowance(
	ledger: UsageLedger,
	kind: "request" | "browser",
	now: number,
) {
	const used = ledger.days.reduce(
		(sum, day) => sum + (kind === "request" ? day.requests : day.browserMs),
		0,
	);
	const limit = kind === "request" ? DYNAMIC_REQUEST_LIMIT : BROWSER_BUDGET_MS;
	const amount = kind === "request" ? 1 : BROWSER_RESERVATION_MS;
	const oldest = Math.min(
		...ledger.days
			.filter((day) =>
				kind === "request" ? day.requests > 0 : day.browserMs > 0,
			)
			.map((day) => day.day),
	);
	return {
		allowed: used + amount <= limit,
		remaining: Math.max(0, limit - used),
		retryAt: Number.isFinite(oldest)
			? (oldest + QUOTA_WINDOW_DAYS + 1) * DAY_MS
			: now + DAY_MS,
	};
}
export function isRasterRequest(request: Request) {
	const url = new URL(request.url);
	const format = (url.searchParams.get("format") ?? "svg").toLowerCase();
	return (
		request.method === "GET" &&
		url.pathname === "/api/gradient" &&
		(format === "png" || format === "webp")
	);
}
export function rasterUnavailable(message: string, retrySeconds = 60) {
	return new Response(
		`${message}\n\nNeed higher API limits? Contact me with your use case and expected request volume: ${CONTACT_URL}`,
		{
			status: 503,
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-store",
				"Retry-After": String(
					Number.isFinite(retrySeconds)
						? Math.max(1, Math.ceil(retrySeconds))
						: 60,
				),
				"Access-Control-Allow-Origin": "*",
				Link: `<${CONTACT_URL}>; rel="help"`,
			},
		},
	);
}
