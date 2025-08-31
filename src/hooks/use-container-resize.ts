import { useMeshStore } from "@/store/store-mesh";
import { type RefObject, useEffect } from "react";

export const useContainerResize = (
	containerRef: RefObject<HTMLDivElement | null>,
) => {
	const setUi = useMeshStore((s) => s.setUi);

	// update container size on resize
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
				const w = rect.width;
				const h = rect.height;
				setUi({
					containerWidth: w,
					containerHeight: h,
				});
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
	}, [containerRef.current, setUi]);
};
