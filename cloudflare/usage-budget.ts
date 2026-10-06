import {
	BROWSER_ACTION_TIMEOUT_MS,
	BROWSER_INITIAL_USAGE_MS,
	BROWSER_RESERVATION_MS,
	WORKER_INITIAL_REQUESTS,
} from "../src/lib/config/config.api";
import {
	allowance,
	recentLedger,
	usageDay,
	rasterUnavailable,
	type UsageLedger,
} from "./raster-budget";
import type { Env } from "./worker";

export class UsageBudget {
	constructor(
		private ctx: DurableObjectState,
		private env: Env,
	) {}
	private async load(storage: DurableObjectTransaction, now: number) {
		const existing = await storage.get<UsageLedger>("usage-v1");
		const ledger = recentLedger(existing ?? { days: [] }, now);
		if (!existing) {
			const day = usageDay(ledger, now);
			day.browserMs = BROWSER_INITIAL_USAGE_MS;
			day.requests = WORKER_INITIAL_REQUESTS;
		}
		return ledger;
	}
	async fetch(request: Request): Promise<Response> {
		const path = new URL(request.url).pathname;
		if (path === "/admit") {
			const now = Date.now();
			return this.ctx.storage.transaction(async (storage) => {
				const ledger = await this.load(storage, now);
				const budget = allowance(ledger, "request", now);
				if (!budget.allowed)
					return rasterUnavailable(
						"The site's server request allowance is exhausted. The browser editor can still export images from an already open page.",
						(budget.retryAt - now) / 1000,
					);
				usageDay(ledger, now).requests++;
				await storage.put("usage-v1", ledger);
				return new Response(null, { status: 204 });
			});
		}
		if (path !== "/render" || request.method !== "POST")
			return new Response("Not found", { status: 404 });
		const input = await request.json<{
			svg: string;
			width: number;
			height: number;
			format: "png" | "webp";
			quality: number;
		}>();
		const now = Date.now();
		const id = crypto.randomUUID();
		const rejected = await this.ctx.storage.transaction(async (storage) => {
			const ledger = await this.load(storage, now);
			if (ledger.active)
				return rasterUnavailable(
					"Another image is rendering. Try again shortly.",
					(ledger.active.expires - now) / 1000,
				);
			const budget = allowance(ledger, "browser", now);
			if (!budget.allowed)
				return rasterUnavailable(
					"The shared PNG/WebP API rendering allowance is exhausted. Use format=svg or export in the browser editor.",
					(budget.retryAt - now) / 1000,
				);
			const day = usageDay(ledger, now);
			day.browserMs += BROWSER_RESERVATION_MS;
			ledger.active = {
				id,
				day: day.day,
				expires: now + BROWSER_RESERVATION_MS,
			};
			await storage.put("usage-v1", ledger);
			return undefined;
		});
		if (rejected) return rejected;
		let measuredMs: number | undefined;
		try {
			const response = await this.env.BROWSER.quickAction("screenshot", {
				html: `<html><head><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${input.svg}</body></html>`,
				setJavaScriptEnabled: false,
				rejectRequestPattern: ["http://*", "https://*"],
				viewport: {
					width: input.width,
					height: input.height,
					deviceScaleFactor: 1,
				},
				gotoOptions: { waitUntil: "domcontentloaded", timeout: 5000 },
				waitForSelector: { selector: "svg", timeout: 5000 },
				actionTimeout: BROWSER_ACTION_TIMEOUT_MS,
				cacheTTL: 0,
				screenshotOptions: {
					type: input.format,
					omitBackground: true,
					encoding: "binary",
					...(input.format === "webp" ? { quality: input.quality } : {}),
				},
			});
			if (
				!response.ok ||
				!response.headers
					.get("Content-Type")
					?.startsWith(`image/${input.format}`)
			) {
				await response.body?.cancel();
				return rasterUnavailable(
					"Image rendering failed. Try again later or export in the browser editor.",
				);
			}
			const rawMs = response.headers.get("X-Browser-Ms-Used");
			const parsedMs = rawMs?.trim() ? Number(rawMs) : NaN;
			if (Number.isFinite(parsedMs) && parsedMs >= 0)
				measuredMs = Math.ceil(parsedMs) + 1000;
			return response;
		} catch {
			return rasterUnavailable(
				"Image rendering failed. Try again later or export in the browser editor.",
			);
		} finally {
			await this.ctx.storage.transaction(async (storage) => {
				const ledger = await this.load(storage, Date.now());
				if (ledger.active?.id !== id) return;
				const day = ledger.days.find((day) => day.day === ledger.active!.day);
				if (day && measuredMs !== undefined)
					day.browserMs += measuredMs - BROWSER_RESERVATION_MS;
				delete ledger.active;
				await storage.put("usage-v1", ledger);
			});
		}
	}
}
