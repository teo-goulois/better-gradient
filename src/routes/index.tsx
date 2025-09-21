import { trackEvent } from "@/lib/tracking";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Better Gradient - Mesh Gradient Generator",
  description:
    "Create stunning blurred mesh gradients with our intuitive editor. Design beautiful backgrounds, export in high quality, and bring your creative vision to life.",
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
    "Intuitive gradient editor",
    "Real-time preview",
    "High quality export",
    "Multiple export formats",
    "Drag and drop interface",
    "Color customization",
    "Undo/redo functionality",
  ],
};

export const Route = createFileRoute("/")({
  component: App,
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "Create stunning blurred mesh gradients with our intuitive editor. Design beautiful backgrounds, export in high quality, and bring your creative vision to life.",
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
      <div className="flex-1 w-full min-h-screen bg-bg relative overflow-hidden">
        <div className="container mx-auto px-6 py-28 z-10 relative h-full flex items-center justify-center min-h-screen">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="mt-6 font-nohemi text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900">
              Create subtle, modern mesh gradients
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              Design elegant blurred-shape mesh gradients with a clear, focused
              editor. Perfect for backgrounds, UI elements, and creative
              projects.
            </p>
            <div className="mt-10  ">
              <Link
                to={"/editor"}
                onClick={() => trackEvent("Navigate to Editor")}
                className="inline-flex items-center gap-3 relative overflow-hidden rounded-full  text-white px-8 py-4 text-lg font-medium ease-in-out duration-150 group hover:scale-105 "
              >
                <img
                  src="/gradients/gradient-1.webp"
                  alt=""
                  className="h-full w-full object-cover -z-10 absolute top-0 left-0"
                  loading="eager"
                />
                <span className="relative z-10 font-nohemi font-semibold">
                  Open Editor
                </span>
              </Link>
              <p className="mt-3 text-sm text-neutral-500">
                No signup required • Free to use
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
