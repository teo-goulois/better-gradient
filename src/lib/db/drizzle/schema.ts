import { sqliteTable, AnySQLiteColumn, uniqueIndex, text, integer } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const createdGradients = sqliteTable("created_gradients", {
	id: text().primaryKey().notNull(),
	share: text().notNull(),
	width: integer().notNull(),
	height: integer().notNull(),
	shapesCount: integer("shapes_count").notNull(),
	colorsCount: integer("colors_count").notNull(),
	exportedFormats: text("exported_formats").notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	status: text().default("draft").notNull(),
},
(table) => [
	uniqueIndex("created_gradients_share_unique").on(table.share),
]);

export const apiKeyRequests = sqliteTable("api_key_requests", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: integer("expires_at").notNull(),
	usedAt: integer("used_at"),
	requestIp: text("request_ip").notNull(),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	uniqueIndex("api_key_requests_token_hash_unique").on(table.tokenHash),
]);

export const apiKeys = sqliteTable("api_keys", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	keyHash: text("key_hash").notNull(),
	prefix: text().notNull(),
	tier: text().default("verified").notNull(),
	status: text().default("active").notNull(),
	createdAt: integer("created_at").notNull(),
	lastUsedAt: integer("last_used_at"),
	revokedAt: integer("revoked_at"),
},
(table) => [
	uniqueIndex("api_keys_key_hash_unique").on(table.keyHash),
]);

