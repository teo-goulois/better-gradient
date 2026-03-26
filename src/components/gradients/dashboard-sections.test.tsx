// @vitest-environment jsdom

import {
	FAVORITES_DASHBOARD_HREF,
	dashboardSearchSchema,
	getDashboardFilterCounts,
	resolveDashboardFilter,
} from "@/lib/dashboard";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		className,
		to,
	}: {
		children: ReactNode;
		className?: string;
		to?: string;
	}) => (
		<a href={to} className={className}>
			{children}
		</a>
	),
}));

import {
	DashboardCollections,
	DashboardFilterTabs,
} from "./dashboard-sections";

afterEach(() => {
	cleanup();
});

describe("dashboard filters", () => {
	it("resolves the default filter and keeps the favorites redirect stable", () => {
		expect(resolveDashboardFilter(dashboardSearchSchema.parse({}).filter)).toBe(
			"all",
		);
		expect(
			resolveDashboardFilter(
				dashboardSearchSchema.parse({ filter: "invalid" }).filter,
			),
		).toBe("all");
		expect(FAVORITES_DASHBOARD_HREF).toBe("/dashboard?filter=favorites");
	});

	it("renders filter tabs with counts and highlights the active tab", () => {
		render(
			<DashboardFilterTabs
				currentFilter="all"
				counts={getDashboardFilterCounts({
					saved: 2,
					favorites: 1,
					exported: 3,
				})}
			/>,
		);

		const allLink = screen.getByText("All").closest("a");
		const savedLink = screen.getByText("Saved").closest("a");

		expect(screen.getByText("6")).not.toBeNull();
		expect(screen.getByText("3")).not.toBeNull();
		expect(allLink?.className).toContain("bg-neutral-950");
		expect(savedLink?.className).not.toContain("bg-neutral-950");
	});
});

describe("dashboard sections", () => {
	const sections = [
		{
			key: "saved" as const,
			title: "Saved gradients",
			description: "saved description",
			count: 0,
			content: <div>saved content</div>,
			empty: <div>saved empty</div>,
		},
		{
			key: "favorites" as const,
			title: "Private favorites",
			description: "favorite description",
			count: 1,
			content: <div>favorite content</div>,
			empty: <div>favorite empty</div>,
		},
		{
			key: "exported" as const,
			title: "Export history",
			description: "export description",
			count: 1,
			content: <div>export content</div>,
			empty: <div>export empty</div>,
		},
	];

	it("shows only the requested filtered section", () => {
		render(<DashboardCollections filter="exported" sections={sections} />);

		expect(screen.getByText("Export history")).not.toBeNull();
		expect(screen.getByText("export content")).not.toBeNull();
		expect(screen.queryByText("Saved gradients")).toBeNull();
		expect(screen.queryByText("Private favorites")).toBeNull();
	});

	it("shows all sections and the matching empty state on the all view", () => {
		render(<DashboardCollections filter="all" sections={sections} />);

		expect(screen.getByText("Saved gradients")).not.toBeNull();
		expect(screen.getByText("Private favorites")).not.toBeNull();
		expect(screen.getByText("Export history")).not.toBeNull();
		expect(screen.getByText("saved empty")).not.toBeNull();
		expect(screen.getByText("favorite content")).not.toBeNull();
		expect(screen.getByText("export content")).not.toBeNull();
	});
});
