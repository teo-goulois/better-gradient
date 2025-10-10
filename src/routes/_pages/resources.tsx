import { CallToAction } from "@/components/shared/call-to-action";
import { SharedFooter } from "@/components/shared/shared-footer";
import { DottedBackground } from "@/components/ui/dotted-background";
import { GridCursor } from "@/components/ui/grid-cursor";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_pages/resources")({
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "Free gradient design resources, color theory guides, CSS documentation, and design inspiration. Everything you need to master mesh gradients.",
      },
      {
        name: "keywords",
        content:
          "gradient resources, color theory, css gradient documentation, design tools, gradient inspiration, web design resources",
      },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const resources = {
    colorTheory: [
      {
        title: "Color Theory Basics",
        description: "Understanding color relationships and harmony",
        items: [
          "Complementary colors create high contrast and vibrant designs",
          "Analogous colors (next to each other on color wheel) create harmony",
          "Monochromatic schemes use variations of a single color",
          "Warm colors (red, orange, yellow) feel energetic and bold",
          "Cool colors (blue, green, purple) feel calm and professional",
        ],
      },
      {
        title: "Gradient Color Tips",
        description: "Best practices for choosing gradient colors",
        items: [
          "Start with 2-3 base colors from the same color family",
          "Avoid mixing too many contrasting colors (creates muddy results)",
          "Use white or light colors sparingly as accents",
          "Dark colors work well as bases for depth",
          "Test gradients on both light and dark backgrounds",
        ],
      },
    ],
    cssResources: [
      {
        title: "CSS Gradient Documentation",
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS/gradient",
        description: "MDN Web Docs - Complete CSS gradient reference",
      },
      {
        title: "CSS Background Properties",
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS/background",
        description: "Learn how to use gradients as backgrounds",
      },
      {
        title: "SVG Filters",
        url: "https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter",
        description: "Understanding SVG blur and filter effects",
      },
    ],
    designInspiration: [
      {
        title: "Dribbble - Gradient Designs",
        url: "https://dribbble.com/tags/gradient",
        description:
          "Curated gradient design inspiration from designers worldwide",
      },
      {
        title: "Behance - Gradient Projects",
        url: "https://www.behance.net/search/projects?search=gradient",
        description: "Professional gradient design projects and case studies",
      },
      {
        title: "Awwwards - Gradient Websites",
        url: "https://www.awwwards.com/websites/gradient/",
        description: "Award-winning websites using gradient backgrounds",
      },
    ],
    relatedTools: [
      {
        title: "Better Gradient Editor",
        url: "/editor",
        description: "Our free mesh gradient generator",
        internal: true,
      },
      {
        title: "Gradient Gallery",
        url: "/gallery",
        description: "Browse community-created gradients",
        internal: true,
      },
      {
        title: "Coolors",
        url: "https://coolors.co/",
        description: "Fast color palette generator",
        internal: false,
      },
      {
        title: "Adobe Color",
        url: "https://color.adobe.com/",
        description: "Create and explore color palettes",
        internal: false,
      },
    ],
  };

  return (
    <>
      <main className="flex-1 w-full bg-white relative">
        <DottedBackground />

        <div className="container mx-auto px-6 py-24 relative z-10">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="font-nohemi text-5xl font-semibold tracking-tight text-neutral-900">
              Gradient Resources
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              Everything you need to create beautiful gradients and master color
              design
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-5xl mx-auto space-y-20">
            {/* Color Theory Section */}
            <section>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
                  Color Theory
                </h2>
                <p className="mt-3 text-base text-neutral-600">
                  Master the fundamentals of color relationships and harmony
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 relative">
                {resources.colorTheory.map((section) => (
                  <div
                    key={section.title}
                    className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
                  >
                    <GridCursor />

                    <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-6">
                      {section.description}
                    </p>
                    <ul className="space-y-3">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm text-neutral-600"
                        >
                          <span className="text-neutral-300 flex-shrink-0 mt-1">
                            →
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* CSS Documentation Section */}
            <section>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
                  CSS Documentation
                </h2>
                <p className="mt-3 text-base text-neutral-600">
                  Essential CSS resources for gradient implementation
                </p>
              </div>
              <div className="grid grid-cols-1 gap-px bg-neutral-200 border border-neutral-200 relative">
                {resources.cssResources.map((resource) => (
                  <a
                    key={resource.title}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
                  >
                    <GridCursor />

                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          {resource.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <title>External Link</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* Design Inspiration Section */}
            <section>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
                  Design Inspiration
                </h2>
                <p className="mt-3 text-base text-neutral-600">
                  Discover curated gradient designs from top designers
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 relative">
                {resources.designInspiration.map((resource, index) => (
                  <a
                    key={resource.title}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
                  >
                    <GridCursor />

                    {/* Index number */}
                    <div className="absolute top-3 right-3 text-5xl font-mono text-neutral-100 group-hover:text-neutral-200 transition-colors leading-none">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors relative z-10">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed relative z-10">
                      {resource.description}
                    </p>
                  </a>
                ))}
              </div>
            </section>

            {/* Related Tools Section */}
            <section>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
                  Related Tools
                </h2>
                <p className="mt-3 text-base text-neutral-600">
                  Powerful tools to enhance your gradient workflow
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 relative">
                {resources.relatedTools.map((tool) =>
                  tool.internal ? (
                    <Link
                      key={tool.title}
                      to={tool.url}
                      className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
                    >
                      <GridCursor />

                      <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {tool.description}
                      </p>

                      {/* Corner accent for internal links */}
                      <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ) : (
                    <a
                      key={tool.title}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
                    >
                      <GridCursor />

                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-neutral-600 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <title>External Link</title>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>
                      </div>
                    </a>
                  )
                )}
              </div>
            </section>

            {/* Call to Action */}
            <CallToAction
              title="Start Creating Gradients"
              description="Ready to put these resources to use? Create stunning mesh gradients with our free tool."
              buttonText="Open Gradient Generator"
              buttonLink="/editor"
              className="mt-20"
            />
          </div>
        </div>
      </main>
    </>
  );
}
