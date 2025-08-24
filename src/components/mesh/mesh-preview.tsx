"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMeshStore } from "@/store/store-mesh";
import {
  generateNoisePngDataUri,
  svgDataUrl,
  svgStringFromState,
} from "@/lib/mesh-svg";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { IconLoader } from "@intentui/icons";
import { Loader } from "../ui/loader";
import { MeshExports } from "./mesh-exports";
import { MeshActions } from "./mesh-actions";

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

  const noise = useMemo(() => generateNoisePngDataUri(64, 0.35), []);
  const svg = useMemo(
    () =>
      svgStringFromState({
        canvas,
        shapes,
        palette,
        filters,
        noiseDataUri: noise,
      }),
    [canvas, shapes, palette, filters, noise]
  );

  // Container/outer frame refs
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const contentGroupRef = useRef<SVGGElement>(null);

  // Figma-like frame state: position and size of the preview card
  const [frame, setFrame] = useState(() => ({
    x: 0,
    y: 0,
    width: ui.frameWidth ?? canvas.width,
    height: ui.frameHeight ?? canvas.height,
  }));
  // rotation disabled
  const frameRef = useRef(frame);

  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  // Inner is 1:1; we map screen -> SVG using getScreenCTM

  // Center frame in container on mount
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    setFrame((f) => ({
      width: f.width,
      height: f.height,
      x: Math.max(0, Math.round((rect.width - f.width) / 2)),
      y: Math.max(0, Math.round((rect.height - f.height) / 2)),
    }));
    // initialize from UI once
    if (ui.frameWidth || ui.frameHeight) {
      setFrame((f) => ({
        ...f,
        width: ui.frameWidth ?? f.width,
        height: ui.frameHeight ?? f.height,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Do not continuously sync frame size to store to avoid loops; we push size on resize end.

  // Apply sidebar size changes immediately to frame (and clamp to container)
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    setFrame((f) => {
      const nextW = ui.frameWidth ?? f.width;
      const nextH = ui.frameHeight ?? f.height;
      if (nextW === f.width && nextH === f.height) return f;
      const w = Math.max(50, Math.min(Math.floor(rect.width), nextW));
      const h = Math.max(50, Math.min(Math.floor(rect.height), nextH));
      let x = f.x;
      let y = f.y;
      // keep frame centered when only size changes from sidebar
      x = Math.max(
        0,
        Math.min(
          Math.round(f.x + (f.width - w) / 2),
          Math.floor(rect.width - w)
        )
      );
      y = Math.max(
        0,
        Math.min(
          Math.round(f.y + (f.height - h) / 2),
          Math.floor(rect.height - h)
        )
      );
      return { x, y, width: w, height: h };
    });
  }, [ui.frameWidth, ui.frameHeight]);

  // Zoom the outer frame (cmd/ctrl + wheel) from container; svg is not directly scaled
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const crect = c.getBoundingClientRect();
      const ax = e.clientX - crect.left;
      const ay = e.clientY - crect.top;
      setFrame((f) => {
        const rx = (ax - f.x) / f.width;
        const ry = (ay - f.y) / f.height;
        const minW = 100;
        const minH = 80;
        const sMin = Math.max(minW / f.width, minH / f.height);
        const sMax = Math.min(crect.width / f.width, crect.height / f.height);
        const sCandidate = factor;
        const s = Math.max(sMin, Math.min(sMax, sCandidate));
        // If scale would not change (at limits), do nothing
        if (Math.abs(s - 1) < 1e-3) return f;
        const newW = f.width * s;
        const newH = f.height * s;
        let nx = Math.round(ax - rx * newW);
        let ny = Math.round(ay - ry * newH);
        nx = Math.min(Math.max(nx, 0), Math.floor(crect.width - newW));
        ny = Math.min(Math.max(ny, 0), Math.floor(crect.height - newH));
        return {
          x: nx,
          y: ny,
          width: Math.round(newW),
          height: Math.round(newH),
        };
      });
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: MouseEvent) => {
      if ((e.buttons & 1) !== 1) return;
      const target = e.target as Element;
      if (
        target.closest("[data-resize]") ||
        target.closest('[data-handle="true"]')
      )
        return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const c = containerRef.current;
      if (!c) return;
      const crect = c.getBoundingClientRect();
      setFrame((f) => {
        let nx = f.x + dx;
        let ny = f.y + dy;
        nx = Math.min(Math.max(nx, 0), Math.floor(crect.width - f.width));
        ny = Math.min(Math.max(ny, 0), Math.floor(crect.height - f.height));
        return { ...f, x: nx, y: ny };
      });
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => (dragging = false);
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    const el = outerRef.current;
    const c = containerRef.current;
    if (!el || !c) return;
    let resizing = false;
    let handle: string | null = null;
    let startX = 0;
    let startY = 0;
    let start = { x: 0, y: 0, w: 0, h: 0, ar: 1 };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Element;
      const h = target.closest("[data-resize]") as HTMLElement | null;
      if (!h) return;
      e.preventDefault();
      resizing = true;
      handle = h.getAttribute("data-resize");
      startX = e.clientX;
      startY = e.clientY;
      const curr = frameRef.current;
      start = {
        x: curr.x,
        y: curr.y,
        w: curr.width,
        h: curr.height,
        ar: Math.max(0.01, curr.width / curr.height),
      };
    };
    const onMove = (e: MouseEvent) => {
      if (!resizing || !handle) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const crect = c.getBoundingClientRect();
      setFrame((_f) => {
        let x = start.x;
        let y = start.y;
        let w = start.w;
        let h = start.h;
        const isN = handle!.includes("n");
        const isS = handle!.includes("s");
        const isE = handle!.includes("e");
        const isW = handle!.includes("w");
        if (isE) w = start.w + dx;
        if (isS) h = start.h + dy;
        if (isW) {
          const nw = start.w - dx;
          x = start.x + (start.w - nw);
          w = nw;
        }
        if (isN) {
          const nh = start.h - dy;
          y = start.y + (start.h - nh);
          h = nh;
        }
        // Aspect ratio lock with Shift
        if (e.shiftKey) {
          const ar = start.ar;
          if ((isE || isW) && !(isN || isS)) {
            // side resize horizontally: adjust height, keep center vertically
            h = w / ar;
            y = start.y + (start.h - h) / 2;
          } else if ((isN || isS) && !(isE || isW)) {
            // side resize vertically: adjust width, keep center horizontally
            w = h * ar;
            x = start.x + (start.w - w) / 2;
          } else {
            // corner handles
            const wFromH = h * ar;
            const hFromW = w / ar;
            if (Math.abs(w - start.w) > Math.abs(h - start.h)) {
              // follow width, derive height
              h = hFromW;
            } else {
              // follow height, derive width
              w = wFromH;
            }
            if (isW) x = start.x + (start.w - w);
            if (isN) y = start.y + (start.h - h);
          }
        }
        // Clamp sizes
        const minW = 50;
        const minH = 50;
        const maxW = Math.floor(crect.width);
        const maxH = Math.floor(crect.height);
        w = Math.max(minW, Math.min(maxW, w));
        h = Math.max(minH, Math.min(maxH, h));
        // Clamp position so frame stays within container
        x = Math.min(Math.max(x, 0), Math.floor(crect.width - w));
        y = Math.min(Math.max(y, 0), Math.floor(crect.height - h));
        return {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(w),
          height: Math.round(h),
        };
      });
    };
    const onUp = () => {
      resizing = false;
      handle = null;
    };
    const onUpCommit = () => {
      const curr = frameRef.current;
      setUi({ frameWidth: curr.width, frameHeight: curr.height });
    };
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseup", onUpCommit);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseup", onUpCommit);
    };
  }, []);

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
                  href={svgDataUrl(svg)}
                  x={0}
                  y={0}
                  width={canvas.width}
                  height={canvas.height}
                  preserveAspectRatio="none"
                />
              </g>

              {/* Vertices overlay: not clipped and constant on-screen size */}
              {ui.showVertices &&
                (() => {
                  const scaleX = frame.width / canvas.width;
                  const scaleY = frame.height / canvas.height;
                  return shapes.map((s) => (
                    <g key={s.id}>
                      {s.points.map((p, idx) => (
                        <g
                          key={idx}
                          transform={`translate(${p.x} ${p.y}) scale(${
                            1 / scaleX
                          } ${1 / scaleY})`}
                          data-handle="true"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedShape(s.id);
                            const startPoint = { x: p.x, y: p.y };
                            const group = contentGroupRef.current;
                            const ctm = group?.getScreenCTM()?.inverse();
                            if (!ctm) return;
                            const toSvg = (
                              clientX: number,
                              clientY: number
                            ) => {
                              const pt = new DOMPoint(clientX, clientY);
                              const sp = pt.matrixTransform(ctm);
                              return { x: sp.x, y: sp.y };
                            };
                            const start = toSvg(e.clientX, e.clientY);
                            const move = (ev: MouseEvent) => {
                              const curr = toSvg(ev.clientX, ev.clientY);
                              const dx = curr.x - start.x;
                              const dy = curr.y - start.y;
                              updateShape(s.id, (old) => {
                                const np = [...old.points];
                                np[idx] = {
                                  x: startPoint.x + dx,
                                  y: startPoint.y + dy,
                                };
                                return { ...old, points: np };
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
                  ));
                })()}

              {/* Centers overlay: not clipped and constant on-screen size */}
              {ui.showCenters &&
                (() => {
                  const scaleX = frame.width / canvas.width;
                  const scaleY = frame.height / canvas.height;
                  return shapes.map((s) => {
                    const cx =
                      s.points.reduce((a, b) => a + b.x, 0) / s.points.length;
                    const cy =
                      s.points.reduce((a, b) => a + b.y, 0) / s.points.length;
                    return (
                      <g key={`${s.id}-center-overlay`}>
                        <g
                          transform={`translate(${cx} ${cy}) scale(${
                            1 / scaleX
                          } ${1 / scaleY})`}
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
                              const group = contentGroupRef.current;
                              const ctm = group?.getScreenCTM()?.inverse();
                              if (!ctm) return;
                              const toSvg = (
                                clientX: number,
                                clientY: number
                              ) => {
                                const pt = new DOMPoint(clientX, clientY);
                                const sp = pt.matrixTransform(ctm);
                                return { x: sp.x, y: sp.y };
                              };
                              const start = toSvg(e.clientX, e.clientY);
                              const startPoints = s.points.map((pt) => ({
                                ...pt,
                              }));
                              const move = (ev: MouseEvent) => {
                                const curr = toSvg(ev.clientX, ev.clientY);
                                const dx = curr.x - start.x;
                                const dy = curr.y - start.y;
                                updateShape(s.id, (old) => ({
                                  ...old,
                                  points: startPoints.map((pt) => ({
                                    x: pt.x + dx,
                                    y: pt.y + dy,
                                  })),
                                }));
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
                    );
                  });
                })()}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
