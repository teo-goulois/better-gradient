"use client";

import { useMeshDrawing } from "@/hooks/mesh/use-mesh-drawing";
import { useMeshStore } from "@/store/store-mesh";
import { useFrameContext } from "../frame/frame-context";
import { CentersOverlay } from "../overlays/CentersOverlay";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

export const MeshPreviewCenterPoint = ({ canvasRef, contentRef }: Props) => {
  const ui = useMeshStore((s) => s.ui);
  const shapes = useMeshStore((s) => s.shapesLive ?? s.shapes);
  const palette = useMeshStore((s) => s.palette);
  const updateShapeLive = useMeshStore((s) => s.updateShapeLive);
  const beginShapesLive = useMeshStore((s) => s.beginShapesLive);
  const commitShapesLive = useMeshStore((s) => s.commitShapesLive);
  const moveShapeUp = useMeshStore((s) => s.moveShapeUp);
  const moveShapeDown = useMeshStore((s) => s.moveShapeDown);
  const removeShape = useMeshStore((s) => s.removeShape);
  const setShapes = useMeshStore((s) => s.setShapes);

  const { frame } = useFrameContext();
  const { canvas } = useMeshDrawing({ canvasRef });

  if (!(ui.showCenters && frame?.width && frame?.height)) {
    return null;
  }

  return (
    <CentersOverlay
      shapes={shapes}
      scale={{
        x: frame.width / canvas.width,
        y: frame.height / canvas.height,
      }}
      contentRef={contentRef}
      palette={palette}
      onSetShapeFillIndex={(shapeId, fillIndex) => {
        setShapes(
          (useMeshStore.getState().shapes ?? []).map((s) =>
            s.id === shapeId ? { ...s, fillIndex } : s
          )
        );
      }}
      onDragShape={(shapeId, dx, dy) => {
        // ensure live session
        if (!useMeshStore.getState().shapesLive) beginShapesLive();
        updateShapeLive(shapeId, (old) => ({
          ...old,
          points: old.points.map((pt) => ({
            x: pt.x + dx,
            y: pt.y + dy,
          })),
        }));
      }}
      onEndDragShape={() => {
        commitShapesLive({ history: "push" });
      }}
      onMoveShapeUp={moveShapeUp}
      onMoveShapeDown={moveShapeDown}
      onSetShapeOpacity={(shapeId, opacity) => {
        if (!useMeshStore.getState().shapesLive) beginShapesLive();
        updateShapeLive(shapeId, (old) => ({ ...old, opacity }));
      }}
      onSetShapeBlur={(shapeId, blur) => {
        if (!useMeshStore.getState().shapesLive) beginShapesLive();
        updateShapeLive(shapeId, (old) => ({ ...old, blur }));
      }}
      onScaleShape={(shapeId, factor) =>
        updateShapeLive(shapeId, (old) => {
          // Scale points around the centroid
          const cx =
            old.points.reduce((a, b) => a + b.x, 0) / old.points.length;
          const cy =
            old.points.reduce((a, b) => a + b.y, 0) / old.points.length;
          const scaled = old.points.map((p) => ({
            x: cx + (p.x - cx) * factor,
            y: cy + (p.y - cy) * factor,
          }));
          return { ...old, points: scaled };
        })
      }
      onRemoveShape={(shapeId) => removeShape(shapeId)}
    />
  );
};
