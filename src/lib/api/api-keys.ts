import { db } from "@/lib/db";
import { apiKeysTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { LRUCache } from "lru-cache";

const KEY_PREFIX = "bg";
const KEY_SEPARATOR = "_";

type CachedApiKey = {
	id: string;
	email: string;
	tier: string;
	status: string;
	prefix: string;
	lastUsedAt: number | null;
};

type ApiKeyCache = LRUCache<string, CachedApiKey>;

const globalForApiKeys = globalThis as typeof globalThis & {
	__apiKeyCache?: ApiKeyCache;
};

const apiKeyCache =
	globalForApiKeys.__apiKeyCache ??
	new LRUCache<string, CachedApiKey>({
		max: 1000,
		ttl: 1000 * 60 * 10,
	});

globalForApiKeys.__apiKeyCache = apiKeyCache;

async function randomBytes(size: number): Promise<Uint8Array> {
	if (globalThis.crypto?.getRandomValues) {
		const bytes = new Uint8Array(size);
		globalThis.crypto.getRandomValues(bytes);
		return bytes;
	}
	const { randomBytes: nodeRandomBytes } = await import("node:crypto");
	return nodeRandomBytes(size);
}

function toBase64Url(bytes: Uint8Array): string {
	const buffer = Buffer.from(bytes);
	return buffer
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

export async function hashToken(value: string): Promise<string> {
	if (globalThis.crypto?.subtle) {
		const data = new TextEncoder().encode(value);
		const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
		return Array.from(new Uint8Array(digest))
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join("");
	}
	const { createHash } = await import("node:crypto");
	return createHash("sha256").update(value).digest("hex");
}

export async function generateApiKey(): Promise<{
	rawKey: string;
	prefix: string;
	hash: string;
}> {
	const prefixBytes = await randomBytes(4);
	const secretBytes = await randomBytes(24);
	const prefix = Buffer.from(prefixBytes).toString("hex");
	const secret = toBase64Url(secretBytes);
	const rawKey = `${KEY_PREFIX}${KEY_SEPARATOR}${prefix}${KEY_SEPARATOR}${secret}`;
	const hash = await hashToken(rawKey);
	return { rawKey, prefix, hash };
}

export async function generateVerificationToken(): Promise<{
	token: string;
	hash: string;
}> {
	const tokenBytes = await randomBytes(32);
	const token = toBase64Url(tokenBytes);
	const hash = await hashToken(token);
	return { token, hash };
}

export function extractApiKey(request: Request): string | null {
	const headerKey =
		request.headers.get("x-api-key") ?? request.headers.get("X-API-Key");
	if (headerKey) return headerKey.trim();
	const authHeader =
		request.headers.get("authorization") ??
		request.headers.get("Authorization");
	if (!authHeader) return null;
	const [scheme, token] = authHeader.split(" ");
	if (!scheme || !token) return null;
	if (scheme.toLowerCase() !== "bearer") return null;
	return token.trim();
}

export function getClientIp(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const [first] = forwarded.split(",");
		if (first?.trim()) return first.trim();
	}
	const realIp = request.headers.get("x-real-ip");
	if (realIp?.trim()) return realIp.trim();
	const cfConnectingIp = request.headers.get("cf-connecting-ip");
	if (cfConnectingIp?.trim()) return cfConnectingIp.trim();
	return "unknown";
}

export async function validateApiKey(rawKey: string): Promise<CachedApiKey | null> {
	const hash = await hashToken(rawKey);
	const cached = apiKeyCache.get(hash);
	if (cached) return cached;
	const record = await db
		.select({
			id: apiKeysTable.id,
			email: apiKeysTable.email,
			tier: apiKeysTable.tier,
			status: apiKeysTable.status,
			prefix: apiKeysTable.prefix,
			lastUsedAt: apiKeysTable.lastUsedAt,
		})
		.from(apiKeysTable)
		.where(eq(apiKeysTable.keyHash, hash))
		.limit(1);

	const found = record[0];
	if (!found || found.status !== "active") {
		return null;
	}

	const now = Date.now();
	const shouldTouch =
		!found.lastUsedAt || now - found.lastUsedAt > 1000 * 60 * 60;
	if (shouldTouch) {
		await db
			.update(apiKeysTable)
			.set({ lastUsedAt: now })
			.where(eq(apiKeysTable.id, found.id));
		found.lastUsedAt = now;
	}

	apiKeyCache.set(hash, found);
	return found;
}
