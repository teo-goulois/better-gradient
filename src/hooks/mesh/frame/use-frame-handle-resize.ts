import { useFrameContext } from "@/components/mesh/frame/frame-context";
import { useEffect, useRef } from "react";

type Props = {
	outerRef: React.RefObject<HTMLDivElement | null>;
	containerRef: React.RefObject<HTMLDivElement | null>;
};

export const useFrameHandleResize = ({ outerRef, containerRef }: Props) => {
	const { frame, saveFrame } = useFrameContext();

	// Refs for tracking resize state
	const resizingRef = useRef(false);
	const handleRef = useRef<string | null>(null);
	const startMouseRef = useRef({ x: 0, y: 0 });
	const startFrameRef = useRef({ x: 0, y: 0, w: 0, h: 0, ar: 1 });
	const lockRef = useRef({
		locked: false,
		aspectRatio: undefined as number | undefined,
	});
	const cleanupRef = useRef<(() => void) | undefined>(undefined);

	// Resizing via handles
	useEffect(() => {
		let rafId = 0;
		const attach = () => {
			const el = outerRef.current;
			const c = containerRef.current;
			if (!el || !c) {
				rafId = requestAnimationFrame(attach);
				return;
			}
			// Event handlers
			const onDown = (e: MouseEvent) => {
				const target = e.target as Element;
				const h = target.closest("[data-resize]") as HTMLElement | null;
				if (!h) {
					console.log(
						"[useFrameHandleResize] resize mousedown ignored (no handle)",
					);
					return;
				}
				e.preventDefault();
				resizingRef.current = true;
				handleRef.current = h.getAttribute("data-resize");
				startMouseRef.current = { x: e.clientX, y: e.clientY };

				const curr = frame;
				if (!curr) return;

				const locked = lockRef.current.locked;
				const providedAr = lockRef.current.aspectRatio;
				const ar =
					locked && providedAr
						? providedAr
						: Math.max(0.01, curr.width / curr.height);
				startFrameRef.current = {
					x: curr.x,
					y: curr.y,
					w: curr.width,
					h: curr.height,
					ar,
				};
			};

			const onMove = (e: MouseEvent) => {
				const currentHandle = handleRef.current;
				if (!resizingRef.current || !currentHandle) return;

				const dx = e.clientX - startMouseRef.current.x;
				const dy = e.clientY - startMouseRef.current.y;
				const crect = c.getBoundingClientRect();

				let x = startFrameRef.current.x;
				let y = startFrameRef.current.y;
				let w = startFrameRef.current.w;
				let h = startFrameRef.current.h;

				const isN = currentHandle.includes("n");
				const isS = currentHandle.includes("s");
				const isE = currentHandle.includes("e");
				const isW = currentHandle.includes("w");

				if (isE) w = startFrameRef.current.w + dx;
				if (isS) h = startFrameRef.current.h + dy;
				if (isW) {
					const nw = startFrameRef.current.w - dx;
					x = startFrameRef.current.x + (startFrameRef.current.w - nw);
					w = nw;
				}
				if (isN) {
					const nh = startFrameRef.current.h - dy;
					y = startFrameRef.current.y + (startFrameRef.current.h - nh);
					h = nh;
				}

				if (e.shiftKey || lockRef.current.locked) {
					const ar = lockRef.current.aspectRatio ?? startFrameRef.current.ar;
					if ((isE || isW) && !(isN || isS)) {
						h = w / ar;
						y = startFrameRef.current.y + (startFrameRef.current.h - h) / 2;
					} else if ((isN || isS) && !(isE || isW)) {
						w = h * ar;
						x = startFrameRef.current.x + (startFrameRef.current.w - w) / 2;
					} else {
						const wFromH = h * ar;
						const hFromW = w / ar;
						if (
							Math.abs(w - startFrameRef.current.w) >
							Math.abs(h - startFrameRef.current.h)
						) {
							h = hFromW;
						} else {
							w = wFromH;
						}
						if (isW)
							x = startFrameRef.current.x + (startFrameRef.current.w - w);
						if (isN)
							y = startFrameRef.current.y + (startFrameRef.current.h - h);
					}
				}

				const minW = 50;
				const minH = 50;
				const maxW = Math.floor(crect.width);
				const maxH = Math.floor(crect.height);
				w = Math.max(minW, Math.min(maxW, w));
				h = Math.max(minH, Math.min(maxH, h));
				x = Math.min(Math.max(x, 0), Math.floor(crect.width - w));
				y = Math.min(Math.max(y, 0), Math.floor(crect.height - h));

				saveFrame({
					x: Math.round(x),
					y: Math.round(y),
					width: Math.round(w),
					height: Math.round(h),
				});
			};

			const onUp = () => {
				resizingRef.current = false;
				handleRef.current = null;
			};

			// Add event listeners
			el.addEventListener("mousedown", onDown);
			window.addEventListener("mousemove", onMove);
			window.addEventListener("mouseup", onUp);

			cleanupRef.current = () => {
				el.removeEventListener("mousedown", onDown);
				window.removeEventListener("mousemove", onMove);
				window.removeEventListener("mouseup", onUp);
			};
		};
		attach();
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
			cleanupRef.current?.();
		};
	}, [outerRef, containerRef, frame, saveFrame]);
};
