"use client";

import { ColorSwatch } from "@/components/ui/color-swatch";
import { Label } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { palettePresets, type PalettePreset } from "@/lib/config/config.palette";
import { trackEvent } from "@/lib/tracking";
import { useMeshStore } from "@/store/store-mesh";
import type { RgbHex } from "@/types/types.mesh";
import { useMemo } from "react";
import type { Key } from "react-aria-components";

export const MeshSidebarPaletteSelector = () => {
  const palette = useMeshStore((state) => state.palette);
  const setPalette = useMeshStore((state) => state.setPalette);

  const selectedPaletteKey = useMemo(() => {
    const current = palette.map((item) => item.color.toLowerCase());
    for (const preset of palettePresets) {
      if (preset.colors.length !== current.length) continue;
      const matches = preset.colors.every(
        (color, index) => color.toLowerCase() === current[index]
      );
      if (matches) return preset.title;
    }
    return null;
  }, [palette]);

  const paletteSections = useMemo(() => {
    const order: PalettePreset["category"][] = [
      "Soft Pastels",
      "Bold & Saturated",
      "Earth & Naturals",
      "Coastal & Cool",
      "Dark & Moody",
      "Playful & Pop",
    ];

    return order
      .map((category) => ({
        title: category,
        items: palettePresets.filter((preset) => preset.category === category),
      }))
      .filter((section) => section.items.length > 0);
  }, []);

  const applyPalette = (key: Key | null) => {
    const preset = palettePresets.find((p) => p.title === key);
    if (!preset) return;

    const nextPalette = preset.colors.map((color) => ({
      id: crypto.randomUUID(),
      color,
    })) as RgbHex[];

    setPalette(nextPalette, { history: "push" });
    trackEvent(
      "Apply Palette Preset",
      {
        palette_name: preset.title,
        colors_count: nextPalette.length,
      },
      true
    );
  };

  return (
    <div className="space-y-1.5">
      <Label for="palette-preset">Curated palettes</Label>
      <Select
        id="palette-preset"
        selectedKey={selectedPaletteKey}
        onSelectionChange={(key) => applyPalette(key)}
        aria-label="Curated palettes"
        placeholder="Apply curated palette"
      >
        <Select.Trigger />
        <Select.Content items={paletteSections}>
          {(section) => (
            <Select.Section
              id={section.title}
              title={section.title}
              items={section.items}
            >
              {(item) => (
                <Select.Item
                  id={item.title}
                  textValue={item.title}
                  className="w-full"
                >
                  <div className="flex justify-between w-full gap-4 font-medium text-sm flex-1 text-nowrap">
                    <Select.Label className="flex-1">{item.title}</Select.Label>
                    <div className="flex items-center">
                      {item.colors.map((color, index) => (
                        <ColorSwatch
                          key={`${color}-${index}`}
                          className="size-4 first:ml-0 -mx-0.5"
                          color={color}
                        />
                      ))}
                    </div>
                  </div>
                </Select.Item>
              )}
            </Select.Section>
          )}
        </Select.Content>
      </Select>
    </div>
  );
};
