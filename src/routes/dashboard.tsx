import { getViewerQueryOptions } from "@/lib/actions/actions.auth";
import { listSavedGradientsQueryOptions } from "@/lib/actions/actions.saved-gradient";
import { seo } from "@/utils/seo";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
	head: () => ({
		...seo({
			title: "Dashboard | Better Gradient",
			description:
				"Manage your saved gradients, publication state, analytics entry points and private library.",
			noindex: true,
		}),
	}),
	loader: async ({ context }) => {
		const viewer = await context.queryClient.ensureQueryData(
			getViewerQueryOptions(),
		);
		if (!viewer.user) {
			throw redirect({ href: "/login?next=/dashboard" });
		}
		await context.queryClient.ensureQueryData(listSavedGradientsQueryOptions());
		return null;
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	return <Outlet />;
}
