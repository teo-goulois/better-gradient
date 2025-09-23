"use client";

import { useContainerSize } from "@/hooks/mesh/use-container-size";
import { useFrameOnMount } from "@/hooks/mesh/use-frame-on-mount";
import { useMeshDrawing } from "@/hooks/mesh/use-mesh-drawing";
import { useMeshFrame } from "@/hooks/mesh/use-mesh-frame";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useMeshStore } from "@/store/store-mesh";
import { useCallback, useRef } from "react";
import { SharedFeedback } from "../shared/shared-feedback";
import { Loader } from "../ui/loader";
import { useFrameContext } from "./frame/frame-context";
import { MeshActions } from "./mesh-actions";
// import { MeshDevtools } from "./mesh-devtools";
import { MeshExports } from "./mesh-exports";
import { MeshUndo } from "./mesh-undo";
import { CentersOverlay } from "./overlays/CentersOverlay";
import { VerticesOverlay } from "./overlays/VerticesOverlay";

export const MeshPreview = () => {
  const isMounted = useIsMounted();
  const ui = useMeshStore((s) => s.ui);
  const shapes = useMeshStore((s) => s.shapes);
  const palette = useMeshStore((s) => s.palette);
  const updateShape = useMeshStore((s) => s.updateShape);
  const setSelectedShape = useMeshStore((s) => s.setSelectedShape);
  const setShapes = useMeshStore((s) => s.setShapes);
  const moveShapeUp = useMeshStore((s) => s.moveShapeUp);
  const moveShapeDown = useMeshStore((s) => s.moveShapeDown);

  const { frame } = useFrameContext();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
  }, []);

  useContainerSize(containerRef);
  useFrameOnMount();
  useMeshFrame({ outerRef, containerRef });
  const { canvas } = useMeshDrawing({ canvasRef });

  return (
    <div className="w-full h-screen px-6 py-4 relative">
      {!isMounted && <MeshPreviewLoader />}
      {/* <MeshDevtools /> */}
      <div className="w-full h-full relative" ref={setContainerRef}>
        <MeshExports outerRef={outerRef} contentRef={contentRef} />
        <MeshActions />
        <SharedFeedback />
        <MeshUndo />

        <div
          id="mesh-preview-wrapper"
          ref={outerRef}
          className="rounded-2xl shadow-xl p-1 overflow-visible bg-white flex items-center justify-center select-none"
          style={{
            position: "absolute",
            top: frame?.y,
            left: frame?.x,
            width: frame?.width,
            height: frame?.height,
          }}
        >
          {/* Content clip to apply border radius only to the preview content */}
          <div
            ref={contentRef}
            id="content-clip"
            className="absolute inset-0 p-1 rounded-2xl overflow-hidden"
          >
            <canvas
              className="rounded-xl"
              ref={canvasRef}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </div>

          {ui.showVertices && frame?.width && frame?.height && (
            <VerticesOverlay
              shapes={shapes}
              scale={{
                x: frame.width / canvas.width,
                y: frame.height / canvas.height,
              }}
              contentRef={contentRef}
              palette={palette}
              onBeginDragVertex={(shapeId) => setSelectedShape(shapeId)}
              onUpdateVertex={(shapeId, vertexIndex, point) =>
                updateShape(shapeId, (old) => {
                  const np = [...old.points];
                  np[vertexIndex] = point;
                  return { ...old, points: np };
                })
              }
            />
          )}

          {ui.showCenters && frame?.width && frame?.height && (
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
                  shapes.map((s) =>
                    s.id === shapeId ? { ...s, fillIndex } : s
                  )
                );
              }}
              onDragShape={(shapeId, dx, dy) =>
                updateShape(shapeId, (old) => ({
                  ...old,
                  points: old.points.map((pt) => ({
                    x: pt.x + dx,
                    y: pt.y + dy,
                  })),
                }))
              }
              onMoveShapeUp={moveShapeUp}
              onMoveShapeDown={moveShapeDown}
              onSetShapeOpacity={(shapeId, opacity) =>
                updateShape(shapeId, (old) => ({ ...old, opacity }))
              }
              onScaleShape={(shapeId, factor) =>
                updateShape(shapeId, (old) => {
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
            />
          )}
          {/* <ResizeHandles /> */}
        </div>
      </div>
    </div>
  );
};

const MeshPreviewLoader = () => {
  return (
    <div className="w-full h-screen flex justify-center items-center absolute inset-0 bg-transparent">
      <Loader size="lg" />
    </div>
  );
};

const ResizeHandles = () => {
  return (
    <>
      {/* Resize handles */}
      <div
        data-resize="n"
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-2.5 cursor-n-resize"
      />
      <div
        data-resize="s"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full h-2.5 cursor-s-resize"
      />
      <div
        data-resize="e"
        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2.5 h-full cursor-e-resize"
      />
      <div
        data-resize="w"
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-full cursor-w-resize"
      />
      <div
        data-resize="ne"
        className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 size-4 cursor-ne-resize"
      />
      <div
        data-resize="nw"
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 size-4 cursor-nw-resize"
      />
      <div
        data-resize="se"
        className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 size-4 cursor-se-resize"
      />
      <div
        data-resize="sw"
        className="absolute left-0 bottom-0 -translate-x-1/2 translate-y-1/2 size-4 cursor-sw-resize"
      />
    </>
  );
};
