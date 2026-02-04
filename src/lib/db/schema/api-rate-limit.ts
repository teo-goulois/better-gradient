import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const apiRateLimitsTable = sqliteTable("api_rate_limits", {
	bucket: text("bucket").primaryKey(),
	scope: text("scope").notNull(),
	identifier: text("identifier").notNull(),
	windowStart: integer("window_start").notNull(),
	count: integer("count").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export type ApiRateLimitTable = typeof apiRateLimitsTable.$inferSelect;
