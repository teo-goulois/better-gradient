import { Button } from "@/components/ui/button";
import { DottedBackground } from "@/components/ui/dotted-background";
import { GridCursor } from "@/components/ui/grid-cursor";
import { Tooltip } from "@/components/ui/tooltip";
import { env } from "@/env";
import { requestApiKey, verifyApiKey } from "@/lib/actions/actions.api-keys";
import { API_LIMITS } from "@/lib/config/api-limits";
import { siteUrl } from "@/utils/site";
import { IconClipboard, IconClipboardFill } from "@intentui/icons";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

type VerificationResult =
  | {
      ok: true;
      apiKey: string;
      email: string;
      tier: string;
    }
  | {
      ok: false;
      error: string;
    };

export const Route = createFileRoute("/_pages/developers")({
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "Better Gradient API documentation. Generate deterministic mesh gradients with seeds, rate limits, and verified API keys.",
      },
      {
        name: "keywords",
        content:
          "gradient api, mesh gradient api, css gradient api, svg gradient api, developer docs",
      },
    ],
  }),
  loader: async ({ location }) => {
    const token = new URLSearchParams(location.search).get("token");
    if (!token || token.length < 32) {
      return { verification: null };
    }
    const verification = (await verifyApiKey({
      data: { token },
    })) as VerificationResult;
    return { verification };
  },
  component: DevelopersPage,
});

function DevelopersPage() {
  const data = Route.useLoaderData();
  const verification = data?.verification ?? null;
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const baseUrl = env.VITE_SERVER_URL ?? siteUrl;
  const exampleUrl = `${baseUrl}/api/gradient?seed=studio&size=1200&format=svg`;

  const requestMutation = useMutation({
    mutationFn: (payload: { email: string }) =>
      requestApiKey({ data: payload }),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    requestMutation.mutate({ email });
  };

  const handleCopy = async () => {
    if (!verification || !verification.ok) return;
    try {
      await navigator.clipboard.writeText(verification.apiKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy API key", error);
    }
  };

  return (
    <main className="flex-1 w-full bg-white relative overflow-hidden">
      <DottedBackground />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.2),_transparent_70%)] blur-2xl" />
        <div className="absolute -bottom-32 left-10 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.22),_transparent_70%)] blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-neutral-400">
              Developers
            </p>
            <h1 className="font-nohemi text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900 mt-4">
              Gradient API
            </h1>
            <p className="mt-5 text-lg text-neutral-600 leading-relaxed">
              Generate deterministic mesh gradients with a single GET request.
              Built for speed, cacheability, and cost-aware usage.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#get-key"
                className="inline-flex items-center px-6 py-3 border-2 border-neutral-900 bg-neutral-900 text-white font-nohemi font-semibold hover:bg-white hover:text-neutral-900 transition-colors"
              >
                Request API Key
              </a>
              <a
                href="#docs"
                className="inline-flex items-center px-6 py-3 border border-neutral-200 bg-white text-neutral-700 font-nohemi font-semibold hover:border-neutral-400 transition-colors"
              >
                Read Docs
              </a>
            </div>
          </div>
          <div className="relative group border border-neutral-200 bg-white/90 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.5)]">
            <GridCursor />
            <p className="text-xs font-mono text-neutral-400">Quick start</p>
            <pre className="mt-4 rounded-lg bg-neutral-900 text-neutral-100 p-4 text-sm leading-relaxed overflow-x-auto">
              {`curl "${baseUrl}/api/gradient?seed=studio&format=svg&width=1200&height=800"`}
            </pre>
            <p className="mt-4 text-sm text-neutral-500">
              Seeded requests are cacheable and return identical results.
            </p>
          </div>
        </section>

        <section id="docs" className="mt-20">
          <div className="max-w-3xl">
            <h2 className="font-nohemi text-3xl font-semibold text-neutral-900">
              Endpoint
            </h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              One endpoint, multiple formats. Add optional headers for a
              verified key tier.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200">
            <div className="bg-white p-6">
              <p className="text-xs font-mono text-neutral-400">GET</p>
              <p className="mt-3 font-nohemi text-lg font-semibold text-neutral-900">
                /api/gradient
              </p>
              <p className="mt-3 text-sm text-neutral-600">
                Returns SVG, CSS, or share code.
              </p>
            </div>
            <div className="bg-white p-6">
              <p className="text-xs font-mono text-neutral-400">Headers</p>
              <p className="mt-3 text-sm text-neutral-700">
                Authorization: Bearer &lt;key&gt;
              </p>
              <p className="mt-2 text-sm text-neutral-700">
                x-api-key: &lt;key&gt;
              </p>
              <p className="mt-3 text-sm text-neutral-500">
                Optional for public demo tier.
              </p>
            </div>
            <div className="bg-white p-6">
              <p className="text-xs font-mono text-neutral-400">Formats</p>
              <p className="mt-3 text-sm text-neutral-700">svg</p>
              <p className="mt-2 text-sm text-neutral-700">css</p>
              <p className="mt-2 text-sm text-neutral-700">share</p>
            </div>
          </div>
        </section>

        <section className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="border border-neutral-200 bg-white p-8 relative group hover:bg-neutral-50 transition-colors">
            <GridCursor />
            <h3 className="font-nohemi text-xl font-semibold text-neutral-900">
              <span className="inline-flex items-center gap-2">
                Query Parameters
                <Tooltip>
                  <Tooltip.Trigger
                    aria-label="Show full URL example"
                    className="size-6 rounded-full border border-neutral-200 text-xs font-mono text-neutral-500 hover:text-neutral-900 hover:border-neutral-400"
                  >
                    ?
                  </Tooltip.Trigger>
                  <Tooltip.Content intent="inverse">
                    <div className="text-xs">
                      <div className="font-semibold">Full URL example</div>
                      <div className="mt-1 font-mono text-[11px] text-muted-fg">
                        {exampleUrl}
                      </div>
                    </div>
                  </Tooltip.Content>
                </Tooltip>
              </span>
            </h3>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <p>
                <span className="font-mono text-neutral-800 font-semibold">
                  seed
                </span>{" "}
                or{" "}
                <span className="font-mono text-neutral-800 font-semibold">
                  email
                </span>{" "}
                sets the deterministic identity. Same value = same gradient.
              </p>
              <p>
                Public tier requires{" "}
                <span className="font-mono text-neutral-800 font-semibold">
                  seed
                </span>{" "}
                or{" "}
                <span className="font-mono text-neutral-800 font-semibold">
                  email
                </span>
                . Verified keys can omit both for random output.
              </p>
              <p>
                <span className="font-mono text-neutral-800 font-semibold">
                  size
                </span>{" "}
                sets both width and height. Use{" "}
                <span className="font-mono text-neutral-800 font-semibold">
                  width
                </span>{" "}
                and{" "}
                <span className="font-mono text-neutral-800 font-semibold">
                  height
                </span>{" "}
                to override one or both.
              </p>
              <p>
                <span className="font-mono text-neutral-800 font-semibold">
                  count
                </span>{" "}
                controls how many shapes are blended in the mesh.
              </p>
              <p>
                <span className="font-mono text-neutral-800 font-semibold">
                  format
                </span>{" "}
                selects
                <span className="font-mono text-neutral-800 font-semibold">
                  svg
                </span>
                ,{" "}
                <span className="font-mono text-neutral-800 font-semibold">
                  css
                </span>
                , or{" "}
                <span className="font-mono text-neutral-800 font-semibold">
                  share
                </span>
                .
              </p>
            </div>
          </div>
          <div className="border border-neutral-200 bg-white p-8 relative group hover:bg-neutral-50 transition-colors">
            <GridCursor />
            <h3 className="font-nohemi text-xl font-semibold text-neutral-900">
              Cache Behavior
            </h3>
            <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
              Seeded requests return an ETag and long-lived cache headers so CDN
              caches can absorb traffic. Random seeds are never cached to keep
              costs predictable.
            </p>
            <pre className="mt-4 rounded-lg bg-neutral-900 text-neutral-100 p-4 text-xs leading-relaxed overflow-x-auto">
              {`ETag: W/"<hash>"\nCache-Control: public, max-age=31536000, s-maxage=31536000, immutable`}
            </pre>
          </div>
        </section>

        <section className="mt-20">
          <div className="max-w-3xl">
            <h2 className="font-nohemi text-3xl font-semibold text-neutral-900">
              Rate Limits
            </h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              Public usage is capped to protect costs. Verified keys unlock
              higher limits and optional random seeds.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-neutral-200 bg-white p-6">
              <p className="text-xs font-mono text-neutral-400">Public</p>
              <p className="mt-3 text-2xl font-nohemi font-semibold text-neutral-900">
                {API_LIMITS.public.perMinute}/min
              </p>
              <p className="text-sm text-neutral-500">
                {API_LIMITS.public.perDay}/day
              </p>
              <p className="mt-4 text-sm text-neutral-600">
                Max size {API_LIMITS.public.maxSize}px - Max count{" "}
                {API_LIMITS.public.maxCount}
              </p>
            </div>
            <div className="border border-neutral-200 bg-white p-6">
              <p className="text-xs font-mono text-neutral-400">Verified</p>
              <p className="mt-3 text-2xl font-nohemi font-semibold text-neutral-900">
                {API_LIMITS.verified.perMinute}/min
              </p>
              <p className="text-sm text-neutral-500">
                {API_LIMITS.verified.perDay}/day
              </p>
              <p className="mt-4 text-sm text-neutral-600">
                Max size {API_LIMITS.verified.maxSize}px - Max count{" "}
                {API_LIMITS.verified.maxCount}
              </p>
            </div>
          </div>
        </section>

        <section id="get-key" className="mt-20">
          <div className="border border-neutral-200 bg-white p-10 relative overflow-hidden">
            <GridCursor />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.18),_transparent_70%)] blur-2xl" />
            <h2 className="font-nohemi text-3xl font-semibold text-neutral-900">
              Get a Verified API Key
            </h2>
            <p className="mt-3 text-neutral-600">
              We'll email a one-time verification link. Keys are shown once, so
              store it safely.
            </p>

            {verification?.ok && (
              <div className="mt-6 border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-800 font-semibold">
                  Verified! Here is your API key.
                </p>
                <div className="mt-3 relative">
                  <pre className="rounded-md bg-neutral-900 relative text-neutral-100 p-3 pr-12 text-xs overflow-x-auto">
                    {verification.apiKey}
                    <Button
                      type="button"
                      intent="secondary"
                      size="sq-xs"
                      onPress={handleCopy}
                      aria-label="Copy API key to clipboard"
                      className="absolute top-1/2 -translate-y-1/2 right-1.5"
                    >
                      {copied ? <IconClipboardFill /> : <IconClipboard />}
                    </Button>
                  </pre>
                </div>
                {copied && (
                  <p className="mt-2 text-xs text-emerald-700">
                    Key copied to clipboard.
                  </p>
                )}
              </div>
            )}

            {verification && !verification.ok && (
              <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                The verification link is invalid or has already been used.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <label
                className="text-sm font-medium text-neutral-700"
                htmlFor="api-email"
              >
                Email address
              </label>
              <input
                id="api-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-neutral-200 bg-white/90 px-4 py-3 font-mono text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  intent="primary"
                  size="lg"
                  isDisabled={requestMutation.isPending}
                >
                  Request Verification
                </Button>
                {requestMutation.data?.ok && (
                  <span className="text-sm text-emerald-700">
                    Check your inbox for a verification link.
                  </span>
                )}
                {requestMutation.data?.ok === false && (
                  <span className="text-sm text-rose-600">
                    {requestMutation.data.error === "rate_limited"
                      ? "Too many requests. Try again later."
                      : "We couldn't send the email. Please try again."}
                  </span>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
