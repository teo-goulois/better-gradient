import { CallToAction } from "@/components/shared/call-to-action";
import { DEFAULT_CANVAS, DEFAULT_FILTERS } from "@/lib/config/config.mesh";
import { svgDataUrl, svgStringFromState } from "@/lib/mesh-svg";
import { generateShapes } from "@/lib/utils/utils.mesh";
import type { CompositionMood } from "@/lib/utils/utils.mesh";
import type { BlobShape, CanvasSettings, Filters, RgbHex } from "@/types/types.mesh";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

const MOODS: CompositionMood[] = [
  "balanced",
  "centered",
  "diagonal",
  "corner",
  "horizon",
  "orbit",
  "triad",
];

const PALETTE_PRESETS: RgbHex[][] = [
  [
    { id: "p1-0", color: "#ffffff" },
    { id: "p1-1", color: "#609EFF" },
    { id: "p1-2", color: "#FCB055" },
    { id: "p1-3", color: "#FB847C" },
    { id: "p1-4", color: "#B6B8FD" },
  ],
  [
    { id: "p2-0", color: "#ffffff" },
    { id: "p2-1", color: "#6E95BC" },
    { id: "p2-2", color: "#8391B8" },
    { id: "p2-3", color: "#DB7E56" },
  ],
  [
    { id: "p3-0", color: "#ffffff" },
    { id: "p3-1", color: "#609EFF" },
    { id: "p3-2", color: "#FCB055" },
    { id: "p3-3", color: "#FCECD1" },
    { id: "p3-4", color: "#C6EFFE" },
    { id: "p3-5", color: "#B6B8FD" },
  ],
  [
    { id: "p4-0", color: "#F0F4FF" },
    { id: "p4-1", color: "#A78BFA" },
    { id: "p4-2", color: "#F472B6" },
    { id: "p4-3", color: "#38BDF8" },
    { id: "p4-4", color: "#34D399" },
  ],
  [
    { id: "p5-0", color: "#FFF7ED" },
    { id: "p5-1", color: "#FB923C" },
    { id: "p5-2", color: "#F43F5E" },
    { id: "p5-3", color: "#E879F9" },
    { id: "p5-4", color: "#FBBF24" },
  ],
  [
    { id: "p6-0", color: "#F0FDFA" },
    { id: "p6-1", color: "#2DD4BF" },
    { id: "p6-2", color: "#3B82F6" },
    { id: "p6-3", color: "#818CF8" },
    { id: "p6-4", color: "#06B6D4" },
  ],
];

type GeneratedGradient = {
  seed: string;
  shapes: BlobShape[];
  palette: RgbHex[];
  filters: Filters;
  canvas: CanvasSettings;
  dataUrl: string;
  cssCode: string;
};

function generateRandomGradient(seed: string): GeneratedGradient {
  const palette = PALETTE_PRESETS[Math.abs(hashCode(seed)) % PALETTE_PRESETS.length];
  const canvas = DEFAULT_CANVAS;
  const filters = DEFAULT_FILTERS;
  const count = 5 + (Math.abs(hashCode(seed + "-count")) % 4); // 5-8 shapes
  const shapes = generateShapes({ seed, count, canvas, palette });
  const state = { shapes, palette, filters, canvas };
  const svg = svgStringFromState({ ...state, outputSize: { width: 480, height: 300 } });
  const dataUrl = svgDataUrl(svg);
  const fullSvg = svgStringFromState(state);
  const cssCode = `background-image: url("${svgDataUrl(fullSvg)}");\nbackground-size: cover;\nbackground-position: center;`;
  return { seed, shapes, palette, filters, canvas, dataUrl, cssCode };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Random Gradient Generator — Better Gradient",
  description:
    "Generate random mesh gradients instantly. Click to randomize colors, shapes, and compositions. Export to PNG, WebP, SVG, or CSS. Free, no signup required.",
  url: "https://better-gradient.com/random-gradient",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Organization",
    name: "Better Gradient",
  },
  featureList: [
    "Random mesh gradient generation",
    "One-click randomize",
    "Multiple composition moods",
    "Export to PNG, WebP, SVG, CSS",
    "No signup required",
    "Free to use",
  ],
};

export const Route = createFileRoute("/_pages/random-gradient")({
  component: RandomGradientPage,
  head: () => ({
    meta: [
      {
        title:
          "Random Gradient Generator — Free Random Mesh Gradients | Better Gradient",
      },
      {
        name: "description",
        content:
          "Generate random mesh gradients instantly. Click to randomize colors, shapes, and compositions. Export to PNG, WebP, SVG, or CSS. Free, no signup required.",
      },
      {
        name: "keywords",
        content:
          "random gradient generator, random gradient, random mesh gradient, gradient randomizer, random color gradient, generate random gradient",
      },
      {
        property: "og:title",
        content: "Random Gradient Generator | Better Gradient",
      },
      {
        property: "og:description",
        content:
          "Generate random mesh gradients instantly. Click to randomize and export to PNG, WebP, SVG, or CSS.",
      },
      {
        property: "og:url",
        content: "https://better-gradient.com/random-gradient",
      },
      {
        property: "og:image",
        content: "https://better-gradient.com/og-image.png",
      },
      {
        name: "twitter:title",
        content: "Random Gradient Generator | Better Gradient",
      },
      {
        name: "twitter:description",
        content:
          "Generate random mesh gradients instantly. Click to randomize and export to PNG, WebP, SVG, or CSS.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://better-gradient.com/random-gradient",
      },
    ],
  }),
});

function RandomGradientPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMood, setSelectedMood] = useState<CompositionMood | "random">(
    "random"
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const gridGradients = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => {
      const moodSuffix =
        selectedMood === "random" ? "" : `-mood-${selectedMood}`;
      const seed = `rng-${refreshKey}-${i}${moodSuffix}`;
      return generateRandomGradient(seed);
    });
  }, [refreshKey, selectedMood]);

  const featured = gridGradients[selectedIndex];

  const featuredSvg = useMemo(() => {
    if (!featured) return "";
    return svgDataUrl(
      svgStringFromState({
        shapes: featured.shapes,
        palette: featured.palette,
        filters: featured.filters,
        canvas: featured.canvas,
        outputSize: { width: 960, height: 540 },
      })
    );
  }, [featured]);

  const handleRandomizeAll = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setSelectedIndex(0);
  }, []);

  const handleCopyCSS = useCallback(async () => {
    if (!featured) return;
    await navigator.clipboard.writeText(featured.cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [featured]);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="flex-1 w-full bg-bg">
        <div className="container max-w-5xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="max-w-3xl">
            <h1 className="font-nohemi text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900">
              Random Gradient Generator
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              Generate beautiful random mesh gradients with one click. Customize
              the mood, randomize shapes and colors, then export to PNG, WebP,
              SVG, or CSS.
            </p>
          </div>

          {/* Featured Gradient Preview */}
          <section className="mt-10">
            <div className="overflow-hidden border border-neutral-200 bg-white">
              <div className="aspect-video">
                {featuredSvg && (
                  <img
                    src={featuredSvg}
                    alt="Featured random mesh gradient preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Controls */}
              <div className="p-4 border-t border-neutral-200 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRandomizeAll}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium hover:scale-105 transition-transform"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <title>Randomize</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Randomize
                </button>

                <button
                  type="button"
                  onClick={handleCopyCSS}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  {copied ? "Copied!" : "Copy CSS"}
                </button>

                <Link
                  to="/editor"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Open in Editor
                </Link>

                {/* Mood Selector */}
                <div className="ml-auto flex items-center gap-2">
                  <label
                    htmlFor="mood-select"
                    className="text-sm text-neutral-500"
                  >
                    Mood
                  </label>
                  <select
                    id="mood-select"
                    value={selectedMood}
                    onChange={(e) => {
                      setSelectedMood(
                        e.target.value as CompositionMood | "random"
                      );
                      setRefreshKey((k) => k + 1);
                      setSelectedIndex(0);
                    }}
                    className="border border-neutral-200 text-sm px-3 py-2 text-neutral-700"
                  >
                    <option value="random">Random</option>
                    {MOODS.map((mood) => (
                      <option key={mood} value={mood}>
                        {mood.charAt(0).toUpperCase() + mood.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Grid of Gradients */}
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-nohemi text-2xl font-semibold text-neutral-900">
                More Random Gradients
              </h2>
              <button
                type="button"
                onClick={handleRandomizeAll}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Generate More
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridGradients.map((gradient, i) => (
                <button
                  key={gradient.seed}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  className={`group text-left bg-white border transition-all overflow-hidden ${
                    selectedIndex === i
                      ? "border-black ring-1 ring-black"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={gradient.dataUrl}
                      alt={`Random mesh gradient variation ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="p-3 border-t border-neutral-200">
                    <span className="text-sm text-neutral-600">
                      {gradient.shapes.length} shapes &bull;{" "}
                      {gradient.palette.length} colors
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* CTA */}
          <CallToAction
            className="mt-16"
            title="Fine-Tune Your Gradient"
            description="Found a gradient you like? Open it in the full editor to adjust colors, shapes, blur, and more. Export in any format."
            buttonText="Open Gradient Editor"
            buttonLink="/editor"
          />

          {/* SEO Content */}
          <section className="mt-16 max-w-3xl">
            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              What is a Random Gradient Generator?
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              A random gradient generator creates unique mesh gradient
              backgrounds by randomly combining colors, shapes, and
              compositions. Unlike simple linear gradients, mesh gradients blend
              multiple colored shapes with blur effects to produce organic,
              flowing color transitions. Each click generates a completely new
              design, making it perfect for discovering unexpected color
              combinations and compositions.
            </p>

            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              How to Use This Tool
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              Click the &ldquo;Randomize&rdquo; button to generate a new batch
              of random gradients instantly. Use the mood selector to guide the
              composition style &mdash; choose from balanced, centered, diagonal,
              corner, horizon, orbit, or triad layouts. Click any gradient in the
              grid to preview it in the large view. When you find a gradient you
              like, copy the CSS code directly or open it in the full editor for
              fine-tuning. You can also export it as PNG, WebP, or SVG from the
              editor.
            </p>

            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              Export Formats
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              Every random gradient can be exported in multiple formats: PNG for
              images and social media, WebP for optimized web use, SVG for
              scalable vector graphics, or CSS code to paste directly into your
              stylesheets. All gradients are free to use in both personal and
              commercial projects.
            </p>

            <p className="text-neutral-600 leading-relaxed">
              You can also try our{" "}
              <Link
                to="/text-gradient"
                className="text-blue-600 hover:underline"
              >
                Text Gradient Generator
              </Link>{" "}
              to apply mesh gradients to text, or our{" "}
              <Link
                to="/tailwind-gradient"
                className="text-blue-600 hover:underline"
              >
                Tailwind Gradient Generator
              </Link>{" "}
              to get Tailwind-ready code.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
