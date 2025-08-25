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
});

function App() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex-1 w-full bg-neutral-50 relative overflow-hidden">
        {/* Soft background gradient image */}
        <div className="pointer-events-none absolute z-0 inset-0 opacity-30">
          <img
            src="/gradients/gradient-1.png"
            alt=""
            className="h-full w-full object-cover  "
            loading="eager"
          />
          <div className="absolute inset-0" />
        </div>
        <div className="container mx-auto px-6 py-28 z-10 relative">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm">
              Mesh Gradient Generator
            </span>
            <h1 className="mt-6 font-nohemi text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900">
              Create subtle, modern mesh gradients
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              Design elegant blurred-shape mesh gradients with a clear, focused
              editor. Perfect for backgrounds, UI elements, and creative
              projects.
            </p>
            <div className="mt-10 font-nohemi">
              <Link
                to={"/editor"}
                className="inline-flex items-center gap-3 rounded-full bg-black text-white px-8 py-4 text-lg font-medium transition-colors duration-200 hover:bg-neutral-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Open Editor
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
