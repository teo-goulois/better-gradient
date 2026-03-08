import { GradientPreview } from "@/components/gradients/gradient-preview";
import {
	EmptyState,
	ProductShell,
	SurfaceCard,
	VisibilityBadge,
} from "@/components/gradients/product-shell";
import { getViewerQueryOptions } from "@/lib/actions/actions.auth";
import {
	listFavoriteGradientsQueryOptions,
	toggleGradientReaction,
} from "@/lib/actions/actions.saved-gradient";
import { seo } from "@/utils/seo";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/favorites")({
	head: () => ({
		...seo({
			title: "Favorites | Better Gradient",
			description: "Private favorites from your Better Gradient account.",
			noindex: true,
		}),
	}),
	loader: async ({ context }) => {
		const viewer = await context.queryClient.ensureQueryData(
			getViewerQueryOptions(),
		);
		if (!viewer.user) {
			throw redirect({ href: "/login?next=/dashboard/favorites" });
		}
		await context.queryClient.ensureQueryData(
			listFavoriteGradientsQueryOptions(),
		);
		return null;
	},
	component: FavoritesPage,
});

function FavoritesPage() {
	const queryClient = useQueryClient();
	const { data } = useSuspenseQuery(listFavoriteGradientsQueryOptions());

	const unfavoriteMutation = useMutation({
		mutationFn: (gradientId: string) =>
			toggleGradientReaction({ data: { gradientId, type: "favorite" } }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["favorite-gradients"],
			});
		},
	});

	return (
		<ProductShell
			title="Private favorites"
			description="Your favorites never affect the leaderboard. They are personal shortcuts back to gradients you want to revisit."
			actions={
				<Link
					to="/dashboard"
					className="inline-flex items-center border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950"
				>
					Back to dashboard
				</Link>
			}
		>
			{data.gradients.length === 0 ? (
				<EmptyState
					title="No favorites yet"
					description="Favorite a public or unlisted gradient from its published page to keep it in your private collection."
					action={
						<Link
							to="/leaderboard"
							className="inline-flex items-center bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
						>
							Explore leaderboard
						</Link>
					}
				/>
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{data.gradients.map((gradient) => (
						<SurfaceCard
							key={gradient.id}
							hoverable
							className="group relative flex h-full flex-col gap-4"
						>
							{/* Unfavorite button */}
							<button
								type="button"
								className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center border border-neutral-200 bg-white/90 text-rose-500 shadow-sm backdrop-blur-sm transition-all duration-150 hover:bg-rose-50 hover:border-rose-200 active:scale-[0.95]"
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

							<div className="overflow-hidden">
								<GradientPreview
									shareState={gradient.shareState}
									title={gradient.title}
									className="block aspect-[4/3] w-full border border-neutral-200 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
								/>
							</div>
							<div className="flex items-center justify-between gap-3">
								<VisibilityBadge
									visibility={
										gradient.visibility as "private" | "public" | "unlisted"
									}
								/>
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
									By {gradient.ownerName}
								</p>
							</div>
							<div>
								<h2 className="font-nohemi text-2xl font-semibold tracking-tight text-neutral-950">
									{gradient.title}
								</h2>
								<p className="mt-2 text-sm text-neutral-600">
									Published{" "}
									{gradient.publishedAt
										? new Date(gradient.publishedAt).toLocaleDateString()
										: new Date(gradient.updatedAt).toLocaleDateString()}
								</p>
							</div>
							<div className="mt-auto flex flex-wrap gap-2">
								{gradient.publicSlug ? (
									<a
										href={`/g/${gradient.publicSlug}`}
										className="inline-flex items-center bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
									>
										Open published page
									</a>
								) : null}
								<Link
									to="/editor"
									search={{ share: gradient.shareState }}
									className="inline-flex items-center border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950"
								>
									Open in editor
								</Link>
							</div>
						</SurfaceCard>
					))}
				</div>
			)}
		</ProductShell>
	);
}
