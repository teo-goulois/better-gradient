"use client";

import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/mesh/sidebar/mesh-sidebar-disclosure";
import { Switch } from "@/components/ui/switch";
import { useMeshStore } from "@/store/store-mesh";
import { IconColorSwatch } from "@intentui/icons";
import { MeshSidebarColorPalette } from "./mesh-sidebar-color-palette";

export const MeshSidebarColor = () => {
  const { ui, setUi } = useMeshStore();
  return (
    <div>
      <Disclosure defaultExpanded>
        <DisclosureTrigger>
          <IconColorSwatch /> Colors
        </DisclosureTrigger>
        <DisclosurePanel>
          <MeshSidebarColorPalette />
          <div className="flex flex-col gap-2">
            <Switch
              className="font-semibold text-sm"
              isSelected={ui.showCenters}
              onChange={(v) => setUi({ showCenters: v })}
            >
              Adjust color position
            </Switch>
            <Switch
              className="font-semibold text-sm"
              isSelected={ui.showVertices}
              onChange={(v) => setUi({ showVertices: v })}
            >
              Adjust Vertices
            </Switch>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
};
