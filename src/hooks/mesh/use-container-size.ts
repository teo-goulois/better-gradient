import { useMeshStore } from "@/store/store-mesh";
import { useEffect } from "react";
import { useElementSize } from "../use-element-size";

export const useContainerSize = (
	containerRef: React.RefObject<HTMLDivElement | null>,
) => {
	// read action imperatively to avoid re-renders from selector
	const setUiContainerSize = useMeshStore.getState().setUiContainerSize;

	const { width, height } = useElementSize(containerRef);

	useEffect(() => {
		if (width == null || height == null) return;

		// avoid redundant writes
		const prev = useMeshStore.getState().ui.container;
		if (prev?.width === width && prev?.height === height) return;

		setUiContainerSize({ width, height });
	}, [width, height]);

	const sizeReady = width !== null && height !== null;

	return { container: { width, height }, sizeReady };
};
