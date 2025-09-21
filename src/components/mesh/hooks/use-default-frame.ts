import { useMeshStore } from "@/store/store-mesh";
import { useEffect } from "react";

export const useDefaultFrame = () => {
	const ui = useMeshStore((s) => s.ui);
	const setUi = useMeshStore((s) => s.setUi);

	useEffect(() => {
		setUi({ frame: { width: 1920, height: 1080, x: 0, y: 0 } });
	}, [setUi]);
};
