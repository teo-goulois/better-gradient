import { getCurrentViewer, requireCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	createdGradientsTable,
	userExportedGradientsTable,
} from "@/lib/db/schema";
import type { GetGradientsValidator } from "@/lib/validators/validator.gradient";
import { and, desc, eq, sql } from "drizzle-orm";

type ExportFormat = "png" | "svg" | "css" | "share" | "webp";
type SaveGradientExportInput = {
	share: string;
	format: ExportFormat;
	width: number;
	height: number;
	shapesCount: number;
	colorsCount: number;
};

export function mergeExportedFormats(
	existingFormats: string,
	format: ExportFormat,
) {
	const formats = new Set<string>(JSON.parse(existingFormats));
	formats.add(format);
	return JSON.stringify(Array.from(formats));
}

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

async function upsertGlobalGradientExport(
	data: SaveGradientExportInput,
	now: number,
) {
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

async function upsertOwnedGradientExport(args: {
	ownerId: string;
	data: SaveGradientExportInput;
	now: number;
}) {
	const existing = await db
		.select()
		.from(userExportedGradientsTable)
		.where(
			and(
				eq(userExportedGradientsTable.ownerId, args.ownerId),
				eq(userExportedGradientsTable.share, args.data.share),
			),
		)
		.limit(1);

	if (existing.length > 0) {
		const prev = existing[0];
		await db
			.update(userExportedGradientsTable)
			.set({
				width: args.data.width,
				height: args.data.height,
				shapesCount: args.data.shapesCount,
				colorsCount: args.data.colorsCount,
				exportedFormats: mergeExportedFormats(
					prev.exportedFormats,
					args.data.format,
				),
				updatedAt: args.now,
			})
			.where(eq(userExportedGradientsTable.id, prev.id));
		return { ok: true, id: prev.id, updated: true };
	}

	const id = `export_${Math.random().toString(36).slice(2, 10)}`;
	await db.insert(userExportedGradientsTable).values({
		id,
		ownerId: args.ownerId,
		share: args.data.share,
		width: args.data.width,
		height: args.data.height,
		shapesCount: args.data.shapesCount,
		colorsCount: args.data.colorsCount,
		exportedFormats: JSON.stringify([args.data.format]),
		createdAt: args.now,
		updatedAt: args.now,
	});

	return { ok: true, id, created: true };
}

export async function saveGradientToDbData(data: SaveGradientExportInput) {
	const now = Date.now();
	const viewer = await getCurrentViewer();
	const globalResult = await upsertGlobalGradientExport(data, now);

	if (viewer.user) {
		await upsertOwnedGradientExport({
			ownerId: viewer.user.id,
			data,
			now,
		});
	}

	return globalResult;
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

export async function listExportedGradientsForOwner() {
	const user = await requireCurrentUser();
	const gradients = await db
		.select({
			id: userExportedGradientsTable.id,
			share: userExportedGradientsTable.share,
			width: userExportedGradientsTable.width,
			height: userExportedGradientsTable.height,
			shapesCount: userExportedGradientsTable.shapesCount,
			colorsCount: userExportedGradientsTable.colorsCount,
			exportedFormats: userExportedGradientsTable.exportedFormats,
			createdAt: userExportedGradientsTable.createdAt,
			updatedAt: userExportedGradientsTable.updatedAt,
		})
		.from(userExportedGradientsTable)
		.where(eq(userExportedGradientsTable.ownerId, user.id))
		.orderBy(desc(userExportedGradientsTable.updatedAt));

	return { gradients };
}
