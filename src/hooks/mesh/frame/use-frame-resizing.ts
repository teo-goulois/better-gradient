import { useFrameContext } from "@/components/mesh/frame/frame-context";
import { fitToContainer } from "@/lib/utils/mesh/utils.mesh.frame";
import { useMeshStore } from "@/store/store-mesh";
import { useEffect } from "react";

export const useFrameResizing = () => {
	const { saveFrame, frame } = useFrameContext();
	const container = useMeshStore((s) => s.ui.container);

	useEffect(() => {
		if (!container) return;
		if (!frame) return;
		const contentAspect =
			frame?.aspectRatio ?? frame.width / Math.max(1, frame.height);

		const fit = fitToContainer(
			container,
			contentAspect ?? frame.width / Math.max(1, frame.height),
		);
		saveFrame({
			x:
				frame.x !== undefined
					? Math.max(0, Math.min(frame.x, Math.max(0, container.width - fit.w)))
					: Math.max(0, Math.round((container.width - fit.w) / 2)),
			y:
				frame.y !== undefined
					? Math.max(
							0,
							Math.min(frame.y, Math.max(0, container.height - fit.h)),
						)
					: Math.max(0, Math.round((container.height - fit.h) / 2)),
			width: fit.w,
			height: fit.h,
		});
	}, [container]);
};
