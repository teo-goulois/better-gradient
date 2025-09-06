import { ContainerSize } from "@/types/types.mesh";
import { useEffect, useRef, useState } from "react";
import { useFrameOnMount } from "./use-frame-on-mount";
import { useMeshStore } from "@/store/store-mesh";

export type FrameRect = { x: number; y: number; width: number; height: number };

type UseMeshFrameArgs = {
	initialSize: { width: number; height: number };
	uiSize: { width?: number; height?: number };
	onCommitSize?: (size: {
		width: number;
		height: number;
		containerWidth: number;
		containerHeight: number;
	}) => void;
	onCommitPosition?: (position: { x: number; y: number }) => void;
	lockAspect?: { locked: boolean; aspectRatio: number };
	contentAspect?: number;
};

// Encapsulates positioning, zoom, dragging and resizing of the preview frame.
export function useMeshFrame({
	initialSize,
	uiSize,
	onCommitSize,
	onCommitPosition,
	lockAspect,
	contentAspect,
}: UseMeshFrameArgs) {
	const ui = useMeshStore((s) => s.ui);
	const containerRef = useRef<HTMLDivElement>(null);
	const outerRef = useRef<HTMLDivElement>(null);

	const onCommitSizeRef = useRef<UseMeshFrameArgs["onCommitSize"] | undefined>(
		undefined,
	);
	useEffect(() => {
		onCommitSizeRef.current = onCommitSize;
	}, [onCommitSize]);

	const onCommitPositionRef = useRef<
		UseMeshFrameArgs["onCommitPosition"] | undefined
	>(undefined);
	useEffect(() => {
		onCommitPositionRef.current = onCommitPosition;
	}, [onCommitPosition]);

	const lockRef = useRef<UseMeshFrameArgs["lockAspect"] | undefined>(undefined);
	useEffect(() => {
		lockRef.current = lockAspect;
	}, [lockAspect]);

	const [frame, setFrame] = useState<FrameRect>(() => ({
		x: 0,
		y: 0,
		width: uiSize.width ?? initialSize.width,
		height: uiSize.height ?? initialSize.height,
	}));

	const [container, setContainer] = useState<ContainerSize>({
		width: 0,
		height: 0,
	});

	// reactively update frame ref
	const frameRef = useRef(frame);
	useEffect(() => {
		frameRef.current = frame;
	}, [frame]);

	// center frame on mount and apply initial UI size if provided; otherwise fit by aspect
	useFrameOnMount({
		containerRef,
		setFrame,
		setContainer,
	});

	// React to external uiSize changes (preview manual resize). If none provided, auto-fit by aspect.
	useEffect(() => {
		const c = containerRef.current;
		if (!c) return;
		const rect = c.getBoundingClientRect();
		setFrame((f) => {
			if (!(uiSize.width || uiSize.height)) {
				const ar = contentAspect ?? f.width / Math.max(1, f.height);
				const fit = fitToContainer(rect, ar);
				const x = Math.max(0, Math.round((rect.width - fit.w) / 2));
				const y = Math.max(0, Math.round((rect.height - fit.h) / 2));
				return { x, y, width: fit.w, height: fit.h };
			}
			const nextW = uiSize.width ?? f.width;
			const nextH = uiSize.height ?? f.height;
			if (nextW === f.width && nextH === f.height) return f;
			const w = Math.max(50, Math.min(Math.floor(rect.width), nextW));
			const h = Math.max(50, Math.min(Math.floor(rect.height), nextH));
			let x = f.x;
			let y = f.y;
			x = Math.max(
				0,
				Math.min(
					Math.round(f.x + (f.width - w) / 2),
					Math.floor(rect.width - w),
				),
			);
			y = Math.max(
				0,
				Math.min(
					Math.round(f.y + (f.height - h) / 2),
					Math.floor(rect.height - h),
				),
			);
			return { x, y, width: w, height: h };
		});
		setContainer({ width: rect.width, height: rect.height });
	}, [uiSize.width, uiSize.height]);

	// Adapt frame to container resize (keep inside and clamp size to container)
	useEffect(() => {
		let ro: ResizeObserver | undefined;
		let rafId = 0;
		const attach = () => {
			const c = containerRef.current;
			if (!c) {
				if (!rafId)
					console.log(
						"[useMeshFrame] container resize observer waiting for container...",
					);
				rafId = requestAnimationFrame(attach);
				return;
			}
			const onResize = () => {
				const rect = c.getBoundingClientRect();
				setFrame((f) => {
					if (!(uiSize.width || uiSize.height)) {
						const ar = contentAspect ?? f.width / Math.max(1, f.height);
						const fit = fitToContainer(rect, ar);
						// Use saved position if available, otherwise center
						const x =
							ui.frameX !== undefined
								? Math.max(
										0,
										Math.min(ui.frameX, Math.max(0, rect.width - fit.w)),
									)
								: Math.max(0, Math.round((rect.width - fit.w) / 2));
						const y =
							ui.frameY !== undefined
								? Math.max(
										0,
										Math.min(ui.frameY, Math.max(0, rect.height - fit.h)),
									)
								: Math.max(0, Math.round((rect.height - fit.h) / 2));
						return { x, y, width: fit.w, height: fit.h };
					}
					const w = Math.min(f.width, Math.floor(rect.width));
					const h = Math.min(f.height, Math.floor(rect.height));
					const maxX = Math.floor(rect.width - w);
					const maxY = Math.floor(rect.height - h);
					const x = Math.min(Math.max(f.x, 0), Math.max(0, maxX));
					const y = Math.min(Math.max(f.y, 0), Math.max(0, maxY));
					return { x, y, width: w, height: h };
				});
				setContainer({ width: rect.width, height: rect.height });
			};
			ro = new ResizeObserver(onResize);
			ro.observe(c);
			// Fire once initially as well
			onResize();
		};
		attach();
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
			ro?.disconnect();
		};
	}, []);

	// React to content aspect changes by refitting when no explicit ui size provided
	useEffect(() => {
		const c = containerRef.current;
		if (!c) return;
		if (uiSize.width || uiSize.height) return;
		const rect = c.getBoundingClientRect();
		const fit = fitToContainer(
			rect,
			contentAspect ??
				frameRef.current.width / Math.max(1, frameRef.current.height),
		);
		setFrame(() => ({
			x:
				ui.frameX !== undefined
					? Math.max(0, Math.min(ui.frameX, Math.max(0, rect.width - fit.w)))
					: Math.max(0, Math.round((rect.width - fit.w) / 2)),
			y:
				ui.frameY !== undefined
					? Math.max(0, Math.min(ui.frameY, Math.max(0, rect.height - fit.h)))
					: Math.max(0, Math.round((rect.height - fit.h) / 2)),
			width: fit.w,
			height: fit.h,
		}));
		setContainer({ width: rect.width, height: rect.height });
	}, [contentAspect]);

	// Zoom with wheel over container (anchor at cursor)
	useEffect(() => {
		let cleanup: (() => void) | undefined;
		let rafId = 0;
		const attach = () => {
			const c = containerRef.current;
			if (!c) {
				if (!rafId)
					console.log("[useMeshFrame] zoom listener waiting for container...");
				rafId = requestAnimationFrame(attach);
				return;
			}

			const onWheel = (e: WheelEvent) => {
				e.preventDefault();
				const factor = e.deltaY > 0 ? 0.975 : 1.025;
				const crect = c.getBoundingClientRect();
				const cw = crect.width;
				const ch = crect.height;
				const ax = e.clientX - crect.left; // absolute x
				const ay = e.clientY - crect.top; // absolute y

				setFrame((fr) => {
					const rx = fr.width > 0 ? (ax - fr.x) / fr.width : 0.5; // relative x
					const ry = fr.height > 0 ? (ay - fr.y) / fr.height : 0.5; // relative y

					const minW = 200;
					const minH = 100;
					const sMin = Math.max(minW / fr.width, minH / fr.height);
					const maxW = cw; //Math.max(minW, crect.width * 6)
					const maxH = ch; //Math.max(minH, crect.height * 6)
					const sMax = Math.min(maxW / fr.width, maxH / fr.height);
					const sCandidate = factor;
					const s = Math.max(sMin, Math.min(sMax, sCandidate));
					if (Math.abs(s - 1) < 1e-3) return fr;
					const newW = fr.width * s;
					const newH = fr.height * s;
					let nx = Math.round(ax - rx * newW);
					let ny = Math.round(ay - ry * newH);
					const minX = 0;
					const maxX = Math.floor(crect.width - newW);
					const minY = 0;
					const maxY = Math.floor(crect.height - newH);
					const clampXMin = Math.min(minX, maxX);
					const clampXMax = Math.max(minX, maxX);
					const clampYMin = Math.min(minY, maxY);
					const clampYMax = Math.max(minY, maxY);
					nx = Math.min(Math.max(nx, clampXMin), clampXMax);
					ny = Math.min(Math.max(ny, clampYMin), clampYMax);
					return {
						x: nx,
						y: ny,
						width: Math.round(newW),
						height: Math.round(newH),
					};
				});
				setContainer({ width: crect.width, height: crect.height });
			};
			c.addEventListener("wheel", onWheel, { passive: false });
			cleanup = () => {
				console.log("[useMeshFrame] zoom listener detached");
				c.removeEventListener("wheel", onWheel);
			};
		};
		attach();
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
			cleanup?.();
		};
	}, []);

	// Dragging the frame by clicking empty space in outerRef
	useEffect(() => {
		let cleanup: (() => void) | undefined;
		let rafId = 0;
		const attach = () => {
			const el = outerRef.current;
			const c = containerRef.current;
			if (!el || !c) {
				if (!rafId)
					console.log("[useMeshFrame] drag listeners waiting for refs...");
				rafId = requestAnimationFrame(attach);
				return;
			}
			let dragging = false;
			let lastX = 0;
			let lastY = 0;
			const onDown = (e: MouseEvent) => {
				if ((e.buttons & 1) !== 1) return;
				const target = e.target as Element;
				if (
					target.closest("[data-resize]") ||
					target.closest('[data-handle="true"]')
				)
					return;
				dragging = true;
				lastX = e.clientX;
				lastY = e.clientY;
			};
			const onMove = (e: MouseEvent) => {
				if (!dragging) return;
				const dx = e.clientX - lastX;
				const dy = e.clientY - lastY;
				const crect = c.getBoundingClientRect();
				setFrame((f) => {
					let nx = f.x + dx;
					let ny = f.y + dy;
					const minX = Math.min(0, Math.floor(crect.width - f.width));
					const maxX = Math.max(0, Math.floor(crect.width - f.width));
					const minY = Math.min(0, Math.floor(crect.height - f.height));
					const maxY = Math.max(0, Math.floor(crect.height - f.height));
					nx = Math.min(Math.max(nx, minX), maxX);
					ny = Math.min(Math.max(ny, minY), maxY);

					return { ...f, x: nx, y: ny };
				});
				setContainer({ width: crect.width, height: crect.height });
				lastX = e.clientX;
				lastY = e.clientY;
			};
			const onUp = () => {
				if (dragging) {
					// Save position when drag ends
					const curr = frameRef.current;
					console.log("Saving frame position:", curr.x, curr.y);
					onCommitPositionRef.current?.({
						x: curr.x,
						y: curr.y,
					});
				}
				dragging = false;
			};
			el.addEventListener("mousedown", onDown);
			window.addEventListener("mousemove", onMove);
			window.addEventListener("mouseup", onUp);
			cleanup = () => {
				console.log("[useMeshFrame] drag listeners detached");
				el.removeEventListener("mousedown", onDown);
				window.removeEventListener("mousemove", onMove);
				window.removeEventListener("mouseup", onUp);
			};
		};
		attach();
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
			cleanup?.();
		};
	}, []);

	// Resizing via handles
	useEffect(() => {
		let cleanup: (() => void) | undefined;
		let rafId = 0;
		const attach = () => {
			const el = outerRef.current;
			const c = containerRef.current;
			if (!el || !c) {
				if (!rafId)
					console.log("[useMeshFrame] resize listeners waiting for refs...");
				rafId = requestAnimationFrame(attach);
				return;
			}
			let resizing = false;
			let handle: string | null = null;
			let startX = 0;
			let startY = 0;
			let start = { x: 0, y: 0, w: 0, h: 0, ar: 1 };
			const onDown = (e: MouseEvent) => {
				const target = e.target as Element;
				const h = target.closest("[data-resize]") as HTMLElement | null;
				if (!h) {
					console.log("[useMeshFrame] resize mousedown ignored (no handle)");
					return;
				}
				e.preventDefault();
				resizing = true;
				handle = h.getAttribute("data-resize");
				startX = e.clientX;
				startY = e.clientY;
				const curr = frameRef.current;
				const locked = lockRef.current?.locked;
				const providedAr = lockRef.current?.aspectRatio;
				const ar =
					locked && providedAr
						? providedAr
						: Math.max(0.01, curr.width / curr.height);
				start = { x: curr.x, y: curr.y, w: curr.width, h: curr.height, ar };
			};
			const onMove = (e: MouseEvent) => {
				const currentHandle = handle;
				if (!resizing || !currentHandle) return;
				const dx = e.clientX - startX;
				const dy = e.clientY - startY;
				const crect = c.getBoundingClientRect();
				setFrame((_f) => {
					let x = start.x;
					let y = start.y;
					let w = start.w;
					let h = start.h;
					const isN = currentHandle.includes("n");
					const isS = currentHandle.includes("s");
					const isE = currentHandle.includes("e");
					const isW = currentHandle.includes("w");
					if (isE) w = start.w + dx;
					if (isS) h = start.h + dy;
					if (isW) {
						const nw = start.w - dx;
						x = start.x + (start.w - nw);
						w = nw;
					}
					if (isN) {
						const nh = start.h - dy;
						y = start.y + (start.h - nh);
						h = nh;
					}
					if (e.shiftKey || lockRef.current?.locked) {
						const ar = lockRef.current?.aspectRatio ?? start.ar;
						if ((isE || isW) && !(isN || isS)) {
							h = w / ar;
							y = start.y + (start.h - h) / 2;
						} else if ((isN || isS) && !(isE || isW)) {
							w = h * ar;
							x = start.x + (start.w - w) / 2;
						} else {
							const wFromH = h * ar;
							const hFromW = w / ar;
							if (Math.abs(w - start.w) > Math.abs(h - start.h)) {
								h = hFromW;
							} else {
								w = wFromH;
							}
							if (isW) x = start.x + (start.w - w);
							if (isN) y = start.y + (start.h - h);
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

					return {
						x: Math.round(x),
						y: Math.round(y),
						width: Math.round(w),
						height: Math.round(h),
					};
				});
				setContainer({ width: crect.width, height: crect.height });
			};
			const onUp = () => {
				resizing = false;
				handle = null;
			};
			const onUpCommit = () => {
				const curr = frameRef.current;
				onCommitSizeRef.current?.({
					width: curr.width,
					height: curr.height,
					containerWidth: container.width,
					containerHeight: container.height,
				});
			};
			el.addEventListener("mousedown", onDown);
			window.addEventListener("mousemove", onMove);
			window.addEventListener("mouseup", onUp);
			window.addEventListener("mouseup", onUpCommit);
			cleanup = () => {
				el.removeEventListener("mousedown", onDown);
				window.removeEventListener("mousemove", onMove);
				window.removeEventListener("mouseup", onUp);
				window.removeEventListener("mouseup", onUpCommit);
			};
		};
		attach();
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
			cleanup?.();
		};
	}, []);

	return { containerRef, outerRef, frame };
}

// Helper: compute fitted size inside container based on aspect ratio and rule
export function fitToContainer(rect: DOMRect, aspect: number) {
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
