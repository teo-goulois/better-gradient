import { FAVORITES_DASHBOARD_HREF } from "@/lib/dashboard";
import { seo } from "@/utils/seo";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/favorites")({
	head: () => ({
		...seo({
			title: "Favorites | Better Gradient",
			description: "Private favorites from your Better Gradient account.",
			noindex: true,
		}),
	}),
	loader: async () => {
		throw redirect({ href: FAVORITES_DASHBOARD_HREF });
	},
});
