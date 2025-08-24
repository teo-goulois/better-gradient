"use client";
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/mesh/sidebar/sidebar-disclosure";
import { IconFullscreen } from "@intentui/icons";
import { useMeshStore } from "@/store/store-mesh";

type Props = {};

export const SidebarSize = ({}: Props) => {
  const { ui, setUi, canvas } = useMeshStore();
  return (
    <div>
      <Disclosure defaultExpanded>
        <DisclosureTrigger>
          <IconFullscreen /> Size
        </DisclosureTrigger>
        <DisclosurePanel>
          <div className="space-y-2">
            <div className="text-sm font-medium">Frame size</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs flex flex-col gap-1">
                <span>Width</span>
                <input
                  type="number"
                  min={50}
                  max={6000}
                  value={ui.frameWidth ?? canvas.width}
                  onChange={(e) =>
                    setUi({
                      frameWidth: Math.max(
                        50,
                        Math.min(6000, Number(e.target.value) || 0)
                      ),
                    })
                  }
                  className="border rounded px-2 py-1"
                />
              </label>
              <label className="text-xs flex flex-col gap-1">
                <span>Height</span>
                <input
                  type="number"
                  min={50}
                  max={6000}
                  value={ui.frameHeight ?? canvas.height}
                  onChange={(e) =>
                    setUi({
                      frameHeight: Math.max(
                        50,
                        Math.min(6000, Number(e.target.value) || 0)
                      ),
                    })
                  }
                  className="border rounded px-2 py-1"
                />
              </label>
            </div>
            <div className="text-xs text-gray-500">
              Hold Shift while resizing to lock aspect ratio.
            </div>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
};
