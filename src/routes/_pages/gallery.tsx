import { CallToAction } from "@/components/shared/call-to-action";
import { GridCursor } from "@/components/ui/grid-cursor";
import { getPublicGradientsFromDbQueryOptions } from "@/lib/actions/actions.gradient";
import { svgDataUrl, svgStringFromState } from "@/lib/mesh-svg";
import { decodeShareString } from "@/lib/utils/share";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_pages/gallery")({
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(
      getPublicGradientsFromDbQueryOptions()
    );
    return data;
  },
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "Browse beautiful mesh gradient examples and inspiration. Discover stunning gradient color combinations for your design projects. Free gradient gallery.",
      },
      {
        name: "keywords",
        content:
          "gradient examples, gradient inspiration, mesh gradient gallery, gradient color combinations, beautiful gradients, gradient designs",
      },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { data } = useSuspenseQuery(getPublicGradientsFromDbQueryOptions());

  return (
    <div className="flex-1 w-full min-h-screen bg-bg">
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="font-nohemi text-5xl font-semibold tracking-tight text-neutral-900">
            Gradient Gallery
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Explore beautiful mesh gradients created by our community. Get
            inspired for your next design project.
          </p>
          <div className="mt-6">
            <Link
              to="/editor"
              className="inline-flex items-center px-6 py-3 rounded-full bg-black text-white font-nohemi font-semibold hover:scale-105 transition-transform"
            >
              Create Your Own
            </Link>
          </div>
        </div>

        {/* Gallery Grid */}
        {data.gradients.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-600">
              No gradients in the gallery yet. Be the first to share your
              creation!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.gradients.map((gradient) => {
              const decoded = decodeShareString(gradient.share);
              const previewDataUrl = decoded
                ? svgDataUrl(
                    svgStringFromState({
                      canvas: decoded.canvas,
                      shapes: decoded.shapes,
                      palette: decoded.palette,
                      filters: decoded.filters,
                      outputSize: { width: 480, height: 300 },
                    })
                  )
                : null;

              return (
                <Link
                  key={gradient.id}
                  to="/share/$state"
                  params={{ state: gradient.share }}
                  className="group"
                >
                  <div className="bg-white  shadow-xs group relative transition-all overflow-hidden">
                    <GridCursor />
                    <div className="aspect-[4/3] overflow-hidden">
                      {previewDataUrl ? (
                        <img
                          src={previewDataUrl}
                          alt={`Mesh gradient with ${gradient.shapesCount} shapes and ${gradient.colorsCount} colors`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                          <span className="text-neutral-400">No preview</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between text-sm text-neutral-600">
                        <span>
                          {gradient.shapesCount} shapes • {gradient.colorsCount}{" "}
                          colors
                        </span>
                        <span>
                          {gradient.width}×{gradient.height}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Call to Action */}
        <CallToAction className="mt-20" />
      </div>
    </div>
  );
}
