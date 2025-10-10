import { CallToAction } from "@/components/shared/call-to-action";
import { SharedFooter } from "@/components/shared/shared-footer";
import { DottedBackground } from "@/components/ui/dotted-background";
import { GridCursor } from "@/components/ui/grid-cursor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_pages/blog")({
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "Learn about mesh gradients, CSS gradients, and modern design techniques. Tutorials, guides, and inspiration for creating stunning gradient backgrounds.",
      },
      {
        name: "keywords",
        content:
          "gradient tutorial, mesh gradient guide, css gradients, gradient design, web design tutorials, UI design blog",
      },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  // Suggested articles for MarbleCMS
  const suggestedArticles = [
    {
      title: "How to Create Modern Mesh Gradients for Web Design",
      description:
        "A comprehensive guide to creating stunning mesh gradients that elevate your web design projects.",
      slug: "how-to-create-modern-mesh-gradients",
      category: "Tutorial",
    },
    {
      title: "CSS Gradient vs Mesh Gradient: Which Should You Use?",
      description:
        "Compare traditional CSS gradients with modern mesh gradients and learn when to use each technique.",
      slug: "css-gradient-vs-mesh-gradient",
      category: "Comparison",
    },
    {
      title: "10 Beautiful Gradient Color Combinations for 2025",
      description:
        "Discover trending gradient color palettes that will make your designs stand out in 2025.",
      slug: "gradient-color-combinations-2025",
      category: "Inspiration",
    },
    {
      title: "Using Gradients in UI Design: Best Practices",
      description:
        "Learn professional techniques for incorporating gradients into your UI design workflow.",
      slug: "gradients-ui-design-best-practices",
      category: "Guide",
    },
    {
      title: "Free Gradient Tools Comparison 2025",
      description:
        "An in-depth comparison of the best free gradient generators and tools available today.",
      slug: "free-gradient-tools-comparison-2025",
      category: "Tools",
    },
  ];

  return (
    <>
      <main className="flex-1 w-full bg-white relative">
        <DottedBackground />

        <div className="container mx-auto px-6 py-24 relative z-10">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="font-nohemi text-5xl font-semibold tracking-tight text-neutral-900">
              Gradient Design Blog
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              Tutorials, guides, and inspiration for creating beautiful mesh
              gradients
            </p>
          </div>

          {/* Blog Integration Notice */}
          <div className="max-w-4xl mx-auto mb-12 border border-neutral-200 bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300">
            <GridCursor />

            <h2 className="font-nohemi text-2xl font-semibold text-neutral-900 mb-4">
              MarbleCMS Integration
            </h2>
            <p className="text-neutral-600">
              This page is ready to be integrated with{" "}
              <a
                href="https://marblecms.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-900 underline hover:no-underline"
              >
                MarbleCMS
              </a>
              . Add your blog content through the CMS and it will appear here.
            </p>
          </div>

          {/* Suggested Articles (Placeholder) */}
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
                Suggested Blog Topics
              </h2>
              <p className="mt-3 text-base text-neutral-600">
                Recommended articles to create in your MarbleCMS
              </p>
            </div>

            <div className="grid grid-cols-1 gap-px bg-neutral-200 border border-neutral-200 relative">
              {suggestedArticles.map((article, index) => (
                <div
                  key={article.slug}
                  className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
                >
                  <GridCursor />

                  {/* Index number */}
                  <div className="absolute top-3 right-3 text-5xl font-mono text-neutral-100 group-hover:text-neutral-200 transition-colors leading-none">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs px-3 py-1 border border-neutral-200 text-neutral-700 font-medium font-mono">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-2 relative z-10">
                    {article.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed relative z-10">
                    {article.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <CallToAction
            title="Ready to Create?"
            description="Try our free mesh gradient generator and start designing beautiful backgrounds today."
            buttonText="Open Gradient Editor"
            buttonLink="/editor"
            className="mt-20"
          />
        </div>
      </main>
    </>
  );
}
