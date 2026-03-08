import { GradientPreview } from "@/components/gradients/gradient-preview";
import {
	EmptyState,
	ProductShell,
	VisibilityBadge,
} from "@/components/gradients/product-shell";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalTitle,
	ModalDescription,
	ModalFooter,
	ModalClose,
} from "@/components/ui/modal";
import {
	deleteSavedGradient,
	listSavedGradientsQueryOptions,
	updateSavedGradientMeta,
} from "@/lib/actions/actions.saved-gradient";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardIndexPage,
});

function DashboardIndexPage() {
	const queryClient = useQueryClient();
	const { data } = useSuspenseQuery(listSavedGradientsQueryOptions());
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		title: string;
	} | null>(null);

	type UpdateSavedGradientMetaPayload = {
		id: string;
		title: string;
		visibility?: "private" | "unlisted" | "public";
	};
	type DeleteSavedGradientPayload = {
		id: string;
	};

	const refreshDashboard = () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: ["saved-gradients"] }),
			queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
		]);

	const publishMutation = useMutation<
		Awaited<ReturnType<typeof updateSavedGradientMeta>>,
		Error,
		UpdateSavedGradientMetaPayload
	>({
		mutationKey: ["update-saved-gradient-meta"],
		mutationFn: (payload) => updateSavedGradientMeta({ data: payload }),
		onSuccess: refreshDashboard,
	});

	const deleteMutation = useMutation<
		Awaited<ReturnType<typeof deleteSavedGradient>>,
		Error,
		DeleteSavedGradientPayload
	>({
		mutationKey: ["delete-saved-gradient"],
		mutationFn: (payload) => deleteSavedGradient({ data: payload }),
		onSuccess: async () => {
			setDeleteTarget(null);
			await refreshDashboard();
		},
	});

	const gradients = data.gradients;

	return (
		<ProductShell
			title="Your gradient library"
			description="Save working files, publish public slugs, inspect engagement, and keep private favorites separate from public upvotes."
			actions={
				<>
					<Link
						to="/dashboard/favorites"
						className="inline-flex items-center border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950"
					>
						View favorites
					</Link>
					<Link
						to="/editor"
						className="inline-flex items-center bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
					>
						New gradient
					</Link>
				</>
			}
		>
			{gradients.length === 0 ? (
				<EmptyState
					title="Nothing saved yet"
					description="Your library starts when you save a gradient from the editor. Anonymous shares keep working, but publishing and analytics begin here."
					action={
						<Link
							to="/editor"
							className="inline-flex items-center bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
						>
							Open editor
						</Link>
					}
				/>
			) : (
				<>
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				{gradients.map((gradient) => {
					const nextVisibility =
						gradient.visibility === "public" ? "private" : "public";
					const isPublished =
						gradient.publicSlug && gradient.visibility !== "private";

					return (
						<div
							key={gradient.id}
							className="group flex flex-col border border-neutral-200 bg-white transition-colors duration-150 hover:border-neutral-300"
						>
							{/* Preview */}
							<div className="relative overflow-hidden">
								<GradientPreview
									shareState={gradient.shareState}
									title={gradient.title}
									className="block aspect-[4/3] w-full border-b border-neutral-200 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
								/>
								{/* Floating actions */}
								<div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
									<Link
										to="/editor"
										search={{ gradientId: gradient.id }}
										className="flex size-8 items-center justify-center bg-white/90 text-neutral-700 backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-950"
										aria-label="Edit gradient"
									>
										<svg className="size-3.5" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
										</svg>
									</Link>
									<Menu>
										<MenuTrigger
											aria-label="More actions"
											className="flex size-8 items-center justify-center bg-white/90 text-neutral-700 backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-950"
										>
											<svg className="size-3.5" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
											</svg>
										</MenuTrigger>
										<MenuContent placement="bottom end">
											<MenuItem
												href={`/dashboard/gradients/${gradient.id}`}
											>
												Analytics
											</MenuItem>
											{isPublished ? (
												<MenuItem
													href={`/g/${gradient.publicSlug}`}
												>
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

							{/* Content */}
							<div className="flex flex-1 flex-col gap-4 p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<h2 className="truncate font-nohemi text-lg font-semibold tracking-tight text-neutral-950">
											{gradient.title}
										</h2>
										<p className="mt-1 text-xs text-neutral-400">
											{gradient.width} x {gradient.height} · {gradient.shapesCount} shapes · {gradient.colorsCount} colors
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

								{/* Inline stats */}
								<div className="flex items-center gap-4 text-sm text-neutral-500">
									<span>
										<strong className="font-semibold text-neutral-950">{gradient.stats.views7d}</strong> views
									</span>
									<span>
										<strong className="font-semibold text-neutral-950">{gradient.stats.upvotes}</strong> upvotes
									</span>
									{gradient.stats.isFavorited ? (
										<svg
											className="size-4 fill-rose-500 text-rose-500"
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

								{/* Actions */}
								<div className="mt-auto flex items-center gap-2 border-t border-neutral-100 pt-4">
									<Button
										size="sm"
										intent={
											gradient.visibility === "public"
												? "outline"
												: "primary"
										}
										className="flex-1"
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
										className="inline-flex items-center justify-center rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-950 sm:text-sm/5"
									>
										Analytics
									</Link>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Delete confirmation modal */}
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
				</>
			)}
		</ProductShell>
	);
}
