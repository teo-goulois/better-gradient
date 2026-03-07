import { CallToAction } from "@/components/shared/call-to-action";
import { DEFAULT_CANVAS, DEFAULT_FILTERS } from "@/lib/config/config.mesh";
import { svgDataUrl, svgStringFromState } from "@/lib/mesh-svg";
import { generateShapes } from "@/lib/utils/utils.mesh";
import type { RgbHex } from "@/types/types.mesh";
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

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Text Gradient Generator — Better Gradient",
  description:
    "Apply beautiful mesh gradients to text with a free text gradient generator. Preview live, customize colors, and copy the CSS code instantly.",
  url: "https://better-gradient.com/text-gradient",
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
    "Live text gradient preview",
    "Custom text input",
    "Multiple font sizes",
    "Mesh gradient backgrounds on text",
    "One-click CSS copy",
    "No signup required",
    "Free to use",
  ],
};

export const Route = createFileRoute("/_pages/text-gradient")({
  component: TextGradientPage,
  head: () => ({
    meta: [
      {
        title:
          "Text Gradient Generator — Free CSS Text Gradient Maker | Better Gradient",
      },
      {
        name: "description",
        content:
          "Apply beautiful mesh gradients to text with our free text gradient generator. Preview live, customize colors, and copy the CSS code instantly. No signup required.",
      },
      {
        name: "keywords",
        content:
          "text gradient generator, gradient text CSS, CSS text gradient, text gradient maker, gradient text effect, gradient typography, mesh gradient text",
      },
      {
        property: "og:title",
        content: "Text Gradient Generator | Better Gradient",
      },
      {
        property: "og:description",
        content:
          "Apply beautiful mesh gradients to text. Preview live, customize colors, and copy the CSS code instantly.",
      },
      {
        property: "og:url",
        content: "https://better-gradient.com/text-gradient",
      },
      {
        property: "og:image",
        content: "https://better-gradient.com/og-image.png",
      },
      {
        name: "twitter:title",
        content: "Text Gradient Generator | Better Gradient",
      },
      {
        name: "twitter:description",
        content:
          "Apply beautiful mesh gradients to text. Preview live, customize colors, and copy the CSS code instantly.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://better-gradient.com/text-gradient",
      },
    ],
  }),
});

function TextGradientPage() {
  const [text, setText] = useState("Better Gradient");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">("lg");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const fontSizeClasses: Record<string, string> = {
    sm: "text-3xl md:text-4xl",
    md: "text-4xl md:text-5xl",
    lg: "text-5xl md:text-7xl",
    xl: "text-6xl md:text-8xl",
  };

  const fontSizeValues: Record<string, string> = {
    sm: "2rem",
    md: "3rem",
    lg: "4.5rem",
    xl: "6rem",
  };

  const gradientDataUrl = useMemo(() => {
    const palette = PALETTE_PRESETS[paletteIndex];
    const seed = `text-gradient-${paletteIndex}-${refreshKey}`;
    const canvas = DEFAULT_CANVAS;
    const filters = DEFAULT_FILTERS;
    const count = 5 + (Math.abs(hashCode(seed + "-count")) % 3);
    const shapes = generateShapes({ seed, count, canvas, palette });
    const svg = svgStringFromState({
      shapes,
      palette,
      filters,
      canvas,
    });
    return svgDataUrl(svg);
  }, [paletteIndex, refreshKey]);

  const cssOutput = useMemo(() => {
    return `.gradient-text {
  font-size: ${fontSizeValues[fontSize]};
  font-weight: 700;
  background-image: url("${gradientDataUrl}");
  background-size: cover;
  background-position: center;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}`;
  }, [gradientDataUrl, fontSize]);

  const handleCopyCSS = useCallback(async () => {
    await navigator.clipboard.writeText(cssOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cssOutput]);

  const handleRandomize = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const gridPreviews = useMemo(() => {
    return PALETTE_PRESETS.map((palette, i) => {
      const seed = `text-grid-${i}-${refreshKey}`;
      const canvas = DEFAULT_CANVAS;
      const filters = DEFAULT_FILTERS;
      const count = 5 + (Math.abs(hashCode(seed + "-count")) % 3);
      const shapes = generateShapes({ seed, count, canvas, palette });
      const svg = svgStringFromState({
        shapes,
        palette,
        filters,
        canvas,
        outputSize: { width: 480, height: 200 },
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
              Text Gradient Generator
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              Apply stunning mesh gradients to any text. Type your text, choose a
              color palette, and copy the CSS code — all in your browser, free.
            </p>
          </div>

          {/* Live Text Preview */}
          <section className="mt-10">
            <div className="overflow-hidden border border-neutral-200 bg-white">
              {/* Preview area */}
              <div className="flex items-center justify-center min-h-[300px] p-8 bg-neutral-50">
                <span
                  className={`font-nohemi font-bold leading-tight text-center break-words max-w-full ${fontSizeClasses[fontSize]}`}
                  style={{
                    backgroundImage: `url("${gradientDataUrl}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                  }}
                >
                  {text || "Type something..."}
                </span>
              </div>

              {/* Controls */}
              <div className="p-4 border-t border-neutral-200 flex flex-col gap-4">
                {/* Row 1: Text input */}
                <div className="flex gap-3 items-center">
                  <label
                    htmlFor="text-input"
                    className="text-sm text-neutral-500 shrink-0"
                  >
                    Text
                  </label>
                  <input
                    id="text-input"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your text..."
                    className="flex-1 border border-neutral-200 text-sm px-3 py-2 text-neutral-700"
                  />
                </div>

                {/* Row 2: Size selector + actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Font size selector */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="size-select"
                      className="text-sm text-neutral-500"
                    >
                      Size
                    </label>
                    <select
                      id="size-select"
                      value={fontSize}
                      onChange={(e) =>
                        setFontSize(e.target.value as typeof fontSize)
                      }
                      className="border border-neutral-200 text-sm px-3 py-2 text-neutral-700"
                    >
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                    </select>
                  </div>

                  {/* Randomize */}
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

                  {/* Copy CSS */}
                  <button
                    type="button"
                    onClick={handleCopyCSS}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy CSS"}
                  </button>

                  {/* Open in Editor */}
                  <Link
                    to="/editor"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Open in Editor
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* CSS Output Preview */}
          <section className="mt-8">
            <h2 className="font-nohemi text-xl font-semibold text-neutral-900 mb-3">
              CSS Code
            </h2>
            <div className="relative bg-neutral-900 text-neutral-100 p-4 font-mono text-sm overflow-x-auto">
              <pre>
                <code>{cssOutput}</code>
              </pre>
              <button
                type="button"
                onClick={handleCopyCSS}
                className="absolute top-3 right-3 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-xs text-neutral-200 transition-colors"
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
                  <div className="aspect-[5/2] overflow-hidden">
                    <img
                      src={preview.dataUrl}
                      alt={`Gradient palette ${preview.paletteIndex + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  {/* Color swatches */}
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
            title="Create Full Mesh Gradients"
            description="Love the gradient on your text? Open the full editor to create background gradients, adjust shapes, and export in any format."
            buttonText="Open Gradient Editor"
            buttonLink="/editor"
          />

          {/* SEO Content */}
          <section className="mt-16 max-w-3xl">
            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              What is a Text Gradient Generator?
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              A text gradient generator applies colorful gradient fills to text
              using CSS. Instead of a flat color, your text is filled with a
              smooth blend of multiple colors — in this case, beautiful mesh
              gradients that create organic, flowing color transitions. The
              technique uses the CSS <code>background-clip: text</code> property
              to mask a background gradient to the shape of your text.
            </p>

            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              How to Use CSS Text Gradients
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              Type your text in the input field above, select a color palette
              that matches your design, and adjust the font size. The preview
              updates in real time. When you&apos;re happy with the result, click
              &ldquo;Copy CSS&rdquo; to get the code. Paste it into your
              stylesheet and apply the <code>.gradient-text</code> class to any
              HTML element. The gradient works on headings, paragraphs, spans,
              and any text element.
            </p>

            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              Browser Compatibility
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              The <code>background-clip: text</code> CSS property is supported
              in all modern browsers including Chrome, Firefox, Safari, and Edge.
              The <code>-webkit-</code> prefix is included for maximum
              compatibility. The generated CSS includes a transparent color
              fallback to ensure graceful degradation.
            </p>

            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              Mesh Gradients vs Linear Gradients for Text
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              While most text gradient generators use simple linear or radial
              gradients, Better Gradient applies{" "}
              <strong>mesh gradients</strong> to your text. Mesh gradients blend
              multiple colored shapes with blur effects, producing far more
              complex and organic color transitions than a basic two-color linear
              gradient. The result is typography that looks premium and unique.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
