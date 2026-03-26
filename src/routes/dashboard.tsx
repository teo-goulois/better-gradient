import { getViewerQueryOptions } from "@/lib/actions/actions.auth";
import { listExportedGradientsQueryOptions } from "@/lib/actions/actions.gradient";
import {
	listFavoriteGradientsQueryOptions,
	listSavedGradientsQueryOptions,
} from "@/lib/actions/actions.saved-gradient";
import { dashboardSearchSchema } from "@/lib/dashboard";
import { seo } from "@/utils/seo";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
	validateSearch: dashboardSearchSchema,
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
		await context.queryClient.ensureQueryData(
			listFavoriteGradientsQueryOptions(),
		);
		await context.queryClient.ensureQueryData(
			listExportedGradientsQueryOptions(),
		);
		return null;
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	return <Outlet />;
}
