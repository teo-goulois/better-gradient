"use client";

import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/mesh/sidebar/mesh-sidebar-disclosure";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { useMeshStore } from "@/store/store-mesh";
import { IconFullscreen } from "@intentui/icons";
import { useFrameContext } from "../frame/frame-context";

// ===== CONSTANTS =====
const MIN_SIZE = 50;
const MAX_SIZE = 6000;
const CONTAINER_PADDING_RATIO = 0.75;
const ASPECT_RATIO_DECIMAL_PLACES = 3;

// Preset configurations for common canvas sizes
const CANVAS_PRESETS = [
  { label: "Square", width: 1080, height: 1080 },
  { label: "Story", width: 1080, height: 1920 },
  { label: "Portrait", width: 1080, height: 1350 },
  { label: "Landscape", width: 1920, height: 1080 },
  { label: "Open Graph", width: 1200, height: 630 },
  { label: "YouTube Thumb", width: 1280, height: 720 },
] as const;

export const MeshSidebarSize = () => {
  // ===== HOOKS =====
  const { saveFrame, frame } = useFrameContext();

  const ui = useMeshStore((s) => s.ui);
  const canvas = useMeshStore((s) => s.canvas);
  const setCanvas = useMeshStore((s) => s.setCanvas);
  const toggleAspectLock = useMeshStore((s) => s.toggleAspectLock);
  const setUi = useMeshStore((s) => s.setUi);
  const storeFrame = useMeshStore((s) => s.frame);

  // ===== DERIVED VALUES =====
  const containerWidth = ui.container?.width;
  const containerHeight = ui.container?.height;

  // Calculate available space with padding to ensure content fits comfortably
  const availableWidth = (containerWidth ?? 0) * CONTAINER_PADDING_RATIO;
  const availableHeight = (containerHeight ?? 0) * CONTAINER_PADDING_RATIO;

  // ===== HELPER FUNCTIONS =====
  /**
   * Validates that all required UI state and dimensions are available
   */
  const isValidState = () => {
    return !!(
      frame?.width &&
      frame?.height &&
      containerWidth &&
      containerHeight
    );
  };

  /**
   * Calculates the optimal scale factor to fit content within available space
   */
  const calculateOptimalScale = (
    contentWidth: number,
    contentHeight: number
  ) => {
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    return Math.min(scaleX, scaleY);
  };

  /**
   * Calculates new canvas dimensions while respecting aspect ratio constraints
   */
  const calculateNewCanvasDimensions = (
    newWidth: number | null,
    newHeight: number | null,
    maintainAspectRatio: boolean
  ) => {
    const canvasAspectRatio = canvas.width / canvas.height;

    if (newWidth !== null && newHeight === null) {
      // Width changed, calculate height
      const calculatedHeight = maintainAspectRatio
        ? Math.max(MIN_SIZE, Math.round(newWidth / canvasAspectRatio))
        : canvas.height;
      return { width: newWidth, height: calculatedHeight };
    }

    if (newHeight !== null && newWidth === null) {
      // Height changed, calculate width
      const calculatedWidth = maintainAspectRatio
        ? Math.max(MIN_SIZE, Math.round(newHeight * canvasAspectRatio))
        : canvas.width;
      return { width: calculatedWidth, height: newHeight };
    }

    return { width: canvas.width, height: canvas.height };
  };

  // ===== MAIN FUNCTIONS =====
  const updateWidth = (newWidth: number) => {
    if (!isValidState()) return;

    // Calculate new canvas dimensions respecting aspect ratio
    const newCanvasDimensions = calculateNewCanvasDimensions(
      newWidth,
      null,
      ui.maintainAspectRatio
    );

    // Calculate optimal scale to fit within available space
    const optimalScale = calculateOptimalScale(
      newCanvasDimensions.width,
      newCanvasDimensions.height
    );

    // Calculate new frame dimensions
    const newFrameWidth = Math.max(
      MIN_SIZE,
      Math.round(newCanvasDimensions.width * optimalScale)
    );
    const newFrameHeight = ui.maintainAspectRatio
      ? Math.max(
          MIN_SIZE,
          Math.round(newCanvasDimensions.height * optimalScale)
        )
      : Math.max(MIN_SIZE, Math.round(canvas.height * optimalScale));

    // Update state
    saveFrame({ width: newFrameWidth, height: newFrameHeight });
    setCanvas(newCanvasDimensions, { history: "replace" });
  };
  const updateHeight = (newHeight: number) => {
    if (!isValidState()) return;

    // Calculate new canvas dimensions respecting aspect ratio
    const newCanvasDimensions = calculateNewCanvasDimensions(
      null,
      newHeight,
      ui.maintainAspectRatio
    );

    // Calculate optimal scale to fit within available space
    const optimalScale = calculateOptimalScale(
      newCanvasDimensions.width,
      newCanvasDimensions.height
    );

    // Calculate new frame dimensions
    const newFrameHeight = Math.max(
      MIN_SIZE,
      Math.round(newCanvasDimensions.height * optimalScale)
    );
    const newFrameWidth = ui.maintainAspectRatio
      ? Math.max(MIN_SIZE, Math.round(newCanvasDimensions.width * optimalScale))
      : Math.max(MIN_SIZE, Math.round(canvas.width * optimalScale));

    // Update state
    saveFrame({ width: newFrameWidth, height: newFrameHeight });
    setCanvas(newCanvasDimensions, { history: "replace" });
  };

  const applyPreset = (
    presetWidth: number,
    presetHeight: number,
    isPreset = true
  ) => {
    if (!isValidState()) return;

    // Calculate optimal scale to fit preset within available space
    const optimalScale = calculateOptimalScale(presetWidth, presetHeight);

    // Calculate scaled frame dimensions
    const newFrameWidth = Math.max(
      MIN_SIZE,
      Math.round(presetWidth * optimalScale)
    );
    const newFrameHeight = Math.max(
      MIN_SIZE,
      Math.round(presetHeight * optimalScale)
    );

    if (isPreset) {
      // Calculate center position for the new frame
      const centerX = Math.round(((containerWidth ?? 0) - newFrameWidth) / 2);
      const centerY = Math.round(((containerHeight ?? 0) - newFrameHeight) / 2);

      // Apply preset: update both canvas and frame to preset dimensions, and center the frame
      saveFrame({
        width: newFrameWidth,
        height: newFrameHeight,
        x: centerX,
        y: centerY,
      });
      setCanvas(
        { width: presetWidth, height: presetHeight },
        { history: "push" }
      );
      setUi({ maintainAspectRatio: true }, { history: "replace" });
    } else {
      // Free-form adjustment: only update canvas dimensions
      setCanvas(
        { width: newFrameWidth, height: newFrameHeight },
        { history: "replace" }
      );
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
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Export Width"
                minValue={MIN_SIZE}
                maxValue={MAX_SIZE}
                value={canvas.width}
                onChange={updateWidth}
              />

              <NumberField
                label="Export Height"
                minValue={MIN_SIZE}
                maxValue={MAX_SIZE}
                value={canvas.height}
                onChange={updateHeight}
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <Switch
                isSelected={ui.maintainAspectRatio}
                onChange={(v) => toggleAspectLock(v as boolean)}
              >
                {ui.maintainAspectRatio
                  ? `Aspect ratio locked${
                      storeFrame?.aspectRatio
                        ? ` (${storeFrame.aspectRatio.toFixed(
                            ASPECT_RATIO_DECIMAL_PLACES
                          )})`
                        : ""
                    }`
                  : "Aspect ratio free"}
              </Switch>
            </div>

            <div className="pt-3 space-y-2">
              <div className="text-sm font-medium">Presets</div>
              <div className="flex flex-wrap gap-2">
                {CANVAS_PRESETS.map((preset) => (
                  <Tooltip key={preset.label}>
                    <Button
                      intent="outline"
                      size="sm"
                      onPress={() => applyPreset(preset.width, preset.height)}
                      className="justify-between"
                    >
                      <span>{preset.label}</span>
                    </Button>
                    <Tooltip.Content>
                      {preset.width}×{preset.height}
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
