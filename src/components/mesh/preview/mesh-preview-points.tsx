"use client";

import { MeshPreviewCenterPoint } from "./mesh-preview-center-point";
import { MeshPreviewVerticesPoints } from "./mesh-preview-vertices-points";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};
export const MeshPreviewPoints = ({ canvasRef, contentRef }: Props) => {
  return (
    <>
      <MeshPreviewVerticesPoints
        canvasRef={canvasRef}
        contentRef={contentRef}
      />
      <MeshPreviewCenterPoint canvasRef={canvasRef} contentRef={contentRef} />
    </>
  );
};
