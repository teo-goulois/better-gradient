"use client";

import { IconDownload } from "@intentui/icons";
import { Button } from "../ui/button";
import { Popover } from "../ui/popover";
import { useMeshStore } from "@/store/store-mesh";
import {
  generateNoisePngDataUri,
  svgDataUrl,
  svgStringFromState,
  svgToPngDataUrl,
} from "@/lib/mesh-svg";

type Props = {};

export const MeshExports = ({}: Props) => {
  const { canvas, shapes, palette, filters, ui, toShareString } =
    useMeshStore();
  return (
    <div className="absolute top-0 right-0 p-1 rounded-lg bg-bg z-50 shadow">
      <Popover>
        <Button>
          {" "}
          <IconDownload /> Export
        </Button>
        <Popover.Content className="sm:min-w-72">
          <Popover.Header>
            <Popover.Title>Export options</Popover.Title>
          </Popover.Header>
          <Popover.Body className="flex flex-col gap-2">
            <Button
              intent="outline"
              onPress={async () => {
                const svg = svgStringFromState({
                  canvas,
                  shapes,
                  palette,
                  filters,
                  outputSize: {
                    width: ui.frameWidth ?? canvas.width,
                    height: ui.frameHeight ?? canvas.height,
                  },
                });
                const data = svgDataUrl(svg);
                const css = `background-image: url("${data}");\nbackground-size: cover;\nbackground-position: center;`;
                await navigator.clipboard.writeText(css);
              }}
            >
              Copy CSS
            </Button>
            <Button
              intent="outline"
              onPress={() => {
                const svg = svgStringFromState({
                  canvas,
                  shapes,
                  palette,
                  filters,
                  outputSize: {
                    width: ui.frameWidth ?? canvas.width,
                    height: ui.frameHeight ?? canvas.height,
                  },
                });
                const blob = new Blob([svg], { type: "image/svg+xml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "mesh.svg";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download SVG
            </Button>
            <Button
              intent="outline"
              onPress={async () => {
                const outputSize = {
                  width: ui.frameWidth ?? canvas.width,
                  height: ui.frameHeight ?? canvas.height,
                };
                const noise = filters.grainEnabled
                  ? generateNoisePngDataUri(64, 0.35)
                  : undefined;
                const svg = svgStringFromState({
                  canvas,
                  shapes,
                  palette,
                  filters,
                  outputSize,
                  noiseDataUri: noise,
                });
                const url = await svgToPngDataUrl(svg, {
                  ...outputSize,
                  scale: 1,
                });
                const a = document.createElement("a");
                a.href = url;
                a.download = "mesh.png";
                a.click();
              }}
            >
              Download PNG
            </Button>
            <Button
              intent="outline"
              onPress={async () => {
                const share = toShareString();
                await navigator.clipboard.writeText(
                  `${location.origin}/share/${share}`
                );
              }}
            >
              Copy Share URL
            </Button>
          </Popover.Body>
          <Popover.Footer></Popover.Footer>
        </Popover.Content>
      </Popover>
    </div>
  );
};
