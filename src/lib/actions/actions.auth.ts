import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

export const getViewer = createServerFn({
	method: "GET",
	response: "data",
}).handler(async () => {
	const { getCurrentViewer } = await import("@/lib/auth");
	return getCurrentViewer();
});

export const getViewerQueryOptions = () =>
	queryOptions({
		queryKey: ["viewer"],
		queryFn: () => getViewer(),
		staleTime: 1000 * 30,
	});
