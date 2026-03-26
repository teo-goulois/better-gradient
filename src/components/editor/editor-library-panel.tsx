"use client";

import { Button } from "@/components/ui/button";
import {
	createSavedGradient,
	updateSavedGradient,
	updateSavedGradientMeta,
} from "@/lib/actions/actions.saved-gradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { twJoin } from "tailwind-merge";

type Visibility = "private" | "public" | "unlisted";

const VISIBILITY_OPTIONS: {
	value: Visibility;
	label: string;
	dot: string;
}[] = [
	{ value: "private", label: "Private", dot: "bg-neutral-400" },
	{ value: "unlisted", label: "Unlisted", dot: "bg-amber-500" },
	{ value: "public", label: "Public", dot: "bg-emerald-500" },
];

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
	const messageTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

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

	const showMessage = (msg: string) => {
		clearTimeout(messageTimer.current);
		setMessage(msg);
		messageTimer.current = setTimeout(() => setMessage(null), 3000);
	};

	useEffect(() => {
		return () => clearTimeout(messageTimer.current);
	}, []);

	const syncQueries = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["saved-gradients"] }),
			queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
			queryClient.invalidateQueries({ queryKey: ["favorite-gradients"] }),
			queryClient.invalidateQueries({ queryKey: ["saved-gradient-editor"] }),
		]);
	};

	const saveMutation = useMutation({
		mutationFn: async () => {
			const trimmedTitle = title.trim() || "Untitled Gradient";
			const existingId = savedGradient?.id;

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
						visibility,
					},
				});
				return {
					id: existingId,
					visibility: meta.visibility as Visibility,
					publicSlug:
						meta.publicSlug ?? savedGradient?.publicSlug ?? null,
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
				visibility !== "private" || trimmedTitle !== "Untitled Gradient"
					? await updateSavedGradientMeta({
							data: {
								id: created.id,
								title: trimmedTitle,
								visibility,
							},
						})
					: null;

			return {
				id: created.id,
				visibility: (meta?.visibility as Visibility) ?? "private",
				publicSlug: meta?.publicSlug ?? null,
			};
		},
		onSuccess: async (result) => {
			await syncQueries();
			setPublishedSlug(result.publicSlug);
			setVisibility(result.visibility);

			if (result.visibility !== "private" && result.publicSlug) {
				showMessage("Published!");
			} else {
				showMessage("Saved!");
			}

			if (!savedGradient?.id || savedGradient.id !== result.id) {
				await router.navigate({
					to: "/editor",
					search: { gradientId: result.id },
				});
			}
		},
		onError: (error) => {
			console.error("Failed to save editor gradient", error);
			showMessage("Failed to save. Try again.");
		},
	});

	if (!viewer) {
		return (
			<div className="flex flex-col gap-2">
				<p className="text-sm font-medium text-muted-fg">Library</p>
				<a
					href={`/login?next=${encodeURIComponent("/editor")}`}
					className="flex gap-3 items-center px-3 py-2 rounded-lg transition-all duration-200 hover:bg-neutral-500/10"
				>
					<div className="rounded-full p-1.5 bg-neutral-500/20 text-neutral-500">
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
								d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
							/>
						</svg>
					</div>
					<div className="flex flex-col items-start">
						<p className="font-semibold">Sign in to save</p>
						<p className="text-sm text-muted-fg">
							Publish, analytics & more
						</p>
					</div>
				</a>
			</div>
		);
	}

	const isSaved = Boolean(savedGradient?.id);
	const isPublic = visibility !== "private";
	const publishedUrl =
		publishedSlug && isPublic
			? `${window.location.origin}/g/${publishedSlug}`
			: null;

	const buttonLabel = isSaved
		? isPublic
			? "Save & publish"
			: "Save"
		: isPublic
			? "Save & publish"
			: "Save to library";

	return (
		<div className="flex flex-col gap-2">
			<p className="text-sm font-medium text-muted-fg">Library</p>

			<div className="flex flex-col gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50/80 p-2.5">
				{/* Title */}
				<input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					maxLength={120}
					placeholder="Untitled Gradient"
					className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400"
				/>

				{/* Visibility pills */}
				<div className="flex gap-0.5 rounded-lg bg-neutral-200/60 p-0.5">
					{VISIBILITY_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => setVisibility(opt.value)}
							className={twJoin(
								"flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all duration-150",
								visibility === opt.value
									? "bg-white text-neutral-950 shadow-sm"
									: "text-neutral-500 hover:text-neutral-700",
							)}
						>
							<span
								className={twJoin(
									"size-1.5 rounded-full transition-colors",
									opt.dot,
								)}
							/>
							{opt.label}
						</button>
					))}
				</div>

				{/* Save button */}
				<Button
					size="sm"
					className="w-full"
					isPending={saveMutation.isPending}
					onPress={() => saveMutation.mutate()}
				>
					{buttonLabel}
				</Button>

				{/* Published link */}
				{publishedUrl ? (
					<div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5">
						<svg
							className="size-3.5 shrink-0 text-emerald-600"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2}
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
							/>
						</svg>
						<span className="flex-1 truncate text-xs text-emerald-700">
							/g/{publishedSlug}
						</span>
						<button
							type="button"
							onClick={async () => {
								await navigator.clipboard.writeText(
									publishedUrl,
								);
								showMessage("Link copied!");
							}}
							className="rounded p-0.5 text-emerald-600 transition-colors hover:bg-emerald-100 hover:text-emerald-800"
							aria-label="Copy link"
						>
							<svg
								className="size-3.5"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={2}
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
								/>
							</svg>
						</button>
						<a
							href={publishedUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded p-0.5 text-emerald-600 transition-colors hover:bg-emerald-100 hover:text-emerald-800"
							aria-label="Open published page"
						>
							<svg
								className="size-3.5"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={2}
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
								/>
							</svg>
						</a>
					</div>
				) : null}

				{/* Feedback message */}
				{message ? (
					<p
						className={twJoin(
							"text-xs font-medium transition-opacity",
							message.startsWith("Failed")
								? "text-red-600"
								: "text-emerald-600",
						)}
					>
						{message}
					</p>
				) : null}
			</div>
		</div>
	);
}
