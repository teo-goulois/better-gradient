"use client";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { trackEvent } from "@/lib/tracking";
import { useMeshStore } from "@/store/store-mesh";
import type { RgbHex } from "@/types/types.mesh";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { IconCircleQuestionmark, IconPlus } from "@intentui/icons";
import { useRef } from "react";
import { MeshSidebarColorPicker } from "./mesh-sidebar-color-picker";

export const MeshSidebarColorPalette = () => {
  const palette = useMeshStore((state) => state.palette);
  console.log({ palette });
  const setPalette = useMeshStore((state) => state.setPalette);
  const isReorderHistorySessionRef = useRef<boolean>(false);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium flex items-center gap-2">
        <p className="">Palette</p>
        <Tooltip>
          <Tooltip.Trigger>
            <IconCircleQuestionmark className="size-4" />
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>
              <p>tips</p>
              <p>1. you can drag and drop to reorder the palette</p>
              <p>2. the first color is the background color</p>
            </p>
          </Tooltip.Content>
        </Tooltip>
      </div>
      <DragDropProvider
        onDragStart={() => {
          isReorderHistorySessionRef.current = false;
        }}
        onDragMove={(event) => {
          const current = useMeshStore.getState().palette;
          setPalette(move(current, event), {
            history: isReorderHistorySessionRef.current ? "replace" : "push",
          });
          isReorderHistorySessionRef.current = true;
        }}
        onDragEnd={() => {
          isReorderHistorySessionRef.current = false;
        }}
      >
        <div className="flex gap-2 flex-wrap">
          {palette.map((item, index) => (
            <SortableColor
              key={`${item.id}-${item.color}`}
              color={item}
              index={index}
            />
          ))}
          {palette.length < 10 && (
            <Button
              intent="outline"
              isCircle
              size="sq-sm"
              onPress={() => {
                setPalette(
                  [
                    ...palette,
                    { id: crypto.randomUUID(), color: "#ffffff" },
                  ] as RgbHex[],
                  { history: "push" }
                );
                trackEvent(
                  "Add Color",
                  {
                    colors_count: palette.length + 1,
                  },
                  true
                );
              }}
            >
              <IconPlus className="size-4" />
            </Button>
          )}
        </div>
      </DragDropProvider>
    </div>
  );
};

type SortableColorProps = {
  color: RgbHex;
  index: number;
};

const SortableColor = ({ color, index }: SortableColorProps) => {
  const palette = useMeshStore((state) => state.palette);
  const setPalette = useMeshStore((state) => state.setPalette);
  const lastColorChangeAtRef = useRef<number>(0);
  // no global side-effects; session handled locally via time-based grouping

  const sortable = useSortable({ id: color.id, index });

  const style = {
    opacity: sortable.isDragging ? 0.5 : 1,
    zIndex: sortable.isDragging ? 50 : 1,
  };

  return (
    <div
      ref={sortable.ref}
      //style={style}
      className="flex items-center gap-1 relative group transition-opacity duration-200 cursor-grab active:cursor-grabbing "
    >
      <MeshSidebarColorPicker
        value={color.color}
        onChange={(c) => {
          const value = c.toString("hex");
          const next = [...palette];
          next[index] = { id: color.id, color: value } as RgbHex;
          const now = Date.now();
          const isNewSession = now - (lastColorChangeAtRef.current || 0) > 300;
          setPalette(next as RgbHex[], {
            history: isNewSession ? "push" : "replace",
          });
          lastColorChangeAtRef.current = now;
          trackEvent(
            "Change Color",
            {
              color_index: index,
              new_color: value,
              colors_count: palette.length,
            },
            true
          );
        }}
        onRemove={() => {
          if (palette.length === 1) return;
          setPalette(palette.filter((_, idx) => idx !== index) as RgbHex[], {
            history: "push",
          });
          trackEvent(
            "Remove Color",
            {
              color_index: index,
              colors_count: palette.length - 1,
            },
            true
          );
        }}
      />
    </div>
  );
};
