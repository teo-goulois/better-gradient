import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export type CreatedGradientTable = typeof createdGradientsTable.$inferSelect;
