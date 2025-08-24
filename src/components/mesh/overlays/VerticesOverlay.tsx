import { memo, useRef } from "react";
import type { BlobShape, Point } from "@/store/store-mesh";

type Props = {
  shapes: BlobShape[];
  scale: { x: number; y: number };
  onBeginDragVertex: (shapeId: string) => void;
  onUpdateVertex: (shapeId: string, vertexIndex: number, point: Point) => void;
};

// Handles are drawn in screen space via an inverse scale so they keep constant size.
export const VerticesOverlay = memo(function VerticesOverlay({
  shapes,
  scale,
  onBeginDragVertex,
  onUpdateVertex,
}: Props) {
  const groupRef = useRef<SVGGElement>(null);

  return (
    <g ref={groupRef}>
      {shapes.map((s) => (
        <g key={s.id}>
          {s.points.map((p, idx) => (
            <g
              key={idx}
              transform={`translate(${p.x} ${p.y}) scale(${1 / scale.x} ${
                1 / scale.y
              })`}
              data-handle="true"
              onMouseDown={(e) => {
                e.preventDefault();
                onBeginDragVertex(s.id);
                const startPoint = { x: p.x, y: p.y };
                const ctm = groupRef.current?.getScreenCTM()?.inverse();
                if (!ctm) return;
                const toSvg = (clientX: number, clientY: number) => {
                  const pt = new DOMPoint(clientX, clientY);
                  const sp = pt.matrixTransform(ctm);
                  return { x: sp.x, y: sp.y };
                };
                const start = toSvg(e.clientX, e.clientY);
                const move = (ev: MouseEvent) => {
                  const curr = toSvg(ev.clientX, ev.clientY);
                  const dx = curr.x - start.x;
                  const dy = curr.y - start.y;
                  onUpdateVertex(s.id, idx, {
                    x: startPoint.x + dx,
                    y: startPoint.y + dy,
                  });
                };
                const up = () => {
                  window.removeEventListener("mousemove", move);
                  window.removeEventListener("mouseup", up);
                };
                window.addEventListener("mousemove", move);
                window.addEventListener("mouseup", up);
              }}
              style={{ cursor: "grab" }}
            >
              <circle
                cx={0}
                cy={0}
                r={8}
                fill="white"
                stroke="black"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
});
