import { FAQ } from "@/components/sections/FAQ";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { UseCases } from "@/components/sections/UseCases";
import { SharedFooter } from "@/components/shared/shared-footer";
import { trackEvent } from "@/lib/tracking";
import { IconArrowDownFill } from "@intentui/icons";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Better Gradient - Free Mesh Gradient Generator & Maker",
  description:
    "Create stunning mesh gradients for free. Professional gradient generator for web design, UI/UX, and creative projects. No signup required, export to PNG, SVG, or CSS.",
  url: "https://better-gradient.com",
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
    "Free mesh gradient generator",
    "No signup required",
    "Real-time gradient preview",
    "Export to PNG, SVG, CSS",
    "Multiple export formats",
    "Color customization",
    "Modern mesh gradients",
    "Blur gradient controls",
  ],
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What are mesh gradients?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Mesh gradients are a modern design technique that creates smooth, organic color transitions by blending multiple colored shapes with blur effects. Unlike linear or radial gradients, mesh gradients produce more natural, flowing color patterns perfect for contemporary UI design and backgrounds.",
      },
    },
    {
      "@type": "Question",
      name: "How do I use gradients in CSS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can use our gradients in CSS by either exporting as CSS code (which gives you a complete background property) or as an SVG that can be used as a background-image. Our CSS export provides optimized code ready to paste into your stylesheets.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use these gradients commercially?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! All gradients created with Better Gradient can be used freely in both personal and commercial projects. There are no attribution requirements or licensing restrictions.",
      },
    },
    {
      "@type": "Question",
      name: "What export formats are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Better Gradient supports PNG (raster images with transparency), SVG (scalable vector graphics), and CSS code export. PNG is perfect for images and graphics, SVG works great for web and maintains quality at any size, while CSS export lets you implement gradients directly in code.",
      },
    },
    {
      "@type": "Question",
      name: "What's the difference between mesh and linear gradients?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Linear gradients transition colors in a straight line, while mesh gradients blend multiple color points with blur effects to create organic, flowing patterns. Mesh gradients offer more visual depth and natural-looking color transitions, making them ideal for modern, sophisticated designs.",
      },
    },
  ],
};

export const Route = createFileRoute("/")({
  component: App,
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "Free mesh gradient generator - Create stunning blur gradient backgrounds for websites, UI design, and creative projects. No signup required. Export to PNG, SVG, or CSS instantly.",
      },
      {
        name: "keywords",
        content:
          "gradient generator, mesh gradient generator, gradient maker, css gradient generator, gradient background generator, mesh gradient, gradient tool, free gradient generator, blur gradient generator, gradient creator",
      },
    ],
    links: [
      {
        rel: "preload",
        href: "/logo.png",
        as: "image",
        type: "image/png",
      },
      {
        rel: "preload",
        href: "/gradients/gradient-1.webp",
        as: "image",
        type: "image/webp",
      },
    ],
  }),
});

function App() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <main className="flex-1 w-full bg-bg">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="container mx-auto px-6 py-28 z-10 relative h-full flex items-center justify-center min-h-[calc(100dvh-4.25rem)]">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="mt-6 font-nohemi text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900">
                Free Mesh Gradient Generator
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-neutral-600">
                Create stunning mesh gradients for free. Design elegant blur
                gradient backgrounds for websites, UI design, and creative
                projects. No signup required.
              </p>
              <div className="mt-10">
                <Link
                  to={"/editor"}
                  onClick={() => trackEvent("Navigate to Editor")}
                  className="inline-flex items-center gap-3 relative overflow-hidden rounded-full text-white px-8 py-4 text-lg font-medium ease-in-out duration-150 group hover:scale-105"
                >
                  <img
                    src="/gradients/gradient-1.webp"
                    alt="Gradient background example"
                    className="h-full w-full object-cover -z-10 absolute top-0 left-0"
                    loading="eager"
                  />
                  <span className="relative z-10 font-nohemi font-semibold">
                    Open Gradient Editor
                  </span>
                </Link>
                <p className="mt-3 text-sm text-neutral-500">
                  No signup required • 100% free • Export to PNG, SVG, CSS
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                <IconArrowDownFill className="size-10 text-neutral-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <HowItWorks />
        <UseCases />
        <Features />
        <FAQ />
      </main>
      <SharedFooter />
    </>
  );
}
