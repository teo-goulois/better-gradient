import {
	MetricCard,
	ProductShell,
	SurfaceCard,
	VisibilityBadge,
} from "@/components/gradients/product-shell";
import { getViewerQueryOptions } from "@/lib/actions/actions.auth";
import { getGradientAnalyticsQueryOptions } from "@/lib/actions/actions.saved-gradient";
import type { LeaderboardWindow } from "@/lib/validators/validator.saved-gradient";
import { seo } from "@/utils/seo";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const windowSchema = z.enum(["24h", "7d", "30d", "all"]).catch("30d");

export const Route = createFileRoute("/dashboard/gradients/$gradientId")({
	validateSearch: z.object({
		window: windowSchema.optional(),
	}),
	loaderDeps: ({ search }) => ({
		window: search.window ?? "30d",
	}),
	head: () => ({
		...seo({
			title: "Gradient analytics | Better Gradient",
			description:
				"Private analytics for your published Better Gradient links.",
			noindex: true,
		}),
	}),
	loader: async ({ context, params, deps }) => {
		const viewer = await context.queryClient.ensureQueryData(
			getViewerQueryOptions(),
		);
		if (!viewer.user) {
			throw redirect({
				href: `/login?next=${encodeURIComponent(
					`/dashboard/gradients/${params.gradientId}`,
				)}`,
			});
		}
		await context.queryClient.ensureQueryData(
			getGradientAnalyticsQueryOptions(params.gradientId, deps.window),
		);
		return null;
	},
	component: DashboardGradientDetailPage,
});

function DashboardGradientDetailPage() {
	const { gradientId } = Route.useParams();
	const search = Route.useSearch();
	const window = search.window ?? "30d";
	const { data } = useSuspenseQuery(
		getGradientAnalyticsQueryOptions(gradientId, window),
	);

	return (
		<ProductShell
			title={data.gradient.title}
			description="Private analytics for your published gradient."
			actions={
				<>
					<Link
						to="/dashboard"
						className="inline-flex items-center border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950"
					>
						Back to dashboard
					</Link>
					<Link
						to="/editor"
						search={{ gradientId }}
						className="inline-flex items-center border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950"
					>
						Edit gradient
					</Link>
					{data.gradient.publicSlug &&
					data.gradient.visibility !== "private" ? (
						<Link
							to="/g/$slug"
							params={{ slug: data.gradient.publicSlug }}
							className="inline-flex items-center bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
						>
							Open published page
						</Link>
					) : null}
				</>
			}
		>
			<div className="flex flex-wrap items-center justify-between gap-4 border border-neutral-200 bg-white p-3">
				<VisibilityBadge
					visibility={
						data.gradient.visibility as "private" | "public" | "unlisted"
					}
				/>
				<WindowTabs gradientId={gradientId} currentWindow={window} />
			</div>

			{/* KPI grid */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
				<MetricCard label="Views" value={data.kpis.views.toLocaleString()} />
				<MetricCard
					label="Unique visitors"
					value={data.kpis.uniqueVisitors.toLocaleString()}
				/>
				<MetricCard
					label="Upvotes"
					value={data.kpis.upvotes.toLocaleString()}
				/>
				<MetricCard
					label="Editor CTR"
					value={formatPercent(data.kpis.openEditorCtr)}
				/>
				<MetricCard
					label="Copy link CTR"
					value={formatPercent(data.kpis.copyLinkCtr)}
				/>
				<MetricCard
					label="Rank"
					value={data.kpis.leaderboardPosition ?? "—"}
					helper={
						data.gradient.visibility === "public"
							? "Among public gradients"
							: "Public only"
					}
				/>
			</div>

			{/* Charts row */}
			<div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
				<SurfaceCard>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
								Time series
							</p>
							<h2 className="mt-2 font-nohemi text-2xl font-semibold tracking-tight text-neutral-950">
								Daily activity
							</h2>
						</div>
						<div className="flex flex-wrap gap-4 text-sm text-neutral-600">
							<span className="flex items-center gap-2">
								<span className="size-2.5 bg-sky-400" />
								Views
							</span>
							<span className="flex items-center gap-2">
								<span className="size-2.5 bg-amber-400" />
								Open editor
							</span>
							<span className="flex items-center gap-2">
								<span className="size-2.5 bg-rose-400" />
								Copy link
							</span>
						</div>
					</div>
					<AnalyticsSeriesChart series={data.series} />
				</SurfaceCard>

				<SurfaceCard>
					<p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
						Traffic sources
					</p>
					<h2 className="mt-2 font-nohemi text-2xl font-semibold tracking-tight text-neutral-950">
						Top referrers
					</h2>
					{data.referrers.length === 0 ? (
						<p className="mt-6 text-sm leading-6 text-neutral-600">
							No referrers yet. Direct traffic and bookmarks typically show up first.
						</p>
					) : (
						<ReferrerList referrers={data.referrers} />
					)}
				</SurfaceCard>
			</div>
		</ProductShell>
	);
}

function WindowTabs({
	gradientId,
	currentWindow,
}: {
	gradientId: string;
	currentWindow: LeaderboardWindow;
}) {
	const windows: Array<{ label: string; value: LeaderboardWindow }> = [
		{ label: "24h", value: "24h" },
		{ label: "7d", value: "7d" },
		{ label: "30d", value: "30d" },
		{ label: "All time", value: "all" },
	];

	return (
		<div className="inline-flex gap-1">
			{windows.map((item) => {
				const isActive = item.value === currentWindow;
				return (
					<Link
						key={item.value}
						to="/dashboard/gradients/$gradientId"
						params={{ gradientId }}
						search={{ window: item.value }}
						className={
							isActive
								? "bg-neutral-950 px-3 py-1.5 text-sm font-semibold text-white"
								: "px-3 py-1.5 text-sm font-semibold text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
						}
					>
						{item.label}
					</Link>
				);
			})}
		</div>
	);
}

function AnalyticsSeriesChart({
	series,
}: {
	series: Array<{
		day: string;
		views: number;
		openEditor: number;
		copyLink: number;
	}>;
}) {
	if (series.length === 0) {
		return (
			<div className="mt-8 flex items-center justify-center py-12 text-sm text-neutral-400">
				No events yet for this time window.
			</div>
		);
	}

	const maxValue = Math.max(
		...series.map((entry) =>
			Math.max(entry.views, entry.openEditor, entry.copyLink),
		),
		1,
	);

	return (
		<div className="mt-6 flex items-end gap-1" style={{ height: 180 }}>
			{series.map((entry) => (
				<div key={entry.day} className="group relative flex flex-1 items-end gap-0.5" style={{ height: "100%" }}>
					<BarColumn value={entry.views} maxValue={maxValue} className="bg-sky-400" />
					<BarColumn value={entry.openEditor} maxValue={maxValue} className="bg-amber-400" />
					<BarColumn value={entry.copyLink} maxValue={maxValue} className="bg-rose-400" />

					<div className="pointer-events-none absolute -top-14 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm group-hover:block">
						<p className="font-semibold text-neutral-950">{entry.day}</p>
						<div className="mt-1 flex gap-2 text-neutral-500">
							<span className="flex items-center gap-1"><span className="size-1.5 bg-sky-400" />{entry.views}</span>
							<span className="flex items-center gap-1"><span className="size-1.5 bg-amber-400" />{entry.openEditor}</span>
							<span className="flex items-center gap-1"><span className="size-1.5 bg-rose-400" />{entry.copyLink}</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function BarColumn({
	value,
	maxValue,
	className,
}: {
	value: number;
	maxValue: number;
	className: string;
}) {
	const heightPercent = Math.max(3, (value / maxValue) * 100);

	return (
		<div
			className={`flex-1 transition-all duration-300 ${className}`}
			style={{ height: `${heightPercent}%` }}
		/>
	);
}

function ReferrerList({
	referrers,
}: {
	referrers: Array<{ host: string; count: number }>;
}) {
	const maxCount = Math.max(...referrers.map((r) => r.count), 1);

	return (
		<div className="mt-6 space-y-2">
			{referrers.map((referrer) => (
				<div
					key={referrer.host}
					className="relative overflow-hidden"
				>
					<div
						className="absolute inset-y-0 left-0 bg-neutral-100"
						style={{
							width: `${(referrer.count / maxCount) * 100}%`,
						}}
					/>
					<div className="relative flex items-center justify-between gap-3 px-4 py-2.5">
						<p className="truncate text-sm font-semibold text-neutral-950">
							{referrer.host}
						</p>
						<p className="shrink-0 text-sm tabular-nums text-neutral-500">
							{referrer.count.toLocaleString()} views
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

function formatPercent(value: number) {
	return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;
}
