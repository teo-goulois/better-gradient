import { createServerFileRoute } from "@tanstack/react-start/server";
import { siteUrl } from "@/utils/site";

const routes = [
  "/",
  "/editor",
]; // add more as you add pages

const buildSitemap = async (): Promise<string> => {
 
  const urls = routes
    .map(
      (path) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.6"}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
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
