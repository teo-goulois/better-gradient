import z from "zod";

export const gradientVisibilitySchema = z.enum(["private", "unlisted", "public"]);
export const gradientReactionTypeSchema = z.enum(["upvote", "favorite"]);
export const leaderboardWindowSchema = z.enum(["24h", "7d", "30d", "all"]);
export const leaderboardModeSchema = z.enum(["trending", "viewed", "voted"]);
export const gradientEventTypeSchema = z.enum(["view", "open_editor", "copy_link"]);

export const createSavedGradientValidator = z.object({
	title: z.string().trim().min(1).max(120).optional(),
	shareState: z.string().min(1),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	shapesCount: z.number().int().nonnegative(),
	colorsCount: z.number().int().nonnegative(),
});

export const updateSavedGradientValidator = createSavedGradientValidator.extend({
	id: z.string().min(1),
});

export const updateSavedGradientMetaValidator = z.object({
	id: z.string().min(1),
	title: z.string().trim().min(1).max(120),
	visibility: gradientVisibilitySchema.optional(),
});

export const deleteSavedGradientValidator = z.object({
	id: z.string().min(1),
});

export const gradientIdValidator = z.object({
	id: z.string().min(1),
});

export const gradientSlugValidator = z.object({
	slug: z.string().min(1),
});

export const toggleGradientReactionValidator = z.object({
	gradientId: z.string().min(1),
	type: gradientReactionTypeSchema,
});

export const leaderboardValidator = z.object({
	window: leaderboardWindowSchema.default("7d"),
	mode: leaderboardModeSchema.default("trending"),
});

export const analyticsValidator = z.object({
	gradientId: z.string().min(1),
	window: leaderboardWindowSchema.default("30d"),
});

export const trackGradientEventValidator = z.object({
	slug: z.string().min(1),
	eventType: gradientEventTypeSchema,
	referrer: z.string().url().optional().or(z.literal("")),
});

export type GradientVisibility = z.infer<typeof gradientVisibilitySchema>;
export type LeaderboardWindow = z.infer<typeof leaderboardWindowSchema>;
export type LeaderboardMode = z.infer<typeof leaderboardModeSchema>;
