"use client";
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/mesh/sidebar/mesh-sidebar-disclosure";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_FILTERS } from "@/lib/config/config.mesh";
import { useMeshStore } from "@/store/store-mesh";
import { IconEyeDropper, IconRefresh } from "@intentui/icons";
import { useEffect, useRef, useState } from "react";

export const MeshSidebarFilter = () => {
  const filters = useMeshStore((state) => state.filters);
  const setFilters = useMeshStore((state) => state.setFilters);
  const shapes = useMeshStore((state) => state.shapes);
  const shapesLive = useMeshStore((state) => state.shapesLive);
  const beginShapesLive = useMeshStore((state) => state.beginShapesLive);
  const setShapesLive = useMeshStore((state) => state.setShapesLive);
  const commitShapesLive = useMeshStore((state) => state.commitShapesLive);

  // Global spread uses a local slider state; applying delta to avoid compounding from absolute values
  const [spreadPct, setSpreadPct] = useState<number>(100);
  const lastAppliedSpreadRef = useRef<number>(100);
  const commitAttachedRef = useRef<boolean>(false);
  const historySessionRef = useRef<boolean>(false);

  // Ensure we clean any pending handler on unmount
  useEffect(() => {
    return () => {
      commitAttachedRef.current = false;
    };
  }, []);

  return (
    <div>
      <Disclosure defaultExpanded>
        <DisclosureTrigger>
          <IconEyeDropper /> Filters
        </DisclosureTrigger>
        <DisclosurePanel>
          <Slider
            label="Blur"
            value={
              filters.blur ? Math.round(((filters.blur - 35) / 65) * 100) : 0
            }
            onChange={(v) => {
              const value = typeof v === "number" ? v : v[0];
              const mappedValue = value === 0 ? 35 : 35 + (value / 100) * 65;
              setFilters(
                { blur: mappedValue },
                { history: historySessionRef.current ? "replace" : "push" }
              );
              historySessionRef.current = true;
            }}
            onChangeEnd={() => {
              historySessionRef.current = false;
            }}
          />
          <Slider
            label="Grain"
            value={(filters.grain ?? 0) * 100}
            onChange={(v) => {
              const value = typeof v === "number" ? v : v[0];
              setFilters(
                { grain: value / 100 },
                { history: historySessionRef.current ? "replace" : "push" }
              );
              historySessionRef.current = true;
            }}
            onChangeEnd={() => {
              historySessionRef.current = false;
            }}
          />
          <Slider
            label="Opacity"
            value={filters.opacity * 100}
            onChange={(v) => {
              const value = typeof v === "number" ? v : v[0];
              const next = Math.max(0, Math.min(100, value));
              const opacity = next / 100;
              setFilters(
                { opacity: opacity },
                { history: historySessionRef.current ? "replace" : "push" }
              );
              historySessionRef.current = true;
            }}
            onChangeEnd={() => {
              historySessionRef.current = false;
            }}
          />
          <Slider
            label="Spread"
            value={spreadPct}
            minValue={50}
            maxValue={150}
            onChange={(v) => {
              const next = typeof v === "number" ? v : v[0];
              const safeNext = Math.max(1, Math.min(1000, next));
              const prev = lastAppliedSpreadRef.current || 100;
              const deltaFactor = safeNext / prev;
              const source = (shapesLive ?? shapes) || [];
              if (deltaFactor !== 1 && source.length > 0) {
                // Begin live session lazily
                if (!shapesLive) beginShapesLive();
                setShapesLive(
                  source.map((s) => {
                    const cx =
                      s.points.reduce((a, b) => a + b.x, 0) / s.points.length;
                    const cy =
                      s.points.reduce((a, b) => a + b.y, 0) / s.points.length;
                    return {
                      ...s,
                      points: s.points.map((p) => ({
                        x: cx + (p.x - cx) * deltaFactor,
                        y: cy + (p.y - cy) * deltaFactor,
                      })),
                    };
                  })
                );
                lastAppliedSpreadRef.current = safeNext;
                // Commit once on pointer up
                if (!commitAttachedRef.current) {
                  commitAttachedRef.current = true;
                  const onUp = () => {
                    commitShapesLive({ history: "replace" });
                    commitAttachedRef.current = false;
                    window.removeEventListener("pointerup", onUp);
                  };
                  window.addEventListener("pointerup", onUp);
                }
              }
              setSpreadPct(safeNext);
            }}
          />
          <Button
            intent="outline"
            onPress={() => {
              setFilters(DEFAULT_FILTERS, { history: "push" });
              lastAppliedSpreadRef.current = 100;
              setSpreadPct(100);
            }}
            className="mt-4"
          >
            <IconRefresh /> Reset Filters
          </Button>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
};
