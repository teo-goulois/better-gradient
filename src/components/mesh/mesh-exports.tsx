"use client";
import { IconDownload } from "@intentui/icons";
import { Button } from "../ui/button";
import { Popover } from "../ui/popover";
import { useMeshStore } from "@/store/store-mesh";
import {
  svgDataUrl,
  svgStringFromState,
  svgToPngDataUrl,
} from "@/lib/mesh-svg";
import { toPng } from "html-to-image";

type Props = {
  outerRef: { current: HTMLDivElement | null };
  contentRef?: { current: HTMLDivElement | null };
};

export const MeshExports = ({ outerRef, contentRef }: Props) => {
  const { canvas, shapes, palette, filters, ui, toShareString } =
    useMeshStore();
  const downloadViewPng = async () => {
    const node = contentRef?.current ?? outerRef.current;
    if (!node) return;
    // Capture exactly what is rendered inside outerRef
    const dataUrl = await toPng(node, {
      pixelRatio: 1,
      cacheBust: true,
      style: {
        // Ensure current size is used
        width: `${node.clientWidth}px`,
        height: `${node.clientHeight}px`,
      },
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "mesh-view.png";
    a.click();
  };
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
            <Button intent="outline" onPress={downloadViewPng}>
              Download View (PNG)
            </Button>
            <Button
              intent="outline"
              onPress={async () => {
                const width =
                  contentRef?.current?.clientWidth ??
                  ui.frameWidth ??
                  canvas.width;
                const height =
                  contentRef?.current?.clientHeight ??
                  ui.frameHeight ??
                  canvas.height;
                const svg = svgStringFromState({
                  canvas,
                  shapes,
                  palette,
                  filters,
                  outputSize: { width, height },
                });
                const data = svgDataUrl(svg);
                const css = `background-image: url("${data}");\nbackground-size: 100% 100%;\nbackground-repeat: no-repeat;`;
                await navigator.clipboard.writeText(css);
              }}
            >
              Copy CSS
            </Button>
            <Button
              intent="outline"
              onPress={() => {
                const width =
                  contentRef?.current?.clientWidth ??
                  ui.frameWidth ??
                  canvas.width;
                const height =
                  contentRef?.current?.clientHeight ??
                  ui.frameHeight ??
                  canvas.height;
                const svg = svgStringFromState({
                  canvas,
                  shapes,
                  palette,
                  filters,
                  outputSize: { width, height },
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
                  width:
                    contentRef?.current?.clientWidth ??
                    ui.frameWidth ??
                    canvas.width,
                  height:
                    contentRef?.current?.clientHeight ??
                    ui.frameHeight ??
                    canvas.height,
                };
                const svg = svgStringFromState({
                  canvas,
                  shapes,
                  palette,
                  filters,
                  outputSize,
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
