import { Button } from "@/components/ui/button";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { Label } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tooltip } from "@/components/ui/tooltip";
import { useMeshStore } from "@/store/store-mesh";
import type { BlobShape, RgbHex } from "@/types/types.mesh";
import { IconArrowDownFill, IconArrowUpFill, IconTrash } from "@intentui/icons";
import { memo, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  shapes: BlobShape[];
  scale: { x: number; y: number };
  contentRef: React.RefObject<HTMLDivElement | null>;
  onDragShape: (shapeId: string, dx: number, dy: number) => void;
  palette: RgbHex[];
  onSetShapeFillIndex: (shapeId: string, fillIndex: number) => void;
  onMoveShapeUp: (shapeId: string) => void;
  onMoveShapeDown: (shapeId: string) => void;
  onSetShapeOpacity: (shapeId: string, opacity: number) => void;
  onSetShapeBlur: (shapeId: string, blur: number) => void;
  onScaleShape: (shapeId: string, factor: number) => void;
  onRemoveShape: (shapeId: string) => void;
  onEndDragShape: () => void;
};

export const CentersOverlay = memo(function CentersOverlay({
  shapes,
  scale,
  contentRef,
  onDragShape,
  palette,
  onSetShapeFillIndex,
  onMoveShapeUp,
  onMoveShapeDown,
  onSetShapeOpacity,
  onScaleShape,
  onSetShapeBlur,
  onRemoveShape,
  onEndDragShape,
}: Props) {
  const filter = useMeshStore((state) => state.filters);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Track last spread percentage per-shape to apply delta scaling (avoid compounding)
  const lastSpreadByShapeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const close = () => {
      setMenuFor(null);
      setIsDragging(false);
    };
    if (menuFor) window.addEventListener("click", close, { once: true });
    return () => window.removeEventListener("click", close);
  }, [menuFor, isDragging]);

  const centers = useMemo(() => {
    return shapes.map((s) => {
      return {
        id: s.id,
        cx: s.points.reduce((a, b) => a + b.x, 0) / s.points.length,
        cy: s.points.reduce((a, b) => a + b.y, 0) / s.points.length,
        fillIndex: s.fillIndex,
        opacity: s.opacity ?? filter.opacity,
        blur: s.blur,
      };
    });
  }, [shapes, filter.opacity]);

  return (
    <div
      ref={overlayRef}
      id="centers-overlay"
      className="absolute inset-0 pointer-events-none"
    >
      {centers.map(({ id, cx, cy, fillIndex, opacity, blur }) => {
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
            {/* Draggable center handle */}
            <ColorSwatch
              data-handle="true"
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-md"
              color={color.color}
              style={{
                width: 18,
                height: 18,
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
                  onEndDragShape();
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
                className="absolute left-3 top-3 p-2 z-50 rounded-md shadow-md min-h-0 bg-white border pointer-events-auto "
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <div className="flex gap-1 items-center">
                  {/* Color palette */}
                  <div className="flex gap-1">
                    {palette.map((c: RgbHex, i: number) => (
                      <button
                        type="button"
                        key={c.color}
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
                  <Separator orientation="vertical" />

                  <Separator orientation="vertical" />
                  {/* Layer controls */}
                  <div className="flex gap-1 border-l  pl-2">
                    <Button
                      size="sq-xs"
                      intent="plain"
                      onPress={() => {
                        onMoveShapeDown(id);
                      }}
                      aria-label="Move layer up"
                    >
                      <IconArrowUpFill />
                    </Button>

                    <Button
                      size="sq-xs"
                      intent="plain"
                      onPress={() => {
                        onMoveShapeUp(id);
                      }}
                      aria-label="Move layer down"
                    >
                      <IconArrowDownFill />
                    </Button>
                    <div className="h-7 px-2 flex items-center justify-center ">
                      <span className="text-xs text-muted-fg font-semibold">
                        {centers.findIndex((c) => c.id === id) + 1}
                      </span>
                    </div>
                    <Tooltip>
                      <Button
                        intent="plain"
                        size="sq-xs"
                        onPress={() => {
                          onRemoveShape(id);
                          setMenuFor(null);
                        }}
                        className="data-hovered:text-danger transition-colors"
                        aria-label="Remove shape"
                      >
                        <IconTrash />
                      </Button>
                      <Tooltip.Content intent="inverse">
                        Remove shape
                      </Tooltip.Content>
                    </Tooltip>
                  </div>
                  <Separator orientation="vertical" />
                </div>
                <Separator orientation="horizontal" className="my-2" />
                <div className="space-y-2">
                  {/* Opacity */}
                  <div className="flex items-center gap-2 px-2 ">
                    <div className="flex items-center gap-2 w-full">
                      <Label>Opacity</Label>
                      <Slider
                        className="min-w-32 w-full flex-1"
                        output="tooltip"
                        aria-label="Opacity"
                        value={Math.round((opacity ?? 1) * 100)}
                        onChange={(v) => {
                          const value = typeof v === "number" ? v : v[0];
                          const next = Math.max(0, Math.min(100, value));
                          onSetShapeOpacity(id, next / 100);
                        }}
                        onChangeEnd={() => {
                          onEndDragShape();
                        }}
                      />
                    </div>
                  </div>
                  {/* Blur (per-shape) */}
                  <div className="flex items-center gap-2 px-2 ">
                    <div className="flex items-center gap-2 w-full">
                      <Label>Blur</Label>
                      <Slider
                        className="min-w-32 w-full flex-1"
                        output="tooltip"
                        aria-label="Blur"
                        value={Math.round(blur ?? filter.blur)}
                        minValue={0}
                        maxValue={175}
                        onChange={(v) => {
                          const value = typeof v === "number" ? v : v[0];
                          const next = Math.max(0, Math.min(175, value));
                          onSetShapeBlur(id, next);
                        }}
                        onChangeEnd={() => {
                          onEndDragShape();
                        }}
                      />
                    </div>
                  </div>
                  {/* Spread (per-shape) */}
                  <div className="flex items-center gap-2 px-2 ">
                    <div className="flex items-center gap-2 w-full">
                      <Label>Spread</Label>
                      <Slider
                        className="min-w-32 w-full flex-1"
                        output="tooltip"
                        aria-label="Spread"
                        value={lastSpreadByShapeRef.current[id] ?? 100}
                        minValue={25}
                        maxValue={200}
                        onChange={(v) => {
                          const raw = typeof v === "number" ? v : v[0];
                          const next = Math.max(1, Math.min(1000, raw));
                          const prev = lastSpreadByShapeRef.current[id] ?? 100;
                          const delta = next / prev;
                          if (delta !== 1) {
                            onScaleShape(id, delta);
                          }
                          lastSpreadByShapeRef.current[id] = next;
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
