import { useFrameContext } from "@/components/mesh/frame/frame-context";
import { centerFrame, fitToContainer } from "@/lib/utils/mesh/utils.mesh.frame";
import { useMeshStore } from "@/store/store-mesh";
import { useEffect } from "react";

const DEFAULT_FRAME_SIZE = { width: 1920, height: 1080 };

// Center frame on mount and apply initial UI size if provided; otherwise fit by aspect
export const useFrameOnMount = () => {
  const { saveFrame, frame } = useFrameContext();

  const setCanvas = useMeshStore((s) => s.setCanvas);
  const containerSize = useMeshStore((s) => s.ui.container);

  useEffect(() => {
    if (!containerSize) {
      return;
    }

    // First-time user: no saved frame dimensions
    if (!frame?.width || !frame?.height) {
      // Set canvas to 1920x1080 for first-time users
      setCanvas(DEFAULT_FRAME_SIZE);

      // Calculate optimal frame size that fits in container while maintaining 16:9 aspect ratio
      const targetAspectRatio =
        DEFAULT_FRAME_SIZE.width / DEFAULT_FRAME_SIZE.height;
      const fit = fitToContainer(containerSize, targetAspectRatio);

      // Center the frame in container
      const centered = centerFrame(containerSize, fit);

      saveFrame({
        width: fit.w,
        height: fit.h,
        x: centered.x,
        y: centered.y,
        aspectRatio: targetAspectRatio,
      });

      return;
    }

    /* // Existing user: restore saved position and scale if needed
    const savedAspectRatio = ui.frame.width / ui.frame.height;

    // Determine if we need to scale based on screen change
    let scaledWidth = ui.frame.width;
    let scaledHeight = ui.frame.height;
    let shouldScale = false;

    const isOutOfBounds = isFrameOutOfBounds(ui.frame, containerSize);

    // If frame is larger than current container, scale it down
    if (isOutOfBounds) {
      const fit = fitToContainer(containerSize, savedAspectRatio);
      scaledWidth = fit.w;
      scaledHeight = fit.h;
      shouldScale = true;
    }

    // Calculate position
    let frameX: number;
    let frameY: number;

    if (shouldScale || ui.frame.x === undefined || ui.frame.y === undefined) {
      // Scale the frame or center if no saved position - properly center for both horizontal and vertical
      frameX = Math.max(0, Math.round((containerSize.width - scaledWidth) / 2));
      frameY = Math.max(
        0,
        Math.round((containerSize.height - scaledHeight) / 2)
      );
      console.log("Centering frame at:", frameX, frameY);
    } else {
      // Use saved position, but ensure it's within bounds
      const maxX = Math.max(0, containerSize.width - scaledWidth);
      const maxY = Math.max(0, containerSize.height - scaledHeight);
      frameX = Math.max(0, Math.min(ui.frame?.x, maxX));
      frameY = Math.max(0, Math.min(ui.frame?.y, maxY));
      console.log("Restoring saved position:", frameX, frameY);
    }

    // setUiFrame(frameRect); */
  }, [containerSize]);
};
