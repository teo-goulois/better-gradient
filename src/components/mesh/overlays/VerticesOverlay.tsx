import type { BlobShape, Point, RgbHex } from "@/types/types.mesh";
import { memo, useRef } from "react";

type Props = {
  shapes: BlobShape[];
  scale: { x: number; y: number };
  contentRef: React.RefObject<HTMLDivElement | null>;
  palette: RgbHex[];
  onBeginDragVertex: (shapeId: string) => void;
  onUpdateVertex: (shapeId: string, vertexIndex: number, point: Point) => void;
};

export const VerticesOverlay = memo(function VerticesOverlay({
  shapes,
  scale,
  contentRef,
  palette,
  onBeginDragVertex,
  onUpdateVertex,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Connecting lines between vertices - positioned to avoid clipping */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <title>Vertices Overlay</title>

        <defs>
          <filter id="smallShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow
              dx="1"
              dy="1"
              stdDeviation=".5"
              floodColor="black"
              floodOpacity="0.1"
            />
          </filter>
        </defs>

        {shapes.map((s) => {
          const shapeColor =
            palette[s.fillIndex]?.color || palette[0]?.color || "#000000";
          return s.points.map((p, idx) => {
            const nextIdx = (idx + 1) % s.points.length;
            const nextP = s.points[nextIdx];
            return (
              <line
                key={`${s.id}-line-${idx}`}
                x1={p.x * scale.x}
                y1={p.y * scale.y}
                x2={nextP.x * scale.x}
                y2={nextP.y * scale.y}
                stroke={shapeColor}
                strokeWidth="2"
                strokeOpacity="1"
                strokeDasharray="3 3"
                filter="url(#smallShadow)"
              />
            );
          });
        })}
      </svg>
      {/* Vertex points */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none shadow"
      >
        {shapes.map((s) => {
          const shapeColor =
            palette[s.fillIndex]?.color || palette[0]?.color || "#000000";
          return (
            <div key={s.id} className="contents shadow">
              {s.points.map((p, idx) => {
                const left = p.x * scale.x;
                const top = p.y * scale.y;
                return (
                  <div
                    key={`${s.id}-vertex-${idx}`}
                    data-handle="true"
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md overflow-hidden"
                    style={{
                      left,
                      top,
                      width: 16,
                      height: 16,
                      cursor: "grab",
                      pointerEvents: "auto",
                      border: `2px solid ${shapeColor}`,
                      //boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.8)",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onBeginDragVertex(s.id);
                      const startPoint = { x: p.x, y: p.y };
                      const toContent = (clientX: number, clientY: number) => {
                        const rect =
                          contentRef.current?.getBoundingClientRect();
                        if (!rect) return { x: 0, y: 0 };
                        return {
                          x: (clientX - rect.left) / scale.x,
                          y: (clientY - rect.top) / scale.y,
                        };
                      };
                      let prev = toContent(e.clientX, e.clientY);
                      let acc = { ...startPoint };
                      const move = (ev: MouseEvent) => {
                        const curr = toContent(ev.clientX, ev.clientY);
                        const dx = curr.x - prev.x;
                        const dy = curr.y - prev.y;
                        acc = { x: acc.x + dx, y: acc.y + dy };
                        prev = curr;
                        onUpdateVertex(s.id, idx, acc);
                      };
                      const up = () => {
                        window.removeEventListener("mousemove", move);
                        window.removeEventListener("mouseup", up);
                      };
                      window.addEventListener("mousemove", move);
                      window.addEventListener("mouseup", up);
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
});
