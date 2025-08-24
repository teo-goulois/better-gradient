"use client";

import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/mesh/sidebar/sidebar-disclosure";
import { SidebarColorPalette } from "./sidebar-color-palette";
import { IconColorSwatch } from "@intentui/icons";
import { useMeshStore } from "@/store/store-mesh";
import { Switch } from "@/components/ui/switch";

type Props = {};

export const SidebarColor = ({}: Props) => {
  const { ui, setUi } = useMeshStore();
  return (
    <div>
      <Disclosure defaultExpanded>
        <DisclosureTrigger>
          <IconColorSwatch /> Colors
        </DisclosureTrigger>
        <DisclosurePanel>
          <SidebarColorPalette />
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
