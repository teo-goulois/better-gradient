import { env } from "@/env";
import posthog from "posthog-js";

interface DiscordEmbedField {
	name: string;
	value: string;
	inline?: boolean;
}

interface DiscordEmbed {
	title?: string;
	description?: string;
	color?: number;
	fields?: DiscordEmbedField[];
	timestamp?: string;
	footer?: {
		text: string;
	};
}

interface DiscordWebhookPayload {
	username?: string;
	avatar_url?: string;
	content?: string;
	embeds?: DiscordEmbed[];
}

interface EventData {
	event: string;
	url?: string;
	referrer?: string;
	[key: string]: unknown;
}

type AnalyticsProperties = Record<string, unknown>;

const DEFAULT_POSTHOG_KEY = "phc_qBjjWJrivwd3o22DBN6RUtoUFddf5tiAsUQGuzo5LGEC";
const POSTHOG_KEY = env.VITE_POSTHOG_KEY ?? DEFAULT_POSTHOG_KEY;
const POSTHOG_HOST = env.VITE_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const POSTHOG_REPLAY_SAMPLE_RATE = Number.parseFloat(
	env.VITE_POSTHOG_REPLAY_SAMPLE_RATE ?? "0.02",
);
const ANONYMOUS_ID_KEY = "bg_anonymous_user_id";
const FIRST_SEEN_KEY = "bg_first_seen_at";
const LAST_SEEN_KEY = "bg_last_seen_at";
const FIRST_REFERRER_KEY = "bg_first_referrer_domain";
const FIRST_LANDING_PATH_KEY = "bg_first_landing_path";
const RETURN_VISIT_MIN_MS = 24 * 60 * 60 * 1000;

let posthogInitialized = false;
let lifecycleCaptured = false;
let lastCapturedPageviewUrl: string | null = null;

const DISCORD_WEBHOOK_URL =
	"https://discord.com/api/webhooks/1410733340084015214/Ydp1bquncROUJ_grG-zg1tReLO9hgpyndACglVViWreRK6azU7caf6EAwszq67hr4nlv";

async function sendDiscordNotification(
	event: string,
	data?: Record<string, unknown>,
): Promise<void> {
	try {
		const embed: DiscordEmbed = {
			title: event,
			description: data
				? Object.entries(data)
						.filter(([, value]) => value !== undefined && value !== null)
						.map(([key, value]) => `**${key}:** ${value}`)
						.join("\n")
				: undefined,
			color: 0x6366f1,
			timestamp: new Date().toISOString(),
		};

		const payload: DiscordWebhookPayload = {
			username: "Better Gradient Bot",
			embeds: [embed],
		};

		await fetch(DISCORD_WEBHOOK_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});
	} catch (error) {
		console.error("Failed to send Discord notification:", error);
	}
}

declare global {
	interface Window {
		umami?: {
			track: (event: string, data?: Record<string, unknown>) => void;
		};
	}
}

async function trackUmamiEvent(event: string): Promise<void> {
	try {
		if (typeof window !== "undefined" && window.umami) {
			window.umami.track(event);
		}
	} catch (error) {
		console.error("Failed to track Umami event:", error);
	}
}

function isPostHogEnabled(): boolean {
	return (
		typeof window !== "undefined" &&
		env.VITE_POSTHOG_DISABLED !== "true" &&
		!!POSTHOG_KEY
	);
}

function debugPostHog(message: string, data?: Record<string, unknown>): void {
	if (env.VITE_POSTHOG_DEBUG !== "true") return;
	console.info("[PostHog]", message, data ?? {});
}

function getReferrerDomain(): string {
	if (typeof document === "undefined" || !document.referrer) {
		return "direct";
	}
	try {
		return new URL(document.referrer).hostname;
	} catch {
		return "unknown";
	}
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
	if (typeof window === "undefined") return "desktop";
	const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
	if (!coarsePointer) return "desktop";
	return window.innerWidth >= 768 ? "tablet" : "mobile";
}

function getLocale(): string {
	if (typeof navigator === "undefined") return "unknown";
	return navigator.language || "unknown";
}

function readStorage(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStorage(key: string, value: string): void {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// Analytics must not break the product when storage is unavailable.
	}
}

function createId(): string {
	return (
		globalThis.crypto?.randomUUID?.() ?? `bg_${Date.now()}_${Math.random()}`
	);
}

function stableHashToUnitInterval(value: string): number {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) / 2 ** 32;
}

function getReplaySampleRate(): number {
	if (!Number.isFinite(POSTHOG_REPLAY_SAMPLE_RATE)) return 0.02;
	return Math.min(Math.max(POSTHOG_REPLAY_SAMPLE_RATE, 0), 1);
}

function shouldRecordSessionReplay(anonymousId: string): boolean {
	if (env.VITE_POSTHOG_REPLAY_FORCE === "true") return true;

	try {
		if (new URLSearchParams(window.location.search).get("replay") === "1") {
			return true;
		}
	} catch {
		// URL parsing is best-effort; sampling remains the fallback.
	}

	return stableHashToUnitInterval(anonymousId) < getReplaySampleRate();
}

function getOrCreateAnonymousUserId(): string {
	const existing = readStorage(ANONYMOUS_ID_KEY);
	if (existing) return existing;

	const id = createId();
	writeStorage(ANONYMOUS_ID_KEY, id);
	return id;
}

function commonProperties(): AnalyticsProperties {
	return {
		path: window.location.pathname,
		referrer_domain: getReferrerDomain(),
		device_type: getDeviceType(),
		locale: getLocale(),
	};
}

function normalizeProperties(
	properties?: AnalyticsProperties,
): AnalyticsProperties | undefined {
	if (!properties) return undefined;
	return Object.fromEntries(
		Object.entries(properties)
			.map(([key, value]) => [
				key
					.replace(/^colors_count$/, "palette_count")
					.replace(/^shapes_count$/, "shape_count"),
				value,
			])
			.filter(([, value]) => value !== undefined),
	);
}

function initPostHog(): void {
	if (posthogInitialized) {
		debugPostHog("init skipped: already initialized");
		return;
	}

	if (!isPostHogEnabled()) {
		debugPostHog("init skipped: disabled or missing key", {
			hasWindow: typeof window !== "undefined",
			disabled: env.VITE_POSTHOG_DISABLED === "true",
			hasKey: !!POSTHOG_KEY,
			host: POSTHOG_HOST,
		});
		return;
	}

	const anonymousId = getOrCreateAnonymousUserId();
	const firstSeenAt = readStorage(FIRST_SEEN_KEY) ?? new Date().toISOString();
	const firstReferrerDomain =
		readStorage(FIRST_REFERRER_KEY) ?? getReferrerDomain();
	const firstLandingPath =
		readStorage(FIRST_LANDING_PATH_KEY) ?? window.location.pathname;

	writeStorage(FIRST_SEEN_KEY, firstSeenAt);
	writeStorage(FIRST_REFERRER_KEY, firstReferrerDomain);
	writeStorage(FIRST_LANDING_PATH_KEY, firstLandingPath);

	posthog.init(POSTHOG_KEY, {
		api_host: POSTHOG_HOST,
		person_profiles: "identified_only",
		capture_pageview: false,
		autocapture: false,
		disable_session_recording: true,
		loaded: (client) => {
			client.identify(anonymousId, {
				first_seen_at: firstSeenAt,
				first_referrer_domain: firstReferrerDomain,
				first_landing_path: firstLandingPath,
				device_type: getDeviceType(),
				locale: getLocale(),
			});
			if (shouldRecordSessionReplay(anonymousId)) {
				client.startSessionRecording();
				debugPostHog("session replay started", {
					sampleRate: getReplaySampleRate(),
				});
			} else {
				debugPostHog("session replay skipped", {
					sampleRate: getReplaySampleRate(),
				});
			}
		},
	});
	posthogInitialized = true;
	debugPostHog("initialized", {
		host: POSTHOG_HOST,
		keyPrefix: POSTHOG_KEY.slice(0, 8),
		distinctId: anonymousId,
		path: window.location.pathname,
	});
}

function capturePostHogEvent(
	event: string,
	properties?: AnalyticsProperties,
): void {
	initPostHog();
	if (!posthogInitialized) {
		debugPostHog("capture skipped: not initialized", { event });
		return;
	}
	const normalizedProperties = normalizeProperties(properties);
	debugPostHog("capture", { event, properties: normalizedProperties });
	posthog.capture(event, normalizedProperties);
}

function capturePageview(pathname?: string): void {
	initPostHog();
	if (!posthogInitialized || typeof window === "undefined") {
		debugPostHog("pageview skipped: not initialized", { pathname });
		return;
	}

	const currentUrl = window.location.href;
	if (lastCapturedPageviewUrl === currentUrl) {
		debugPostHog("pageview skipped: duplicate", { currentUrl });
		return;
	}
	lastCapturedPageviewUrl = currentUrl;

	const properties = {
		...commonProperties(),
		$current_url: currentUrl,
		$host: window.location.host,
		$pathname: pathname ?? window.location.pathname,
		$title: document.title,
	};

	debugPostHog("pageview", properties);
	posthog.capture("$pageview", properties);
}

function mapLegacyEvent(
	event: string,
	data?: AnalyticsProperties,
): { event: string; properties?: AnalyticsProperties } | null {
	switch (event) {
		case "Editor Loaded":
			return {
				event: "editor_loaded",
				properties: {
					entry_source: inferEditorEntrySource(),
					is_mobile: getDeviceType() !== "desktop",
					...data,
				},
			};
		case "Randomize Gradient":
			return null;
		case "Apply Preset":
			return {
				event: "preset_applied",
				properties: {
					preset_type: data?.is_user_preset ? "user" : "built_in",
					preset_name: data?.preset_name,
				},
			};
		case "Save Custom Preset":
			return {
				event: "custom_preset_saved",
				properties: data,
			};
		case "Copy Share URL":
			return {
				event: "share_link_copied",
				properties: {
					surface: "editor_export_popover",
					...data,
				},
			};
		case "Export PNG":
			return exportEvent("png", data);
		case "Export WebP":
			return exportEvent("webp", data);
		case "Export SVG":
			return exportEvent("svg", data);
		case "Copy CSS":
			return exportEvent("css", data);
		case "API Key Requested":
			return {
				event: "api_key_requested",
				properties: data,
			};
		case "View Shared Gradient":
			return {
				event: "gallery_gradient_opened",
				properties: {
					source: "share",
					...data,
				},
			};
		default:
			return null;
	}
}

function exportEvent(format: string, data?: AnalyticsProperties) {
	return {
		event: "export_completed",
		properties: {
			format,
			...data,
		},
	};
}

function inferEditorEntrySource(): string {
	if (typeof document === "undefined") return "direct";
	const referrer = document.referrer;
	if (!referrer) return "direct";
	try {
		const url = new URL(referrer);
		if (url.pathname === "/") return "home_cta";
		if (url.pathname.startsWith("/share/")) return "share_page";
		if (url.pathname === "/random-gradient") return "random_gradient_page";
		if (url.pathname === "/gallery") return "gallery";
		return "other";
	} catch {
		return "other";
	}
}

function captureLifecycleEvents(): void {
	if (lifecycleCaptured || typeof window === "undefined") return;
	lifecycleCaptured = true;

	initPostHog();
	if (!posthogInitialized) return;

	const now = Date.now();
	const previousLastSeen = Number(readStorage(LAST_SEEN_KEY) ?? 0);
	const firstSeenAt = readStorage(FIRST_SEEN_KEY);
	const properties = commonProperties();

	capturePostHogEvent("app_loaded", properties);

	if (previousLastSeen && now - previousLastSeen >= RETURN_VISIT_MIN_MS) {
		capturePostHogEvent("return_visit", {
			days_since_last_seen: Math.floor(
				(now - previousLastSeen) / RETURN_VISIT_MIN_MS,
			),
			path: window.location.pathname,
		});
	}

	posthog.setPersonProperties({
		is_returning_user: !!firstSeenAt && previousLastSeen > 0,
		device_type: getDeviceType(),
		locale: getLocale(),
	});
	writeStorage(LAST_SEEN_KEY, String(now));
}

async function trackEvent(
	event: string,
	data?: Record<string, unknown>,
	hideDiscord?: boolean,
): Promise<void> {
	//if (env.VITE_SERVER_URL !== "http://localhost:3000") {
	const posthogEvent = mapLegacyEvent(event, data);
	if (posthogEvent) {
		capturePostHogEvent(posthogEvent.event, posthogEvent.properties);
	}
	await Promise.allSettled([
		hideDiscord ? Promise.resolve() : sendDiscordNotification(event, data),
		trackUmamiEvent(event),
	]);
	//}
}

export {
	captureLifecycleEvents,
	capturePageview,
	capturePostHogEvent,
	getOrCreateAnonymousUserId,
	sendDiscordNotification,
	trackUmamiEvent,
	trackEvent,
	type EventData,
};
