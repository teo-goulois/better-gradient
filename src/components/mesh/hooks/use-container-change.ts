import { useMeshStore } from "@/store/store-mesh";
import { useEffect, useRef } from "react";

export const useContainerChange = (
	ref: React.RefObject<HTMLDivElement | null>,
) => {
	const ui = useMeshStore((s) => s.ui);
	const setUi = useMeshStore((s) => s.setUi);

	const previousObserver = useRef<ResizeObserver | null>(null);
	const element = ref.current;

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		console.log("element", element, Node.ELEMENT_NODE, element?.nodeType);

		if (previousObserver.current) {
			previousObserver.current.disconnect();
			previousObserver.current = null;
		}

		if (element?.nodeType === Node.ELEMENT_NODE) {
			const observer = new ResizeObserver(([entry]) => {
				console.log("entry", entry);
				if (entry?.borderBoxSize) {
					const { inlineSize: width, blockSize: height } =
						entry.borderBoxSize[0];

					if (
						width !== ui.container?.width ||
						height !== ui.container?.height
					) {
						console.log("container changed", width, height);
						setUi({ container: { width, height } });
					}
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
	}, [ref.current, setUi]);
};
