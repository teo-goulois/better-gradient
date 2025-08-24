import { memo, useRef } from "react";
import type { BlobShape, Point } from "@/store/store-mesh";

type Props = {
  shapes: BlobShape[];
  scale: { x: number; y: number };
  contentRef: React.RefObject<HTMLDivElement | null>;
  onBeginDragVertex: (shapeId: string) => void;
  onUpdateVertex: (shapeId: string, vertexIndex: number, point: Point) => void;
};

export const VerticesOverlay = memo(function VerticesOverlay({
  shapes,
  scale,
  contentRef,
  onBeginDragVertex,
  onUpdateVertex,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
      {shapes.map((s) => (
        <div key={s.id} className="contents">
          {s.points.map((p, idx) => {
            const left = p.x * scale.x;
            const top = p.y * scale.y;
            return (
              <div
                key={idx}
                data-handle="true"
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-white"
                style={{
                  left,
                  top,
                  width: 16,
                  height: 16,
                  cursor: "grab",
                  pointerEvents: "auto",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onBeginDragVertex(s.id);
                  const startPoint = { x: p.x, y: p.y };
                  const toContent = (clientX: number, clientY: number) => {
                    const rect = contentRef.current?.getBoundingClientRect();
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
      ))}
    </div>
  );
});
