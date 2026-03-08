import { createHash } from "node:crypto";
import { envServer } from "@/env-server";
import { db } from "@/lib/db";
import {
	accountsTable,
	sessionsTable,
	usersTable,
	verificationsTable,
} from "@/lib/db/schema";
import { getRequestHeaders, getRequestIP } from "@tanstack/react-start/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export type Viewer = {
	user: null | {
		id: string;
		email: string;
		name: string;
		image: string | null;
	};
};

function hashToken(value: string) {
	return createHash("sha256").update(value).digest("hex");
}

function siteUrl() {
	return envServer.BETTER_AUTH_URL.replace(/\/$/, "");
}

export const auth = betterAuth({
	baseURL: siteUrl(),
	secret: envServer.BETTER_AUTH_SECRET,
	trustedOrigins: [siteUrl()],
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: usersTable,
			session: sessionsTable,
			account: accountsTable,
			verification: verificationsTable,
		},
	}),
	socialProviders: {
		google: {
			clientId: envServer.GOOGLE_CLIENT_ID,
			clientSecret: envServer.GOOGLE_CLIENT_SECRET,
			prompt: "consent",
			accessType: "offline",
		},
	},
	plugins: [tanstackStartCookies()],
});

export async function getCurrentViewer(): Promise<Viewer> {
	const requestHeaders = new Headers();
	for (const [key, value] of getRequestHeaders().entries()) {
		requestHeaders.set(key, value);
	}
	const session = await auth.api.getSession({
		headers: requestHeaders,
	});

	if (!session?.user) {
		return { user: null };
	}

	return {
		user: {
			id: session.user.id,
			email: session.user.email,
			name: session.user.name,
			image: session.user.image ?? null,
		},
	};
}

export async function requireCurrentUser() {
	const viewer = await getCurrentViewer();
	if (!viewer.user) {
		throw new Error("UNAUTHORIZED");
	}
	return viewer.user;
}

export function buildVisitorHash() {
	const ip = getRequestIP({ xForwardedFor: true }) || "unknown";
	const agent = getRequestHeaders().get("user-agent") || "unknown";
	return hashToken(`${envServer.BETTER_AUTH_SECRET}:${ip}:${agent}`);
}
