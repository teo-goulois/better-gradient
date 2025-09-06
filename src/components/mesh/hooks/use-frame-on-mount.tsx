import { useMeshStore } from "@/store/store-mesh";
import type { ContainerSize, FrameRect } from "@/types/types.mesh";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { useEffect } from "react";

type UseFrameOnMountArgs = {
	containerRef: RefObject<HTMLDivElement | null>;
	setFrame: Dispatch<SetStateAction<FrameRect>>;
	setContainer: Dispatch<SetStateAction<ContainerSize>>;
};

// Center frame on mount and apply initial UI size if provided; otherwise fit by aspect
export const useFrameOnMount = ({
	containerRef,
	setFrame,
	setContainer,
}: UseFrameOnMountArgs) => {
	const ui = useMeshStore((s) => s.ui);
	const setCanvas = useMeshStore((s) => s.setCanvas);
	const setUi = useMeshStore((s) => s.setUi);
	const hasHydrated = useMeshStore.persist.hasHydrated();

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!hasHydrated) return;
		const c = containerRef.current;
		if (!c) {
			return;
		}

		console.log("useFrameOnMount - Full UI state:", JSON.stringify(ui, null, 2));
		const rect = c.getBoundingClientRect();
		setContainer({ width: rect.width, height: rect.height });

		// First-time user: no saved frame dimensions
		if (!ui.frameWidth || !ui.frameHeight) {
			// Set canvas to 1920x1080 for first-time users
			setCanvas({ width: 1920, height: 1080 });

			// Calculate optimal frame size that fits in container while maintaining 16:9 aspect ratio
			const targetAspectRatio = 1920 / 1080;
			const fit = fitToContainer(rect, targetAspectRatio);

			// Center the frame in container
			const centeredX = Math.max(0, Math.round((rect.width - fit.w) / 2));
			const centeredY = Math.max(0, Math.round((rect.height - fit.h) / 2));

			const frameRect = {
				x: centeredX,
				y: centeredY,
				width: fit.w,
				height: fit.h,
			};

			setFrame(frameRect);

			// Save frame dimensions and position to store for future use
			setUi({
				frameWidth: fit.w,
				frameHeight: fit.h,
				frameX: centeredX,
				frameY: centeredY,
				aspectRatio: targetAspectRatio,
			});

			return;
		}

		// Existing user: restore saved position and scale if needed
		const savedAspectRatio = ui.frameWidth / ui.frameHeight;
		console.log("Loading saved position:", ui.frameX, ui.frameY, "dimensions:", ui.frameWidth, ui.frameHeight);

		// Determine if we need to scale based on screen change
		let scaledWidth = ui.frameWidth;
		let scaledHeight = ui.frameHeight;
		let shouldScale = false;

		// If frame is larger than current container, scale it down
		if (ui.frameWidth > rect.width || ui.frameHeight > rect.height) {
			const fit = fitToContainer(rect, savedAspectRatio);
			scaledWidth = fit.w;
			scaledHeight = fit.h;
			shouldScale = true;
		}

		// Calculate position
		let frameX: number;
		let frameY: number;

		if (shouldScale || ui.frameX === undefined || ui.frameY === undefined) {
			// Scale the frame or center if no saved position - properly center for both horizontal and vertical
			frameX = Math.max(0, Math.round((rect.width - scaledWidth) / 2));
			frameY = Math.max(0, Math.round((rect.height - scaledHeight) / 2));
			console.log("Centering frame at:", frameX, frameY);
		} else {
			// Use saved position, but ensure it's within bounds
			const maxX = Math.max(0, rect.width - scaledWidth);
			const maxY = Math.max(0, rect.height - scaledHeight);
			frameX = Math.max(0, Math.min(ui.frameX, maxX));
			frameY = Math.max(0, Math.min(ui.frameY, maxY));
			console.log("Restoring saved position:", frameX, frameY);
		}

		const frameRect = {
			x: frameX,
			y: frameY,
			width: scaledWidth,
			height: scaledHeight,
		};

		setFrame(frameRect);
	}, [hasHydrated]);
};

// Helper: compute fitted size inside container based on aspect ratio and rule
function fitToContainer(rect: DOMRect, aspect: number) {
	const ar = Math.max(0.01, aspect || 1);
	let w = 0;
	let h = 0;
	// Rule: if w > h keep width, else keep height
	if (ar >= 1) {
		// keep width = container width, derive height
		w = Math.floor(rect.width);
		h = Math.round(w / ar);
		if (h > rect.height) {
			// fallback: clamp to height
			h = Math.floor(rect.height);
			w = Math.round(h * ar);
		}
	} else {
		// keep height = container height, derive width
		h = Math.floor(rect.height);
		w = Math.round(h * ar);
		if (w > rect.width) {
			// fallback: clamp to width
			w = Math.floor(rect.width);
			h = Math.round(w / ar);
		}
	}
	// Ensure minimums
	w = Math.max(50, w);
	h = Math.max(50, h);
	return { w, h };
}
