"use client";

import { useContainerSize } from "@/hooks/mesh/use-container-size";
import { useFrameOnMount } from "@/hooks/mesh/use-frame-on-mount";
import { useMeshDrawing } from "@/hooks/mesh/use-mesh-drawing";
import { useMeshFrame } from "@/hooks/mesh/use-mesh-frame";
import { useIsMounted } from "@/hooks/use-is-mounted";
import {
  makeCirclePoints,
  makeDiamondPoints,
  makeRandomBlobPoints,
  makeSquarePoints,
} from "@/lib/utils/utils.mesh";
import { useMeshStore } from "@/store/store-mesh";
import { useCallback, useRef, useState } from "react";
import { SharedFeedback } from "../shared/shared-feedback";
import { ContextMenu } from "../ui/context-menu";
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
  const removeShape = useMeshStore((s) => s.removeShape);

  const { frame } = useFrameContext();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const addShapeFromPoints = useMeshStore((s) => s.addShapeFromPoints);
  const canvasSettings = useMeshStore((s) => s.canvas);

  const [lastRightClick, setLastRightClick] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const toCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = contentRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const scaleX = (frame?.width ?? rect.width) / canvasSettings.width;
      const scaleY = (frame?.height ?? rect.height) / canvasSettings.height;
      return {
        x: (clientX - rect.left) / scaleX,
        y: (clientY - rect.top) / scaleY,
      };
    },
    [frame, canvasSettings.width, canvasSettings.height]
  );

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
  }, []);

  useContainerSize(containerRef);
  useFrameOnMount();
  useMeshFrame({ outerRef, containerRef });
  const { canvas } = useMeshDrawing({ canvasRef });

  // no-op

  return (
    <div className="w-full h-screen px-6 py-4 relative">
      {!isMounted && <MeshPreviewLoader />}
      {/* <MeshDevtools /> */}
      <ContextMenu>
        <div className="w-full h-full relative" ref={setContainerRef}>
          <MeshExports outerRef={outerRef} contentRef={contentRef} />
          <MeshActions />
          <SharedFeedback />
          <MeshUndo />

          <ContextMenu.Trigger
            onContextMenu={(e) => {
              e.preventDefault();
              const pt = toCanvasCoords(e.clientX, e.clientY);
              setLastRightClick(pt);
            }}
            className="absolute inset-0  "
            aria-label="Context anchor"
          />
          <ContextContent lastRightClick={lastRightClick} />

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
            {/* <div
              ref={contentRef}
              id="content-clip"
              className="absolute inset-0 p-1 rounded-2xl overflow-hidden z-0"
            >
              <canvas
                className="rounded-xl"
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div> */}
            <ContextMenu>
              <ContextMenu.Trigger
                className="absolute inset-0 p-1 rounded-2xl overflow-hidden"
                onContextMenu={(e) => {
                  const pt = toCanvasCoords(e.clientX, e.clientY);
                  setLastRightClick(pt);
                }}
              >
                <div
                  ref={contentRef}
                  id="content-clip"
                  className="w-full h-full"
                >
                  <canvas
                    className="rounded-xl"
                    ref={canvasRef}
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                </div>
              </ContextMenu.Trigger>
              <ContextContent lastRightClick={lastRightClick} />
            </ContextMenu>

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
                      old.points.reduce((a, b) => a + b.x, 0) /
                      old.points.length;
                    const cy =
                      old.points.reduce((a, b) => a + b.y, 0) /
                      old.points.length;
                    const scaled = old.points.map((p) => ({
                      x: cx + (p.x - cx) * factor,
                      y: cy + (p.y - cy) * factor,
                    }));
                    return { ...old, points: scaled };
                  })
                }
                onRemoveShape={(shapeId) => removeShape(shapeId)}
              />
            )}
            {/* <ResizeHandles /> */}
            {/* Hidden trigger anchoring the context menu at container's top-left */}
          </div>
          {/* Close container div */}
        </div>
      </ContextMenu>
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

//

const ContextContent = ({
  lastRightClick,
}: {
  lastRightClick: { x: number; y: number } | null;
}) => {
  const setShapes = useMeshStore((s) => s.setShapes);
  const canvasSettings = useMeshStore((s) => s.canvas);
  const addShapeFromPoints = useMeshStore((s) => s.addShapeFromPoints);

  return (
    <ContextMenu.Content
      aria-label="Context menu content"
      onAction={(key) => {
        const k = String(key);
        if (k === "remove-all") {
          setShapes([]);
          return;
        }
        if (!lastRightClick) return;
        const center = lastRightClick;
        const base =
          Math.min(canvasSettings.width, canvasSettings.height) * 0.3;
        if (k === "point-random") {
          const pts = makeRandomBlobPoints(
            `${Date.now()}`,
            canvasSettings,
            center
          );
          addShapeFromPoints(pts);
        } else if (k === "shape-circle") {
          addShapeFromPoints(makeCirclePoints(center, base, 24));
        } else if (k === "shape-square") {
          addShapeFromPoints(makeSquarePoints(center, base));
        } else if (k === "shape-diamond") {
          addShapeFromPoints(makeDiamondPoints(center, base));
        }
      }}
    >
      <ContextMenu.Section title="Add at cursor">
        <ContextMenu.Item id="point-random">
          <ContextMenu.Label>Point (random)</ContextMenu.Label>
        </ContextMenu.Item>
        <ContextMenu.Item id="shape-circle">
          <ContextMenu.Label>Circle</ContextMenu.Label>
        </ContextMenu.Item>
        <ContextMenu.Item id="shape-square">
          <ContextMenu.Label>Square</ContextMenu.Label>
        </ContextMenu.Item>
        <ContextMenu.Item id="shape-diamond">
          <ContextMenu.Label>Diamond</ContextMenu.Label>
        </ContextMenu.Item>
      </ContextMenu.Section>
      <ContextMenu.Separator />
      <ContextMenu.Item id="remove-all">
        <ContextMenu.Label>Remove all shapes</ContextMenu.Label>
      </ContextMenu.Item>
    </ContextMenu.Content>
  );
};
