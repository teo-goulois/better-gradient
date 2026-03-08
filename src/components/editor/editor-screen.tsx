"use client";

import { FrameProvider } from "@/components/mesh/frame/frame-context";
import { MeshPreview } from "@/components/mesh/mesh-preview";
import { MeshSidebar } from "@/components/mesh/sidebar/mesh-sidebar";
import { getViewerQueryOptions } from "@/lib/actions/actions.auth";
import { getSavedGradientForEditorQueryOptions } from "@/lib/actions/actions.saved-gradient";
import { useMeshStore } from "@/store/store-mesh";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { twJoin } from "tailwind-merge";

export function EditorScreen({
	savedGradientId,
	shareStateFromSearch,
}: {
	savedGradientId?: string;
	shareStateFromSearch?: string;
}) {
	const fromShareString = useMeshStore((state) => state.fromShareString);
	const viewerQuery = useQuery(getViewerQueryOptions());
	const savedGradientQuery = useQuery({
		...getSavedGradientForEditorQueryOptions(savedGradientId ?? "__none__"),
		enabled: Boolean(savedGradientId),
	});

	useEffect(() => {
		if (savedGradientQuery.data?.gradient.shareState) {
			fromShareString(savedGradientQuery.data.gradient.shareState);
			return;
		}
		if (shareStateFromSearch) {
			fromShareString(shareStateFromSearch);
		}
	}, [
		savedGradientQuery.data?.gradient.shareState,
		shareStateFromSearch,
		fromShareString,
	]);

	return (
		<FrameProvider>
			<div
				className={twJoin(
					"flex-1 w-full overflow-hidden bg-gray-100 relative pl-[17rem] editor-container",
					"[background-size:16px_16px] bg-[position:0_0] bg-repeat-round",
					"bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]",
					"max-md:hidden",
				)}
			>
				<MeshSidebar />
				<MeshPreview
					savedGradient={savedGradientQuery.data?.gradient}
					viewer={viewerQuery.data?.user ?? null}
				/>
			</div>
		</FrameProvider>
	);
}
