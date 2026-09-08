import { describe, expect, it } from "vitest";
import { containerEnv, forwardRequest } from "./config";

describe("Cloudflare container boundary", () => {
	it("passes application secrets without forwarding infrastructure bindings", () => {
		const vars = containerEnv({ TURSO_AUTH_TOKEN: "test-token", POSTHOG_DISABLED: "true" });
		expect(vars).toEqual({ TURSO_AUTH_TOKEN: "test-token", POSTHOG_DISABLED: "true" });
		expect(Object.values(vars).every((value) => typeof value === "string")).toBe(true);
	});

	it("uses the Cloudflare client IP and public origin, preserving POST bodies", async () => {
		const request = new Request("https://better-gradient.com/_server/test?x=1", {
			method: "POST",
			body: "payload",
			headers: {
				"cf-connecting-ip": "192.0.2.1",
				"x-forwarded-for": "spoofed",
				"x-real-ip": "spoofed",
				"x-vercel-forwarded-for": "spoofed",
				"x-forwarded-host": "spoofed.example",
				Authorization: "Bearer test-key",
			},
		});
		const forwarded = forwardRequest(request);
		expect(forwarded.url).toBe(request.url);
		expect(forwarded.headers.get("x-forwarded-for")).toBe("192.0.2.1");
		expect(forwarded.headers.has("x-real-ip")).toBe(false);
		expect(forwarded.headers.has("x-vercel-forwarded-for")).toBe(false);
		expect(forwarded.headers.get("x-forwarded-host")).toBe("better-gradient.com");
		expect(forwarded.headers.get("x-forwarded-proto")).toBe("https");
		expect(forwarded.headers.get("authorization")).toBe("Bearer test-key");
		expect(await forwarded.text()).toBe("payload");
	});

	it("discards untrusted forwarding headers when no Cloudflare IP is present", () => {
		const request = new Request("http://localhost/api/gradient", {
			headers: { "x-forwarded-for": "spoofed", "x-real-ip": "spoofed" },
		});
		expect(forwardRequest(request).headers.has("x-forwarded-for")).toBe(false);
	});
});
