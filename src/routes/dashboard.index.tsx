import {
	DashboardCollections,
	DashboardFilterTabs,
	SourceBadge,
} from "@/components/gradients/dashboard-sections";
import { GradientPreview } from "@/components/gradients/gradient-preview";
import {
	ProductShell,
	SurfaceCard,
	VisibilityBadge,
} from "@/components/gradients/product-shell";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import {
	Modal,
	ModalClose,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from "@/components/ui/modal";
import {
	listExportedGradientsQueryOptions,
} from "@/lib/actions/actions.gradient";
import {
	createSavedGradient,
	deleteSavedGradient,
	listFavoriteGradientsQueryOptions,
	listSavedGradientsQueryOptions,
	toggleGradientReaction,
	updateSavedGradientMeta,
} from "@/lib/actions/actions.saved-gradient";
import {
	getDashboardFilterCounts,
	resolveDashboardFilter,
} from "@/lib/dashboard";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";
import { Route as DashboardRoute } from "./dashboard";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardIndexPage,
});

function DashboardIndexPage() {
	const search = DashboardRoute.useSearch();
	const filter = resolveDashboardFilter(search.filter);
	const queryClient = useQueryClient();
	const { data: savedData } = useSuspenseQuery(listSavedGradientsQueryOptions());
	const { data: favoriteData } = useSuspenseQuery(
		listFavoriteGradientsQueryOptions(),
	);
	const { data: exportedData } = useSuspenseQuery(
		listExportedGradientsQueryOptions(),
	);
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		title: string;
	} | null>(null);

	const refreshDashboard = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["saved-gradients"] }),
			queryClient.invalidateQueries({ queryKey: ["favorite-gradients"] }),
			queryClient.invalidateQueries({ queryKey: ["exported-gradients"] }),
			queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
		]);
	};

	const publishMutation = useMutation({
		mutationKey: ["update-saved-gradient-meta"],
		mutationFn: (payload: {
			id: string;
			title: string;
			visibility?: "private" | "unlisted" | "public";
		}) => updateSavedGradientMeta({ data: payload }),
		onSuccess: refreshDashboard,
	});

	const deleteMutation = useMutation({
		mutationKey: ["delete-saved-gradient"],
		mutationFn: (payload: { id: string }) => deleteSavedGradient({ data: payload }),
		onSuccess: async () => {
			setDeleteTarget(null);
			await refreshDashboard();
		},
	});

	const unfavoriteMutation = useMutation({
		mutationKey: ["toggle-gradient-favorite"],
		mutationFn: (gradientId: string) =>
			toggleGradientReaction({ data: { gradientId, type: "favorite" } }),
		onSuccess: refreshDashboard,
	});

	const saveAndPublishMutation = useMutation({
		mutationKey: ["save-and-publish-gradient"],
		mutationFn: async (payload: {
			title: string;
			shareState: string;
			width: number;
			height: number;
			shapesCount: number;
			colorsCount: number;
		}) => {
			const saved = await createSavedGradient({ data: payload });
			await updateSavedGradientMeta({
				data: { id: saved.id, title: payload.title, visibility: "public" },
			});
			return saved;
		},
		onSuccess: refreshDashboard,
	});

	const counts = getDashboardFilterCounts({
		saved: savedData.gradients.length,
		favorites: favoriteData.gradients.length,
		exported: exportedData.gradients.length,
	});

	const allItems = useMemo(() => {
		type UnifiedItem =
			| {
					source: "saved";
					id: string;
					title: string;
					shareState: string;
					updatedAt: number;
					width: number;
					height: number;
					shapesCount: number;
					colorsCount: number;
					visibility: "private" | "public" | "unlisted";
					publicSlug: string | null;
					gradientId: string;
					stats: { views7d: number; upvotes: number; isFavorited: boolean };
			  }
			| {
					source: "favorite";
					id: string;
					title: string;
					shareState: string;
					updatedAt: number;
					width: number;
					height: number;
					shapesCount: number;
					colorsCount: number;
					visibility: "private" | "public" | "unlisted";
					publicSlug: string | null;
					ownerName: string;
					gradientId: string;
			  }
			| {
					source: "exported";
					id: string;
					title: string;
					shareState: string;
					updatedAt: number;
					width: number;
					height: number;
					shapesCount: number;
					colorsCount: number;
					exportedFormats: string[];
			  };

		const items: UnifiedItem[] = [
			...savedData.gradients.map(
				(g) =>
					({
						source: "saved",
						id: `saved_${g.id}`,
						gradientId: g.id,
						title: g.title,
						shareState: g.shareState,
						updatedAt: g.updatedAt,
						width: g.width,
						height: g.height,
						shapesCount: g.shapesCount,
						colorsCount: g.colorsCount,
						visibility: g.visibility as "private" | "public" | "unlisted",
						publicSlug: g.publicSlug,
						stats: g.stats,
					}) satisfies UnifiedItem,
			),
			...favoriteData.gradients.map(
				(g) =>
					({
						source: "favorite",
						id: `fav_${g.id}`,
						gradientId: g.id,
						title: g.title,
						shareState: g.shareState,
						updatedAt: g.updatedAt,
						width: g.width,
						height: g.height,
						shapesCount: g.shapesCount,
						colorsCount: g.colorsCount,
						visibility: g.visibility as "private" | "public" | "unlisted",
						publicSlug: g.publicSlug,
						ownerName: g.ownerName,
					}) satisfies UnifiedItem,
			),
			...exportedData.gradients.map(
				(g) =>
					({
						source: "exported",
						id: g.id,
						title: "Exported gradient",
						shareState: g.share,
						updatedAt: g.updatedAt,
						width: g.width,
						height: g.height,
						shapesCount: g.shapesCount,
						colorsCount: g.colorsCount,
						exportedFormats: JSON.parse(g.exportedFormats) as string[],
					}) satisfies UnifiedItem,
			),
		];

		items.sort((a, b) => b.updatedAt - a.updatedAt);
		return items;
	}, [savedData, favoriteData, exportedData]);

	const allContent =
		allItems.length > 0 ? (
			<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
				{allItems.map((item) => (
					<div
						key={item.id}
						className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm shadow-neutral-950/[0.03] transition-shadow duration-200 hover:shadow-md hover:shadow-neutral-950/[0.06]"
					>
						<div className="relative">
							<GradientPreview
								shareState={item.shareState}
								title={item.title}
								className="block aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
							/>
							<div className="absolute left-3 top-3">
								<SourceBadge source={item.source} />
							</div>
							{item.source === "saved" && (
								<div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
									<Link
										to="/editor"
										search={{ gradientId: item.gradientId }}
										className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-neutral-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-950"
										aria-label="Edit gradient"
									>
										<svg
											className="size-3.5"
											viewBox="0 0 24 24"
											fill="none"
											strokeWidth={2}
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
											/>
										</svg>
									</Link>
								</div>
							)}
						</div>

						<div className="flex flex-1 flex-col gap-3 p-4">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<h3 className="truncate font-nohemi text-lg font-semibold tracking-tight text-neutral-900">
										{item.title}
									</h3>
									<p className="mt-1 text-xs text-neutral-400">
										{item.width} x {item.height} · {item.shapesCount} shapes ·{" "}
										{item.colorsCount} colors
									</p>
								</div>
								{item.source === "saved" && (
									<VisibilityBadge visibility={item.visibility} />
								)}
							</div>

							{item.source === "favorite" && (
								<p className="text-xs text-neutral-400">
									By {item.ownerName}
								</p>
							)}

							{item.source === "exported" && (
								<div className="flex flex-wrap gap-1.5">
									{item.exportedFormats.map((format) => (
										<span
											key={format}
											className="inline-flex items-center rounded-md bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400"
										>
											{format}
										</span>
									))}
								</div>
							)}

							{item.source === "saved" && (
								<div className="flex items-center gap-4 text-sm text-neutral-400">
									<span>
										<strong className="font-semibold tabular-nums text-neutral-900">
											{item.stats.views7d}
										</strong>{" "}
										views
									</span>
									<span>
										<strong className="font-semibold tabular-nums text-neutral-900">
											{item.stats.upvotes}
										</strong>{" "}
										upvotes
									</span>
								</div>
							)}

							<div className="mt-auto flex items-center gap-2 border-t border-neutral-50 pt-3">
								{item.source === "saved" && (
									<>
										<Button
											size="sm"
											intent={item.visibility === "public" ? "outline" : "primary"}
											className="flex-1 rounded-xl"
											isPending={
												publishMutation.isPending &&
												publishMutation.variables?.id === item.gradientId
											}
											onPress={() =>
												publishMutation.mutate({
													id: item.gradientId,
													title: item.title,
													visibility:
														item.visibility === "public"
															? "private"
															: "public",
												})
											}
										>
											{item.visibility === "public"
												? "Unpublish"
												: "Publish"}
										</Button>
										<Link
											to="/dashboard/gradients/$gradientId"
											params={{ gradientId: item.gradientId }}
											className="inline-flex items-center justify-center rounded-xl border border-neutral-100 px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-200 hover:text-neutral-900"
										>
											Analytics
										</Link>
									</>
								)}
								{item.source === "favorite" && (
									<>
										{item.publicSlug ? (
											<Link
												to="/g/$slug"
												params={{ slug: item.publicSlug }}
												className="inline-flex flex-1 items-center justify-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.96]"
											>
												View
											</Link>
										) : null}
										<Link
											to="/editor"
											search={{ share: item.shareState }}
											className="inline-flex items-center justify-center rounded-xl border border-neutral-100 px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-200 hover:text-neutral-900"
										>
											Open in editor
										</Link>
									</>
								)}
								{item.source === "exported" && (
									<>
										<Button
											size="sm"
											intent="primary"
											className="flex-1 rounded-xl"
											isPending={
												saveAndPublishMutation.isPending &&
												saveAndPublishMutation.variables?.shareState ===
													item.shareState
											}
											onPress={() =>
												saveAndPublishMutation.mutate({
													title: item.title,
													shareState: item.shareState,
													width: item.width,
													height: item.height,
													shapesCount: item.shapesCount,
													colorsCount: item.colorsCount,
												})
											}
										>
											Publish
										</Button>
										<Link
											to="/editor"
											search={{ share: item.shareState }}
											className="inline-flex items-center justify-center rounded-xl border border-neutral-100 px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-200 hover:text-neutral-900"
										>
											Edit
										</Link>
									</>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		) : (
			<DashboardEmptyCard
				title="Your library is empty"
				description="Create your first gradient in the editor, favorite a public one, or export to get started."
				action={
					<Link
						to="/editor"
						className="inline-flex items-center rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.96]"
					>
						Open editor
					</Link>
				}
			/>
		);

	return (
		<ProductShell
			title="Your gradient library"
			description="Switch between exported files, saved working files, and private favorites without leaving your dashboard."
			actions={
				<>
					<Link
						to="/dashboard"
						search={{ filter: "favorites" }}
						className="inline-flex items-center rounded-xl border border-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-600 shadow-sm shadow-neutral-950/[0.03] transition-colors hover:border-neutral-200 hover:text-neutral-900"
					>
						View favorites
					</Link>
					<Link
						to="/editor"
						className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 active:scale-[0.96]"
					>
						New gradient
					</Link>
				</>
			}
		>
			<DashboardFilterTabs currentFilter={filter} counts={counts} />

			<DashboardCollections
				filter={filter}
				allContent={allContent}
				sections={[
					{
						key: "saved",
						title: "Saved gradients",
						description:
							"Your working files stay editable, publishable, and connected to analytics.",
						count: savedData.gradients.length,
						content: (
							<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
								{savedData.gradients.map((gradient) => {
									const nextVisibility =
										gradient.visibility === "public" ? "private" : "public";
									const isPublished =
										Boolean(gradient.publicSlug) &&
										gradient.visibility !== "private";

									return (
										<div
											key={gradient.id}
											className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm shadow-neutral-950/[0.03] transition-shadow duration-200 hover:shadow-md hover:shadow-neutral-950/[0.06]"
										>
											<div className="relative">
												<GradientPreview
													shareState={gradient.shareState}
													title={gradient.title}
													className="block aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
												/>
												<div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
													<Link
														to="/editor"
														search={{ gradientId: gradient.id }}
														className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-neutral-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-950"
														aria-label="Edit gradient"
													>
														<svg
															className="size-3.5"
															viewBox="0 0 24 24"
															fill="none"
															strokeWidth={2}
															stroke="currentColor"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
															/>
														</svg>
													</Link>
													<Menu>
														<MenuTrigger
															aria-label="More actions"
															className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-neutral-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-950"
														>
															<svg
																className="size-3.5"
																viewBox="0 0 24 24"
																fill="none"
																strokeWidth={2}
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
																/>
															</svg>
														</MenuTrigger>
														<MenuContent placement="bottom end">
															<MenuItem
																href={`/dashboard/gradients/${gradient.id}`}
															>
																Analytics
															</MenuItem>
															{isPublished ? (
																<MenuItem href={`/g/${gradient.publicSlug}`}>
																	Open public page
																</MenuItem>
															) : null}
															<MenuItem
																isDanger
																onAction={() =>
																	setDeleteTarget({
																		id: gradient.id,
																		title: gradient.title,
																	})
																}
															>
																Delete
															</MenuItem>
														</MenuContent>
													</Menu>
												</div>
											</div>

											<div className="flex flex-1 flex-col gap-4 p-4">
												<div className="flex items-start justify-between gap-3">
													<div className="min-w-0">
														<h3 className="truncate font-nohemi text-lg font-semibold tracking-tight text-neutral-900">
															{gradient.title}
														</h3>
														<p className="mt-1 text-xs text-neutral-400">
															{gradient.width} x {gradient.height} · {gradient.shapesCount}{" "}
															shapes · {gradient.colorsCount} colors
														</p>
													</div>
													<VisibilityBadge
														visibility={
															gradient.visibility as
																| "private"
																| "public"
																| "unlisted"
														}
													/>
												</div>

												<div className="flex items-center gap-4 text-sm text-neutral-400">
													<span>
														<strong className="font-semibold tabular-nums text-neutral-900">
															{gradient.stats.views7d}
														</strong>{" "}
														views
													</span>
													<span>
														<strong className="font-semibold tabular-nums text-neutral-900">
															{gradient.stats.upvotes}
														</strong>{" "}
														upvotes
													</span>
													{gradient.stats.isFavorited ? (
														<svg
															className="size-4 fill-rose-400 text-rose-400"
															viewBox="0 0 24 24"
															strokeWidth={2}
															stroke="currentColor"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
															/>
														</svg>
													) : null}
												</div>

												<div className="mt-auto flex items-center gap-2 border-t border-neutral-50 pt-4">
													<Button
														size="sm"
														intent={
															gradient.visibility === "public"
																? "outline"
																: "primary"
														}
														className="flex-1 rounded-xl"
														isPending={
															publishMutation.isPending &&
															publishMutation.variables?.id === gradient.id
														}
														onPress={() =>
															publishMutation.mutate({
																id: gradient.id,
																title: gradient.title,
																visibility: nextVisibility,
															})
														}
													>
														{gradient.visibility === "public"
															? "Unpublish"
															: "Publish"}
													</Button>
													<Link
														to="/dashboard/gradients/$gradientId"
														params={{ gradientId: gradient.id }}
														className="inline-flex items-center justify-center rounded-xl border border-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-200 hover:text-neutral-900 sm:text-sm/5"
													>
														Analytics
													</Link>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						),
						empty: (
							<DashboardEmptyCard
								title="Nothing saved yet"
								description="Save a gradient from the editor to keep an editable working file in your library."
								action={
									<Link
										to="/editor"
										className="inline-flex items-center rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.96]"
									>
										Open editor
									</Link>
								}
							/>
						),
					},
					{
						key: "favorites",
						title: "Private favorites",
						description:
							"Your favorites stay private and give you a fast way back to gradients you want to revisit.",
						count: favoriteData.gradients.length,
						content: (
							<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
								{favoriteData.gradients.map((gradient) => (
									<SurfaceCard
										key={gradient.id}
										hoverable
										className="group relative flex h-full flex-col gap-4"
									>
										<button
											type="button"
											className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-xl border border-neutral-100 bg-white/90 text-rose-400 shadow-sm backdrop-blur-sm transition-all duration-150 hover:border-rose-200 hover:bg-rose-50 active:scale-[0.96]"
											aria-label="Remove from favorites"
											onClick={() => unfavoriteMutation.mutate(gradient.id)}
										>
											<svg
												className="size-4 fill-current"
												viewBox="0 0 24 24"
												strokeWidth={2}
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
												/>
											</svg>
										</button>

										<div className="overflow-hidden rounded-xl">
											<GradientPreview
												shareState={gradient.shareState}
												title={gradient.title}
												className="block aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
											/>
										</div>
										<div className="flex items-center justify-between gap-3">
											<VisibilityBadge
												visibility={
													gradient.visibility as
														| "private"
														| "public"
														| "unlisted"
												}
											/>
											<p className="text-xs font-medium text-neutral-400">
												By {gradient.ownerName}
											</p>
										</div>
										<div>
											<h3 className="font-nohemi text-2xl font-semibold tracking-tight text-neutral-900">
												{gradient.title}
											</h3>
											<p className="mt-2 text-sm text-neutral-500">
												Published{" "}
												{gradient.publishedAt
													? new Date(gradient.publishedAt).toLocaleDateString()
													: new Date(gradient.updatedAt).toLocaleDateString()}
											</p>
										</div>
										<div className="mt-auto flex flex-wrap gap-2">
											{gradient.publicSlug ? (
												<Link
													to="/g/$slug"
													params={{ slug: gradient.publicSlug }}
													className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.96]"
												>
													Open published page
												</Link>
											) : null}
											<Link
												to="/editor"
												search={{ share: gradient.shareState }}
												className="inline-flex items-center rounded-xl border border-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:border-neutral-200 hover:text-neutral-900"
											>
												Open in editor
											</Link>
										</div>
									</SurfaceCard>
								))}
							</div>
						),
						empty: (
							<DashboardEmptyCard
								title="No favorites yet"
								description="Favorite a public or unlisted gradient from its published page to keep it in your private collection."
								action={
									<Link
										to="/leaderboard"
										className="inline-flex items-center rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.96]"
									>
										Explore leaderboard
									</Link>
								}
							/>
						),
					},
					{
						key: "exported",
						title: "Export history",
						description:
							"Every export made while signed in lands here with its recorded formats.",
						count: exportedData.gradients.length,
						content: (
							<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
								{exportedData.gradients.map((gradient) => {
									const formats = JSON.parse(
										gradient.exportedFormats,
									) as string[];

									return (
										<SurfaceCard
											key={gradient.id}
											hoverable
											className="group flex h-full flex-col gap-4"
										>
											<div className="overflow-hidden rounded-xl">
												<GradientPreview
													shareState={gradient.share}
													title="Exported gradient"
													className="block aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
												/>
											</div>
											<div className="flex items-start justify-between gap-3">
												<div>
													<h3 className="font-nohemi text-2xl font-semibold tracking-tight text-neutral-900">
														Exported gradient
													</h3>
													<p className="mt-2 text-sm text-neutral-500">
														Last export{" "}
														{new Date(
															gradient.updatedAt,
														).toLocaleDateString()}
													</p>
												</div>
												<p className="text-xs font-medium tabular-nums text-neutral-400">
													{gradient.width} x {gradient.height}
												</p>
											</div>
											<p className="text-sm text-neutral-400">
												{gradient.shapesCount} shapes · {gradient.colorsCount} colors
											</p>
											<div className="flex flex-wrap gap-1.5">
												{formats.map((format) => (
													<span
														key={format}
														className="inline-flex items-center rounded-md bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
													>
														{format}
													</span>
												))}
											</div>
											<div className="mt-auto flex flex-wrap gap-2 border-t border-neutral-50 pt-4">
												<Button
													size="sm"
													intent="primary"
													className="rounded-xl"
													isPending={
														saveAndPublishMutation.isPending &&
														saveAndPublishMutation.variables?.shareState ===
															gradient.share
													}
													onPress={() =>
														saveAndPublishMutation.mutate({
															title: "Exported gradient",
															shareState: gradient.share,
															width: gradient.width,
															height: gradient.height,
															shapesCount: gradient.shapesCount,
															colorsCount: gradient.colorsCount,
														})
													}
												>
													Publish
												</Button>
												<Link
													to="/editor"
													search={{ share: gradient.share }}
													className="inline-flex items-center rounded-xl border border-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:border-neutral-200 hover:text-neutral-900"
												>
													Open in editor
												</Link>
											</div>
										</SurfaceCard>
									);
								})}
							</div>
						),
						empty: (
							<DashboardEmptyCard
								title="No exports yet"
								description="Exports made while signed in will appear here automatically with their recorded formats."
								action={
									<Link
										to="/editor"
										className="inline-flex items-center rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.96]"
									>
										Create and export
									</Link>
								}
							/>
						),
					},
				]}
			/>

			<Modal
				isOpen={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
			>
				<ModalContent role="alertdialog" size="sm">
					<ModalHeader>
						<ModalTitle>Delete gradient?</ModalTitle>
						<ModalDescription>
							This will permanently delete &quot;{deleteTarget?.title}&quot; and
							all its analytics data. This action cannot be undone.
						</ModalDescription>
					</ModalHeader>
					<ModalFooter>
						<ModalClose>Cancel</ModalClose>
						<Button
							intent="danger"
							isPending={deleteMutation.isPending}
							onPress={() => {
								if (deleteTarget) {
									deleteMutation.mutate({ id: deleteTarget.id });
								}
							}}
						>
							Delete
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</ProductShell>
	);
}

function DashboardEmptyCard({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: ReactNode;
}) {
	return (
		<SurfaceCard className="border-dashed border-neutral-200 bg-neutral-50/40">
			<div className="flex flex-col items-center justify-center px-6 py-12 text-center">
				<div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
					<svg
						className="size-6"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3"
						/>
					</svg>
				</div>
				<h3 className="font-nohemi text-xl font-semibold tracking-tight text-neutral-900" style={{ textWrap: "balance" }}>
					{title}
				</h3>
				<p className="mt-2 max-w-md text-sm leading-6 text-neutral-400" style={{ textWrap: "pretty" }}>
					{description}
				</p>
				{action ? <div className="mt-6">{action}</div> : null}
			</div>
		</SurfaceCard>
	);
}
