"use client";

import { useEffect, useRef } from "react";
import { useMeshStore } from "@/store/store-mesh";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { Loader } from "../ui/loader";
import { MeshExports } from "./mesh-exports";
import { MeshActions } from "./mesh-actions";
import { useMeshSvg } from "./hooks/use-mesh-svg";
import { useMeshFrame } from "./hooks/use-mesh-frame";
import { VerticesOverlay } from "./overlays/VerticesOverlay";
import { CentersOverlay } from "./overlays/CentersOverlay";
import { MeshUndo } from "./mesh-undo";

type MeshPreviewProps = {};

export const MeshPreview = ({}: MeshPreviewProps) => {
  const isMounted = useIsMounted();

  const shapes = useMeshStore((s) => s.shapes);
  const palette = useMeshStore((s) => s.palette);
  const filters = useMeshStore((s) => s.filters);
  const canvas = useMeshStore((s) => s.canvas);
  const ui = useMeshStore((s) => s.ui);
  const setUiFrameSize = useMeshStore((s) => s.setUiFrameSize);
  const updateShape = useMeshStore((s) => s.updateShape);
  const setSelectedShape = useMeshStore((s) => s.setSelectedShape);
  const setShapes = useMeshStore((s) => s.setShapes);
  const setUi = useMeshStore((s) => s.setUi);

  const { svgUrl } = useMeshSvg({ canvas, shapes, palette, filters });

  // Canvas + content refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const { containerRef, outerRef, frame } = useMeshFrame({
    initialSize: { width: canvas.width, height: canvas.height },
    uiSize: { width: ui.frameWidth, height: ui.frameHeight },
    onCommitSize: (size) => {
      setUiFrameSize({
        width: size.width,
        height: size.height,
      });
    },
    lockAspect: {
      locked: ui.maintainAspectRatio,
      aspectRatio:
        ui.aspectRatio ??
        (ui.frameWidth && ui.frameHeight
          ? ui.frameWidth / ui.frameHeight
          : canvas.width / canvas.height),
    },
    contentAspect:
      ui.aspectRatio ??
      (ui.frameWidth && ui.frameHeight
        ? ui.frameWidth / ui.frameHeight
        : canvas.width / canvas.height),
  });

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
  }, [svgUrl, canvas.width, canvas.height, canvasRef.current]);

  // update container size on resize
  useEffect(() => {
    let ro: ResizeObserver | undefined;
    let rafId = 0;
    const attach = () => {
      const c = containerRef.current;
      if (!c) {
        if (!rafId)
          console.log(
            "[useMeshFrame] container resize observer waiting for container..."
          );
        rafId = requestAnimationFrame(attach);
        return;
      }
      const onResize = () => {
        const rect = c.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        console.log("onResize", { w, h });
        setUi({
          containerWidth: w,
          containerHeight: h,
        });
      };
      ro = new ResizeObserver(onResize);
      ro.observe(c);
      // Fire once initially as well
      onResize();
    };
    attach();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [containerRef.current]);

  if (!isMounted)
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader size="lg" />
      </div>
    );

  return (
    <div className="w-full h-screen px-6 py-4 relative">
      <div className="w-full h-full relative" ref={containerRef}>
        <MeshExports outerRef={outerRef} contentRef={contentRef} />
        <MeshActions />
        <MeshUndo />
        <div
          id="mesh-preview-wrapper"
          ref={outerRef}
          className="rounded-2xl shadow-xl p-1 overflow-visible bg-white flex items-center justify-center select-none"
          style={{
            position: "absolute",
            top: frame.y,
            left: frame.x,
            width: frame.width,
            height: frame.height,
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

          {/* Overlays render as absolutely positioned divs over the content */}
          {ui.showVertices && (
            <VerticesOverlay
              shapes={shapes}
              scale={{
                x: frame.width / canvas.width,
                y: frame.height / canvas.height,
              }}
              contentRef={contentRef}
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

          {/* Centers overlay: not clipped and constant on-screen size */}
          {ui.showCenters && (
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
            />
          )}
          <ResizeHandles />
        </div>
      </div>
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
