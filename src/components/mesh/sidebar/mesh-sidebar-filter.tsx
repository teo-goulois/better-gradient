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
import { useMemo, useRef, useState } from "react";

export const MeshSidebarFilter = () => {
  const { filters, setFilters, shapes, setShapes } = useMeshStore();
  // Global opacity reflects the average of shape opacities for display; slider sets all
  const averageOpacityPct = useMemo(() => {
    if (!shapes || shapes.length === 0) return 100;
    const avg =
      shapes.reduce((acc, s) => acc + (s.opacity ?? 1), 0) / shapes.length;
    return Math.round(Math.max(0, Math.min(1, avg)) * 100);
  }, [shapes]);

  // Global spread uses a local slider state; applying delta to avoid compounding from absolute values
  const [spreadPct, setSpreadPct] = useState<number>(100);
  const lastAppliedSpreadRef = useRef<number>(100);

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
              setFilters({ blur: mappedValue });
            }}
          />
          <Slider
            label="Grain"
            value={(filters.grain ?? 0) * 100}
            onChange={(v) => {
              const value = typeof v === "number" ? v : v[0];
              setFilters({ grain: value / 100 });
            }}
          />
          <Slider
            label="Opacity"
            value={filters.opacity * 100}
            onChange={(v) => {
              const value = typeof v === "number" ? v : v[0];
              const next = Math.max(0, Math.min(100, value));
              const opacity = next / 100;
              setFilters({ opacity: opacity });
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
              if (deltaFactor !== 1 && shapes.length > 0) {
                setShapes(
                  shapes.map((s) => {
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
              }
              setSpreadPct(safeNext);
            }}
          />
          <Button
            intent="outline"
            onPress={() => {
              setFilters(DEFAULT_FILTERS);
              const prev = lastAppliedSpreadRef.current || 100;
              const deltaFactor = prev !== 100 ? 100 / prev : 1;
              setShapes(
                shapes.map((s) => {
                  let points = s.points;
                  if (deltaFactor !== 1) {
                    const cx =
                      s.points.reduce((a, b) => a + b.x, 0) / s.points.length;
                    const cy =
                      s.points.reduce((a, b) => a + b.y, 0) / s.points.length;
                    points = s.points.map((p) => ({
                      x: cx + (p.x - cx) * deltaFactor,
                      y: cy + (p.y - cy) * deltaFactor,
                    }));
                  }
                  return { ...s, points, opacity: undefined };
                })
              );
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
