import { svgDataUrl, svgStringFromState } from "@/lib/mesh-svg";
import { decodeShareString } from "@/lib/utils/share";
import { useMemo } from "react";

export function GradientPreview({
	shareState,
	title,
	className,
}: {
	shareState: string;
	title: string;
	className?: string;
}) {
	const previewDataUrl = useMemo(() => {
		const decoded = decodeShareString(shareState);
		if (!decoded) {
			return null;
		}
		return svgDataUrl(
			svgStringFromState({
				canvas: decoded.canvas,
				shapes: decoded.shapes,
				palette: decoded.palette,
				filters: decoded.filters,
				outputSize: { width: 480, height: 320 },
			}),
		);
	}, [shareState]);

	if (!previewDataUrl) {
		return (
			<div
				className={className ?? "aspect-[4/3] rounded-xl bg-neutral-100"}
			/>
		);
	}

	return (
		<img
			src={previewDataUrl}
			alt={title}
			className={
				className ??
				"block aspect-[4/3] w-full rounded-xl border border-neutral-200 object-cover"
			}
			loading="lazy"
			decoding="async"
		/>
	);
}
