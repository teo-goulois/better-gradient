import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const apiKeysTable = sqliteTable("api_keys", {
	id: text("id").primaryKey(),
	email: text("email").notNull(),
	keyHash: text("key_hash").notNull().unique(),
	prefix: text("prefix").notNull(),
	tier: text("tier").notNull().default("verified"),
	status: text("status").notNull().default("active"),
	createdAt: integer("created_at").notNull(),
	lastUsedAt: integer("last_used_at"),
	revokedAt: integer("revoked_at"),
});

export const apiKeyRequestsTable = sqliteTable("api_key_requests", {
	id: text("id").primaryKey(),
	email: text("email").notNull(),
	tokenHash: text("token_hash").notNull().unique(),
	expiresAt: integer("expires_at").notNull(),
	usedAt: integer("used_at"),
	requestIp: text("request_ip").notNull(),
	createdAt: integer("created_at").notNull(),
});

export type ApiKeyRecord = typeof apiKeysTable.$inferSelect;
export type ApiKeyRequestRecord = typeof apiKeyRequestsTable.$inferSelect;
