"use client";

import { Button } from "@/components/ui/button";
import { useMeshStore } from "@/store/store-mesh";
import { SidebarColorPicker } from "./sidebar-color-picker";
import { IconPlus } from "@intentui/icons";

type Props = {};

export const SidebarColorPalette = ({}: Props) => {
  const { palette, setPalette } = useMeshStore();

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Palette</div>
      <div className="flex gap-2 flex-wrap">
        {palette.map((c, i) => (
          <Color key={i} color={c} index={i} />
        ))}
        {palette.length < 5 && (
          <Button
            intent="outline"
            isCircle
            size="sq-sm"
            onPress={() => setPalette([...palette, "#ffffff"] as any)}
          >
            <IconPlus className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const Color = ({ color, index }: { color: string; index: number }) => {
  const { palette, setPalette } = useMeshStore();

  return (
    <div className="flex items-center gap-1 relative group">
      <SidebarColorPicker
        value={color}
        onChange={(c) => {
          const value = c.toString("hex");
          const next = [...palette];
          next[index] = value as any;
          setPalette(next as any);
        }}
        onRemove={() =>
          setPalette(palette.filter((_, idx) => idx !== index) as any)
        }
      />
    </div>
  );
};
