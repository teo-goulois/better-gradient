"use client";

import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/mesh/sidebar/mesh-sidebar-disclosure";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { useMeshStore } from "@/store/store-mesh";
import { IconCircleQuestionmark, IconColorSwatch } from "@intentui/icons";
import { MeshSidebarColorPalette } from "./mesh-sidebar-color-palette";
import { MeshSidebarPresetSelector } from "./mesh-sidebar-preset-selector";

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
          <MeshSidebarPresetSelector />
          <div className="flex flex-col items-start gap-2">
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
            <Tooltip>
              <Tooltip.Trigger className="flex items-center gap-2">
                Hints <IconCircleQuestionmark />
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p className="font-semibold">When adjusting color position</p>
                <p className="">You can right click the color point to :</p>
                <ul className="list-disc list-inside">
                  <li>Change the index of the color</li>
                  <li>Change the color</li>
                </ul>
              </Tooltip.Content>
            </Tooltip>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
};
