import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const createdGradientsTable = sqliteTable("created_gradients", {
	id: text("id").primaryKey(),
	share: text("share").notNull().unique(),
	width: integer("width").notNull(),
	height: integer("height").notNull(),
	shapesCount: integer("shapes_count").notNull(),
	colorsCount: integer("colors_count").notNull(),
	exportedFormats: text("exported_formats").notNull(), // JSON string array
	status: text("status").notNull().default("draft"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const userExportedGradientsTable = sqliteTable(
	"user_exported_gradients",
	{
		id: text("id").primaryKey(),
		ownerId: text("owner_id").notNull(),
		share: text("share").notNull(),
		width: integer("width").notNull(),
		height: integer("height").notNull(),
		shapesCount: integer("shapes_count").notNull(),
		colorsCount: integer("colors_count").notNull(),
		exportedFormats: text("exported_formats").notNull(),
		createdAt: integer("created_at").notNull(),
		updatedAt: integer("updated_at").notNull(),
	},
	(table) => [
		uniqueIndex("user_exported_gradients_owner_share_unique").on(
			table.ownerId,
			table.share,
		),
		index("user_exported_gradients_owner_updated_idx").on(
			table.ownerId,
			table.updatedAt,
		),
	],
);

export type CreatedGradientTable = typeof createdGradientsTable.$inferSelect;
export type UserExportedGradientTable =
	typeof userExportedGradientsTable.$inferSelect;
