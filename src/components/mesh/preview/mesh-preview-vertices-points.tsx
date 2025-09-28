"use client";

import { useMeshDrawing } from "@/hooks/mesh/use-mesh-drawing";
import { useMeshStore } from "@/store/store-mesh";
import { useFrameContext } from "../frame/frame-context";
import { VerticesOverlay } from "../overlays/VerticesOverlay";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

export const MeshPreviewVerticesPoints = ({ canvasRef, contentRef }: Props) => {
  const ui = useMeshStore((s) => s.ui);
  const shapes = useMeshStore((s) => s.shapesLive ?? s.shapes);
  const palette = useMeshStore((s) => s.palette);
  const updateShapeLive = useMeshStore((s) => s.updateShapeLive);
  const setSelectedShape = useMeshStore((s) => s.setSelectedShape);
  const beginShapesLive = useMeshStore((s) => s.beginShapesLive);
  const commitShapesLive = useMeshStore((s) => s.commitShapesLive);

  const { frame } = useFrameContext();
  const { canvas } = useMeshDrawing({ canvasRef });

  if (!(ui.showVertices && frame?.width && frame?.height)) {
    return null;
  }
  return (
    <VerticesOverlay
      shapes={shapes}
      scale={{
        x: frame.width / canvas.width,
        y: frame.height / canvas.height,
      }}
      contentRef={contentRef}
      palette={palette}
      onBeginDragVertex={(shapeId) => {
        setSelectedShape(shapeId);
        beginShapesLive();
      }}
      onUpdateVertex={(shapeId, vertexIndex, point) =>
        updateShapeLive(shapeId, (old) => {
          const np = [...old.points];
          np[vertexIndex] = point;
          return { ...old, points: np };
        })
      }
      onEndDragVertex={() => {
        commitShapesLive({ history: "replace" });
      }}
    />
  );
};
