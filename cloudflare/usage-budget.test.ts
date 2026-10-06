import { describe, expect, it, vi } from "vitest";
import { UsageBudget } from "./usage-budget";
import {
	BROWSER_BUDGET_MS,
	BROWSER_INITIAL_USAGE_MS,
	BROWSER_RESERVATION_MS,
	DYNAMIC_REQUEST_LIMIT,
} from "../src/lib/config/config.api";
import type { UsageLedger } from "./raster-budget";

function fixture(
	quickAction = vi.fn(
		async () =>
			new Response("png", {
				headers: { "Content-Type": "image/png", "X-Browser-Ms-Used": "150.1" },
			}),
	),
) {
	const values = new Map<string, unknown>();
	let pending = Promise.resolve();
	const storage = {
		async get(key: string) {
			return structuredClone(values.get(key));
		},
		async put(key: string, value: unknown) {
			values.set(key, structuredClone(value));
		},
		transaction<T>(fn: (storage: unknown) => Promise<T>) {
			const result = pending.then(() => fn(storage));
			pending = result.then(
				() => {},
				() => {},
			);
			return result;
		},
	};
	const budget = new UsageBudget(
		{ storage } as never,
		{ BROWSER: { quickAction } } as never,
	);
	const render = () =>
		budget.fetch(
			new Request("https://budget/render", {
				method: "POST",
				body: JSON.stringify({
					svg: '<svg width="128" height="96"></svg>',
					width: 128,
					height: 96,
					format: "png",
					quality: 95,
				}),
			}),
		);
	const ledger = () => values.get("usage-v1") as UsageLedger;
	return { budget, render, values, ledger, quickAction };
}

describe("persistent Browser Run budget", () => {
	it("precharges before rendering and settles a successful measured response", async () => {
		const f = fixture();
		f.quickAction.mockImplementationOnce(async () => {
			expect(f.ledger().days[0].browserMs).toBe(
				BROWSER_INITIAL_USAGE_MS + BROWSER_RESERVATION_MS,
			);
			expect(f.ledger().active).toBeDefined();
			return new Response("png", {
				headers: { "Content-Type": "image/png", "X-Browser-Ms-Used": "150.1" },
			});
		});
		expect((await f.render()).status).toBe(200);
		expect(f.ledger().days[0].browserMs).toBe(BROWSER_INITIAL_USAGE_MS + 1151);
		expect(f.ledger().active).toBeUndefined();
	});
	it("retains the full reserve for errors and missing metering", async () => {
		const f = fixture();
		f.quickAction.mockRejectedValueOnce(new Error("provider error"));
		expect((await f.render()).status).toBe(503);
		expect(f.ledger().days[0].browserMs).toBe(
			BROWSER_INITIAL_USAGE_MS + BROWSER_RESERVATION_MS,
		);
		f.quickAction.mockResolvedValueOnce(
			new Response("png", { headers: { "Content-Type": "image/png" } }),
		);
		await f.render();
		expect(f.ledger().days[0].browserMs).toBe(
			BROWSER_INITIAL_USAGE_MS + 2 * BROWSER_RESERVATION_MS,
		);
	});
	it("serializes rendering across concurrent callers", async () => {
		const f = fixture();
		let finish!: (response: Response) => void;
		f.quickAction.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
		const first = f.render();
		await vi.waitFor(() => expect(f.quickAction).toHaveBeenCalledTimes(1));
		expect((await f.render()).status).toBe(503);
		finish(
			new Response("png", {
				headers: { "Content-Type": "image/png", "X-Browser-Ms-Used": "10" },
			}),
		);
		await first;
		expect(f.quickAction).toHaveBeenCalledTimes(1);
	});
	it("fails closed at browser and dynamic request quotas", async () => {
		const f = fixture();
		f.values.set("usage-v1", {
			days: [
				{
					day: Math.floor(Date.now() / 86400000),
					requests: DYNAMIC_REQUEST_LIMIT,
					browserMs: BROWSER_BUDGET_MS,
				},
			],
		});
		expect((await f.render()).status).toBe(503);
		expect(
			(await f.budget.fetch(new Request("https://budget/admit"))).status,
		).toBe(503);
		expect(f.quickAction).not.toHaveBeenCalled();
	});
	it("cannot render when the reservation cannot be persisted", async () => {
		const quickAction = vi.fn();
		const budget = new UsageBudget(
			{
				storage: {
					transaction: async () => {
						throw new Error("storage unavailable");
					},
				},
			} as never,
			{ BROWSER: { quickAction } } as never,
		);
		await expect(
			budget.fetch(
				new Request("https://budget/render", {
					method: "POST",
					body: JSON.stringify({ svg: "<svg/>" }),
				}),
			),
		).rejects.toThrow();
		expect(quickAction).not.toHaveBeenCalled();
	});
});
