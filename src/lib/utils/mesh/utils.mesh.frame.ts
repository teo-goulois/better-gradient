import type { ContainerSize, FrameRect } from "@/types/types.mesh";

// Helper: compute fitted size inside container based on aspect ratio and rule
export function fitToContainer(size: ContainerSize, aspect: number) {
	const ar = Math.max(0.01, aspect || 1);
	let w = 0;
	let h = 0;
	// Rule: if w > h keep width, else keep height
	if (ar >= 1) {
		// keep width = container width, derive height
		w = Math.floor(size.width);
		h = Math.round(w / ar);
		if (h > size.height) {
			// fallback: clamp to height
			h = Math.floor(size.height);
			w = Math.round(h * ar);
		}
	} else {
		// keep height = container height, derive width
		h = Math.floor(size.height);
		w = Math.round(h * ar);
		if (w > size.width) {
			// fallback: clamp to width
			w = Math.floor(size.width);
			h = Math.round(w / ar);
		}
	}
	// Ensure minimums
	w = Math.max(50, w);
	h = Math.max(50, h);
	return { w, h };
}

export function centerFrame(
	containerSize: ContainerSize,
	frameSize: { w: number; h: number },
) {
	const centeredX = Math.max(
		0,
		Math.round((containerSize.width - frameSize.w) / 2),
	);
	const centeredY = Math.max(
		0,
		Math.round((containerSize.height - frameSize.h) / 2),
	);
	return { x: centeredX, y: centeredY };
}

export function isFrameOutOfBounds(frame: FrameRect, container: ContainerSize) {
	return (
		frame.x < 0 ||
		frame.y < 0 ||
		frame.x + frame.width > container.width ||
		frame.y + frame.height > container.height
	);
}
