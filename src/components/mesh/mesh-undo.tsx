"use client";

import { trackEvent } from "@/lib/tracking";
import { useMeshStore } from "@/store/store-mesh";
import { IconRedo, IconUndo } from "@intentui/icons";
import { Button } from "../ui/button";
import { Tooltip } from "../ui/tooltip";

export const MeshUndo = () => {
  const undo = useMeshStore((s) => s.undo);
  const redo = useMeshStore((s) => s.redo);
  const canUndo = useMeshStore((s) => s._past.length > 0);
  const canRedo = useMeshStore((s) => s._future.length > 0);

  const handleUndo = () => {
    undo();
    trackEvent("Undo Action", undefined, true);
  };

  const handleRedo = () => {
    redo();
    trackEvent("Redo Action", undefined, true);
  };

  return (
    <div className="absolute top-0 left-0 p-1 rounded-lg bg-bg z-50 shadow flex gap-1 items-center">
      <Tooltip>
        <Button
          onPress={handleUndo}
          size="sq-md"
          intent="plain"
          isDisabled={!canUndo}
        >
          <IconUndo className="size-4" />
        </Button>
        <Tooltip.Content intent="inverse">Undo changes</Tooltip.Content>
      </Tooltip>
      <Tooltip>
        <Button
          onPress={handleRedo}
          size="sq-md"
          intent="plain"
          isDisabled={!canRedo}
        >
          <IconRedo className="size-4" />
        </Button>
        <Tooltip.Content intent="inverse">Redo changes</Tooltip.Content>
      </Tooltip>
    </div>
  );
};
