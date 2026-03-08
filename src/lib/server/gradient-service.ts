import { db } from "@/lib/db";
import { createdGradientsTable } from "@/lib/db/schema";
import type { GetGradientsValidator } from "@/lib/validators/validator.gradient";
import { eq, sql } from "drizzle-orm";

export async function getTotalExportsFromDbData() {
	const result = await db
		.select({
			count: sql<number>`count(*)`.as("count"),
		})
		.from(createdGradientsTable);

	return { count: result[0]?.count || 0 };
}

export async function getPublicGradientsFromDbData() {
	const gradients = await db
		.select()
		.from(createdGradientsTable)
		.where(eq(createdGradientsTable.status, "public"));

	return { gradients };
}

export async function saveGradientToDbData(data: {
	share: string;
	format: "png" | "svg" | "css" | "share" | "webp";
	width: number;
	height: number;
	shapesCount: number;
	colorsCount: number;
}) {
	const now = Date.now();
	const existing = await db
		.select()
		.from(createdGradientsTable)
		.where(eq(createdGradientsTable.share, data.share))
		.limit(1);

	if (existing.length > 0) {
		const prev = existing[0];
		const formats = new Set<string>(JSON.parse(prev.exportedFormats));
		formats.add(data.format);
		await db
			.update(createdGradientsTable)
			.set({
				width: data.width,
				height: data.height,
				shapesCount: data.shapesCount,
				colorsCount: data.colorsCount,
				exportedFormats: JSON.stringify(Array.from(formats)),
				updatedAt: now,
			})
			.where(eq(createdGradientsTable.share, data.share));
		return { ok: true, id: prev.id, updated: true };
	}

	const id = `created_${Math.random().toString(36).slice(2, 10)}`;
	await db.insert(createdGradientsTable).values({
		id,
		share: data.share,
		width: data.width,
		height: data.height,
		shapesCount: data.shapesCount,
		colorsCount: data.colorsCount,
		exportedFormats: JSON.stringify([data.format]),
		status: "draft",
		createdAt: now,
		updatedAt: now,
	});

	return { ok: true, id, created: true };
}

export async function updateGradientStatusInDbData(data: {
	id: string;
	status: "draft" | "public";
}) {
	await db
		.update(createdGradientsTable)
		.set({ status: data.status })
		.where(eq(createdGradientsTable.id, data.id));
	return { ok: true, id: data.id, updated: true };
}

export async function deleteGradientFromDbData(data: { id: string }) {
	await db
		.delete(createdGradientsTable)
		.where(eq(createdGradientsTable.id, data.id));
	return { ok: true, id: data.id, deleted: true };
}

export async function getGradientsFromDbData(data: GetGradientsValidator) {
	const gradients = await db
		.select()
		.from(createdGradientsTable)
		.where(
			data.status ? eq(createdGradientsTable.status, data.status) : undefined,
		)
		.limit(data.limit)
		.offset((data.page - 1) * data.limit);
	return { gradients };
}
