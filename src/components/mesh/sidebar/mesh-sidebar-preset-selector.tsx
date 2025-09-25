"use client";

import { Button, ButtonPrimitive } from "@/components/ui/button";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { Label } from "@/components/ui/field";

import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { configPreset } from "@/lib/config/config.preset";
import { cx } from "@/lib/primitive";
import { trackEvent } from "@/lib/tracking";
import { useMeshStore } from "@/store/store-mesh";
import type { RgbHex } from "@/types/types.mesh";
import { IconSparklesTwo, IconTrash } from "@intentui/icons";
import { useCallback, useState } from "react";
import type { Key } from "react-aria-components";
import { useLocalStorage } from "usehooks-ts";
// Type for user presets
interface UserPreset {
  title: string;
  config: {
    palette: RgbHex[];
    shapes: {
      id: string;
      points: { x: number; y: number }[];
      fillIndex: number;
    }[];
  };
  isUserPreset: true;
}

// Custom hook for managing user presets
const useUserPresets = () => {
  const [userPresets, setUserPresets] = useLocalStorage<UserPreset[]>(
    "mesh-user-presets",
    []
  );

  const saveUserPreset = useCallback(
    (name: string, config: UserPreset["config"]) => {
      const newPreset: UserPreset = {
        title: name,
        config,
        isUserPreset: true,
      };

      const updatedPresets = [...userPresets, newPreset];
      setUserPresets(updatedPresets);

      try {
        localStorage.setItem(
          "mesh-user-presets",
          JSON.stringify(updatedPresets)
        );
      } catch (error) {
        console.error("Failed to save user preset:", error);
      }

      return newPreset;
    },
    [userPresets]
  );

  const deleteUserPreset = useCallback(
    (title: string) => {
      const updatedPresets = userPresets.filter(
        (preset: UserPreset) => preset.title !== title
      );
      setUserPresets(updatedPresets);

      try {
        localStorage.setItem(
          "mesh-user-presets",
          JSON.stringify(updatedPresets)
        );
      } catch (error) {
        console.error("Failed to delete user preset:", error);
      }
    },
    [userPresets]
  );

  return { userPresets, saveUserPreset, deleteUserPreset };
};

export const MeshSidebarPresetSelector = () => {
  const { setPalette, setShapes, shapes, palette } = useMeshStore();
  const { userPresets } = useUserPresets();

  // Combine built-in presets with user presets
  const allPresets = [...configPreset, ...userPresets];

  const applyPreset = (key: Key | null) => {
    const preset = allPresets.find((p) => p.title === key);
    if (!preset) return;
    // Apply the preset configuration
    setPalette(preset.config.palette as RgbHex[]);
    setShapes(preset.config.shapes);

    trackEvent(
      "Apply Preset",
      {
        preset_name: preset.title,
        is_user_preset: "isUserPreset" in preset ? preset.isUserPreset : false,
      },
      true
    );
  };

  const findSelectedPreset = (): Key | null => {
    for (const preset of allPresets) {
      // Check if palette matches
      const paletteMatches = preset.config.palette.every(
        (color: { color: string; id: string }) =>
          palette.some((p) => p.color === color.color)
      );

      // Check if shapes match (compare shape points and fillIndex)
      const shapesMatch =
        preset.config.shapes.length === shapes.length &&
        preset.config.shapes.every(
          (
            presetShape: {
              fillIndex: number;
              points: { x: number; y: number }[];
            },
            index: number
          ) => {
            const currentShape = shapes[index];
            if (!currentShape) return false;

            // Check if fillIndex matches
            if (presetShape.fillIndex !== currentShape.fillIndex) return false;

            // Check if all points match (with some tolerance for floating point)
            if (presetShape.points.length !== currentShape.points.length)
              return false;

            return presetShape.points.every(
              (presetPoint: { x: number; y: number }, pointIndex: number) => {
                const currentPoint = currentShape.points[pointIndex];
                if (!currentPoint) return false;

                const tolerance = 0.1; // Small tolerance for floating point comparison
                return (
                  Math.abs(presetPoint.x - currentPoint.x) < tolerance &&
                  Math.abs(presetPoint.y - currentPoint.y) < tolerance
                );
              }
            );
          }
        );

      if (paletteMatches && shapesMatch) {
        return preset.title;
      }
    }

    return null;
  };

  const selectedPresetKey = findSelectedPreset();

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <SelectHeader selectedPresetKey={selectedPresetKey} />
        <Select
          id="preset"
          selectedKey={selectedPresetKey}
          onSelectionChange={(key) => applyPreset(key)}
          aria-label="Presets"
          placeholder="Apply predefined preset"
        >
          <Select.Trigger />
          <Select.Content items={allPresets}>
            {(item) => {
              const isUserPreset =
                "isUserPreset" in item && item.isUserPreset === true;
              return (
                <Select.Item
                  id={item.title}
                  textValue={item.title}
                  className={"w-full"}
                >
                  <div className="flex justify-between w-full gap-4 font-medium text-sm flex-1 text-nowrap">
                    <div className="flex items-center gap-1">
                      {isUserPreset && <IconSparklesTwo />}
                      <Select.Label className="flex-1">
                        {item.title}
                      </Select.Label>
                    </div>
                    <div className="flex items-center">
                      {item.config.palette.map(
                        (color: { color: string; id: string }) => (
                          <ColorSwatch
                            key={color.id}
                            className="size-4 first:ml-0 -mx-0.5"
                            color={color.color}
                          />
                        )
                      )}
                    </div>
                  </div>
                </Select.Item>
              );
            }}
          </Select.Content>
        </Select>
      </div>
    </div>
  );
};

const SelectHeader = ({
  selectedPresetKey,
}: {
  selectedPresetKey: Key | null;
}) => {
  const { setPalette, setShapes, shapes, palette } = useMeshStore();
  const { userPresets, saveUserPreset } = useUserPresets();
  const [presetName, setPresetName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset = saveUserPreset(presetName.trim(), {
      palette: [...palette],
      shapes: [...shapes],
    });

    // Apply the newly saved preset
    setPalette(newPreset.config.palette as RgbHex[]);
    setShapes(newPreset.config.shapes);

    // Reset form
    setPresetName("");

    trackEvent(
      "Save Custom Preset",
      {
        preset_name: newPreset.title,
      },
      true
    );
  };

  return (
    <div className="flex justify-between items-center">
      <Label for="preset">Preset</Label>
      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <ButtonPrimitive
          isDisabled={!!selectedPresetKey}
          className={cx(["data-[disabled]:opacity-50"])}
        >
          Add to preset
        </ButtonPrimitive>
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>Save Custom Preset</Modal.Title>
            <Modal.Description>
              Give your current configuration a name to save it as a reusable
              preset.
            </Modal.Description>
          </Modal.Header>

          <Modal.Body>
            <TextField
              label="Preset name"
              value={presetName}
              onChange={setPresetName}
              placeholder="Enter a name for your preset..."
              autoFocus
            />
          </Modal.Body>

          <Modal.Footer>
            <Modal.Close>Cancel</Modal.Close>
            <Modal.Close
              onClick={handleSavePreset}
              isDisabled={!presetName.trim()}
            >
              Save Preset
            </Modal.Close>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </div>
  );
};
