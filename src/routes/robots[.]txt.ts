import { createServerFileRoute } from "@tanstack/react-start/server";
import { siteUrl } from "@/utils/site";

const buildRobotsTxt = (): string => {
  return `User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml`;
};

export const ServerRoute = createServerFileRoute("/robots.txt").methods({
  GET: async () => {
    return new Response(buildRobotsTxt(), {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=3600",
      },
    });
  },
});
