import { useEffect } from "react";
import { useMeshSvg } from "./use-mesh-svg";

type Props = {
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

export const useMeshDrawing = ({ canvasRef }: Props) => {
	const { svgUrl, canvas } = useMeshSvg();
	// Draw SVG URL into Canvas; avoid resizing canvas unless dims changed to prevent flicker
	useEffect(() => {
		const canvasEl = canvasRef.current;
		if (!canvasEl) {
			console.log("no canvasEl");
			return;
		}
		if (canvasEl.width !== canvas.width || canvasEl.height !== canvas.height) {
			canvasEl.width = canvas.width;
			canvasEl.height = canvas.height;
		}
		const ctx = canvasEl.getContext("2d");
		if (!ctx) {
			console.log("no ctx");
			return;
		}
		let cancelled = false;
		const img = new Image();
		img.decoding = "async" as any;
		img.onload = () => {
			const draw = () => {
				if (cancelled) return;
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			};
			if ("decode" in img && typeof (img as any).decode === "function") {
				(img as any)
					.decode()
					.then(() => {
						if (!cancelled) draw();
					})
					.catch(() => {
						if (!cancelled) draw();
					});
			} else {
				draw();
			}
		};
		img.src = svgUrl;
		return () => {
			cancelled = true;
		};
	}, [svgUrl, canvasRef.current]);

	return { canvas };
};
