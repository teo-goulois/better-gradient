"use client";

import { trackEvent } from "@/lib/tracking";
import { useMeshStore } from "@/store/store-mesh";
import { Button } from "../ui/button";

export const MeshActions = () => {
  const { randomize, shuffleColors, shapes, palette } = useMeshStore();

  const handleRandomize = () => {
    randomize();
    trackEvent(
      "Randomize Gradient",
      {
        shapes_count: shapes.length,
        colors_count: palette.length,
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
        <Button onPress={handleRandomize}>Randomize</Button>
        <Button onPress={handleShuffleColors} intent="outline">
          Shuffle
        </Button>
      </div>
    </div>
  );
};
