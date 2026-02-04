import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const apiKeyRequestsTable = sqliteTable(
	"api_key_requests",
	{
		id: text("id").primaryKey(),
		email: text("email").notNull(),
		tokenHash: text("token_hash").notNull(),
		expiresAt: integer("expires_at").notNull(),
		usedAt: integer("used_at"),
		requestIp: text("request_ip").notNull(),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		uniqueIndex("api_key_requests_token_hash_unique").on(table.tokenHash),
	],
);

export const apiKeysTable = sqliteTable(
	"api_keys",
	{
		id: text("id").primaryKey(),
		email: text("email").notNull(),
		keyHash: text("key_hash").notNull(),
		prefix: text("prefix").notNull(),
		tier: text("tier").notNull().default("verified"),
		status: text("status").notNull().default("active"),
		createdAt: integer("created_at").notNull(),
		lastUsedAt: integer("last_used_at"),
		revokedAt: integer("revoked_at"),
	},
	(table) => [uniqueIndex("api_keys_key_hash_unique").on(table.keyHash)],
);

export type ApiKeyRequestTable = typeof apiKeyRequestsTable.$inferSelect;
export type ApiKeyTable = typeof apiKeysTable.$inferSelect;
