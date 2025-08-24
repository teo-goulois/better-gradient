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
import { NumberField } from "@/components/ui/number-field";
import { Tooltip } from "@/components/ui/tooltip";

type Props = {};

export const SidebarSize = ({}: Props) => {
  const ui = useMeshStore((s) => s.ui);
  const canvas = useMeshStore((s) => s.canvas);
  const setCanvas = useMeshStore((s) => s.setCanvas);
  const toggleAspectLock = useMeshStore((s) => s.toggleAspectLock);
  const setUi = useMeshStore((s) => s.setUi);
  const setUiFrameSize = useMeshStore((s) => s.setUiFrameSize);

  const presets: { label: string; width: number; height: number }[] = [
    { label: "Square", width: 1080, height: 1080 },
    { label: "Story", width: 1080, height: 1920 },
    { label: "Portrait", width: 1080, height: 1350 },
    { label: "Landscape", width: 1920, height: 1080 },
    { label: "Open Graph", width: 1200, height: 630 },
    { label: "YouTube Thumb", width: 1280, height: 720 },
  ];

  const containerWidth = ui.containerWidth;
  const containerHeight = ui.containerHeight;

  // Calculate container size as a percentage (e.g., 50%) of the available container dimensions
  const containerWidthWithPadding = (containerWidth ?? 0) * 0.75;
  const containerHeightWithPadding = (containerHeight ?? 0) * 0.75;

  const updateWidth = (w: number) => {
    if (
      !ui ||
      !ui.frameWidth ||
      !ui.frameHeight ||
      !containerWidth ||
      !containerHeight
    ) {
      return;
    }
    console.log("START");
    const canvasAr = canvas.width / canvas.height;
    const frameAr = ui.frameWidth / ui.frameHeight;

    console.log({ canvasAr, frameAr });
    console.log({ canvas: canvas.width, canvasHeight: canvas.height });

    const nextCanvasWidth = w;
    const nextCanvasHeight = ui.maintainAspectRatio
      ? Math.max(50, Math.round(nextCanvasWidth / Math.max(0.01, canvasAr)))
      : canvas.height; // Keep canvas height unchanged when aspect ratio is free

    console.log({ nextCanvasWidth, nextCanvasHeight });

    // Calculate scale factors for both dimensions
    const scaleX = containerWidthWithPadding / nextCanvasWidth;
    const scaleY = containerHeightWithPadding / nextCanvasHeight;

    const scale = Math.min(scaleX, scaleY);

    console.log({ scaleX, scaleY, scale });

    const nextFrameWidth = Math.max(50, Math.round(nextCanvasWidth * scale));
    const nextFrameHeight = ui.maintainAspectRatio
      ? Math.max(50, Math.round(nextCanvasHeight * scale))
      : Math.max(50, Math.round(canvas.height * scale));

    console.log({ nextFrameWidth, nextFrameHeight });

    setUiFrameSize({ width: nextFrameWidth, height: nextFrameHeight });
    setCanvas({ width: nextCanvasWidth, height: nextCanvasHeight });
    setUi({
      maintainAspectRatio: ui.maintainAspectRatio,
      aspectRatio: canvasAr,
    });
    console.log("END");
  };
  const updateHeight = (h: number) => {
    if (
      !ui ||
      !ui.frameWidth ||
      !ui.frameHeight ||
      !containerWidth ||
      !containerHeight
    ) {
      return;
    }
    console.log("START");
    const canvasAr = canvas.width / canvas.height;
    const frameAr = ui.frameWidth / ui.frameHeight;

    console.log({ canvasAr, frameAr });
    console.log({ canvas: canvas.width, canvasHeight: canvas.height });

    const nextCanvasHeight = h;
    // When aspect ratio is locked, compute the width from the aspect ratio (width/height = canvasAr)
    // so width = height * aspectRatio. Previously this inverted the calculation.
    const nextCanvasWidth = ui.maintainAspectRatio
      ? Math.max(50, Math.round(nextCanvasHeight * canvasAr))
      : canvas.width; // Keep canvas width unchanged when aspect ratio is free

    console.log({ nextCanvasWidth, nextCanvasHeight });

    // Calculate scale factors for both dimensions
    const scaleX = containerWidthWithPadding / nextCanvasWidth;
    const scaleY = containerHeightWithPadding / nextCanvasHeight;

    const scale = Math.min(scaleX, scaleY);

    console.log({ scaleX, scaleY, scale });

    const nextFrameHeight = Math.max(50, Math.round(nextCanvasHeight * scale));
    const nextFrameWidth = ui.maintainAspectRatio
      ? Math.max(50, Math.round(nextCanvasWidth * scale))
      : Math.max(50, Math.round(canvas.width * scale));

    console.log({ nextFrameWidth, nextFrameHeight });

    setUiFrameSize({ width: nextFrameWidth, height: nextFrameHeight });
    setCanvas({ width: nextCanvasWidth, height: nextCanvasHeight });
    setUi({
      maintainAspectRatio: ui.maintainAspectRatio,
      // Keep aspect ratio in state consistent with the new canvas dimensions
      aspectRatio: Math.max(0.01, nextCanvasWidth / nextCanvasHeight),
    });
    console.log("END");
  };

  const applyPreset = (w: number, h: number, isPreset = true) => {
    const aspectRatio = Math.max(0.01, w / h);
    if (
      !ui ||
      !ui.frameWidth ||
      !ui.frameHeight ||
      !containerWidth ||
      !containerHeight
    ) {
      return;
    }

    // Calculate scale factors for both dimensions
    const scaleX = containerWidthWithPadding / w;
    const scaleY = containerHeightWithPadding / h;

    // Use the smaller scale to ensure both dimensions fit with padding
    const scale = Math.min(scaleX, scaleY);

    const maxFw = Math.max(50, Math.round(w * scale));
    const maxFh = Math.max(50, Math.round(h * scale));

    // Apply the scale to both dimensions to maintain aspect ratio
    const newFw = Math.max(50, maxFw);
    const newFh = Math.max(50, maxFh);

    if (isPreset) {
      setUiFrameSize({ width: newFw, height: newFh });
      setCanvas({ width: w, height: h });
      setUi({ maintainAspectRatio: true, aspectRatio });
    } else {
      console.log({ newFw, newFh });

      /*       if (ui.maintainAspectRatio) {
        setUi({ aspectRatio: Math.max(0.01, newFw / newFh) });
      }
      setCanvas({ width: newFw, height: newFh });
      setUiFrameSize({ width: newFw, height: newFh });
 */
    }
  };

  return (
    <div>
      <Disclosure defaultExpanded>
        <DisclosureTrigger>
          <IconFullscreen /> Size
        </DisclosureTrigger>
        <DisclosurePanel>
          <div className="space-y-2">
            <div className="text-sm font-medium">Export size</div>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Export Width"
                minValue={50}
                maxValue={6000}
                value={canvas.width}
                onChange={(value) => {
                  updateWidth(value);
                }}
              />

              <NumberField
                label="Export Height"
                minValue={50}
                maxValue={6000}
                value={canvas.height}
                onChange={(value) => {
                  updateHeight(value);
                }}
              />
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
              Preview scales to fit your screen.
            </div>

            <div className="pt-3 space-y-2">
              <div className="text-sm font-medium">Presets</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Tooltip>
                    <Button
                      key={p.label}
                      intent="outline"
                      size="sm"
                      onPress={() => applyPreset(p.width, p.height)}
                      className=" justify-between"
                    >
                      <span>{p.label}</span>
                    </Button>
                    <Tooltip.Content>
                      {p.width}×{p.height}
                    </Tooltip.Content>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
};
