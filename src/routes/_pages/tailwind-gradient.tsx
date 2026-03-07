import { CallToAction } from "@/components/shared/call-to-action";
import { DEFAULT_CANVAS, DEFAULT_FILTERS } from "@/lib/config/config.mesh";
import { svgDataUrl, svgStringFromState } from "@/lib/mesh-svg";
import { generateShapes } from "@/lib/utils/utils.mesh";
import type { RgbHex } from "@/types/types.mesh";
import { buildAbsoluteUrl, seo } from "@/utils/seo";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

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
    { id: "p3-0", color: "#F0F4FF" },
    { id: "p3-1", color: "#A78BFA" },
    { id: "p3-2", color: "#F472B6" },
    { id: "p3-3", color: "#38BDF8" },
    { id: "p3-4", color: "#34D399" },
  ],
  [
    { id: "p4-0", color: "#FFF7ED" },
    { id: "p4-1", color: "#FB923C" },
    { id: "p4-2", color: "#F43F5E" },
    { id: "p4-3", color: "#E879F9" },
    { id: "p4-4", color: "#FBBF24" },
  ],
  [
    { id: "p5-0", color: "#F0FDFA" },
    { id: "p5-1", color: "#2DD4BF" },
    { id: "p5-2", color: "#3B82F6" },
    { id: "p5-3", color: "#818CF8" },
    { id: "p5-4", color: "#06B6D4" },
  ],
  [
    { id: "p6-0", color: "#1a1a2e" },
    { id: "p6-1", color: "#e94560" },
    { id: "p6-2", color: "#0f3460" },
    { id: "p6-3", color: "#533483" },
    { id: "p6-4", color: "#16213e" },
  ],
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

type ExportFormat =
  | "inline-style"
  | "custom-css"
  | "react-component"
  | "tailwind-arbitrary";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Tailwind Gradient Generator — Better Gradient",
  description:
    "Generate beautiful mesh gradients and get ready-to-use Tailwind CSS code. Inline styles, custom CSS, or background images for Tailwind projects.",
  url: "https://better-gradient.com/tailwind-gradient",
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
    "Mesh gradient generation for Tailwind",
    "Inline style code output",
    "Custom CSS with Tailwind integration",
    "JSX/React style object output",
    "Multiple export formats",
    "No signup required",
    "Free to use",
  ],
};

export const Route = createFileRoute("/_pages/tailwind-gradient")({
  component: TailwindGradientPage,
  head: () => ({
    ...seo({
      title: "Tailwind Gradient Generator — Free Tailwind CSS Gradient Tool | Better Gradient",
      description: "Generate beautiful mesh gradients and get ready-to-use Tailwind CSS code. Copy inline styles, custom CSS, or use as background images in your Tailwind projects. Free, no signup.",
      keywords: "tailwind gradient generator, tailwind CSS gradient, tailwind background gradient, tailwind gradient colors, tailwind mesh gradient, tailwind gradient tool",
      url: buildAbsoluteUrl("/tailwind-gradient"),
      canonical: buildAbsoluteUrl("/tailwind-gradient"),
    }),
  }),
});

function TailwindGradientPage() {
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exportFormat, setExportFormat] =
    useState<ExportFormat>("inline-style");
  const [copied, setCopied] = useState(false);
  const [className, setClassName] = useState("mesh-gradient");

  const currentGradient = useMemo(() => {
    const palette = PALETTE_PRESETS[paletteIndex];
    const seed = `tw-gradient-${paletteIndex}-${refreshKey}`;
    const canvas = DEFAULT_CANVAS;
    const filters = DEFAULT_FILTERS;
    const count = 5 + (Math.abs(hashCode(seed + "-count")) % 3);
    const shapes = generateShapes({ seed, count, canvas, palette });
    const state = { shapes, palette, filters, canvas };
    const svg = svgStringFromState(state);
    const previewSvg = svgStringFromState({
      ...state,
      outputSize: { width: 960, height: 540 },
    });
    const dataUrl = svgDataUrl(svg);
    const previewDataUrl = svgDataUrl(previewSvg);
    return { shapes, palette, filters, canvas, dataUrl, previewDataUrl, svg };
  }, [paletteIndex, refreshKey]);

  const codeOutput = useMemo(() => {
    const { dataUrl } = currentGradient;

    switch (exportFormat) {
      case "inline-style":
        return `{/* Tailwind + inline style for mesh gradient */}
<div
  className="w-full h-64 bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: \`url("${dataUrl}")\`,
  }}
/>`;

      case "custom-css":
        return `/* Add this to your CSS file or globals.css */
@layer components {
  .${className} {
    background-image: url("${dataUrl}");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
}

{/* Then use it with Tailwind classes */}
<div className="${className} w-full h-64 rounded-lg" />`;

      case "react-component":
        return `// MeshGradient.tsx — Reusable React component
const gradientSvg = \`${currentGradient.svg}\`;

export function MeshGradient({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={\`bg-cover bg-center bg-no-repeat \${className}\`}
      style={{
        backgroundImage: \`url("data:image/svg+xml;utf8,\${encodeURIComponent(gradientSvg)}")\`,
      }}
    >
      {children}
    </div>
  );
}

{/* Usage */}
<MeshGradient className="w-full h-64 rounded-lg" />`;

      case "tailwind-arbitrary": {
        const encodedSvg = encodeURIComponent(currentGradient.svg)
          .replace(/'/g, "%27")
          .replace(/"/g, "%22");
        const arbitraryClass = `bg-[url('data:image/svg+xml;utf8,${encodedSvg}')]`;
        const displayClass =
          arbitraryClass.length > 200
            ? `${arbitraryClass.slice(0, 200)}...`
            : arbitraryClass;
        return `{/* Tailwind arbitrary value — works but very long! */}
{/* Recommended: use inline style or custom CSS class instead */}
<div className="${displayClass} bg-cover bg-center bg-no-repeat w-full h-64" />

{/* Note: The full class is ${arbitraryClass.length} characters long. */}
{/* For production, prefer the "Inline Style" or "Custom CSS" format. */}`;
      }

      default:
        return "";
    }
  }, [exportFormat, currentGradient, className]);

  const handleCopyCode = useCallback(async () => {
    await navigator.clipboard.writeText(codeOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeOutput]);

  const handleRandomize = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const gridPreviews = useMemo(() => {
    return PALETTE_PRESETS.map((palette, i) => {
      const seed = `tw-grid-${i}-${refreshKey}`;
      const canvas = DEFAULT_CANVAS;
      const filters = DEFAULT_FILTERS;
      const count = 5 + (Math.abs(hashCode(seed + "-count")) % 3);
      const shapes = generateShapes({ seed, count, canvas, palette });
      const svg = svgStringFromState({
        shapes,
        palette,
        filters,
        canvas,
        outputSize: { width: 480, height: 300 },
      });
      return {
        dataUrl: svgDataUrl(svg),
        paletteIndex: i,
        colors: palette.map((c) => c.color),
      };
    });
  }, [refreshKey]);

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
              Tailwind Gradient Generator
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              Generate beautiful mesh gradients for your Tailwind CSS projects.
              Pick a palette, preview live, and copy ready-to-use code — inline
              styles, custom CSS classes, or React components.
            </p>
          </div>

          {/* Gradient Preview */}
          <section className="mt-10">
            <div className="overflow-hidden border border-neutral-200 bg-white">
              <div className="aspect-video">
                {currentGradient.previewDataUrl && (
                  <img
                    src={currentGradient.previewDataUrl}
                    alt="Tailwind mesh gradient preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Controls */}
              <div className="p-4 border-t border-neutral-200 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRandomize}
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
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  {copied ? "Copied!" : "Copy Code"}
                </button>

                <Link
                  to="/editor"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Open in Editor
                </Link>
              </div>
            </div>
          </section>

          {/* Code Output Section */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-nohemi text-xl font-semibold text-neutral-900">
                Code Output
              </h2>
              {/* Format selector tabs */}
              <div className="flex border border-neutral-200 divide-x divide-neutral-200 text-sm">
                {(
                  [
                    { key: "inline-style", label: "Inline Style" },
                    { key: "custom-css", label: "Custom CSS" },
                    { key: "react-component", label: "React Component" },
                    { key: "tailwind-arbitrary", label: "Arbitrary Value" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setExportFormat(tab.key)}
                    className={`px-3 py-1.5 transition-colors ${
                      exportFormat === tab.key
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Class name input (only for custom-css format) */}
            {exportFormat === "custom-css" && (
              <div className="flex gap-3 items-center mb-3">
                <label
                  htmlFor="class-name"
                  className="text-sm text-neutral-500 shrink-0"
                >
                  Class name
                </label>
                <input
                  id="class-name"
                  type="text"
                  value={className}
                  onChange={(e) =>
                    setClassName(e.target.value.replace(/\s/g, "-"))
                  }
                  placeholder="mesh-gradient"
                  className="border border-neutral-200 text-sm px-3 py-2 text-neutral-700 font-mono"
                />
              </div>
            )}

            <div className="relative bg-neutral-900 text-neutral-100 p-4 font-mono text-sm overflow-x-auto max-h-[400px] overflow-y-auto">
              <pre className="whitespace-pre-wrap">
                <code>{codeOutput}</code>
              </pre>
              <button
                type="button"
                onClick={handleCopyCode}
                className="sticky top-0 float-right px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-xs text-neutral-200 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </section>

          {/* Palette Grid */}
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-nohemi text-2xl font-semibold text-neutral-900">
                Choose a Palette
              </h2>
              <button
                type="button"
                onClick={handleRandomize}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Refresh All
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {gridPreviews.map((preview) => (
                <button
                  key={preview.paletteIndex}
                  type="button"
                  onClick={() => setPaletteIndex(preview.paletteIndex)}
                  className={`group text-left bg-white border transition-all overflow-hidden ${
                    paletteIndex === preview.paletteIndex
                      ? "border-black ring-1 ring-black"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={preview.dataUrl}
                      alt={`Gradient palette ${preview.paletteIndex + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="p-2 border-t border-neutral-200 flex gap-1">
                    {preview.colors.slice(0, 5).map((color, ci) => (
                      <span
                        key={`${preview.paletteIndex}-${ci}`}
                        className="w-5 h-5 rounded-full border border-neutral-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* CTA */}
          <CallToAction
            className="mt-16"
            title="Full Gradient Editor"
            description="Need more control? Open the full editor to fine-tune colors, shapes, blur, grain, and export in any format — PNG, WebP, SVG, or CSS."
            buttonText="Open Gradient Editor"
            buttonLink="/editor"
          />

          {/* SEO Content */}
          <section className="mt-16 max-w-3xl">
            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              Why Mesh Gradients for Tailwind CSS?
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              Tailwind CSS provides utility classes for linear and radial
              gradients (<code>bg-gradient-to-r</code>,{" "}
              <code>from-blue-500</code>, <code>to-purple-600</code>), but these
              only support simple two or three-color transitions. Mesh gradients
              blend multiple colored shapes with blur effects to create organic,
              complex color transitions that are impossible to achieve with
              Tailwind&apos;s built-in gradient utilities alone.
            </p>

            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              How to Use Mesh Gradients in Tailwind Projects
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              This generator creates mesh gradients as SVG data URLs. Since
              Tailwind doesn&apos;t have utility classes for mesh gradients, the
              tool provides four ways to integrate them:{" "}
              <strong>inline styles</strong> for quick prototyping,{" "}
              <strong>custom CSS classes</strong> for reusable styles in your
              <code> globals.css</code>, <strong>React components</strong> for
              component-based architectures, and{" "}
              <strong>arbitrary values</strong> for one-off usage. Choose the
              format that best fits your project structure.
            </p>

            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              Inline Style vs Custom CSS Class
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              For most Tailwind projects, the <strong>inline style</strong>{" "}
              approach is the fastest — paste the JSX directly into your
              component. For reusable gradients across multiple components,
              create a <strong>custom CSS class</strong> inside{" "}
              <code>@layer components</code> in your <code>globals.css</code>{" "}
              file. This keeps your JSX clean and lets you combine the gradient
              class with other Tailwind utilities like <code>rounded-lg</code>,{" "}
              <code>shadow-xl</code>, or <code>p-8</code>.
            </p>

            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              Performance Considerations
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              Mesh gradients are rendered as SVG embedded in data URLs. For
              production use, consider saving the SVG as a static file and
              referencing it with a URL instead of inlining the data. This
              improves caching, reduces HTML size, and is better for performance.
              You can download the SVG file from the full editor and serve it
              from your <code>public/</code> directory or a CDN.
            </p>

            <p className="text-neutral-600 leading-relaxed">
              Looking for other gradient tools? Try our{" "}
              <Link
                to="/random-gradient"
                className="text-blue-600 hover:underline"
              >
                Random Gradient Generator
              </Link>{" "}
              for quick inspiration, or our{" "}
              <Link
                to="/text-gradient"
                className="text-blue-600 hover:underline"
              >
                Text Gradient Generator
              </Link>{" "}
              to apply mesh gradients directly to text.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
