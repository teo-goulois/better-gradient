import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { envServer } from "@/env-server";
import { db } from "../db";
import { apiKeyRequestsTable, apiKeysTable } from "../db/schema";
import {
	confirmApiKeyValidator,
	requestApiKeyValidator,
} from "../validators/validator.api-key";

const REQUEST_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const DEFAULT_SITE_URL = "https://better-gradient.com";

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function siteUrl(): string {
	const raw = process.env.VITE_SITE_URL ?? DEFAULT_SITE_URL;
	return raw.replace(/\/$/, "");
}

function generateApiKey(): string {
	const payload = randomBytes(24).toString("hex");
	return `bg_live_${payload}`;
}

async function sendConfirmationEmail(args: {
	to: string;
	confirmUrl: string;
}) {
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${envServer.RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: envServer.RESEND_FROM_EMAIL,
			to: args.to,
			subject: "Confirm your Better Gradient API key",
			html: `
				<div style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111;">
					<h2 style="margin: 0 0 12px;">Confirm your API key request</h2>
					<p style="margin: 0 0 16px;">Click the link below to confirm your request and generate your API key.</p>
					<p style="margin: 0 0 24px;">
						<a href="${args.confirmUrl}" style="background: #111; color: #fff; padding: 12px 16px; text-decoration: none; display: inline-block;">Confirm API key</a>
					</p>
					<p style="margin: 0; color: #555;">If you didn't request access, you can ignore this email.</p>
				</div>
			`,
		}),
	});

	if (!response.ok) {
		const detail = await response.text();
		throw new Error(`Resend error: ${response.status} ${detail}`);
	}
}

export const requestApiKey = createServerFn({
	method: "POST",
	response: "data",
})
	.validator((data: unknown) => requestApiKeyValidator.parse(data))
	.handler(async ({ data }) => {
		const now = Date.now();
		const email = normalizeEmail(data.email);
		const token = randomUUID();
		const tokenHash = hashToken(token);
		const id = `api_req_${Math.random().toString(36).slice(2, 10)}`;
		const expiresAt = now + REQUEST_TTL_MS;
		const confirmUrl = `${siteUrl()}/developers/confirm?token=${token}`;

		await db.insert(apiKeyRequestsTable).values({
			id,
			email,
			tokenHash,
			expiresAt,
			usedAt: null,
			requestIp: "unknown",
			createdAt: now,
		});

		await sendConfirmationEmail({ to: email, confirmUrl });

		return {
			ok: true,
			id,
			email,
			expiresAt,
		};
	});

export const confirmApiKeyRequest = createServerFn({
	method: "POST",
	response: "data",
})
	.validator((data: unknown) => confirmApiKeyValidator.parse(data))
	.handler(async ({ data }) => {
		const now = Date.now();
		const tokenHash = hashToken(data.token);
		const request = await db
			.select()
			.from(apiKeyRequestsTable)
			.where(eq(apiKeyRequestsTable.tokenHash, tokenHash))
			.limit(1);

		const record = request[0];
		if (!record) {
			return { ok: false, error: "invalid" } as const;
		}
		if (record.usedAt) {
			return { ok: false, error: "used" } as const;
		}
		if (record.expiresAt < now) {
			return { ok: false, error: "expired" } as const;
		}

		const apiKey = generateApiKey();
		const keyHash = hashToken(apiKey);
		const prefix = apiKey.slice(0, 12);
		const id = `api_key_${Math.random().toString(36).slice(2, 10)}`;

		await db.transaction(async (tx) => {
			await tx.insert(apiKeysTable).values({
				id,
				email: record.email,
				keyHash,
				prefix,
				tier: "verified",
				status: "active",
				createdAt: now,
				lastUsedAt: null,
				revokedAt: null,
			});
			await tx
				.update(apiKeyRequestsTable)
				.set({ usedAt: now })
				.where(eq(apiKeyRequestsTable.id, record.id));
		});

		return {
			ok: true,
			apiKey,
		};
	});
