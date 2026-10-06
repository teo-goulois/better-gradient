import { describe, expect, it } from "vitest";
import {
	allowance,
	DAY_MS,
	recentLedger,
	usageDay,
	rasterUnavailable,
	type UsageLedger,
} from "./raster-budget";
import {
	BROWSER_BUDGET_MS,
	DYNAMIC_REQUEST_LIMIT,
	WORKER_CPU_BUDGET_MS,
	WORKER_CPU_MS_PER_REQUEST,
} from "../src/lib/config/config.api";

describe("33% project allowance", () => {
	it("bounds browser time and worst-case admitted Worker CPU", () => {
		expect(BROWSER_BUDGET_MS).toBe(11_880_000);
		expect(WORKER_CPU_BUDGET_MS).toBe(9_900_000);
		expect(
			DYNAMIC_REQUEST_LIMIT * WORKER_CPU_MS_PER_REQUEST,
		).toBeLessThanOrEqual(WORKER_CPU_BUDGET_MS);
	});
	it("keeps usage across calendar and billing boundaries, expiring only after 32 full days", () => {
		const ledger = { days: [{ day: 1, requests: 1, browserMs: 100 }] };
		expect(recentLedger(ledger, 33 * DAY_MS).days).toHaveLength(1);
		expect(recentLedger(ledger, 34 * DAY_MS).days).toHaveLength(0);
	});
	it("refuses before a render could exceed the time budget", () => {
		const ledger: UsageLedger = { days: [] };
		usageDay(ledger, DAY_MS).browserMs = BROWSER_BUDGET_MS - 299_999;
		expect(allowance(ledger, "browser", DAY_MS).allowed).toBe(false);
		expect(allowance(ledger, "browser", DAY_MS).retryAt).toBe(34 * DAY_MS);
	});
	it("stops dynamic work at its worst-case CPU allowance and provides the contact", async () => {
		const ledger = {
			days: [{ day: 1, requests: DYNAMIC_REQUEST_LIMIT, browserMs: 0 }],
		};
		expect(allowance(ledger, "request", DAY_MS).allowed).toBe(false);
		const response = rasterUnavailable("Limit reached");
		expect(response.headers.get("Link")).toContain("tally.so");
		expect(await response.text()).toContain("Contact me");
	});
});
