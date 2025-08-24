import { memo, useMemo, useRef, useState, useEffect } from "react";
import type { BlobShape, RgbHex } from "@/store/store-mesh";

type Props = {
  shapes: BlobShape[];
  scale: { x: number; y: number };
  contentRef: React.RefObject<HTMLDivElement | null>;
  onDragShape: (shapeId: string, dx: number, dy: number) => void;
  palette: RgbHex[];
  onSetShapeFillIndex: (shapeId: string, fillIndex: number) => void;
};

export const CentersOverlay = memo(function CentersOverlay({
  shapes,
  scale,
  contentRef,
  onDragShape,
  palette,
  onSetShapeFillIndex,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const close = () => {
      setMenuFor(null);
      setIsDragging(false);
    };
    if (menuFor) window.addEventListener("click", close, { once: true });
    return () => window.removeEventListener("click", close);
  }, [menuFor, isDragging]);

  const centers = useMemo(() => {
    return shapes.map((s) => ({
      id: s.id,
      cx: s.points.reduce((a, b) => a + b.x, 0) / s.points.length,
      cy: s.points.reduce((a, b) => a + b.y, 0) / s.points.length,
      fillIndex: s.fillIndex,
    }));
  }, [shapes]);

  return (
    <div
      ref={overlayRef}
      id="centers-overlay"
      className="absolute inset-0 pointer-events-none"
    >
      {centers.map(({ id, cx, cy, fillIndex }) => {
        const left = cx * scale.x;
        const top = cy * scale.y;
        const color = palette[fillIndex] ?? palette[0] ?? "#000000";
        return (
          <div
            data-is-dragging={isDragging}
            key={`${id}-center-overlay`}
            className="absolute"
            style={{ left, top }}
          >
            {/* Crosshair lines */}
            <div
              className="absolute bg-black"
              style={{
                left: -10,
                top: 0,
                width: 20,
                height: 1,
                transform: "translateY(-0.5px)",
              }}
            />
            <div
              className="absolute bg-black"
              style={{
                left: 0,
                top: -10,
                width: 1,
                height: 20,
                transform: "translateX(-0.5px)",
              }}
            />
            {/* Draggable center handle */}
            <div
              data-handle="true"
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
              style={{
                width: 18,
                height: 18,
                background: color.color,
                cursor: "move",
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                const toContent = (clientX: number, clientY: number) => {
                  const rect = contentRef.current?.getBoundingClientRect();
                  if (!rect) return { x: 0, y: 0 };
                  return {
                    x: (clientX - rect.left) / scale.x,
                    y: (clientY - rect.top) / scale.y,
                  };
                };
                let prev = toContent(e.clientX, e.clientY);
                const move = (ev: MouseEvent) => {
                  const curr = toContent(ev.clientX, ev.clientY);
                  setIsDragging(true);
                  onDragShape(id, curr.x - prev.x, curr.y - prev.y);
                  prev = curr;
                };
                const up = () => {
                  window.removeEventListener("mousemove", move);
                  window.removeEventListener("mouseup", up);
                  setIsDragging(false);
                };
                window.addEventListener("mousemove", move);
                window.addEventListener("mouseup", up);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuFor(id);
              }}
            />
            {menuFor === id && (
              <div
                className="absolute left-3 top-3 p-1 rounded-md shadow-md bg-white border pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex gap-1">
                  {palette.map((c: RgbHex, i: number) => (
                    <button
                      key={i}
                      className="size-5 rounded-full border"
                      style={{
                        background: c.color,
                        borderColor: "rgba(0,0,0,0.2)",
                      }}
                      onClick={() => {
                        onSetShapeFillIndex(id, i);
                        setMenuFor(null);
                      }}
                      title={c.color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
