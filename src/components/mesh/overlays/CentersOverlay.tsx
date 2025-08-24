import { memo, useMemo, useRef } from "react";
import type { BlobShape } from "@/store/store-mesh";

type Props = {
  shapes: BlobShape[];
  scale: { x: number; y: number };
  onDragShape: (shapeId: string, dx: number, dy: number) => void;
};

export const CentersOverlay = memo(function CentersOverlay({
  shapes,
  scale,
  onDragShape,
}: Props) {
  const groupRef = useRef<SVGGElement>(null);
  const centers = useMemo(() => {
    return shapes.map((s) => ({
      id: s.id,
      cx: s.points.reduce((a, b) => a + b.x, 0) / s.points.length,
      cy: s.points.reduce((a, b) => a + b.y, 0) / s.points.length,
    }));
  }, [shapes]);

  return (
    <g ref={groupRef}>
      {centers.map(({ id, cx, cy }) => (
        <g key={`${id}-center-overlay`}>
          <g
            transform={`translate(${cx} ${cy}) scale(${1 / scale.x} ${
              1 / scale.y
            })`}
          >
            <circle
              cx={0}
              cy={0}
              r={9}
              fill="rgba(255,255,255,0.9)"
              stroke="black"
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
              style={{ cursor: "move" }}
              data-handle="true"
              onMouseDown={(e) => {
                e.preventDefault();
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
                  onDragShape(id, curr.x - start.x, curr.y - start.y);
                };
                const up = () => {
                  window.removeEventListener("mousemove", move);
                  window.removeEventListener("mouseup", up);
                };
                window.addEventListener("mousemove", move);
                window.addEventListener("mouseup", up);
              }}
            />
          </g>
          <line
            x1={cx - 10}
            x2={cx + 10}
            y1={cy}
            y2={cy}
            stroke="black"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={cx}
            x2={cx}
            y1={cy - 10}
            y2={cy + 10}
            stroke="black"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </g>
  );
});
