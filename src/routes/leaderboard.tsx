import { GradientPreview } from "@/components/gradients/gradient-preview";
import {
	ProductShell,
	SurfaceCard,
} from "@/components/gradients/product-shell";
import { getLeaderboardQueryOptions } from "@/lib/actions/actions.saved-gradient";
import type {
	LeaderboardMode,
	LeaderboardWindow,
} from "@/lib/validators/validator.saved-gradient";
import { buildAbsoluteUrl, seo } from "@/utils/seo";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
	mode: z.enum(["trending", "viewed", "voted"]).catch("trending").optional(),
	window: z.enum(["24h", "7d", "30d", "all"]).catch("7d").optional(),
});

export const Route = createFileRoute("/leaderboard")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		mode: search.mode ?? "trending",
		window: search.window ?? "7d",
	}),
	head: () => ({
		...seo({
			title: "Gradient leaderboard | Better Gradient",
			description:
				"Browse trending public gradients, top viewed links and most upvoted creations on Better Gradient.",
			url: buildAbsoluteUrl("/leaderboard"),
			canonical: buildAbsoluteUrl("/leaderboard"),
		}),
	}),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(
			getLeaderboardQueryOptions(deps.window, deps.mode),
		);
		return null;
	},
	component: LeaderboardPage,
});

const podiumColors = [
	{
		text: "bg-gradient-to-b from-amber-300 to-amber-500 bg-clip-text text-transparent",
		ring: "ring-2 ring-amber-200/60 ring-offset-2",
	},
	{
		text: "bg-gradient-to-b from-neutral-300 to-neutral-400 bg-clip-text text-transparent",
		ring: "ring-2 ring-neutral-200/60 ring-offset-2",
	},
	{
		text: "bg-gradient-to-b from-amber-500 to-amber-700 bg-clip-text text-transparent",
		ring: "ring-2 ring-amber-300/40 ring-offset-2",
	},
];

function LeaderboardPage() {
	const search = Route.useSearch();
	const mode = search.mode ?? "trending";
	const window = search.window ?? "7d";
	const { data } = useSuspenseQuery(getLeaderboardQueryOptions(window, mode));

	return (
		<ProductShell
			title="Public gradient leaderboard"
			description="Trending blends views with upvotes. Top Viewed and Top Voted keep the ranking legible when you want a single signal."
		>
			<div className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-white p-2 shadow-sm shadow-neutral-950/[0.03] sm:flex-row sm:items-center sm:justify-between">
				<ModeTabs currentMode={mode} currentWindow={window} />
				<WindowTabs currentMode={mode} currentWindow={window} />
			</div>

			<div className="grid gap-4">
				{data.gradients.map((gradient, index) => {
					const isTopThree = index < 3;
					const podium = podiumColors[index];

					return (
						<SurfaceCard
							key={gradient.id}
							hoverable
							className={`group overflow-hidden ${podium?.ring ?? ""}`}
						>
							<div
								className={`grid gap-5 ${isTopThree ? "lg:grid-cols-[72px_260px_1fr]" : "lg:grid-cols-[56px_180px_1fr]"}`}
							>
								<div className="flex items-start">
									<p
										className={`font-nohemi font-semibold tabular-nums tracking-tight ${
											isTopThree
												? `text-6xl ${podium?.text ?? ""}`
												: "text-4xl text-neutral-200"
										}`}
									>
										{String(index + 1).padStart(2, "0")}
									</p>
								</div>
								<div className="overflow-hidden rounded-xl">
									<GradientPreview
										shareState={gradient.shareState}
										title={gradient.title}
										className={`block w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${isTopThree ? "aspect-[4/3]" : "aspect-[3/2]"}`}
									/>
								</div>
								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
										<div>
											<p className="text-xs font-medium text-neutral-400">
												By {gradient.ownerName}
											</p>
											<h2
												className={`mt-3 font-nohemi font-semibold tracking-tight text-neutral-900 ${isTopThree ? "text-3xl" : "text-2xl"}`}
												style={{ textWrap: "balance" }}
											>
												{gradient.title}
											</h2>
											<p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
												Published{" "}
												{gradient.publishedAt
													? new Date(
															gradient.publishedAt,
														).toLocaleDateString()
													: "recently"}
											</p>
										</div>
										{gradient.publicSlug ? (
											<Link
												to="/g/$slug"
												params={{ slug: gradient.publicSlug }}
												className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.96]"
											>
												Open gradient
											</Link>
										) : null}
									</div>
									<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-400">
										<span>
											<strong className="font-semibold tabular-nums text-neutral-900">
												{gradient.score.toFixed(1)}
											</strong>{" "}
											score
										</span>
										<span>
											<strong className="font-semibold tabular-nums text-neutral-900">
												{gradient.stats.views.toLocaleString()}
											</strong>{" "}
											views
										</span>
										<span>
											<strong className="font-semibold tabular-nums text-neutral-900">
												{gradient.stats.upvotes.toLocaleString()}
											</strong>{" "}
											upvotes
										</span>
										<span>
											<strong className="font-semibold tabular-nums text-neutral-900">
												{gradient.stats.uniqueVisitors.toLocaleString()}
											</strong>{" "}
											unique
										</span>
									</div>
								</div>
							</div>
						</SurfaceCard>
					);
				})}
				{data.gradients.length === 0 ? (
					<SurfaceCard className="flex flex-col items-center justify-center py-16 text-center">
						<div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-xl bg-neutral-50">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="text-neutral-300"
							>
								<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
								<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
								<path d="M4 22h16" />
								<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
								<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
								<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
							</svg>
						</div>
						<h3 className="font-nohemi text-lg font-semibold tracking-tight text-neutral-900" style={{ textWrap: "balance" }}>
							No gradients ranked yet
						</h3>
						<p className="mt-2 max-w-sm text-sm leading-6 text-neutral-400" style={{ textWrap: "pretty" }}>
							No public gradients have been published for this time
							period. Try a different window or check back later.
						</p>
					</SurfaceCard>
				) : null}
			</div>
		</ProductShell>
	);
}

function ModeTabs({
	currentMode,
	currentWindow,
}: {
	currentMode: LeaderboardMode;
	currentWindow: LeaderboardWindow;
}) {
	const tabs: Array<{ label: string; value: LeaderboardMode }> = [
		{ label: "Trending", value: "trending" },
		{ label: "Top Viewed", value: "viewed" },
		{ label: "Top Voted", value: "voted" },
	];

	return (
		<div className="inline-flex gap-1">
			{tabs.map((tab) => {
				const isActive = tab.value === currentMode;
				return (
					<Link
						key={tab.value}
						to="/leaderboard"
						search={{ mode: tab.value, window: currentWindow }}
						className={
							isActive
								? "rounded-xl bg-neutral-900 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm"
								: "rounded-xl px-3.5 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
						}
					>
						{tab.label}
					</Link>
				);
			})}
		</div>
	);
}

function WindowTabs({
	currentMode,
	currentWindow,
}: {
	currentMode: LeaderboardMode;
	currentWindow: LeaderboardWindow;
}) {
	const tabs: Array<{ label: string; value: LeaderboardWindow }> = [
		{ label: "24h", value: "24h" },
		{ label: "7d", value: "7d" },
		{ label: "30d", value: "30d" },
		{ label: "All time", value: "all" },
	];

	return (
		<div className="inline-flex gap-1">
			{tabs.map((tab) => {
				const isActive = tab.value === currentWindow;
				return (
					<Link
						key={tab.value}
						to="/leaderboard"
						search={{ mode: currentMode, window: tab.value }}
						className={
							isActive
								? "rounded-xl bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
								: "rounded-xl px-3 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
						}
					>
						{tab.label}
					</Link>
				);
			})}
		</div>
	);
}
