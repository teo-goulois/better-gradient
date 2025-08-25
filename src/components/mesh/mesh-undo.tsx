"use client";

import { IconRedo, IconUndo } from "@intentui/icons";
import { Button } from "../ui/button";
import { useMeshStore } from "@/store/store-mesh";
import { Tooltip } from "../ui/tooltip";

type Props = {};

export const MeshUndo = ({}: Props) => {
  const undo = useMeshStore((s) => s.undo);
  const redo = useMeshStore((s) => s.redo);
  const canUndo = useMeshStore((s) => s._past.length > 0);
  const canRedo = useMeshStore((s) => s._future.length > 0);

  return (
    <div className="absolute top-0 left-0 p-1 rounded-lg bg-bg z-50 shadow flex gap-1 items-center">
      <Tooltip>
        <Button
          onPress={undo}
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
          onPress={redo}
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
