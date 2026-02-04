"use client";

import { Select } from "@/components/ui/select";
import { trackEvent } from "@/lib/tracking";
import { useMeshStore } from "@/store/store-mesh";
import type { CompositionMood } from "@/lib/utils/utils.mesh";
import { Button } from "../ui/button";
import {
  IconArrowUpLeft,
  IconArrowUpRight,
  IconCheck,
  IconCompass,
  IconGrid4,
  IconMoon,
  IconSparklesTwo,
  IconStarLines,
  IconSunrise,
} from "@intentui/icons";
import { useState } from "react";
import type { Key } from "react-aria-components";

const MOOD_OPTIONS: { id: "auto" | CompositionMood; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "balanced", label: "Balanced" },
  { id: "centered", label: "Centered" },
  { id: "diagonal", label: "Diagonal" },
  { id: "corner", label: "Corner" },
  { id: "horizon", label: "Horizon" },
  { id: "orbit", label: "Orbit" },
  { id: "triad", label: "Triad" },
];

export const MeshActions = () => {
  const randomize = useMeshStore((state) => state.randomize);
  const shuffleColors = useMeshStore((state) => state.shuffleColors);
  const shapes = useMeshStore((state) => state.shapes);
  const palette = useMeshStore((state) => state.palette);
  const [moodKey, setMoodKey] = useState<Key | null>("auto");

  const handleRandomize = () => {
    const mood =
      moodKey && moodKey !== "auto" ? (moodKey as CompositionMood) : undefined;
    randomize({ mood });
    trackEvent(
      "Randomize Gradient",
      {
        shapes_count: shapes.length,
        colors_count: palette.length,
        mood: mood ?? "auto",
      },
      true
    );
  };

  const handleShuffleColors = () => {
    shuffleColors();
    trackEvent(
      "Shuffle Colors",
      {
        shapes_count: shapes.length,
        colors_count: palette.length,
      },
      true
    );
  };

  return (
    <div className="absolute bottom-0 right-1/2 left-1/2 p-1 w-fit -translate-x-1/2 rounded-lg bg-bg z-50 shadow">
      <div className="flex gap-2">
        <div className="min-w-40">
          <Select
            aria-label="Composition mood"
            selectedKey={moodKey}
            onSelectionChange={(key) => setMoodKey(key ?? "auto")}
          >
            <Select.Trigger prefix="Mood" className="h-9" />
            <Select.Content items={MOOD_OPTIONS}>
              {(item) => (
                <Select.Item
                  id={item.id}
                  textValue={item.label}
                  className="w-full [&_[data-slot=check-indicator]]:hidden [&>div]:col-start-1 [&>div]:col-span-full"
                >
                  {({ isSelected }) => (
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <IconCheck
                          aria-hidden="true"
                          className="size-4 text-muted-fg"
                        />
                      ) : (
                        <item.icon
                          aria-hidden="true"
                          className="size-4 text-muted-fg"
                        />
                      )}
                      <Select.Label className="flex-1">
                        {item.label}
                      </Select.Label>
                    </div>
                  )}

                </Select.Item>
              )}
            </Select.Content>
          </Select>
        </div>
        <Button onPress={handleRandomize}>Randomize</Button>
        <Button onPress={handleShuffleColors} intent="outline">
          Shuffle
        </Button>
      </div>
    </div>
  );
};
