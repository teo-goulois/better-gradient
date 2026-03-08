import {
	type LeaderboardMode,
	type LeaderboardWindow,
	analyticsValidator,
	createSavedGradientValidator,
	deleteSavedGradientValidator,
	gradientIdValidator,
	gradientSlugValidator,
	leaderboardValidator,
	toggleGradientReactionValidator,
	trackGradientEventValidator,
	updateSavedGradientMetaValidator,
	updateSavedGradientValidator,
} from "@/lib/validators/validator.saved-gradient";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

export const createSavedGradient = createServerFn({
	method: "POST",
	response: "data",
})
	.inputValidator((data: unknown) => createSavedGradientValidator.parse(data))
	.handler(async ({ data }) => {
		const { createSavedGradientRecord } = await import(
			"@/lib/server/saved-gradient-service"
		);
		return createSavedGradientRecord(data);
	});

export const updateSavedGradient = createServerFn({
	method: "POST",
	response: "data",
})
	.inputValidator((data: unknown) => updateSavedGradientValidator.parse(data))
	.handler(async ({ data }) => {
		const { updateSavedGradientRecord } = await import(
			"@/lib/server/saved-gradient-service"
		);
		return updateSavedGradientRecord(data);
	});

export const updateSavedGradientMeta = createServerFn({
	method: "POST",
	response: "data",
})
	.inputValidator((data: unknown) =>
		updateSavedGradientMetaValidator.parse(data),
	)
	.handler(async ({ data }) => {
		const { updateSavedGradientMetadata } = await import(
			"@/lib/server/saved-gradient-service"
		);
		return updateSavedGradientMetadata(data);
	});

export const deleteSavedGradient = createServerFn({
	method: "POST",
	response: "data",
})
	.inputValidator((data: unknown) => deleteSavedGradientValidator.parse(data))
	.handler(async ({ data }) => {
		const { deleteSavedGradientRecord } = await import(
			"@/lib/server/saved-gradient-service"
		);
		return deleteSavedGradientRecord(data);
	});

export const getSavedGradientForEditor = createServerFn({
	method: "GET",
	response: "data",
})
	.inputValidator((data: unknown) => gradientIdValidator.parse(data))
	.handler(async ({ data }) => {
		const { getSavedGradientForEditorById } = await import(
			"@/lib/server/saved-gradient-service"
		);
		return getSavedGradientForEditorById(data);
	});

export const getSavedGradientForEditorQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["saved-gradient-editor", id],
		queryFn: () => getSavedGradientForEditor({ data: { id } }),
	});

export const listSavedGradients = createServerFn({
	method: "GET",
	response: "data",
}).handler(async () => {
	const { listSavedGradientsForOwner } = await import(
		"@/lib/server/saved-gradient-service"
	);
	return listSavedGradientsForOwner();
});

export const listSavedGradientsQueryOptions = () =>
	queryOptions({
		queryKey: ["saved-gradients"],
		queryFn: () => listSavedGradients(),
	});

export const getPublicGradientBySlug = createServerFn({
	method: "GET",
	response: "data",
})
	.inputValidator((data: unknown) => gradientSlugValidator.parse(data))
	.handler(async ({ data }) => {
		const { getPublicGradientBySlugData } = await import(
			"@/lib/server/saved-gradient-service"
		);
		return getPublicGradientBySlugData(data);
	});

export const getPublicGradientBySlugQueryOptions = (slug: string) =>
	queryOptions({
		queryKey: ["public-gradient", slug],
		queryFn: () => getPublicGradientBySlug({ data: { slug } }),
	});

export const toggleGradientReaction = createServerFn({
	method: "POST",
	response: "data",
})
	.inputValidator((data: unknown) =>
		toggleGradientReactionValidator.parse(data),
	)
	.handler(async ({ data }) => {
		const { toggleGradientReactionForCurrentUser } = await import(
			"@/lib/server/saved-gradient-service"
		);
		return toggleGradientReactionForCurrentUser(data);
	});

export const getGradientReactionStateForUser = createServerFn({
	method: "GET",
	response: "data",
})
	.inputValidator((data: unknown) => gradientIdValidator.parse(data))
	.handler(async ({ data }) => {
		const { getGradientReactionStateForCurrentUser } = await import(
			"@/lib/server/saved-gradient-service"
		);
		return getGradientReactionStateForCurrentUser(data);
	});

export const listFavoriteGradients = createServerFn({
	method: "GET",
	response: "data",
}).handler(async () => {
	const { listFavoriteGradientsForOwner } = await import(
		"@/lib/server/saved-gradient-service"
	);
	return listFavoriteGradientsForOwner();
});

export const listFavoriteGradientsQueryOptions = () =>
	queryOptions({
		queryKey: ["favorite-gradients"],
		queryFn: () => listFavoriteGradients(),
	});

export const getGradientAnalytics = createServerFn({
	method: "GET",
	response: "data",
})
	.inputValidator((data: unknown) => analyticsValidator.parse(data))
	.handler(async ({ data }) => {
		const { getGradientAnalyticsForOwner } = await import(
			"@/lib/server/saved-gradient-service"
		);
		return getGradientAnalyticsForOwner(data);
	});

export const getGradientAnalyticsQueryOptions = (
	gradientId: string,
	window: LeaderboardWindow,
) =>
	queryOptions({
		queryKey: ["gradient-analytics", gradientId, window],
		queryFn: () => getGradientAnalytics({ data: { gradientId, window } }),
	});

export const getLeaderboard = createServerFn({
	method: "GET",
	response: "data",
})
	.inputValidator((data: unknown) => leaderboardValidator.parse(data))
	.handler(async ({ data }) => {
		const { getLeaderboardData } = await import(
			"@/lib/server/saved-gradient-service"
		);
		return getLeaderboardData(data);
	});

export const getLeaderboardQueryOptions = (
	window: LeaderboardWindow,
	mode: LeaderboardMode,
) =>
	queryOptions({
		queryKey: ["leaderboard", window, mode],
		queryFn: () => getLeaderboard({ data: { window, mode } }),
	});

export const trackGradientEvent = createServerFn({
	method: "POST",
	response: "data",
})
	.inputValidator((data: unknown) => trackGradientEventValidator.parse(data))
	.handler(async () => {
		throw new Error("Use /api/gradient-events");
	});
