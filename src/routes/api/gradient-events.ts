import { buildVisitorHash } from "@/lib/auth";
import { trackGradientEventInternal } from "@/lib/server/saved-gradient-service";
import { trackGradientEventValidator } from "@/lib/validators/validator.saved-gradient";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gradient-events")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const payload = trackGradientEventValidator.parse(
						await request.json(),
					);
					const result = await trackGradientEventInternal({
						slug: payload.slug,
						eventType: payload.eventType,
						referrer: payload.referrer,
						visitorHash: buildVisitorHash(),
					});
					return Response.json(result);
				} catch (error) {
					console.error("Failed to track gradient event", error);
					return Response.json({ ok: false }, { status: 400 });
				}
			},
		},
	},
});
