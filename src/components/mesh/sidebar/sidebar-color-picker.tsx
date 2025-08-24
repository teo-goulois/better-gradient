import { IconEyeDropper, IconX } from "@intentui/icons";
import { parseColor } from "@react-stately/color";
import { use } from "react";
import {
  ColorPicker as ColorPickerPrimitive,
  type ColorPickerProps as ColorPickerPrimitiveProps,
  ColorPickerStateContext,
} from "react-aria-components";
import { twJoin, twMerge } from "tailwind-merge";
import { Button } from "@/components/ui/button";
import { ColorArea } from "@/components/ui/color-area";
import { ColorField } from "@/components/ui/color-field";
import { ColorSlider } from "@/components/ui/color-slider";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { Description } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  type PopoverContentProps,
} from "@/components/ui/popover";

interface SidebarColorPickerProps
  extends ColorPickerPrimitiveProps,
    Pick<PopoverContentProps, "placement"> {
  label?: string;
  className?: string;
  children?: React.ReactNode;
  showArrow?: boolean;
  isDisabled?: boolean;
  description?: string;
  eyeDropper?: boolean;
  onRemove?: () => void;
  divProps?: React.HTMLAttributes<HTMLDivElement>;
}

const SidebarColorPicker = ({
  showArrow = false,
  placement = "bottom start",
  label,
  isDisabled,
  children,
  description,
  eyeDropper,
  className,
  onRemove,
  divProps,
  ...props
}: SidebarColorPickerProps) => {
  return (
    <div className={twMerge("flex flex-col items-start gap-y-1", className)}>
      <ColorPickerPrimitive {...props}>
        <Popover>
          <Popover.Trigger>
            <div className="relative group">
              <Button
                isDisabled={isDisabled}
                size={label ? "md" : "sq-sm"}
                intent="outline"
                isCircle
                className={twJoin(
                  "w-auto *:data-[slot=color-swatch]:size-9",
                  !label && "size-fit",
                  "p-0"
                )}
              >
                <ColorSwatch className="rounded-full" />
                {label && label}
              </Button>
              <Button
                isCircle
                size="sq-xxs"
                intent="secondary"
                className={twJoin(
                  "size-4",
                  "rounded-full",
                  "absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                )}
                onPress={onRemove}
              >
                <IconX className="size-2" />
              </Button>
            </div>
          </Popover.Trigger>
          <PopoverContent
            className="overflow-auto **:data-[slot=color-area]:w-full **:data-[slot=color-slider]:w-full sm:min-w-min sm:max-w-56 sm:**:data-[slot=color-area]:size-56 *:[[role=dialog]]:p-4 sm:*:[[role=dialog]]:p-3"
            showArrow={showArrow}
            placement={placement}
          >
            <div className="flex flex-col gap-y-1.5">
              {children || (
                <>
                  <ColorArea
                    colorSpace="hsb"
                    xChannel="saturation"
                    yChannel="brightness"
                  />
                  <ColorSlider
                    showOutput={false}
                    colorSpace="hsb"
                    channel="hue"
                  />
                  <div className="flex items-center gap-1.5">
                    {eyeDropper && <EyeDropper />}
                    <ColorField className="h-9" aria-label="Hex" />
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </ColorPickerPrimitive>
      {description && <Description>{description}</Description>}
    </div>
  );
};

declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
  }
}

const EyeDropper = () => {
  const state = use(ColorPickerStateContext)!;

  if (!window.EyeDropper) {
    return "EyeDropper is not supported in your browser.";
  }

  return (
    <Button
      aria-label="Eye dropper"
      size="sq-sm"
      intent="outline"
      onPress={() => {
        const eyeDropper = window.EyeDropper ? new window.EyeDropper() : null;
        eyeDropper
          ?.open()
          .then((result) => state.setColor(parseColor(result.sRGBHex)));
      }}
    >
      <IconEyeDropper />
    </Button>
  );
};

export type { SidebarColorPickerProps };
export { SidebarColorPicker, EyeDropper };
