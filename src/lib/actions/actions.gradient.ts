import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { createdGradientsTable } from "../db/schema";
import {
	saveGradientValidator,
	updateGradientValidator,
} from "../validators/validator.gradient";

export const getPublicGradientsFromDb = createServerFn({
	method: "GET", // HTTP method to use
	response: "data", // Response handling mode
}).handler(async () => {
	const gradients = await db
		.select()
		.from(createdGradientsTable)
		.where(eq(createdGradientsTable.status, "public"));

	return { gradients };
});

export const getPublicGradientsFromDbQueryOptions = () =>
	queryOptions({
		queryKey: ["getPublicGradientsFromDbQueryOptions"],
		queryFn: () => getPublicGradientsFromDb(),
	});

export const saveGradientToDb = createServerFn({
	method: "POST", // HTTP method to use
	response: "data", // Response handling mode
})
	.validator((data: unknown) => saveGradientValidator.parse(data))
	.handler(async ({ data }) => {
		const now = Date.now();
		// Upsert by share
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

		// Function implementation
	});

export const updateGradientStatusInDb = createServerFn({
	method: "POST", // HTTP method to use
	response: "data", // Response handling mode
})
	.validator((data: unknown) => updateGradientValidator.parse(data))
	.handler(async ({ data }) => {
		await db
			.update(createdGradientsTable)
			.set({ status: data.status })
			.where(eq(createdGradientsTable.id, data.id));
		return { ok: true, id: data.id, updated: true };
	});
