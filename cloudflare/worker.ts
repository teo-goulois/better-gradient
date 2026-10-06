import application from "../.cloudflare/worker/server/index.mjs";
import { forwardRequest } from "./config";
import { isRasterRequest } from "./raster-budget";
import { videoRange } from "./video";
import { UsageBudget } from "./usage-budget";
import { rasterUnavailable } from "./raster-budget";
export { UsageBudget };

export interface Env {
	BUDGET: DurableObjectNamespace;
	BROWSER: BrowserRun;
	ASSETS: Fetcher;
	VIDEOS: R2Bucket;
	TURSO_DATABASE_URL: string;
	TURSO_AUTH_TOKEN: string;
	MARBLE_API_URL: string;
	MARBLE_WORKSPACE_KEY: string;
	RESEND_API_KEY: string;
	RESEND_FROM_EMAIL: string;
	VITE_SITE_URL?: string;
	POSTHOG_KEY?: string;
	POSTHOG_HOST?: string;
	POSTHOG_ENABLED?: string;
	POSTHOG_DISABLED?: string;
	POSTHOG_DEBUG?: string;
}

export default {
	async fetch(request, env, ctx) {
		const budget = env.BUDGET.getByName("better-gradient-usage-v1");
		let admitted: Response;
		try {
			admitted = await budget.fetch("https://budget/admit");
		} catch {
			return rasterUnavailable(
				"The server allowance could not be checked. Please try again shortly.",
			);
		}
		if (!admitted.ok) return admitted;
		if (new URL(request.url).pathname === "/video/step-2-position.mp4") {
			if (request.method !== "GET" && request.method !== "HEAD")
				return new Response(null, { status: 405 });
			const object =
				request.method === "HEAD"
					? await env.VIDEOS.head("step-2-position.mp4")
					: await env.VIDEOS.get("step-2-position.mp4");
			if (!object) return new Response("Not found", { status: 404 });
			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set("Content-Type", "video/mp4");
			headers.set("Content-Length", String(object.size));
			headers.set("ETag", object.httpEtag);
			headers.set("Last-Modified", object.uploaded.toUTCString());
			headers.set("Cache-Control", "public, max-age=86400");
			headers.set("Accept-Ranges", "bytes");
			return videoRange(
				request,
				new Response(
					request.method === "GET" ? (object as R2ObjectBody).body : null,
					{ headers },
				),
			);
		}
		const forwarded = forwardRequest(request);
		const response = await application.fetch!(
			forwarded as Request<unknown, IncomingRequestCfProperties>,
			env,
			ctx,
		);
		if (
			!isRasterRequest(request) ||
			!response.ok ||
			!response.headers.get("Content-Type")?.startsWith("image/svg+xml")
		)
			return response;
		const svg = await response.text();
		const dimensions = svg.match(/^<svg[^>]* width="(\d+)" height="(\d+)"/);
		if (!dimensions)
			return rasterUnavailable("Image dimensions could not be determined.");
		const params = new URL(request.url).searchParams;
		const format = params.get("format")!.toLowerCase() as "png" | "webp";
		const value = params.get("quality") ? Number(params.get("quality")) : 0.95;
		const quality = Math.max(
			1,
			Math.min(
				100,
				Math.round(
					Number.isFinite(value) ? (value <= 1 ? value * 100 : value) : 95,
				),
			),
		);
		const hash = Array.from(
			new Uint8Array(
				await crypto.subtle.digest(
					"SHA-256",
					new TextEncoder().encode(`${format}:${quality}:${svg}`),
				),
			),
		)
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join("");
		const cacheKey = new Request(
			`${new URL(request.url).origin}/__render-cache/${hash}`,
		);
		const cache = caches.default;
		const cached = await cache.match(cacheKey);
		const image =
			cached ??
			(await budget.fetch("https://budget/render", {
				method: "POST",
				body: JSON.stringify({
					svg,
					width: Number(dimensions[1]),
					height: Number(dimensions[2]),
					format,
					quality,
				}),
			}));
		if (!image.ok) return image;
		const headers = new Headers(response.headers);
		headers.delete("Content-Length");
		headers.set("Content-Type", `image/${format}`);
		headers.set("X-Render-Cache", cached ? "HIT" : "MISS");
		if (!cached) {
			const copy = image.clone();
			ctx.waitUntil(
				cache
					.put(
						cacheKey,
						new Response(copy.body, {
							headers: {
								"Content-Type": `image/${format}`,
								"Cache-Control": "public, max-age=86400",
							},
						}),
					)
					.catch(() => {}),
			);
		}
		return new Response(image.body, { headers });
	},
} satisfies ExportedHandler<Env>;
