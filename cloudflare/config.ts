const runtimeKeys = [
	"TURSO_DATABASE_URL",
	"TURSO_AUTH_TOKEN",
	"MARBLE_API_URL",
	"MARBLE_WORKSPACE_KEY",
	"RESEND_API_KEY",
	"RESEND_FROM_EMAIL",
	"VITE_SITE_URL",
	"POSTHOG_KEY",
	"POSTHOG_HOST",
	"POSTHOG_ENABLED",
	"POSTHOG_DISABLED",
	"POSTHOG_DEBUG",
] as const;

export function containerEnv(env: Partial<Record<(typeof runtimeKeys)[number], string>>) {
	return Object.fromEntries(
		runtimeKeys.flatMap((key) => env[key] === undefined ? [] : [[key, env[key]!]]),
	);
}

export function forwardRequest(request: Request): Request {
	const forwarded = new Request(request);
	const url = new URL(request.url);
	const ip = request.headers.get("cf-connecting-ip");
	forwarded.headers.delete("x-forwarded-for");
	forwarded.headers.delete("x-real-ip");
	forwarded.headers.delete("x-vercel-forwarded-for");
	if (ip) forwarded.headers.set("x-forwarded-for", ip);
	forwarded.headers.set("x-forwarded-host", url.host);
	forwarded.headers.set("x-forwarded-proto", url.protocol.slice(0, -1));
	return forwarded;
}
