import type { DashboardFilter } from "@/lib/dashboard";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { twJoin } from "tailwind-merge";

type DashboardSection = {
	key: Exclude<DashboardFilter, "all">;
	title: string;
	description: string;
	count: number;
	content: ReactNode;
	empty: ReactNode;
};

export function DashboardFilterTabs({
	currentFilter,
	counts,
}: {
	currentFilter: DashboardFilter;
	counts: Record<DashboardFilter, number>;
}) {
	const filters: Array<{ key: DashboardFilter; label: string }> = [
		{ key: "all", label: "All" },
		{ key: "saved", label: "Saved" },
		{ key: "favorites", label: "Favorites" },
		{ key: "exported", label: "Exported" },
	];

	return (
		<nav
			aria-label="Dashboard filters"
			className="flex flex-wrap gap-1.5 rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-sm shadow-neutral-950/[0.03]"
		>
			{filters.map((filter) => {
				const isActive = filter.key === currentFilter;
				return (
					<Link
						key={filter.key}
						to="/dashboard"
						search={{ filter: filter.key }}
						className={twJoin(
							"inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
							isActive
								? "bg-neutral-900 text-white shadow-sm"
								: "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
						)}
					>
						<span>{filter.label}</span>
						<span
							className={twJoin(
								"min-w-5 rounded-md px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums",
								isActive ? "bg-white/15 text-white/80" : "bg-neutral-100 text-neutral-400",
							)}
						>
							{counts[filter.key]}
						</span>
					</Link>
				);
			})}
		</nav>
	);
}

export function DashboardCollections({
	filter,
	sections,
	allContent,
}: {
	filter: DashboardFilter;
	sections: DashboardSection[];
	allContent?: ReactNode;
}) {
	if (filter === "all") {
		return <>{allContent}</>;
	}

	const section = sections.find((entry) => entry.key === filter);
	if (!section) {
		return null;
	}

	return <DashboardSectionBlock section={section} isFocused />;
}

export function SourceBadge({
	source,
}: {
	source: "saved" | "favorite" | "exported";
}) {
	const config = {
		saved: "bg-sky-100/80 text-sky-600",
		favorite: "bg-rose-100/80 text-rose-500",
		exported: "bg-amber-100/80 text-amber-600",
	};

	return (
		<span
			className={twJoin(
				"inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm",
				config[source],
			)}
		>
			{source}
		</span>
	);
}

function DashboardSectionBlock({
	section,
	isFocused = false,
}: {
	section: DashboardSection;
	isFocused?: boolean;
}) {
	return (
		<section className="grid gap-5">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2
						className={twJoin(
							"font-nohemi font-semibold tracking-tight text-neutral-950",
							isFocused ? "text-3xl" : "text-2xl",
						)}
						style={{ textWrap: "balance" }}
					>
						{section.title}
					</h2>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500" style={{ textWrap: "pretty" }}>
						{section.description}
					</p>
				</div>
				<p className="text-xs font-medium tabular-nums text-neutral-400">
					{section.count} item{section.count === 1 ? "" : "s"}
				</p>
			</header>
			{section.count > 0 ? section.content : section.empty}
		</section>
	);
}
