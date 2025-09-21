import { useFrameContext } from "@/components/mesh/frame/frame-context";
import { useEffect } from "react";

type Props = {
	containerRef: React.RefObject<HTMLDivElement | null>;
};

export const useFrameZooming = ({ containerRef }: Props) => {
	const { saveFrame, frame } = useFrameContext();

	useEffect(() => {
		let cleanup: (() => void) | undefined;
		let rafId = 0;
		let pendingZoom: {
			factor: number;
			clientX: number;
			clientY: number;
		} | null = null;

		const attach = () => {
			const c = containerRef.current;
			if (!c) {
				rafId = requestAnimationFrame(attach);
				return;
			}

			// Process pending zoom with requestAnimationFrame for smooth updates
			const processZoom = () => {
				if (!pendingZoom) return;

				const { factor, clientX, clientY } = pendingZoom;
				pendingZoom = null;

				// Get fresh state at the time of the event
				const currentFrame = frame;

				if (!currentFrame) return;

				const crect = c.getBoundingClientRect();
				const ax = clientX - crect.left; // absolute x
				const ay = clientY - crect.top; // absolute y

				// Calculate relative position safely
				const rx =
					currentFrame.width > 0
						? (ax - currentFrame.x) / currentFrame.width
						: 0.5; // relative x
				const ry =
					currentFrame.height > 0
						? (ay - currentFrame.y) / currentFrame.height
						: 0.5; // relative y

				const minW = 200;
				const minH = 100;

				// Prevent division by zero and ensure valid scaling bounds
				const safeWidth = Math.max(currentFrame.width, 1);
				const safeHeight = Math.max(currentFrame.height, 1);
				const sMin = Math.max(minW / safeWidth, minH / safeHeight);

				// Ensure container dimensions are valid
				const safeCw = Math.max(crect.width, minW);
				const safeCh = Math.max(crect.height, minH);
				const sMax = Math.min(safeCw / safeWidth, safeCh / safeHeight);

				const s = Math.max(sMin, Math.min(sMax, factor));

				// Skip if change is too small
				if (Math.abs(s - 1) < 1e-3) return;

				const newW = currentFrame.width * s;
				const newH = currentFrame.height * s;

				// Calculate new position based on zoom center
				let nx = Math.round(ax - rx * newW);
				let ny = Math.round(ay - ry * newH);

				// Improved clamping logic - handle cases where frame is larger than container
				if (newW >= crect.width) {
					// Frame is wider than or equal to container, center it
					nx = Math.round((crect.width - newW) / 2);
				} else {
					// Frame fits, clamp to container bounds
					nx = Math.max(0, Math.min(nx, crect.width - newW));
				}

				if (newH >= crect.height) {
					// Frame is taller than or equal to container, center it
					ny = Math.round((crect.height - newH) / 2);
				} else {
					// Frame fits, clamp to container bounds
					ny = Math.max(0, Math.min(ny, crect.height - newH));
				}

				// Batch updates to prevent multiple re-renders
				saveFrame({
					x: nx,
					y: ny,
					width: Math.round(newW),
					height: Math.round(newH),
				});
			};

			// Store current frame at the time of wheel event to avoid stale closures
			const onWheel = (e: WheelEvent) => {
				e.preventDefault();

				// Queue the zoom operation for the next frame
				pendingZoom = {
					factor: e.deltaY > 0 ? 0.975 : 1.025,
					clientX: e.clientX,
					clientY: e.clientY,
				};

				// Schedule processing for next frame if not already scheduled
				if (!rafId) {
					rafId = requestAnimationFrame(() => {
						processZoom();
						rafId = 0;
					});
				}
			};

			c.addEventListener("wheel", onWheel, { passive: false });
			cleanup = () => {
				c.removeEventListener("wheel", onWheel);
			};
		};

		attach();
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
			cleanup?.();
		};
	}, [containerRef, saveFrame, frame]);
};
