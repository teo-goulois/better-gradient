"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import {
	createSavedGradient,
	updateSavedGradient,
	updateSavedGradientMeta,
} from "@/lib/actions/actions.saved-gradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Key } from "react-aria-components";

type Visibility = "private" | "public" | "unlisted";

type SavedGradient = {
	id: string;
	title: string;
	shareState: string;
	publicSlug: string | null;
	visibility: string;
};

type Viewer = {
	id: string;
	email: string;
	name: string;
	image: string | null;
};

export function EditorLibraryPanel({
	viewer,
	savedGradient,
	shareState,
	width,
	height,
	shapesCount,
	colorsCount,
}: {
	viewer: Viewer | null;
	savedGradient?: SavedGradient;
	shareState: string;
	width: number;
	height: number;
	shapesCount: number;
	colorsCount: number;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [title, setTitle] = useState(
		savedGradient?.title ?? "Untitled Gradient",
	);
	const [visibility, setVisibility] = useState<Visibility>(
		(savedGradient?.visibility as Visibility | undefined) ?? "private",
	);
	const [publishedSlug, setPublishedSlug] = useState<string | null>(
		savedGradient?.publicSlug ?? null,
	);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		setTitle(savedGradient?.title ?? "Untitled Gradient");
		setVisibility(
			(savedGradient?.visibility as Visibility | undefined) ?? "private",
		);
		setPublishedSlug(savedGradient?.publicSlug ?? null);
	}, [
		savedGradient?.title,
		savedGradient?.visibility,
		savedGradient?.publicSlug,
	]);

	const syncQueries = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["saved-gradients"] }),
			queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
			queryClient.invalidateQueries({ queryKey: ["favorite-gradients"] }),
			queryClient.invalidateQueries({ queryKey: ["saved-gradient-editor"] }),
		]);
	};

	const saveMutation = useMutation({
		mutationFn: async (mode: "save" | "publish") => {
			const trimmedTitle = title.trim() || "Untitled Gradient";
			const existingId = savedGradient?.id;
			const targetVisibility =
				mode === "publish"
					? visibility
					: ((savedGradient?.visibility as Visibility | undefined) ??
						"private");

			if (existingId) {
				await updateSavedGradient({
					data: {
						id: existingId,
						title: trimmedTitle,
						shareState,
						width,
						height,
						shapesCount,
						colorsCount,
					},
				});
				const meta = await updateSavedGradientMeta({
					data: {
						id: existingId,
						title: trimmedTitle,
						visibility: targetVisibility,
					},
				});
				return {
					id: existingId,
					visibility: meta.visibility as Visibility,
					publicSlug: meta.publicSlug ?? savedGradient?.publicSlug ?? null,
				};
			}

			const created = await createSavedGradient({
				data: {
					title: trimmedTitle,
					shareState,
					width,
					height,
					shapesCount,
					colorsCount,
				},
			});

			const meta =
				targetVisibility !== "private" || trimmedTitle !== "Untitled Gradient"
					? await updateSavedGradientMeta({
							data: {
								id: created.id,
								title: trimmedTitle,
								visibility: targetVisibility,
							},
						})
					: null;

			return {
				id: created.id,
				visibility: meta?.visibility ?? "private",
				publicSlug: meta?.publicSlug ?? null,
			};
		},
		onSuccess: async (result, mode) => {
			await syncQueries();
			setPublishedSlug(result.publicSlug);
			setMessage(
				mode === "publish"
					? result.visibility === "private"
						? "Gradient saved privately."
						: "Published link updated."
					: "Gradient saved to your library.",
			);

			if (!savedGradient?.id || savedGradient.id !== result.id) {
				await router.navigate({
					to: "/editor",
					search: { gradientId: result.id },
				});
			}
		},
		onError: (error) => {
			console.error("Failed to save editor gradient", error);
			setMessage("Could not save this gradient. Try again.");
		},
	});

	if (!viewer) {
		return (
			<div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 p-3">
				<p className="text-sm font-semibold text-neutral-900">Library</p>
				<p className="mt-2 text-sm leading-6 text-neutral-600">
					Sign in with Google to save this gradient, publish a permalink,
					collect upvotes and keep private analytics.
				</p>
				<a
					href={`/login?next=${encodeURIComponent("/editor")}`}
					className="mt-3 inline-flex items-center rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
				>
					Sign in to save
				</a>
			</div>
		);
	}

	const isSaved = Boolean(savedGradient?.id);
	const publishedUrl =
		publishedSlug && visibility !== "private"
			? `${window.location.origin}/g/${publishedSlug}`
			: null;

	return (
		<div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold text-neutral-900">Library</p>
					<p className="text-xs text-neutral-500">
						Owner-only saves, publishing and analytics.
					</p>
				</div>
				<p className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
					{isSaved ? "saved" : "draft"}
				</p>
			</div>

			<div className="mt-3 grid gap-3">
				<label className="grid gap-1.5 text-left">
					<span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
						Title
					</span>
					<input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						maxLength={120}
						className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-400"
					/>
				</label>

				<Select
					aria-label="Visibility"
					selectedKey={visibility}
					onSelectionChange={(key: Key | null) => {
						if (key) setVisibility(key as Visibility);
					}}
					className="grid gap-1.5 text-left"
				>
					<span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
						Visibility
					</span>
					<SelectTrigger className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 shadow-none outline-none transition-colors focus:border-neutral-400" />
					<SelectContent>
						<SelectItem id="private" textValue="Private">
							<span className="flex items-center gap-2">
								<span className="size-2 rounded-full bg-neutral-400" />
								Private
							</span>
						</SelectItem>
						<SelectItem id="unlisted" textValue="Unlisted">
							<span className="flex items-center gap-2">
								<span className="size-2 rounded-full bg-amber-500" />
								Unlisted
							</span>
						</SelectItem>
						<SelectItem id="public" textValue="Public">
							<span className="flex items-center gap-2">
								<span className="size-2 rounded-full bg-emerald-500" />
								Public
							</span>
						</SelectItem>
					</SelectContent>
				</Select>

				<div className="flex flex-col gap-2 sm:flex-row">
					<Button
						className="flex-1"
						isPending={
							saveMutation.isPending && saveMutation.variables === "save"
						}
						onPress={() => saveMutation.mutate("save")}
					>
						{isSaved ? "Update saved gradient" : "Save to library"}
					</Button>
					<Button
						intent={visibility === "private" ? "outline" : "primary"}
						className="flex-1"
						isPending={
							saveMutation.isPending && saveMutation.variables === "publish"
						}
						onPress={() => saveMutation.mutate("publish")}
					>
						{visibility === "private" ? "Save private" : "Publish link"}
					</Button>
				</div>

				<div className="flex flex-wrap gap-2 text-xs text-neutral-500">
					<span className="rounded-full bg-white px-2.5 py-1">
						{width} x {height}
					</span>
					<span className="rounded-full bg-white px-2.5 py-1">
						{shapesCount} shapes
					</span>
					<span className="rounded-full bg-white px-2.5 py-1">
						{colorsCount} colors
					</span>
				</div>

				{publishedUrl ? (
					<div className="rounded-xl border border-neutral-200 bg-white p-3 text-left">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
							Published link
						</p>
						<p className="mt-2 truncate text-sm text-neutral-700">
							{publishedUrl}
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<Button
								intent="outline"
								size="sm"
								onPress={async () => {
									await navigator.clipboard.writeText(publishedUrl);
									setMessage("Published link copied.");
								}}
							>
								Copy link
							</Button>
							<a
								href={publishedUrl}
								className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950"
							>
								Open published page
							</a>
						</div>
					</div>
				) : null}

				{message ? <p className="text-sm text-neutral-600">{message}</p> : null}
			</div>
		</div>
	);
}
