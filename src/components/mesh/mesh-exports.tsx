"use client";
import { saveGradientToDb } from "@/lib/actions/actions.gradient";
import {
  svgDataUrl,
  svgStringFromState,
  svgToPngDataUrl,
  svgToWebpDataUrl,
} from "@/lib/mesh-svg";
import { trackEvent } from "@/lib/tracking";
import { useMeshStore } from "@/store/store-mesh";
import { IconCheck, IconDownload, IconGalleryFill } from "@intentui/icons";
import type { SVGProps } from "react";
import { useState } from "react";
import { twJoin } from "tailwind-merge";
import { Button, ButtonPrimitive } from "../ui/button";
import { Popover } from "../ui/popover";
import { Separator } from "../ui/separator";

type Props = {
  outerRef: { current: HTMLDivElement | null };
  contentRef?: { current: HTMLDivElement | null };
};

export const MeshExports = ({ outerRef, contentRef }: Props) => {
  const canvas = useMeshStore((state) => state.canvas);
  const shapes = useMeshStore((state) => state.shapes);
  const palette = useMeshStore((state) => state.palette);
  const filters = useMeshStore((state) => state.filters);
  const toShareString = useMeshStore((state) => state.toShareString);

  const [feedbackStates, setFeedbackStates] = useState<Record<string, boolean>>(
    {}
  );

  const showFeedback = (action: string) => {
    setFeedbackStates((prev) => ({ ...prev, [action]: true }));
    setTimeout(() => {
      setFeedbackStates((prev) => ({ ...prev, [action]: false }));
    }, 1500);
  };

  const persist = async (format: "png" | "webp" | "svg" | "css" | "share") => {
    const width = contentRef?.current?.clientWidth ?? canvas.width;
    const height = contentRef?.current?.clientHeight ?? canvas.height;
    const share = toShareString();
    await saveGradientToDb({
      data: {
        share,
        width,
        height,
        shapesCount: shapes.length,
        colorsCount: palette.length,
        format,
      },
    });
  };

  const downloadPng = async () => {
    const w = canvas.width;
    const h = canvas.height;
    const outputSize = {
      width: w,
      height: h,
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
    showFeedback("png");
    trackEvent("Export PNG", {
      width: w,
      height: h,
      shapes_count: shapes.length,
      colors_count: palette.length,
    });
    persist("png");
  };

  const downloadWebp = async () => {
    const w = canvas.width;
    const h = canvas.height;
    const outputSize = {
      width: w,
      height: h,
    };
    const svg = svgStringFromState({
      canvas,
      shapes,
      palette,
      filters,
      outputSize,
    });
    const url = await svgToWebpDataUrl(svg, {
      ...outputSize,
      scale: 1,
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = "mesh.webp";
    a.click();
    showFeedback("webp");
    trackEvent("Export WebP", {
      width: w,
      height: h,
      shapes_count: shapes.length,
      colors_count: palette.length,
    });
    persist("webp");
  };

  const downloadSvg = () => {
    const width = contentRef?.current?.clientWidth ?? canvas.width;
    const height = contentRef?.current?.clientHeight ?? canvas.height;
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
    showFeedback("svg");
    trackEvent("Export SVG", {
      width,
      height,
      shapes_count: shapes.length,
      colors_count: palette.length,
    });
    persist("svg");
  };

  const copyCss = async () => {
    const width = contentRef?.current?.clientWidth ?? canvas.width;
    const height = contentRef?.current?.clientHeight ?? canvas.height;
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
    showFeedback("css");
    trackEvent("Copy CSS", {
      width,
      height,
      shapes_count: shapes.length,
      colors_count: palette.length,
    });
    persist("css");
  };

  const copyShareUrl = async () => {
    const share = toShareString();
    await navigator.clipboard.writeText(`${location.origin}/share/${share}`);
    showFeedback("share");
    trackEvent("Copy Share URL", {
      shapes_count: shapes.length,
      colors_count: palette.length,
    });
    persist("share");
  };

  return (
    <div className="absolute top-0 right-0 p-1 rounded-lg bg-bg z-50 shadow">
      <Popover>
        <Button>
          <IconDownload /> Export
        </Button>
        <Popover.Content className="sm:min-w-72">
          <Popover.Header className="p-3">
            <Popover.Title>Export options</Popover.Title>
          </Popover.Header>
          <Separator />
          <Popover.Body className="flex flex-col gap-2 p-3">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-fg">Export</p>
              <div className="flex flex-col gap-2">
                <ButtonPrimitive
                  onPress={downloadPng}
                  className={twJoin(
                    "flex gap-3 items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                    "data-[hovered=true]:bg-primary/10",
                    feedbackStates.png && "bg-primary/20 scale-[0.98]"
                  )}
                >
                  <div
                    className={twJoin(
                      "rounded-full p-1.5 transition-all duration-200",
                      feedbackStates.png
                        ? "bg-primary/30 text-primary"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {feedbackStates.png ? (
                      <IconCheck className="size-6" />
                    ) : (
                      <IconGalleryFill className="size-6" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0 items-start">
                    <p className="font-semibold">
                      {feedbackStates.png ? "Downloaded!" : "PNG"}
                    </p>
                    <p className="text-sm text-muted-fg">for web</p>
                  </div>
                </ButtonPrimitive>
                <ButtonPrimitive
                  onPress={downloadWebp}
                  className={twJoin(
                    "flex gap-3 items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                    "data-[hovered=true]:bg-blue-500/10",
                    feedbackStates.webp && "bg-blue-500/20 scale-[0.98]"
                  )}
                >
                  <div
                    className={twJoin(
                      "rounded-full p-1.5 transition-all duration-200",
                      feedbackStates.webp
                        ? "bg-blue-500/30 text-blue-500"
                        : "bg-blue-500/20 text-blue-500"
                    )}
                  >
                    {feedbackStates.webp ? (
                      <IconCheck className="size-6" />
                    ) : (
                      <IconGalleryFill className="size-6" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0 items-start">
                    <p className="font-semibold">
                      {feedbackStates.webp ? "Downloaded!" : "WebP"}
                    </p>
                    <p className="text-sm text-muted-fg">smaller size</p>
                  </div>
                </ButtonPrimitive>
                <ButtonPrimitive
                  onPress={downloadSvg}
                  className={twJoin(
                    "flex gap-3 items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                    "data-[hovered=true]:bg-purple-500/10",
                    feedbackStates.svg && "bg-purple-500/20 scale-[0.98]"
                  )}
                >
                  <div
                    className={twJoin(
                      "rounded-full p-1.5 transition-all duration-200",
                      feedbackStates.svg
                        ? "bg-purple-500/30 text-purple-500"
                        : "bg-purple-500/20 text-purple-500"
                    )}
                  >
                    {feedbackStates.svg ? (
                      <IconCheck className="size-6" />
                    ) : (
                      <HugeiconsSvg01 className="size-6" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0 items-start">
                    <p className="font-semibold">
                      {feedbackStates.svg ? "Downloaded!" : "SVG"}
                    </p>
                    <p className="text-sm text-muted-fg">for print</p>
                  </div>
                </ButtonPrimitive>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-fg">Dev</p>
              <div className="flex flex-col gap-2">
                <ButtonPrimitive
                  onPress={copyCss}
                  className={twJoin(
                    "flex gap-3 items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                    "data-[hovered=true]:bg-orange-500/10",
                    feedbackStates.css && "bg-orange-500/20 scale-[0.98]"
                  )}
                >
                  <div
                    className={twJoin(
                      "rounded-full p-1.5 transition-all duration-200",
                      feedbackStates.css
                        ? "bg-orange-500/30 text-orange-500"
                        : "bg-orange-500/20 text-orange-500"
                    )}
                  >
                    {feedbackStates.css ? (
                      <IconCheck className="size-6" />
                    ) : (
                      <HugeiconsSvg01 className="size-6" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0 items-start">
                    <p className="font-semibold">
                      {feedbackStates.css ? "Copied!" : "CSS"}
                    </p>
                    <p className="text-sm text-muted-fg">Copy CSS</p>
                  </div>
                </ButtonPrimitive>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-fg">Share</p>
              <div className="flex flex-col gap-2">
                <ButtonPrimitive
                  onPress={copyShareUrl}
                  className={twJoin(
                    "flex gap-3 items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                    "data-[hovered=true]:bg-green-500/10",
                    feedbackStates.share && "bg-green-500/20 scale-[0.98]"
                  )}
                >
                  <div
                    className={twJoin(
                      "rounded-full p-1.5 transition-all duration-200",
                      feedbackStates.share
                        ? "bg-green-500/30 text-green-500"
                        : "bg-green-500/20 text-green-500"
                    )}
                  >
                    {feedbackStates.share ? (
                      <IconCheck className="size-6" />
                    ) : (
                      <HugeiconsSvg01 className="size-6" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0 items-start text-left">
                    <p className="font-semibold">
                      {feedbackStates.share ? "Copied!" : "Share URL"}
                    </p>
                    <p className="text-sm text-muted-fg">share with others</p>
                  </div>
                </ButtonPrimitive>
              </div>
            </div>
          </Popover.Body>
        </Popover.Content>
      </Popover>
    </div>
  );
};

export function HugeiconsSvg01(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <title>Huge Icons</title>
      {/* Icon from Huge Icons by Hugeicons - undefined */}
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        color="currentColor"
      >
        <path d="M3.5 13v-.804c0-2.967 0-4.45.469-5.636c.754-1.905 2.348-3.407 4.37-4.118C9.595 2 11.168 2 14.318 2c1.798 0 2.698 0 3.416.253c1.155.406 2.066 1.264 2.497 2.353c.268.677.268 1.525.268 3.22V13" />
        <path d="M3.5 12a3.333 3.333 0 0 1 3.333-3.333c.666 0 1.451.116 2.098-.057a1.67 1.67 0 0 0 1.179-1.18c.173-.647.057-1.432.057-2.098A3.333 3.333 0 0 1 13.5 2m.509 14l-1.673 4.695c-.31.87-.465 1.305-.71 1.305s-.4-.435-.71-1.305L9.242 16M20.5 17c-.09-1.018-.913-1-1.781-1c-.85 0-1.276 0-1.54.293s-.264.764-.264 1.707v2c0 .943 0 1.414.264 1.707s.69.293 1.54.293s1.275 0 1.54-.293c.264-.293.264-.764.264-1.707c0-.704-1.353-.5-1.353-.5M6.04 16H4.93c-.444 0-.666 0-.842.076c-.596.26-.588.869-.588 1.424s-.008 1.165.588 1.424c.176.076.398.076.842.076s.666 0 .841.076c.597.26.589.869.589 1.424s.008 1.165-.589 1.424C5.596 22 5.374 22 4.93 22H3.72" />
      </g>
    </svg>
  );
}
