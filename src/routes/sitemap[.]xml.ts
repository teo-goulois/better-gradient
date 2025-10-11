import { getPosts } from "@/lib/actions/action.query";
import { siteUrl } from "@/utils/site";
import { createServerFileRoute } from "@tanstack/react-start/server";

const routes = ["/", "/editor", "/gallery", "/resources", "/guide", "/blog"]; // add more as you add pages

const buildSitemap = async (): Promise<string> => {
	// Fetch all blog posts
	const postsData = await getPosts();
	const posts = postsData?.posts || [];

	// Generate URLs for static routes
	const staticUrls = routes
		.map(
			(path) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.6"}</priority>
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

export const ServerRoute = createServerFileRoute("/sitemap.xml").methods({
	GET: async () => {
		return new Response(await buildSitemap(), {
			headers: {
				"Content-Type": "application/xml",
				"Cache-Control": "public, max-age=3600",
			},
		});
	},
});
