import { trackEvent } from "@/lib/tracking";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Better Gradient - Beautiful Gradient Generator",
  description:
    "Create stunning gradients with our intuitive editor. Design beautiful backgrounds, export in high quality, and bring your creative vision to life.",
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
      <main className="flex-1 w-full bg-bg relative overflow-hidden">
        <div className="container mx-auto px-6 py-28 z-10 relative h-full flex items-center justify-center min-h-[calc(100dvh-4.25rem)]">
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

              {/* <div className="mt-6">
                <Link
                  to="/created"
                  className="text-sm underline text-neutral-700 hover:text-black"
                >
                  See created gradients
                </Link>
              </div> */}
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center  text-sm text-muted-fg/50  fixed bottom-0 left-0 right-0 pb-4">
        <div className="flex flex-col justify-between container mx-auto gap-8 sm:flex-row sm:items-center">
          <h2 className="text-sm font-medium">2025 Better Gradient</h2>
          <nav
            aria-labelledby="social-icons-heading"
            className="flex items-center gap-4 "
          >
            <p className="text-base sr-only" id="social-icons-heading">
              Follow us on social media
            </p>
            <a
              className=" text-sm font-medium  hover:text-blue-600 dark:hover:text-blue-300"
              href="https://x.com/teo_goulois"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="icon icon-tabler-layout-brand-x size-4"
              >
                <title>X</title>
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
            </a>

            {/* <a
              className="text-base font-medium hover:text-blue-500  dark:hover:text-blue-400"
              href="https://github.com/teo-goulois/better-gradient"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="icon icon-tabler-layout-brand-github size-4"
              >
                <title>Github</title>
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
              </svg>
            </a> */}
          </nav>
        </div>
      </footer>
    </>
  );
}
