import {
	ProductShell,
	SurfaceCard,
	VisibilityBadge,
} from "@/components/gradients/product-shell";
import { Button } from "@/components/ui/button";
import { getViewerQueryOptions } from "@/lib/actions/actions.auth";
import {
	svgDataUrl,
	svgStringFromState,
	svgToPngDataUrl,
} from "@/lib/mesh-svg";
import {
	getPublicGradientBySlugQueryOptions,
	toggleGradientReaction,
} from "@/lib/actions/actions.saved-gradient";
import { decodeShareString } from "@/lib/utils/share";
import { buildAbsoluteUrl, seo } from "@/utils/seo";
import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PublicGradientQueryData = {
	gradient: {
		id: string;
		title: string;
		shareState: string;
		publicSlug: string | null;
		visibility: string;
		publishedAt: number | null;
		ownerId: string;
		ownerName: string;
		ownerImage: string | null;
		stats: {
			views: number;
			uniqueVisitors: number;
			upvotes: number;
		};
		viewerState: {
			isOwner: boolean;
			hasUpvoted: boolean;
			hasFavorited: boolean;
		};
	};
};

export const Route = createFileRoute("/g/$slug")({
	head: ({ params }) => ({
		...seo({
			title: "Published gradient | Better Gradient",
			description:
				"Discover a published mesh gradient and open it directly in Better Gradient.",
			url: buildAbsoluteUrl(`/g/${params.slug}`),
			canonical: buildAbsoluteUrl(`/g/${params.slug}`),
		}),
	}),
	component: PublicGradientPage,
});

function PublicGradientPage() {
	const { slug } = Route.useParams();
	const queryClient = useQueryClient();
	const trackedView = useRef(false);
	const { data } = useSuspenseQuery(getPublicGradientBySlugQueryOptions(slug));
	const viewerQuery = useQuery(getViewerQueryOptions());
	const viewer = viewerQuery.data?.user ?? null;
	const gradient = data.gradient;
	type ToggleGradientReactionPayload = {
		gradientId: string;
		type: "upvote" | "favorite";
	};

	useEffect(() => {
		if (trackedView.current) {
			return;
		}
		trackedView.current = true;
		void postGradientEvent(slug, "view");
	}, [slug]);

	const reactionMutation = useMutation<
		Awaited<ReturnType<typeof toggleGradientReaction>>,
		Error,
		ToggleGradientReactionPayload,
		{ previous?: PublicGradientQueryData }
	>({
		mutationKey: ["toggle-gradient-reaction", slug],
		mutationFn: (payload) => toggleGradientReaction({ data: payload }),
		onMutate: async (variables) => {
			const queryKey = ["public-gradient", slug] as const;
			await queryClient.cancelQueries({ queryKey });
			const previous =
				queryClient.getQueryData<PublicGradientQueryData>(queryKey);
			queryClient.setQueryData(
				queryKey,
				(current: PublicGradientQueryData | undefined) => {
					if (!current) return current;
					const hasUpvoted = current.gradient.viewerState.hasUpvoted;
					const hasFavorited = current.gradient.viewerState.hasFavorited;
					const nextIsUpvote =
						variables.type === "upvote" ? !hasUpvoted : hasUpvoted;
					const nextIsFavorite =
						variables.type === "favorite" ? !hasFavorited : hasFavorited;
					const nextUpvotes =
						variables.type === "upvote"
							? current.gradient.stats.upvotes + (hasUpvoted ? -1 : 1)
							: current.gradient.stats.upvotes;

					return {
						gradient: {
							...current.gradient,
							stats: {
								...current.gradient.stats,
								upvotes: Math.max(0, nextUpvotes),
							},
							viewerState: {
								...current.gradient.viewerState,
								hasUpvoted: nextIsUpvote,
								hasFavorited: nextIsFavorite,
							},
						},
					};
				},
			);

			return { previous };
		},
		onError: (_error, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(["public-gradient", slug], context.previous);
			}
		},
		onSettled: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["public-gradient", slug],
			});
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
				queryClient.invalidateQueries({ queryKey: ["favorite-gradients"] }),
			]);
		},
	});

	const nextEditorUrl = `/editor?share=${encodeURIComponent(gradient.shareState)}`;
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	const previewUrl = useMemo(() => {
		const decoded = decodeShareString(gradient.shareState);
		if (!decoded) return null;
		return svgDataUrl(
			svgStringFromState({
				canvas: decoded.canvas,
				shapes: decoded.shapes,
				palette: decoded.palette,
				filters: decoded.filters,
				outputSize: { width: 480, height: 320 },
			}),
		);
	}, [gradient.shareState]);

	const handleDownload = useCallback(async () => {
		setIsDownloading(true);
		try {
			const decoded = decodeShareString(gradient.shareState);
			if (!decoded) return;
			const svg = svgStringFromState({
				canvas: decoded.canvas,
				shapes: decoded.shapes,
				palette: decoded.palette,
				filters: decoded.filters,
				outputSize: { width: decoded.canvas.width, height: decoded.canvas.height },
			});
			const pngDataUrl = await svgToPngDataUrl(svg, 2);
			const a = document.createElement("a");
			a.href = pngDataUrl;
			a.download = `${gradient.title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "gradient"}.png`;
			a.click();
		} finally {
			setIsDownloading(false);
		}
	}, [gradient.shareState, gradient.title]);

	return (
		<ProductShell
			title={gradient.title}
			description={`Published by ${gradient.ownerName}. Public upvotes are visible here; private favorites stay in your own library.`}
			actions={
				<>
					{gradient.visibility !== "private" ? (
						<VisibilityBadge
							visibility={
								gradient.visibility as "private" | "public" | "unlisted"
							}
						/>
					) : null}
					{gradient.visibility === "public" ? (
						<a
							href="/leaderboard"
							className="inline-flex items-center border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950"
						>
							View leaderboard
						</a>
					) : null}
				</>
			}
		>
			<div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
				<SurfaceCard className="group overflow-hidden">
					{previewUrl ? (
						<button
							type="button"
							className="w-full overflow-hidden cursor-zoom-in"
							onClick={() => setLightboxOpen(true)}
						>
							<motion.img
								layoutId="gradient-lightbox"
								src={previewUrl}
								alt={gradient.title}
								className="block aspect-16/10 w-full border border-neutral-200 object-cover"
								loading="lazy"
								decoding="async"
							/>
						</button>
					) : (
						<div className="aspect-16/10 w-full bg-neutral-100" />
					)}
				</SurfaceCard>

				<SurfaceCard className="flex h-full flex-col gap-5">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
							Published gradient
						</p>
						<p className="mt-3 text-base leading-7 text-neutral-600">
							{gradient.visibility === "public"
								? "This gradient collects upvotes and ranks on the leaderboard."
								: "This gradient is shareable via its link but does not appear in public rankings."}
						</p>
					</div>

					{/* Author with avatar */}
					<div className="flex items-center gap-3">
						{gradient.ownerImage ? (
							<OwnerAvatar
								image={gradient.ownerImage}
								name={gradient.ownerName}
							/>
						) : (
							<div className="flex size-8 items-center justify-center bg-neutral-900 text-xs font-semibold text-white">
								{gradient.ownerName
									.split(/\s+/)
									.slice(0, 2)
									.map((p) => p[0]?.toUpperCase() ?? "")
									.join("")}
							</div>
						)}
						<div>
							<p className="text-sm font-semibold text-neutral-950">
								{gradient.ownerName}
							</p>
							<p className="text-xs text-neutral-500">
								{gradient.publishedAt
									? `Published ${new Date(gradient.publishedAt).toLocaleDateString()}`
									: "Published recently"}
							</p>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<PublicStat
							label="Views"
							value={gradient.stats.views.toLocaleString()}
						/>
						<PublicStat
							label="Upvotes"
							value={gradient.stats.upvotes.toLocaleString()}
						/>
						<PublicStat
							label="Unique visitors"
							value={gradient.stats.uniqueVisitors.toLocaleString()}
						/>
					</div>

					{/* Primary actions -- horizontal */}
					<div className="flex gap-3">
						<Button
							className="flex-1"
							onPress={async () => {
								await postGradientEvent(slug, "open_editor");
								window.location.href = nextEditorUrl;
							}}
						>
							Open in editor
						</Button>
						<Button
							intent="outline"
							onPress={async () => {
								await navigator.clipboard.writeText(
									buildAbsoluteUrl(`/g/${slug}`),
								);
								await postGradientEvent(slug, "copy_link");
							}}
						>
							Copy link
						</Button>
					</div>

					{/* Social actions -- horizontal */}
					{viewer ? (
						<div className="flex gap-3">
							{gradient.visibility === "public" &&
							!gradient.viewerState.isOwner ? (
								<Button
									className="flex-1"
									intent={
										gradient.viewerState.hasUpvoted ? "primary" : "outline"
									}
									isPending={
										reactionMutation.isPending &&
										reactionMutation.variables?.type === "upvote"
									}
									onPress={() =>
										reactionMutation.mutate({
											gradientId: gradient.id,
											type: "upvote",
										})
									}
								>
									<svg
										className="size-4"
										viewBox="0 0 24 24"
										fill="none"
										strokeWidth={2}
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M4.5 10.5 12 3l7.5 7.5M12 3v18"
										/>
									</svg>
									{gradient.viewerState.hasUpvoted
										? `Upvoted ${gradient.stats.upvotes}`
										: `Upvote ${gradient.stats.upvotes}`}
								</Button>
							) : null}
							<Button
								className="flex-1"
								intent={
									gradient.viewerState.hasFavorited ? "primary" : "outline"
								}
								isPending={
									reactionMutation.isPending &&
									reactionMutation.variables?.type === "favorite"
								}
								onPress={() =>
									reactionMutation.mutate({
										gradientId: gradient.id,
										type: "favorite",
									})
								}
							>
								<svg
									className={`size-4 ${gradient.viewerState.hasFavorited ? "fill-current" : "fill-none"}`}
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
								{gradient.viewerState.hasFavorited
									? "Saved"
									: "Favorite"}
							</Button>
						</div>
					) : (
						<a
							href={`/login?next=${encodeURIComponent(`/g/${slug}`)}`}
							className="inline-flex items-center justify-center border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-950"
						>
							Sign in to upvote or favorite
						</a>
					)}
				</SurfaceCard>
			</div>

			<AnimatePresence>
				{lightboxOpen && previewUrl ? (
					<GradientLightbox
						previewUrl={previewUrl}
						title={gradient.title}
						isDownloading={isDownloading}
						onDownload={handleDownload}
						onClose={() => setLightboxOpen(false)}
					/>
				) : null}
			</AnimatePresence>
		</ProductShell>
	);
}

function GradientLightbox({
	previewUrl,
	title,
	isDownloading,
	onDownload,
	onClose,
}: {
	previewUrl: string;
	title: string;
	isDownloading: boolean;
	onDownload: () => void;
	onClose: () => void;
}) {
	const backdropRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKey);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handleKey);
			document.body.style.overflow = "";
		};
	}, [onClose]);

	return (
		<motion.div
			ref={backdropRef}
			className="fixed inset-0 z-[100] flex items-center justify-center p-6"
			initial={{ backgroundColor: "rgba(0,0,0,0)" }}
			animate={{ backgroundColor: "rgba(0,0,0,0.8)" }}
			exit={{ backgroundColor: "rgba(0,0,0,0)" }}
			transition={{ duration: 0.25, ease: "easeOut" }}
			onClick={(e) => {
				if (e.target === backdropRef.current) onClose();
			}}
		>
			<div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col items-center gap-5">
				<motion.img
					layoutId="gradient-lightbox"
					src={previewUrl}
					alt={title}
					className="block max-h-[78vh] w-full rounded-xl object-contain shadow-2xl"
				/>
				<motion.div
					className="flex items-center gap-3"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 10 }}
					transition={{ delay: 0.15, duration: 0.25 }}
				>
					<button
						type="button"
						disabled={isDownloading}
						onClick={onDownload}
						className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-lg transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60"
					>
						<svg
							className="size-4"
							viewBox="0 0 24 24"
							fill="none"
							strokeWidth={2}
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
							/>
						</svg>
						{isDownloading ? "Exporting..." : "Download PNG"}
					</button>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
					>
						Close
					</button>
				</motion.div>
			</div>
		</motion.div>
	);
}

function OwnerAvatar({ image, name }: { image: string; name: string }) {
	const [imgError, setImgError] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		const img = imgRef.current;
		if (img && img.complete && img.naturalWidth === 0) {
			setImgError(true);
		}
	}, []);

	if (imgError) {
		return (
			<div className="flex size-8 items-center justify-center bg-neutral-900 text-xs font-semibold text-white">
				{name
					.split(/\s+/)
					.slice(0, 2)
					.map((p) => p[0]?.toUpperCase() ?? "")
					.join("")}
			</div>
		);
	}

	return (
		<img
			ref={imgRef}
			src={image}
			alt={name}
			referrerPolicy="no-referrer"
			className="size-8 object-cover"
			loading="lazy"
			onError={() => setImgError(true)}
		/>
	);
}

function PublicStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="border border-neutral-200 bg-neutral-50/80 px-4 py-3">
			<p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
				{label}
			</p>
			<p className="mt-2 text-lg font-semibold text-neutral-950">{value}</p>
		</div>
	);
}

async function postGradientEvent(
	slug: string,
	eventType: "copy_link" | "open_editor" | "view",
) {
	try {
		await fetch("/api/gradient-events", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			keepalive: true,
			body: JSON.stringify({
				slug,
				eventType,
				referrer: document.referrer || "",
			}),
		});
	} catch (error) {
		console.error("Failed to post gradient event", error);
	}
}
