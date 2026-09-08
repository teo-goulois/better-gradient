import { Container } from "@cloudflare/containers";
import { containerEnv, forwardRequest } from "./config";
import { videoRange } from "./video";

export interface Env {
	APP: DurableObjectNamespace<BetterGradientApp>;
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

export class BetterGradientApp extends Container<Env> {
	defaultPort = 3000;
	sleepAfter = "5m";
	envVars = containerEnv(this.env);
}

export default {
	async fetch(request, env) {
		const response = await env.APP.getByName("app").fetch(forwardRequest(request));
		return new URL(request.url).pathname === "/video/step-2-position.mp4"
			? videoRange(request, response)
			: response;
	},
} satisfies ExportedHandler<Env>;
