import { requireCurrentUser } from "@/lib/auth";
import { toggleGradientReactionInternal } from "@/lib/server/saved-gradient-service";
import { toggleGradientReactionValidator } from "@/lib/validators/validator.saved-gradient";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gradient-reaction/toggle-favorite")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const user = await requireCurrentUser();
					const payload = toggleGradientReactionValidator.parse(
						await request.json(),
					);
					const result = await toggleGradientReactionInternal({
						gradientId: payload.gradientId,
						type: "favorite",
						userId: user.id,
					});
					return Response.json(result);
				} catch (error) {
					console.error("Failed to toggle gradient favorite", error);
					return Response.json({ ok: false }, { status: 400 });
				}
			},
		},
	},
});
