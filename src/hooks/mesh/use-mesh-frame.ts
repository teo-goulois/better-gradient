import type { FrameRect } from "@/types/types.mesh";
import { useFrameDragging } from "./frame/use-frame-dragging";
import { useFrameHandleResize } from "./frame/use-frame-handle-resize";
import { useFrameResizing } from "./frame/use-frame-resizing";
import { useFrameZooming } from "./frame/use-frame-zooming";

type Props = {
	outerRef: React.RefObject<HTMLDivElement | null>;
	containerRef: React.RefObject<HTMLDivElement | null>;
	// set frame
};

export const useMeshFrame = ({ outerRef, containerRef }: Props) => {
	useFrameDragging({ outerRef });
	useFrameZooming({ containerRef });
	useFrameResizing();
	//useFrameHandleResize({ outerRef, containerRef });
};
