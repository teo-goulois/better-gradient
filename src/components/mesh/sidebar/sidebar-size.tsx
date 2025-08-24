"use client";
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/mesh/sidebar/sidebar-disclosure";
import { IconFullscreen } from "@intentui/icons";
import { useMeshStore } from "@/store/store-mesh";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type Props = {};

export const SidebarSize = ({}: Props) => {
  const ui = useMeshStore((s) => s.ui);
  const canvas = useMeshStore((s) => s.canvas);
  const setUiFrameSize = useMeshStore((s) => s.setUiFrameSize);
  const toggleAspectLock = useMeshStore((s) => s.toggleAspectLock);
  const setUi = useMeshStore((s) => s.setUi);

  const presets: { label: string; width: number; height: number }[] = [
    { label: "Square • 1080×1080", width: 1080, height: 1080 },
    { label: "Story • 1080×1920", width: 1080, height: 1920 },
    { label: "Portrait • 1080×1350", width: 1080, height: 1350 },
    { label: "Landscape • 1920×1080", width: 1920, height: 1080 },
    { label: "Open Graph • 1200×630", width: 1200, height: 630 },
    { label: "YouTube Thumb • 1280×720", width: 1280, height: 720 },
  ];

  const applyPreset = (w: number, h: number) => {
    setUiFrameSize({ width: w, height: h });
    setUi({ maintainAspectRatio: true, aspectRatio: w / h });
  };
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
                    setUiFrameSize({
                      width: Math.max(
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
                    setUiFrameSize({
                      height: Math.max(
                        50,
                        Math.min(6000, Number(e.target.value) || 0)
                      ),
                    })
                  }
                  className="border rounded px-2 py-1"
                />
              </label>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <Switch
                isSelected={ui.maintainAspectRatio}
                onChange={(v) => toggleAspectLock(v as boolean)}
              >
                {ui.maintainAspectRatio
                  ? `Aspect ratio locked${
                      ui.aspectRatio ? ` (${ui.aspectRatio.toFixed(3)})` : ""
                    }`
                  : "Aspect ratio free"}
              </Switch>
            </div>
            <div className="text-xs text-gray-500">
              Hold Shift while resizing to lock aspect ratio temporarily.
            </div>

            <div className="pt-3 space-y-2">
              <div className="text-sm font-medium">Presets</div>
              <div className="grid grid-cols-1 gap-2">
                {presets.map((p) => (
                  <Button
                    key={p.label}
                    intent="outline"
                    size="sm"
                    onPress={() => applyPreset(p.width, p.height)}
                    className="w-full justify-between"
                  >
                    <span>{p.label}</span>
                    <span className="text-xs text-gray-500">
                      {p.width}×{p.height}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
};
