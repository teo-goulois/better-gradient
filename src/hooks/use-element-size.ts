"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

export function useElementSize<T extends Element>(
	ref: RefObject<T | null>,
): { width: number | null; height: number | null };
export function useElementSize<T extends Element>(
	ref: RefObject<T | null>,
	initial: {
		width: number;
		height: number;
	},
): {
	width: number;
	height: number;
};
export function useElementSize<T extends Element = Element>(
	ref: RefObject<T | null>,
	initial?: {
		width: number;
		height: number;
	},
) {
	const [size, setSize] = useState({
		width: initial?.width ?? null,
		height: initial?.height ?? null,
	});

	const previousObserver = useRef<ResizeObserver | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const element = ref.current;

		if (previousObserver.current) {
			previousObserver.current.disconnect();
			previousObserver.current = null;
		}

		if (element?.nodeType === Node.ELEMENT_NODE) {
			const observer = new ResizeObserver(([entry]) => {
				if (entry?.borderBoxSize) {
					const { inlineSize: width, blockSize: height } =
						entry.borderBoxSize[0];

					setSize((prev) => {
						if (prev.width === width && prev.height === height) return prev;
						return { width, height };
					});
				}
			});

			observer.observe(element, { box: "border-box" });
			previousObserver.current = observer;
		}

		return () => {
			if (previousObserver.current) {
				previousObserver.current.disconnect();
				previousObserver.current = null;
			}
		};
	}, [ref]);

	return size;
}
