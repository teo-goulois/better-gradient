import { z } from "zod";

export const dashboardFilterSchema = z.enum([
	"all",
	"saved",
	"favorites",
	"exported",
]);

export const dashboardSearchSchema = z.object({
	filter: dashboardFilterSchema.catch("all").optional(),
});

export type DashboardFilter = z.infer<typeof dashboardFilterSchema>;

export const FAVORITES_DASHBOARD_HREF = "/dashboard?filter=favorites";

export function resolveDashboardFilter(filter?: DashboardFilter) {
	return filter ?? "all";
}

export function getDashboardFilterCounts(args: {
	saved: number;
	favorites: number;
	exported: number;
}) {
	return {
		all: args.saved + args.favorites + args.exported,
		saved: args.saved,
		favorites: args.favorites,
		exported: args.exported,
	};
}
