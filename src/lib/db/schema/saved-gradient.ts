import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const savedGradientsTable = sqliteTable(
	"saved_gradients",
	{
		id: text("id").primaryKey(),
		ownerId: text("owner_id").notNull(),
		title: text("title").notNull(),
		shareState: text("share_state").notNull(),
		publicSlug: text("public_slug"),
		visibility: text("visibility").notNull().default("private"),
		width: integer("width").notNull(),
		height: integer("height").notNull(),
		shapesCount: integer("shapes_count").notNull(),
		colorsCount: integer("colors_count").notNull(),
		createdAt: integer("created_at").notNull(),
		updatedAt: integer("updated_at").notNull(),
		publishedAt: integer("published_at"),
	},
	(table) => [
		index("saved_gradients_owner_id_idx").on(table.ownerId),
		uniqueIndex("saved_gradients_public_slug_unique").on(table.publicSlug),
		index("saved_gradients_visibility_idx").on(table.visibility),
	],
);

export const gradientEventsTable = sqliteTable(
	"gradient_events",
	{
		id: text("id").primaryKey(),
		gradientId: text("gradient_id").notNull(),
		eventType: text("event_type").notNull(),
		visitorHash: text("visitor_hash").notNull(),
		referrerHost: text("referrer_host"),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("gradient_events_gradient_id_created_at_idx").on(
			table.gradientId,
			table.createdAt,
		),
	],
);

export const gradientReactionsTable = sqliteTable(
	"gradient_reactions",
	{
		id: text("id").primaryKey(),
		gradientId: text("gradient_id").notNull(),
		userId: text("user_id").notNull(),
		type: text("type").notNull(),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		uniqueIndex("gradient_reactions_unique").on(
			table.gradientId,
			table.userId,
			table.type,
		),
		index("gradient_reactions_gradient_id_type_created_at_idx").on(
			table.gradientId,
			table.type,
			table.createdAt,
		),
		index("gradient_reactions_user_id_type_created_at_idx").on(
			table.userId,
			table.type,
			table.createdAt,
		),
	],
);

export type SavedGradientTable = typeof savedGradientsTable.$inferSelect;
export type GradientEventTable = typeof gradientEventsTable.$inferSelect;
export type GradientReactionTable = typeof gradientReactionsTable.$inferSelect;
