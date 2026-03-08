import { EditorScreen } from "@/components/editor/editor-screen";
import { getViewerQueryOptions } from "@/lib/actions/actions.auth";
import { getSavedGradientForEditorQueryOptions } from "@/lib/actions/actions.saved-gradient";
import { trackEvent } from "@/lib/tracking";
import { buildAbsoluteUrl, seo } from "@/utils/seo";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

export const Route = createFileRoute("/editor")({
	validateSearch: z.object({
		gradientId: z.string().optional(),
		share: z.string().optional(),
	}),
	loaderDeps: ({ search }) => ({
		gradientId: search.gradientId,
	}),
	component: Editor,
	ssr: false,
	head: () => ({
		...seo({
			title: "Gradient Editor — Free Mesh Gradient Maker | Better Gradient",
			description:
				"Create stunning mesh gradients with our free editor. Customize colors, blur, grain, and shapes. Export to PNG, WebP, SVG, or CSS. No signup required.",
			keywords:
				"gradient editor, mesh gradient editor, gradient maker, gradient creator, free gradient tool",
			url: buildAbsoluteUrl("/editor"),
			canonical: buildAbsoluteUrl("/editor"),
		}),
	}),
	loader: async ({ context, deps }) => {
		if (!deps.gradientId) {
			return null;
		}
		const viewer = await context.queryClient.ensureQueryData(
			getViewerQueryOptions(),
		);
		if (!viewer.user) {
			throw redirect({
				href: `/login?next=${encodeURIComponent(`/editor?gradientId=${deps.gradientId}`)}`,
			});
		}
		await context.queryClient.ensureQueryData(
			getSavedGradientForEditorQueryOptions(deps.gradientId),
		);
		return null;
	},
});

function Editor() {
	const search = Route.useSearch();

	useEffect(() => {
		trackEvent("Editor Loaded", undefined, true);
	}, []);

	return (
		<>
			<div className="hidden md:flex md:flex-1">
				<EditorScreen
					savedGradientId={search.gradientId}
					shareStateFromSearch={search.share}
				/>
			</div>

			<div className="md:hidden flex-1 w-full min-h-screen bg-bg relative overflow-hidden">
				<div className="container mx-auto px-6 py-28 z-10 relative h-full flex items-center justify-center min-h-screen">
					<div className="max-w-2xl mx-auto text-center">
						<h1 className="font-nohemi text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900 mb-6">
							Desktop Experience Required
						</h1>

						<p className="text-lg leading-relaxed text-neutral-600 mb-10 max-w-xl mx-auto">
							The gradient editor is currently optimized for desktop devices.
							We&apos;re working on mobile support and will be available soon!
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
							<Link
								to="/"
								onClick={() => trackEvent("Navigate to Home from Mobile")}
								className="inline-flex items-center gap-3 relative overflow-hidden rounded-full text-white px-8 py-4 text-lg font-medium transition-colors duration-200 group w-full sm:w-auto justify-center"
							>
								<img
									src="/gradients/gradient-1.webp"
									alt=""
									className="h-full w-full object-cover -z-10 absolute top-0 left-0"
									loading="eager"
								/>
								<span className="relative z-10 font-nohemi font-semibold">
									Go to Homepage
								</span>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
