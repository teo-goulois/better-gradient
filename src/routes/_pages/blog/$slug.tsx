import { Prose } from "@/components/shared/shared-prose";
import { DottedBackground } from "@/components/ui/dotted-background";
import { Separator } from "@/components/ui/separator";
import { getSinglePost } from "@/lib/actions/action.query";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_pages/blog/$slug")({
  component: RouteComponent,
  loader: async ({ params }: { params: { slug: string } }) => {
    const data = await getSinglePost({ data: params.slug });
    return data;
  },
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const { post } = data || {};

  console.log({ post });

  if (!post) {
    return (
      <main className="flex-1 w-full bg-white relative min-h-screen">
        <DottedBackground />
        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-3xl mx-auto border border-neutral-200 bg-white p-12 text-center">
            <h1 className="font-nohemi text-3xl font-semibold text-neutral-900 mb-4">
              Post not found
            </h1>
            <p className="text-neutral-600 mb-8">
              The blog post you're looking for doesn't exist.
            </p>
            <Link
              to="/blog"
              className="inline-block px-6 py-3 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
            >
              Back to Blog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full bg-white relative">
      <DottedBackground />

      <article className="container px-6 max-w-5xl mx-auto py-12 relative z-10">
        {/* Back to Blog */}
        <div className=" mb-8">
          <Link
            to="/blog"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors inline-flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Back to Blog</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Blog
          </Link>
        </div>

        {/* Article Header */}
        <header className="max-w-5xl mx-auto mb-12 space-y-6">
          <h1 className="font-nohemi text-4xl md:text-5xl font-semibold tracking-tight">
            {post.title}
          </h1>
          {/* Cover Image */}
          {post.coverImage && (
            <div className="max-w-5xl mx-auto mb-8 relative overflow-hidden rounded-lg border border-neutral-200">
              <div className="absolute inset-0 easing-gradient pointer-events-none" />
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-[400px] object-cover"
              />
            </div>
          )}
          <div className="flex justify-between items-center">
            {/* Category & Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {post.category && (
                <span className="text-xs px-3 py-1 border border-neutral-200 text-neutral-700 font-medium font-mono">
                  {post.category.name}
                </span>
              )}
              {post.tags &&
                post.tags.length > 0 &&
                post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs px-3 py-1 bg-neutral-100 text-neutral-600 font-medium font-mono"
                  >
                    {tag.name}
                  </span>
                ))}
            </div>
            {/* Meta Info */}
            <div className="flex items-center  gap-3 ">
              <div className="flex items-center gap-3">
                {post.authors && post.authors.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {post.authors[0].image && (
                      <img
                        src={post.authors[0].image}
                        alt={post.authors[0].name}
                        className="size-6 rounded-full border border-neutral-200"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {post.authors[0].name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Separator
                orientation="vertical"
                className="self-stretch h-auto"
              />
              {post.publishedAt && (
                <time className="text-xs text-neutral-500">
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              )}
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="max-w-3xl mx-auto  bg-white relative">
          <Prose
            html={post.content}
            className="prose-neutral prose-lg max-w-none"
          />

          {/* Attribution */}
          {post.attribution && (
            <div className="mt-12 pt-6 border-t border-neutral-200 text-sm text-neutral-600">
              <p>
                Attribution:{" "}
                <a
                  href={post.attribution.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-900 underline hover:no-underline"
                >
                  {post.attribution.author}
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Back to Blog CTA */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <Link
            to="/blog"
            className="inline-block px-6 py-3 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
          >
            Read More Articles
          </Link>
        </div>
      </article>
    </main>
  );
}
