"use client";

import { Button } from "@/components/ui/button";
import { RgbHex, useMeshStore } from "@/store/store-mesh";
import { SidebarColorPicker } from "./sidebar-color-picker";
import { IconCircleQuestionmark, IconPlus } from "@intentui/icons";
import { DragDropProvider, PointerSensor } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { Tooltip } from "@/components/ui/tooltip";

type Props = {};

export const SidebarColorPalette = ({}: Props) => {
  const { palette, setPalette } = useMeshStore();

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
        onDragEnd={(event) => {
          setPalette(move(palette, event));
        }}
      >
        <div className="flex gap-2 flex-wrap">
          {palette.map((item, index) => (
            <SortableColor key={item.id} color={item} index={index} />
          ))}
          {palette.length < 5 && (
            <Button
              intent="outline"
              isCircle
              size="sq-sm"
              onPress={() =>
                setPalette([
                  ...palette,
                  { id: crypto.randomUUID(), color: "#ffffff" },
                ] as any)
              }
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
  const { palette, setPalette } = useMeshStore();
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
      <SidebarColorPicker
        value={color.color}
        onChange={(c) => {
          const value = c.toString("hex");
          const next = [...palette];
          next[index] = { id: color.id, color: value } as RgbHex;
          setPalette(next as any);
        }}
        onRemove={() =>
          setPalette(palette.filter((_, idx) => idx !== index) as any)
        }
      />
    </div>
  );
};
