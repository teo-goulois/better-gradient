import { umamiConfig } from "@/utils/analytics";

type UmamiEventData = Record<
	string,
	string | number | boolean | null | undefined
>;

type TrackUmamiServerEventInput = {
	name: string;
	url: string;
	request: Request;
	title?: string;
	data?: UmamiEventData;
};

function normalizeHost(host: string): string {
	return host.replace(/^https?:\/\//, "").split("/")[0] ?? host;
}

function pickHeader(request: Request, name: string): string | undefined {
	return request.headers.get(name) ?? undefined;
}

export async function trackUmamiServerEvent(
	input: TrackUmamiServerEventInput,
): Promise<void> {
	try {
		const hostUrl = umamiConfig.hostUrl.replace(/\/$/, "");
		const websiteId = umamiConfig.websiteId;
		if (!hostUrl || !websiteId) {
			return;
		}

		const requestUrl = new URL(input.request.url);
		const forwardedHost = pickHeader(input.request, "x-forwarded-host");
		const hostHeader = pickHeader(input.request, "host");
		const hostname = normalizeHost(
			forwardedHost ?? hostHeader ?? requestUrl.host,
		);
		const languageHeader = pickHeader(input.request, "accept-language");
		const language = languageHeader?.split(",")[0]?.trim() || "en";
		const referrer = pickHeader(input.request, "referer") ?? "";
		const userAgent =
			pickHeader(input.request, "user-agent") ?? "BetterGradientAPI/1.0";

		const data = input.data
			? Object.fromEntries(
					Object.entries(input.data).filter(
						([, value]) => value !== undefined,
					),
				)
			: undefined;

		const payload = {
			hostname,
			language,
			referrer,
			screen: "0x0",
			title: input.title ?? "API Event",
			url: input.url,
			website: websiteId,
			name: input.name,
			data,
		};

		await fetch(`${hostUrl}/api/send`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": userAgent,
			},
			body: JSON.stringify({
				type: "event",
				payload,
			}),
		});
	} catch (error) {
		console.error("Failed to track Umami server event:", error);
	}
}
