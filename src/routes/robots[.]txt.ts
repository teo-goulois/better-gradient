import { siteUrl } from "@/utils/site";
import { createFileRoute } from "@tanstack/react-router";

const buildRobotsTxt = (): string => {
	return `User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml`;
};

export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: async () => {
				return new Response(buildRobotsTxt(), {
					headers: {
						"Content-Type": "text/plain",
					},
				});
			},
		},
	},
});
