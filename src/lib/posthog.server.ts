import { envServer } from "@/env-server";

type PostHogServerProperties = Record<
	string,
	string | number | boolean | null | undefined
>;

type TrackPostHogServerEventInput = {
	event: string;
	distinctId: string;
	request?: Request;
	properties?: PostHogServerProperties;
};

const DEFAULT_POSTHOG_KEY = "phc_qBjjWJrivwd3o22DBN6RUtoUFddf5tiAsUQGuzo5LGEC";

function debugPostHogServer(
	message: string,
	data?: Record<string, unknown>,
): void {
	if (envServer.POSTHOG_DEBUG !== "true") return;
	console.info("[PostHog server]", message, data ?? {});
}

function pickHeader(
	request: Request | undefined,
	name: string,
): string | undefined {
	return request?.headers.get(name) ?? undefined;
}

export async function trackPostHogServerEvent(
	input: TrackPostHogServerEventInput,
): Promise<void> {
	try {
		const apiKey = envServer.POSTHOG_KEY ?? DEFAULT_POSTHOG_KEY;
		if (!apiKey || envServer.POSTHOG_DISABLED === "true") {
			debugPostHogServer("capture skipped: disabled or missing key", {
				event: input.event,
				disabled: envServer.POSTHOG_DISABLED === "true",
				hasKey: !!apiKey,
			});
			return;
		}

		const host = (envServer.POSTHOG_HOST ?? "https://eu.i.posthog.com").replace(
			/\/$/,
			"",
		);
		const requestUrl = input.request ? new URL(input.request.url) : undefined;
		const properties = Object.fromEntries(
			Object.entries({
				...input.properties,
				$current_url: requestUrl?.href,
				$pathname: requestUrl?.pathname,
				$referrer: pickHeader(input.request, "referer"),
				$useragent: pickHeader(input.request, "user-agent"),
				locale: pickHeader(input.request, "accept-language")
					?.split(",")[0]
					?.trim(),
			}).filter(([, value]) => value !== undefined),
		);

		const response = await fetch(`${host}/capture/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				api_key: apiKey,
				event: input.event,
				distinct_id: input.distinctId,
				properties,
			}),
		});
		debugPostHogServer("capture", {
			event: input.event,
			host,
			status: response.status,
			ok: response.ok,
		});
	} catch (error) {
		console.error("Failed to track PostHog server event:", error);
	}
}
