import { SharedBetterGradientTypo } from "@/components/shared/shared-better-gradient-typo";
import { Button } from "@/components/ui/button";
import { DottedBackground } from "@/components/ui/dotted-background";
import { GridCursor } from "@/components/ui/grid-cursor";
import { confirmApiKeyRequest } from "@/lib/actions/actions.api-key";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_pages/developers/confirm")({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  component: ConfirmPage,
});

type ConfirmState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; apiKey: string }
  | { status: "error"; message: string };

function ConfirmPage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<ConfirmState>({ status: "idle" });
  const canConfirm = useMemo(() => !!token, [token]);

  const handleConfirm = async () => {
    if (!token || state.status === "pending") return;
    setState({ status: "pending" });
    try {
      const result = await confirmApiKeyRequest({ data: { token } });
      if (result?.ok && "apiKey" in result) {
        setState({ status: "success", apiKey: result.apiKey });
        return;
      }
      const error =
        result?.error === "expired"
          ? "That confirmation link has expired. Please request a new key."
          : result?.error === "used"
            ? "That confirmation link was already used."
            : "That confirmation link is invalid.";
      setState({ status: "error", message: error });
    } catch {
      setState({
        status: "error",
        message: "We could not confirm your request. Please try again.",
      });
    }
  };

  const handleCopy = async () => {
    if (state.status !== "success") return;
    await navigator.clipboard.writeText(state.apiKey);
  };

  return (
    <main className="bg-white relative min-h-[70vh]">
      <section className="relative overflow-hidden">
        <DottedBackground />
        <div className="container max-w-4xl mx-auto px-6 py-20 relative z-10">
          <div className="border border-neutral-200 bg-white p-10">
            <GridCursor />
            <p className="text-xs font-mono uppercase tracking-wide text-neutral-500">
              Developers
            </p>
            <h1 className="font-nohemi text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900 mt-3">
              Confirm your <SharedBetterGradientTypo className="tracking-[4%]" />{" "}
              API key
            </h1>
            <p className="text-base text-neutral-600 mt-3 max-w-2xl">
              For security, we only reveal your API key once. Store it somewhere
              safe after confirmation.
            </p>

            <div className="mt-10 border border-neutral-200 bg-neutral-50 p-6">
              {state.status === "idle" && canConfirm && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-neutral-600">
                    Click below to generate your API key. It will be displayed
                    once and cannot be recovered later.
                  </p>
                  <Button
                    intent="primary"
                    className="rounded-none"
                    onPress={handleConfirm}
                  >
                    Generate API key
                  </Button>
                </div>
              )}

              {state.status === "pending" && (
                <p className="text-sm text-neutral-600">Generating your key...</p>
              )}

              {state.status === "success" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-neutral-600">
                    Here is your API key. Copy it now — you will not be able to
                    see it again.
                  </p>
                  <div className="border border-neutral-300 bg-white px-4 py-3 font-mono text-sm text-neutral-900">
                    {state.apiKey}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      intent="primary"
                      className="rounded-none"
                      onPress={handleCopy}
                    >
                      Copy API key
                    </Button>
                    <Link
                      to="/developers"
                      className="inline-flex items-center px-4 py-2 border border-neutral-900 text-neutral-900 font-nohemi font-semibold hover:bg-neutral-900 hover:text-white transition-colors"
                    >
                      Back to developers
                    </Link>
                  </div>
                </div>
              )}

              {state.status === "error" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-red-600">{state.message}</p>
                  {canConfirm && (
                    <Button
                      intent="primary"
                      className="rounded-none"
                      onPress={handleConfirm}
                    >
                      Try again
                    </Button>
                  )}
                  <Link
                    to="/developers"
                    className="inline-flex items-center px-4 py-2 border border-neutral-900 text-neutral-900 font-nohemi font-semibold hover:bg-neutral-900 hover:text-white transition-colors"
                  >
                    Request a new key
                  </Link>
                </div>
              )}

              {state.status === "idle" && !canConfirm && (
                <p className="text-sm text-neutral-600">
                  This confirmation link is missing a token.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
