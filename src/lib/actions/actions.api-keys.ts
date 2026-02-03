import { envServer } from "@/env-server";
import {
	generateApiKey,
	generateVerificationToken,
	getClientIp,
	hashToken,
} from "@/lib/api/api-keys";
import { applyKeyRequestLimit } from "@/lib/api/rate-limit";
import { db } from "@/lib/db";
import { apiKeyRequestsTable, apiKeysTable } from "@/lib/db/schema";
import {
	requestApiKeyValidator,
	verifyApiKeyValidator,
} from "@/lib/validators/validator.api-keys";
import { eq } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";
import { siteUrl } from "@/utils/site";

const resend = new Resend(envServer.RESEND_API_KEY);
const REQUEST_EXPIRATION_MS = 1000 * 60 * 60 * 24;

function createId(prefix: string) {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const requestApiKey = createServerFn({
	method: "POST",
	response: "data",
})
	.validator((data: unknown) => requestApiKeyValidator.parse(data))
	.handler(async ({ data, request }) => {
		const email = data.email.toLowerCase().trim();
		const requestIp = request ? getClientIp(request) : "unknown";

		const [limitByIp, limitByEmail] = await Promise.all([
			applyKeyRequestLimit(`ip:${requestIp}`),
			applyKeyRequestLimit(`email:${email}`),
		]);

		if (!limitByIp.allowed || !limitByEmail.allowed) {
			return {
				ok: false,
				error: "rate_limited",
				retryAfter:
					limitByIp.headers["Retry-After"] ??
					limitByEmail.headers["Retry-After"] ??
					null,
			};
		}

		const { token, hash } = await generateVerificationToken();
		const now = Date.now();
		const expiresAt = now + REQUEST_EXPIRATION_MS;

		await db.insert(apiKeyRequestsTable).values({
			id: createId("api_req"),
			email,
			tokenHash: hash,
			expiresAt,
			requestIp,
			createdAt: now,
		});

		const origin = request ? new URL(request.url).origin : siteUrl;
		const verifyUrl = `${origin}/developers?token=${encodeURIComponent(token)}`;

		try {
			await resend.emails.send({
				from: envServer.RESEND_FROM_EMAIL,
				to: email,
				subject: "Your Better Gradient API key request",
				html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2>Verify your email to get an API key</h2>
            <p>Click the button below to verify your email and receive your API key.</p>
            <p style="margin:24px 0">
              <a href="${verifyUrl}" style="background:#111;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">Verify and get key</a>
            </p>
            <p>This link expires in 24 hours.</p>
            <p>If you didn't request this, you can ignore this email.</p>
          </div>
        `,
			});
		} catch (error) {
			console.error("Failed to send API key verification email", error);
			return { ok: false, error: "email_failed" };
		}

		return { ok: true };
	});

export const verifyApiKey = createServerFn({
	method: "POST",
	response: "data",
})
	.validator((data: unknown) => verifyApiKeyValidator.parse(data))
	.handler(async ({ data }) => {
		const token = data.token.trim();
		const hashedToken = await hashToken(token);
		const existing = await db
			.select()
			.from(apiKeyRequestsTable)
			.where(eq(apiKeyRequestsTable.tokenHash, hashedToken))
			.limit(1);

		const record = existing[0];
		if (!record) {
			return { ok: false, error: "invalid_token" };
		}
		if (record.usedAt) {
			return { ok: false, error: "token_used" };
		}
		const now = Date.now();
		if (record.expiresAt < now) {
			return { ok: false, error: "token_expired" };
		}

		const { rawKey, prefix, hash: keyHash } = await generateApiKey();
		await db.insert(apiKeysTable).values({
			id: createId("api_key"),
			email: record.email,
			keyHash,
			prefix,
			tier: "verified",
			status: "active",
			createdAt: now,
			lastUsedAt: null,
		});
		await db
			.update(apiKeyRequestsTable)
			.set({ usedAt: now })
			.where(eq(apiKeyRequestsTable.id, record.id));

		return {
			ok: true,
			apiKey: rawKey,
			email: record.email,
			tier: "verified",
		};
	});
