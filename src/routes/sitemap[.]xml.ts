import { getPostsData } from "@/lib/server/marble-service";
import { siteUrl } from "@/utils/site";
import { createFileRoute } from "@tanstack/react-router";

const routes: { path: string; priority: string; changefreq: string }[] = [
	{ path: "/", priority: "1.0", changefreq: "weekly" },
	{ path: "/editor", priority: "0.8", changefreq: "monthly" },
	{ path: "/gallery", priority: "0.7", changefreq: "weekly" },
	{ path: "/random-gradient", priority: "0.7", changefreq: "monthly" },
	{ path: "/text-gradient", priority: "0.7", changefreq: "monthly" },
	{ path: "/tailwind-gradient", priority: "0.7", changefreq: "monthly" },
	{ path: "/blog", priority: "0.6", changefreq: "weekly" },
	{ path: "/guide", priority: "0.6", changefreq: "monthly" },
	{ path: "/resources", priority: "0.5", changefreq: "monthly" },
	{ path: "/developers", priority: "0.5", changefreq: "monthly" },
];

const buildSitemap = async (): Promise<string> => {
	// Fetch all blog posts
	const postsData = await getPostsData();
	const posts = postsData?.posts || [];

	// Generate URLs for static routes (no lastmod — inaccurate dates harm crawl signals)
	const staticUrls = routes
		.map(
			(route) => `  <url>
    <loc>${siteUrl}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
		)
		.join("\n");

	// Generate URLs for blog posts
	const blogUrls = posts
		.map(
			(post) => `  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt || post.publishedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`,
		)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${blogUrls}
</urlset>`;
};

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				return new Response(await buildSitemap(), {
					headers: {
						"Content-Type": "application/xml",
						"Cache-Control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
