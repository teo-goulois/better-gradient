import { DottedBackground } from "@/components/ui/dotted-background";
import { GridCursor } from "@/components/ui/grid-cursor";
import { getPosts } from "@/lib/actions/action.query";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_pages/blog/")({
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
  loader: async () => {
    const posts = await getPosts();
    return posts;
  },
  component: BlogPage,
});

function BlogPage() {
  const data = Route.useLoaderData();
  const posts = data?.posts || [];

  return (
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

        {/* Blog Posts */}
        {posts.length === 0 ? (
          <div className="max-w-4xl mx-auto border border-neutral-200 bg-white p-12 text-center relative group hover:bg-neutral-50 transition-all duration-300">
            <GridCursor />
            <p className="text-neutral-600 text-lg">
              No blog posts yet. Check back soon for articles about gradients,
              design tips, and tutorials.
            </p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6  relative">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="bg-white p-8 relative group border border-neutral-200 hover:bg-neutral-50 transition-all duration-300 block"
                >
                  <GridCursor />

                  {/* Cover Image */}
                  {post.coverImage && (
                    <div className="mb-6 -mx-8 -mt-8">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  {/* Category & Tags */}
                  {/* <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {post.category && (
                      <span className="text-xs px-3 py-1 border border-neutral-200 text-neutral-700 font-medium font-mono">
                        {post.category.name}
                      </span>
                    )}
                  </div> */}

                  {/* Title */}
                  <h3 className="font-nohemi text-xl font-semibold text-neutral-900 mb-3 relative z-10 group-hover:text-neutral-700 transition-colors">
                    {post.title}
                  </h3>

                  {/* Description */}
                  {post.description && (
                    <p className="text-sm text-neutral-600 leading-relaxed relative z-10 mb-4">
                      {post.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-neutral-500 relative z-10">
                    {post.publishedAt && (
                      <time>
                        {new Date(post.publishedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </time>
                    )}
                    {post.authors && post.authors.length > 0 && (
                      <span>by {post.authors[0].name}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
