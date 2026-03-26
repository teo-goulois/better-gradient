import {
	createdGradientsTable,
	userExportedGradientsTable,
} from "@/lib/db/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	getCurrentViewerMock,
	requireCurrentUserMock,
	dbMock,
	resetState,
	globalRows,
	userRows,
	viewerState,
} = vi.hoisted(() => {
		const globalRows: Array<Record<string, unknown>> = [];
		const userRows: Array<Record<string, unknown>> = [];
		const viewerState: {
			user: null | { id: string; email: string; name: string; image: null };
		} = { user: null };

		function getRows(table: unknown) {
			if (table === createdGradientsTable) {
				return globalRows;
			}
			if (table === userExportedGradientsTable) {
				if (!viewerState.user) return [];
				return userRows.filter((row) => row.ownerId === viewerState.user?.id);
			}
			throw new Error("Unexpected table");
		}

		const dbMock = {
			select: vi.fn(() => ({
				from: (table: unknown) => ({
					where: () => ({
						limit: async () => getRows(table).slice(0, 1),
						orderBy: async () =>
							[...getRows(table)].sort(
								(a, b) => Number(b.updatedAt) - Number(a.updatedAt),
							),
					}),
				}),
			})),
			insert: vi.fn((table: unknown) => ({
				values: async (value: Record<string, unknown>) => {
					if (table === createdGradientsTable) {
						globalRows.push(value);
						return;
					}
					if (table === userExportedGradientsTable) {
						userRows.push(value);
						return;
					}
					throw new Error("Unexpected table");
				},
			})),
			update: vi.fn((table: unknown) => ({
				set: (patch: Record<string, unknown>) => ({
					where: async () => {
						const target = getRows(table)[0];
						if (target) {
							Object.assign(target, patch);
						}
					},
				}),
			})),
		};

		return {
			getCurrentViewerMock: vi.fn(async () => viewerState),
			requireCurrentUserMock: vi.fn(async () => {
				if (!viewerState.user) {
					throw new Error("UNAUTHORIZED");
				}
				return viewerState.user;
			}),
			dbMock,
			resetState: () => {
				globalRows.length = 0;
				userRows.length = 0;
				viewerState.user = null;
			},
			globalRows,
			userRows,
			viewerState,
		};
	});

vi.mock("@/lib/auth", () => ({
	getCurrentViewer: getCurrentViewerMock,
	requireCurrentUser: requireCurrentUserMock,
}));

vi.mock("@/lib/db", () => ({
	db: dbMock,
}));

import {
	listExportedGradientsForOwner,
	saveGradientToDbData,
} from "./gradient-service";

describe("gradient export persistence", () => {
	beforeEach(() => {
		resetState();
		vi.clearAllMocks();
	});

	it("writes both global exports and owned export history for logged-in users", async () => {
		viewerState.user = {
			id: "user_1",
			email: "user_1@example.com",
			name: "User One",
			image: null,
		};

		await saveGradientToDbData({
			share: "share_one",
			format: "png",
			width: 1200,
			height: 900,
			shapesCount: 5,
			colorsCount: 4,
		});

		expect(globalRows).toHaveLength(1);
		expect(userRows).toHaveLength(1);
		expect(globalRows[0]?.share).toBe("share_one");
		expect(userRows[0]?.ownerId).toBe("user_1");
		expect(userRows[0]?.exportedFormats).toBe(JSON.stringify(["png"]));
	});

	it("keeps anonymous exports out of the owned export history", async () => {
		await saveGradientToDbData({
			share: "share_two",
			format: "svg",
			width: 1200,
			height: 900,
			shapesCount: 5,
			colorsCount: 4,
		});

		expect(globalRows).toHaveLength(1);
		expect(userRows).toHaveLength(0);
	});

	it("merges formats when the same user exports the same share twice", async () => {
		viewerState.user = {
			id: "user_1",
			email: "user_1@example.com",
			name: "User One",
			image: null,
		};

		await saveGradientToDbData({
			share: "share_three",
			format: "png",
			width: 1200,
			height: 900,
			shapesCount: 5,
			colorsCount: 4,
		});
		await saveGradientToDbData({
			share: "share_three",
			format: "svg",
			width: 1200,
			height: 900,
			shapesCount: 5,
			colorsCount: 4,
		});

		expect(globalRows).toHaveLength(1);
		expect(userRows).toHaveLength(1);
		expect(JSON.parse(String(globalRows[0]?.exportedFormats))).toEqual([
			"png",
			"svg",
		]);
		expect(JSON.parse(String(userRows[0]?.exportedFormats))).toEqual([
			"png",
			"svg",
		]);
	});

	it("creates distinct owned export rows when two users export the same share", async () => {
		viewerState.user = {
			id: "user_1",
			email: "user_1@example.com",
			name: "User One",
			image: null,
		};
		await saveGradientToDbData({
			share: "shared_gradient",
			format: "png",
			width: 1200,
			height: 900,
			shapesCount: 5,
			colorsCount: 4,
		});

		viewerState.user = {
			id: "user_2",
			email: "user_2@example.com",
			name: "User Two",
			image: null,
		};
		await saveGradientToDbData({
			share: "shared_gradient",
			format: "png",
			width: 1200,
			height: 900,
			shapesCount: 5,
			colorsCount: 4,
		});

		expect(globalRows).toHaveLength(1);
		expect(userRows).toHaveLength(2);
		expect(userRows.map((row) => row.ownerId)).toEqual(["user_1", "user_2"]);
	});

	it("lists only the current user's export history", async () => {
		userRows.push(
			{
				id: "export_1",
				ownerId: "user_1",
				share: "share_a",
				width: 1200,
				height: 900,
				shapesCount: 5,
				colorsCount: 4,
				exportedFormats: JSON.stringify(["png"]),
				createdAt: 1,
				updatedAt: 1,
			},
			{
				id: "export_2",
				ownerId: "user_2",
				share: "share_b",
				width: 1200,
				height: 900,
				shapesCount: 5,
				colorsCount: 4,
				exportedFormats: JSON.stringify(["svg"]),
				createdAt: 2,
				updatedAt: 2,
			},
		);
		viewerState.user = {
			id: "user_1",
			email: "user_1@example.com",
			name: "User One",
			image: null,
		};

		const result = await listExportedGradientsForOwner();

		expect(result.gradients).toHaveLength(1);
		expect(result.gradients[0]?.share).toBe("share_a");
	});
});
