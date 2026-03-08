import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable(
	"users",
	{
		id: text("id").primaryKey(),
		email: text("email").notNull(),
		name: text("name").notNull(),
		image: text("image"),
		emailVerified: integer("email_verified", { mode: "boolean" })
			.notNull()
			.default(false),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessionsTable = sqliteTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id").notNull(),
		token: text("token").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [uniqueIndex("sessions_token_unique").on(table.token)],
);

export const accountsTable = sqliteTable(
	"accounts",
	{
		id: text("id").primaryKey(),
		userId: text("user_id").notNull(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("accounts_provider_account_unique").on(
			table.providerId,
			table.accountId,
		),
	],
);

export const verificationsTable = sqliteTable(
	"verifications",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("verifications_identifier_value_unique").on(
			table.identifier,
			table.value,
		),
	],
);

export type UserTable = typeof usersTable.$inferSelect;
export type SessionTable = typeof sessionsTable.$inferSelect;
export type AccountTable = typeof accountsTable.$inferSelect;
export type VerificationTable = typeof verificationsTable.$inferSelect;
