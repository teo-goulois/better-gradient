import { getCurrentViewer, requireCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	apiRateLimitsTable,
	gradientEventsTable,
	gradientReactionsTable,
	savedGradientsTable,
	usersTable,
} from "@/lib/db/schema";
import type {
	LeaderboardMode,
	LeaderboardWindow,
} from "@/lib/validators/validator.saved-gradient";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

type GradientEventType = "view" | "open_editor" | "copy_link";

const REACTION_WINDOW_MS = 60_000;
const REACTION_LIMIT = 60;

function now() {
	return Date.now();
}

function makeId(prefix: string) {
	return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

function slugify(input: string) {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

async function ensureUniqueSlug(title: string, id: string) {
	const base = slugify(title) || `gradient-${id.slice(-6)}`;
	return `${base}-${id.slice(-6)}`;
}

function titleFallback() {
	return "Untitled Gradient";
}

function windowStart(window: LeaderboardWindow) {
	const current = now();
	switch (window) {
		case "24h":
			return current - 1000 * 60 * 60 * 24;
		case "7d":
			return current - 1000 * 60 * 60 * 24 * 7;
		case "30d":
			return current - 1000 * 60 * 60 * 24 * 30;
		case "all":
			return null;
	}
}

function upvoteWeight(window: LeaderboardWindow) {
	switch (window) {
		case "24h":
			return 6;
		case "7d":
			return 8;
		case "30d":
			return 10;
		case "all":
			return 12;
	}
}

function freshnessBonus(publishedAt: number | null) {
	if (!publishedAt) return 0;
	const ageDays = (now() - publishedAt) / (1000 * 60 * 60 * 24);
	return Math.max(0, 1 - ageDays / 30);
}

async function checkReactionRateLimit(userId: string) {
	const current = now();
	const bucketStart =
		Math.floor(current / REACTION_WINDOW_MS) * REACTION_WINDOW_MS;
	const bucket = `reaction:${userId}:${bucketStart}`;

	await db
		.insert(apiRateLimitsTable)
		.values({
			bucket,
			scope: "reaction",
			identifier: userId,
			windowStart: bucketStart,
			count: 1,
			updatedAt: current,
		})
		.onConflictDoUpdate({
			target: apiRateLimitsTable.bucket,
			set: {
				count: sql<number>`${apiRateLimitsTable.count} + 1`,
				updatedAt: current,
			},
		});

	const row = await db
		.select({ count: apiRateLimitsTable.count })
		.from(apiRateLimitsTable)
		.where(eq(apiRateLimitsTable.bucket, bucket))
		.limit(1);

	if ((row[0]?.count ?? 0) > REACTION_LIMIT) {
		throw new Error("RATE_LIMITED");
	}
}

async function getReactionCounts(
	gradientIds: string[],
	userId?: string | null,
) {
	if (gradientIds.length === 0) {
		return {
			upvotes: new Map<string, number>(),
			favorites: new Set<string>(),
		};
	}

	const grouped = await db
		.select({
			gradientId: gradientReactionsTable.gradientId,
			type: gradientReactionsTable.type,
			count: sql<number>`count(*)`.as("count"),
		})
		.from(gradientReactionsTable)
		.where(inArray(gradientReactionsTable.gradientId, gradientIds))
		.groupBy(gradientReactionsTable.gradientId, gradientReactionsTable.type);

	const favorites = new Set<string>();
	if (userId) {
		const favoriteRows = await db
			.select({ gradientId: gradientReactionsTable.gradientId })
			.from(gradientReactionsTable)
			.where(
				and(
					inArray(gradientReactionsTable.gradientId, gradientIds),
					eq(gradientReactionsTable.userId, userId),
					eq(gradientReactionsTable.type, "favorite"),
				),
			);
		for (const row of favoriteRows) {
			favorites.add(row.gradientId);
		}
	}

	const upvotes = new Map<string, number>();
	for (const row of grouped) {
		if (row.type === "upvote") {
			upvotes.set(row.gradientId, row.count);
		}
	}

	return { upvotes, favorites };
}

async function getEventCounts(
	gradientIds: string[],
	window: LeaderboardWindow,
) {
	if (gradientIds.length === 0) {
		return new Map<
			string,
			{
				views: number;
				uniqueVisitors: number;
				openInEditor: number;
				copyLink: number;
			}
		>();
	}

	const start = windowStart(window);
	const filters = [
		inArray(gradientEventsTable.gradientId, gradientIds),
		start ? sql`${gradientEventsTable.createdAt} >= ${start}` : undefined,
	].filter(Boolean);

	const rows = await db
		.select({
			gradientId: gradientEventsTable.gradientId,
			eventType: gradientEventsTable.eventType,
			count: sql<number>`count(*)`.as("count"),
			uniqueVisitors:
				sql<number>`count(distinct ${gradientEventsTable.visitorHash})`.as(
					"unique_visitors",
				),
		})
		.from(gradientEventsTable)
		.where(and(...filters))
		.groupBy(gradientEventsTable.gradientId, gradientEventsTable.eventType);

	const result = new Map<
		string,
		{
			views: number;
			uniqueVisitors: number;
			openInEditor: number;
			copyLink: number;
		}
	>();

	for (const row of rows) {
		const entry = result.get(row.gradientId) ?? {
			views: 0,
			uniqueVisitors: 0,
			openInEditor: 0,
			copyLink: 0,
		};
		if (row.eventType === "view") {
			entry.views = row.count;
			entry.uniqueVisitors = row.uniqueVisitors;
		}
		if (row.eventType === "open_editor") {
			entry.openInEditor = row.count;
		}
		if (row.eventType === "copy_link") {
			entry.copyLink = row.count;
		}
		result.set(row.gradientId, entry);
	}

	return result;
}

function computeTrendingScore(args: {
	views: number;
	upvotes: number;
	publishedAt: number | null;
	window: LeaderboardWindow;
}) {
	return (
		args.views * 1 +
		args.upvotes * upvoteWeight(args.window) +
		freshnessBonus(args.publishedAt)
	);
}

export async function createSavedGradientRecord(data: {
	title?: string;
	shareState: string;
	width: number;
	height: number;
	shapesCount: number;
	colorsCount: number;
}) {
	const user = await requireCurrentUser();
	const timestamp = now();
	const id = makeId("grad");

	await db.insert(savedGradientsTable).values({
		id,
		ownerId: user.id,
		title: data.title?.trim() || titleFallback(),
		shareState: data.shareState,
		publicSlug: null,
		visibility: "private",
		width: data.width,
		height: data.height,
		shapesCount: data.shapesCount,
		colorsCount: data.colorsCount,
		createdAt: timestamp,
		updatedAt: timestamp,
		publishedAt: null,
	});

	return { ok: true, id };
}

export async function updateSavedGradientRecord(data: {
	id: string;
	title?: string;
	shareState: string;
	width: number;
	height: number;
	shapesCount: number;
	colorsCount: number;
}) {
	const user = await requireCurrentUser();
	const existing = await db
		.select()
		.from(savedGradientsTable)
		.where(
			and(
				eq(savedGradientsTable.id, data.id),
				eq(savedGradientsTable.ownerId, user.id),
			),
		)
		.limit(1);

	if (!existing[0]) {
		throw new Error("NOT_FOUND");
	}

	await db
		.update(savedGradientsTable)
		.set({
			title: data.title?.trim() || existing[0].title,
			shareState: data.shareState,
			width: data.width,
			height: data.height,
			shapesCount: data.shapesCount,
			colorsCount: data.colorsCount,
			updatedAt: now(),
		})
		.where(eq(savedGradientsTable.id, data.id));

	return { ok: true, id: data.id };
}

export async function updateSavedGradientMetadata(data: {
	id: string;
	title: string;
	visibility?: "private" | "unlisted" | "public";
}) {
	const user = await requireCurrentUser();
	const existing = await db
		.select()
		.from(savedGradientsTable)
		.where(
			and(
				eq(savedGradientsTable.id, data.id),
				eq(savedGradientsTable.ownerId, user.id),
			),
		)
		.limit(1);

	if (!existing[0]) {
		throw new Error("NOT_FOUND");
	}

	const nextVisibility = data.visibility ?? existing[0].visibility;
	const publishedAt =
		nextVisibility === "private"
			? existing[0].publishedAt
			: (existing[0].publishedAt ?? now());
	const publicSlug =
		nextVisibility === "private" && existing[0].publicSlug
			? existing[0].publicSlug
			: (existing[0].publicSlug ??
				(await ensureUniqueSlug(data.title || existing[0].title, data.id)));

	await db
		.update(savedGradientsTable)
		.set({
			title: data.title,
			visibility: nextVisibility,
			publicSlug,
			publishedAt,
			updatedAt: now(),
		})
		.where(eq(savedGradientsTable.id, data.id));

	return { ok: true, id: data.id, visibility: nextVisibility, publicSlug };
}

export async function deleteSavedGradientRecord(data: { id: string }) {
	const user = await requireCurrentUser();
	const existing = await db
		.select({ id: savedGradientsTable.id })
		.from(savedGradientsTable)
		.where(
			and(
				eq(savedGradientsTable.id, data.id),
				eq(savedGradientsTable.ownerId, user.id),
			),
		)
		.limit(1);

	if (!existing[0]) {
		throw new Error("NOT_FOUND");
	}

	await db
		.delete(gradientEventsTable)
		.where(eq(gradientEventsTable.gradientId, data.id));
	await db
		.delete(gradientReactionsTable)
		.where(eq(gradientReactionsTable.gradientId, data.id));
	await db
		.delete(savedGradientsTable)
		.where(eq(savedGradientsTable.id, data.id));

	return { ok: true, id: data.id };
}

export async function getSavedGradientForEditorById(data: { id: string }) {
	const user = await requireCurrentUser();
	const gradient = await db
		.select()
		.from(savedGradientsTable)
		.where(
			and(
				eq(savedGradientsTable.id, data.id),
				eq(savedGradientsTable.ownerId, user.id),
			),
		)
		.limit(1);

	if (!gradient[0]) {
		throw new Error("NOT_FOUND");
	}

	return { gradient: gradient[0] };
}

export async function listSavedGradientsForOwner() {
	const user = await requireCurrentUser();
	const gradients = await db
		.select({
			id: savedGradientsTable.id,
			title: savedGradientsTable.title,
			shareState: savedGradientsTable.shareState,
			publicSlug: savedGradientsTable.publicSlug,
			visibility: savedGradientsTable.visibility,
			width: savedGradientsTable.width,
			height: savedGradientsTable.height,
			shapesCount: savedGradientsTable.shapesCount,
			colorsCount: savedGradientsTable.colorsCount,
			createdAt: savedGradientsTable.createdAt,
			updatedAt: savedGradientsTable.updatedAt,
			publishedAt: savedGradientsTable.publishedAt,
		})
		.from(savedGradientsTable)
		.where(eq(savedGradientsTable.ownerId, user.id))
		.orderBy(desc(savedGradientsTable.updatedAt));

	const gradientIds = gradients.map((gradient) => gradient.id);
	const eventCounts = await getEventCounts(gradientIds, "7d");
	const reactions = await getReactionCounts(gradientIds, user.id);

	return {
		gradients: gradients.map((gradient) => {
			const events = eventCounts.get(gradient.id);
			return {
				...gradient,
				stats: {
					views7d: events?.views ?? 0,
					upvotes: reactions.upvotes.get(gradient.id) ?? 0,
					isFavorited: reactions.favorites.has(gradient.id),
				},
			};
		}),
	};
}

export async function getPublicGradientBySlugData(data: { slug: string }) {
	const viewer = await getCurrentViewer();
	const gradient = await db
		.select({
			id: savedGradientsTable.id,
			title: savedGradientsTable.title,
			shareState: savedGradientsTable.shareState,
			publicSlug: savedGradientsTable.publicSlug,
			visibility: savedGradientsTable.visibility,
			width: savedGradientsTable.width,
			height: savedGradientsTable.height,
			shapesCount: savedGradientsTable.shapesCount,
			colorsCount: savedGradientsTable.colorsCount,
			publishedAt: savedGradientsTable.publishedAt,
			ownerId: savedGradientsTable.ownerId,
			ownerName: usersTable.name,
			ownerImage: usersTable.image,
		})
		.from(savedGradientsTable)
		.innerJoin(usersTable, eq(usersTable.id, savedGradientsTable.ownerId))
		.where(eq(savedGradientsTable.publicSlug, data.slug))
		.limit(1);

	const item = gradient[0];
	if (!item || item.visibility === "private") {
		throw new Error("NOT_FOUND");
	}

	const events = await getEventCounts([item.id], "all");
	const reactions = await getReactionCounts([item.id], viewer.user?.id);
	const userReactions = viewer.user
		? await db
				.select({ type: gradientReactionsTable.type })
				.from(gradientReactionsTable)
				.where(
					and(
						eq(gradientReactionsTable.gradientId, item.id),
						eq(gradientReactionsTable.userId, viewer.user.id),
					),
				)
		: [];

	return {
		gradient: {
			...item,
			stats: {
				views: events.get(item.id)?.views ?? 0,
				uniqueVisitors: events.get(item.id)?.uniqueVisitors ?? 0,
				upvotes: reactions.upvotes.get(item.id) ?? 0,
			},
			viewerState: {
				isOwner: viewer.user?.id === item.ownerId,
				hasUpvoted: userReactions.some(
					(reaction) => reaction.type === "upvote",
				),
				hasFavorited: userReactions.some(
					(reaction) => reaction.type === "favorite",
				),
			},
		},
	};
}

export async function toggleGradientReactionForCurrentUser(data: {
	gradientId: string;
	type: "upvote" | "favorite";
}) {
	const user = await requireCurrentUser();
	return toggleGradientReactionInternal({
		gradientId: data.gradientId,
		type: data.type,
		userId: user.id,
	});
}

export async function getGradientReactionStateForCurrentUser(data: {
	id: string;
}) {
	const viewer = await getCurrentViewer();
	if (!viewer.user) {
		return { hasUpvoted: false, hasFavorited: false };
	}

	const rows = await db
		.select({ type: gradientReactionsTable.type })
		.from(gradientReactionsTable)
		.where(
			and(
				eq(gradientReactionsTable.gradientId, data.id),
				eq(gradientReactionsTable.userId, viewer.user.id),
			),
		);

	return {
		hasUpvoted: rows.some((row) => row.type === "upvote"),
		hasFavorited: rows.some((row) => row.type === "favorite"),
	};
}

export async function listFavoriteGradientsForOwner() {
	const user = await requireCurrentUser();
	const rows = await db
		.select({
			id: savedGradientsTable.id,
			title: savedGradientsTable.title,
			shareState: savedGradientsTable.shareState,
			publicSlug: savedGradientsTable.publicSlug,
			visibility: savedGradientsTable.visibility,
			width: savedGradientsTable.width,
			height: savedGradientsTable.height,
			shapesCount: savedGradientsTable.shapesCount,
			colorsCount: savedGradientsTable.colorsCount,
			updatedAt: savedGradientsTable.updatedAt,
			ownerName: usersTable.name,
		})
		.from(gradientReactionsTable)
		.innerJoin(
			savedGradientsTable,
			eq(savedGradientsTable.id, gradientReactionsTable.gradientId),
		)
		.innerJoin(usersTable, eq(usersTable.id, savedGradientsTable.ownerId))
		.where(
			and(
				eq(gradientReactionsTable.userId, user.id),
				eq(gradientReactionsTable.type, "favorite"),
			),
		)
		.orderBy(desc(gradientReactionsTable.createdAt));

	return { gradients: rows };
}

export async function getGradientAnalyticsForOwner(data: {
	gradientId: string;
	window: LeaderboardWindow;
}) {
	const user = await requireCurrentUser();
	const gradient = await db
		.select()
		.from(savedGradientsTable)
		.where(
			and(
				eq(savedGradientsTable.id, data.gradientId),
				eq(savedGradientsTable.ownerId, user.id),
			),
		)
		.limit(1);
	const item = gradient[0];
	if (!item) {
		throw new Error("NOT_FOUND");
	}

	const start = windowStart(data.window);
	const filters = [
		eq(gradientEventsTable.gradientId, data.gradientId),
		start ? sql`${gradientEventsTable.createdAt} >= ${start}` : undefined,
	].filter(Boolean);

	const rows = await db
		.select({
			eventType: gradientEventsTable.eventType,
			createdAt: gradientEventsTable.createdAt,
			referrerHost: gradientEventsTable.referrerHost,
			visitorHash: gradientEventsTable.visitorHash,
		})
		.from(gradientEventsTable)
		.where(and(...filters))
		.orderBy(desc(gradientEventsTable.createdAt));

	const upvotes = await db
		.select({
			count: sql<number>`count(*)`.as("count"),
		})
		.from(gradientReactionsTable)
		.where(
			and(
				eq(gradientReactionsTable.gradientId, data.gradientId),
				eq(gradientReactionsTable.type, "upvote"),
			),
		);

	const seriesMap = new Map<
		string,
		{ day: string; views: number; openEditor: number; copyLink: number }
	>();
	const referrerMap = new Map<string, number>();
	const uniqueVisitors = new Set<string>();
	let views = 0;
	let openEditor = 0;
	let copyLink = 0;

	for (const row of rows) {
		const day = new Date(row.createdAt).toISOString().slice(0, 10);
		const entry = seriesMap.get(day) ?? {
			day,
			views: 0,
			openEditor: 0,
			copyLink: 0,
		};
		if (row.eventType === "view") {
			views += 1;
			entry.views += 1;
			uniqueVisitors.add(row.visitorHash);
			if (row.referrerHost) {
				referrerMap.set(
					row.referrerHost,
					(referrerMap.get(row.referrerHost) ?? 0) + 1,
				);
			}
		}
		if (row.eventType === "open_editor") {
			openEditor += 1;
			entry.openEditor += 1;
		}
		if (row.eventType === "copy_link") {
			copyLink += 1;
			entry.copyLink += 1;
		}
		seriesMap.set(day, entry);
	}

	const leaderboard = await getLeaderboardData({
		mode: "trending",
		window: data.window,
	});
	const position =
		leaderboard.gradients.findIndex(
			(candidate) => candidate.id === data.gradientId,
		) + 1;

	return {
		gradient: item,
		kpis: {
			views,
			uniqueVisitors: uniqueVisitors.size,
			openEditor,
			copyLink,
			upvotes: upvotes[0]?.count ?? 0,
			openEditorCtr: views > 0 ? openEditor / views : 0,
			copyLinkCtr: views > 0 ? copyLink / views : 0,
			leaderboardPosition: position > 0 ? position : null,
		},
		series: Array.from(seriesMap.values()).sort((a, b) =>
			a.day.localeCompare(b.day),
		),
		referrers: Array.from(referrerMap.entries())
			.map(([host, count]) => ({ host, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10),
	};
}

export async function getLeaderboardData(data: {
	window: LeaderboardWindow;
	mode: LeaderboardMode;
}) {
	const gradients = await db
		.select({
			id: savedGradientsTable.id,
			title: savedGradientsTable.title,
			shareState: savedGradientsTable.shareState,
			publicSlug: savedGradientsTable.publicSlug,
			width: savedGradientsTable.width,
			height: savedGradientsTable.height,
			shapesCount: savedGradientsTable.shapesCount,
			colorsCount: savedGradientsTable.colorsCount,
			publishedAt: savedGradientsTable.publishedAt,
			updatedAt: savedGradientsTable.updatedAt,
			ownerName: usersTable.name,
			ownerImage: usersTable.image,
		})
		.from(savedGradientsTable)
		.innerJoin(usersTable, eq(usersTable.id, savedGradientsTable.ownerId))
		.where(eq(savedGradientsTable.visibility, "public"));

	const gradientIds = gradients.map((gradient) => gradient.id);
	const events = await getEventCounts(gradientIds, data.window);
	const reactions = await getReactionCounts(gradientIds);

	const enriched = gradients.map((gradient) => {
		const counts = events.get(gradient.id) ?? {
			views: 0,
			uniqueVisitors: 0,
			openInEditor: 0,
			copyLink: 0,
		};
		const upvotes = reactions.upvotes.get(gradient.id) ?? 0;
		return {
			...gradient,
			stats: {
				views: counts.views,
				uniqueVisitors: counts.uniqueVisitors,
				upvotes,
			},
			score: computeTrendingScore({
				views: counts.views,
				upvotes,
				publishedAt: gradient.publishedAt,
				window: data.window,
			}),
		};
	});

	const sorted = [...enriched].sort((a, b) => {
		const comparison =
			data.mode === "viewed"
				? b.stats.views - a.stats.views
				: data.mode === "voted"
					? b.stats.upvotes - a.stats.upvotes
					: b.score - a.score;
		if (comparison !== 0) return comparison;
		if (b.stats.upvotes !== a.stats.upvotes) {
			return b.stats.upvotes - a.stats.upvotes;
		}
		if (b.stats.uniqueVisitors !== a.stats.uniqueVisitors) {
			return b.stats.uniqueVisitors - a.stats.uniqueVisitors;
		}
		return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
	});

	return { gradients: sorted };
}

export async function trackGradientEventInternal(args: {
	slug: string;
	eventType: GradientEventType;
	referrer?: string;
	visitorHash: string;
}) {
	const gradient = await db
		.select({
			id: savedGradientsTable.id,
			visibility: savedGradientsTable.visibility,
		})
		.from(savedGradientsTable)
		.where(eq(savedGradientsTable.publicSlug, args.slug))
		.limit(1);

	const item = gradient[0];
	if (!item || item.visibility === "private") {
		return { ok: false as const };
	}

	const referrerHost = (() => {
		if (!args.referrer) return null;
		try {
			return new URL(args.referrer).host;
		} catch {
			return null;
		}
	})();

	await db.insert(gradientEventsTable).values({
		id: makeId("evt"),
		gradientId: item.id,
		eventType: args.eventType,
		visitorHash: args.visitorHash,
		referrerHost,
		createdAt: now(),
	});

	return { ok: true as const, gradientId: item.id };
}

export async function toggleGradientReactionInternal(args: {
	gradientId: string;
	type: "upvote" | "favorite";
	userId: string;
}) {
	await checkReactionRateLimit(args.userId);

	const gradient = await db
		.select()
		.from(savedGradientsTable)
		.where(eq(savedGradientsTable.id, args.gradientId))
		.limit(1);
	const item = gradient[0];
	if (!item) {
		throw new Error("NOT_FOUND");
	}
	if (args.type === "upvote" && item.visibility !== "public") {
		throw new Error("FORBIDDEN");
	}
	if (args.type === "upvote" && item.ownerId === args.userId) {
		throw new Error("OWN_GRADIENT");
	}
	if (
		args.type === "favorite" &&
		item.visibility === "private" &&
		item.ownerId !== args.userId
	) {
		throw new Error("FORBIDDEN");
	}

	const existing = await db
		.select({ id: gradientReactionsTable.id })
		.from(gradientReactionsTable)
		.where(
			and(
				eq(gradientReactionsTable.gradientId, args.gradientId),
				eq(gradientReactionsTable.userId, args.userId),
				eq(gradientReactionsTable.type, args.type),
			),
		)
		.limit(1);

	if (existing[0]) {
		await db
			.delete(gradientReactionsTable)
			.where(eq(gradientReactionsTable.id, existing[0].id));
		return { ok: true, active: false };
	}

	await db.insert(gradientReactionsTable).values({
		id: makeId("react"),
		gradientId: args.gradientId,
		userId: args.userId,
		type: args.type,
		createdAt: now(),
	});
	return { ok: true, active: true };
}
