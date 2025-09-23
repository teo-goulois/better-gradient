import z from "zod";

export const saveGradientValidator = z.object({
	share: z.string(),
	format: z.enum(["png", "svg", "css", "share"]),
	width: z.number(),
	height: z.number(),
	shapesCount: z.number(),
	colorsCount: z.number(),
});

export const getGradientValidator = z.object({
	share: z.string(),
});

export const updateGradientValidator = z.object({
	id: z.string(),
	status: z.enum(["draft", "public"]),
});

export const getGradientsValidator = z.object({
	page: z.number(),
	limit: z.number(),
	status: z.enum(["draft", "public"]).nullable(),
});
export type GetGradientsValidator = z.infer<typeof getGradientsValidator>;
