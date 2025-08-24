"use client";

import { useRef } from "react";
import { useMeshStore } from "@/store/store-mesh";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { Loader } from "../ui/loader";
import { MeshExports } from "./mesh-exports";
import { MeshActions } from "./mesh-actions";
import { useMeshSvg } from "./hooks/use-mesh-svg";
import { useMeshFrame } from "./hooks/use-mesh-frame";
import { VerticesOverlay } from "./overlays/VerticesOverlay";
import { CentersOverlay } from "./overlays/CentersOverlay";

type Props = {};

export const MeshPreview = ({}: Props) => {
  const isMounted = useIsMounted();
  const shapes = useMeshStore((s) => s.shapes);
  const palette = useMeshStore((s) => s.palette);
  const filters = useMeshStore((s) => s.filters);
  const canvas = useMeshStore((s) => s.canvas);
  const ui = useMeshStore((s) => s.ui);
  const setUi = useMeshStore((s) => s.setUi);
  const updateShape = useMeshStore((s) => s.updateShape);
  const setSelectedShape = useMeshStore((s) => s.setSelectedShape);

  const { svgUrl } = useMeshSvg({ canvas, shapes, palette, filters });

  // Container/outer frame refs managed by hook
  const svgRef = useRef<SVGSVGElement>(null);
  const contentGroupRef = useRef<SVGGElement>(null);

  const { containerRef, outerRef, frame } = useMeshFrame({
    initialSize: { width: canvas.width, height: canvas.height },
    uiSize: { width: ui.frameWidth, height: ui.frameHeight },
    onCommitSize: (size) =>
      setUi({ frameWidth: size.width, frameHeight: size.height }),
  });

  // Inner is 1:1; we map screen -> SVG using getScreenCTM
  // Frame sizing and interactions handled by useMeshFrame

  // Frame size reacts to UI via useMeshFrame

  // Zoom handled by useMeshFrame

  // Drag handled by useMeshFrame

  // Resize handled by useMeshFrame

  // Rotation disabled; effect removed

  if (!isMounted)
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader size="lg" />
      </div>
    );

  return (
    <div className="w-full h-screen p-6 relative">
      <div className="w-full h-full relative" ref={containerRef}>
        <MeshExports />
        <MeshActions />
        <div
          id="mesh-preview-wrapper"
          ref={outerRef}
          className="rounded-2xl shadow-xl border overflow-visible bg-white flex items-center justify-center select-none"
          style={{
            position: "absolute",
            top: frame.y,
            left: frame.x,
            width: frame.width,
            height: frame.height,
          }}
        >
          {/* Resize handles */}
          <div
            data-resize="n"
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded bg-black/60 cursor-n-resize"
          />
          <div
            data-resize="s"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded bg-black/60 cursor-s-resize"
          />
          <div
            data-resize="e"
            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded bg-black/60 cursor-e-resize"
          />
          <div
            data-resize="w"
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded bg-black/60 cursor-w-resize"
          />
          <div
            data-resize="ne"
            className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded bg-black/60 cursor-ne-resize"
          />
          <div
            data-resize="nw"
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded bg-black/60 cursor-nw-resize"
          />
          <div
            data-resize="se"
            className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded bg-black/60 cursor-se-resize"
          />
          <div
            data-resize="sw"
            className="absolute left-0 bottom-0 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded bg-black/60 cursor-sw-resize"
          />
          <svg
            ref={svgRef}
            width={frame.width}
            height={frame.height}
            viewBox={`0 0 ${canvas.width} ${canvas.height}`}
            preserveAspectRatio="none"
            style={{ overflow: "visible", width: "100%", height: "100%" }}
          >
            {/* Clip background content to the canvas rect so only handles can overflow */}
            <defs>
              <clipPath id="frameClip">
                <rect x={0} y={0} width={canvas.width} height={canvas.height} />
              </clipPath>
            </defs>
            <g ref={contentGroupRef}>
              <g clipPath="url(#frameClip)">
                <image
                  href={svgUrl}
                  x={0}
                  y={0}
                  width={canvas.width}
                  height={canvas.height}
                  preserveAspectRatio="none"
                />
              </g>

              {ui.showVertices && (
                <VerticesOverlay
                  shapes={shapes}
                  scale={{
                    x: frame.width / canvas.width,
                    y: frame.height / canvas.height,
                  }}
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
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
