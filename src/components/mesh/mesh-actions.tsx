"use client";

import { Button } from "../ui/button";
import { useMeshStore } from "@/store/store-mesh";

type Props = {};

export const MeshActions = ({}: Props) => {
  const { randomize, shuffleColors } = useMeshStore();
  return (
    <div className="absolute bottom-0 right-1/2 left-1/2 p-1 w-fit -translate-x-1/2 rounded-lg bg-bg z-50 shadow">
      <div className="flex gap-2">
        <Button onPress={() => randomize()}>Randomize</Button>
        <Button onPress={() => shuffleColors()} intent="outline">
          Shuffle
        </Button>
      </div>
    </div>
  );
};
