import { SharedBetterGradientTypo } from "@/components/shared/shared-better-gradient-typo";
import { Button } from "@/components/ui/button";
import { DottedBackground } from "@/components/ui/dotted-background";
import { GridCursor } from "@/components/ui/grid-cursor";
import { requestApiKey } from "@/lib/actions/actions.api-key";
import { trackEvent } from "@/lib/tracking";
import { buildAbsoluteUrl, seo } from "@/utils/seo";
import { Link, createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";

export const Route = createFileRoute("/_pages/developers/")({
	head: () => ({
		...seo({
			title:
				"Developer API — Generate Gradients Programmatically | Better Gradient",
			description:
				"Developer API for Better Gradient. Request an API key and generate mesh gradients programmatically with simple endpoints.",
			keywords:
				"gradient api, mesh gradient api, gradient generator api, webp png svg gradient, developer api",
			url: buildAbsoluteUrl("/developers"),
			canonical: buildAbsoluteUrl("/developers"),
		}),
	}),
	component: DevelopersPage,
});

type RequestState = "idle" | "pending" | "success" | "error";

function DevelopersPage() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<RequestState>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const canSubmit = useMemo(
		() => email.trim().length > 3 && status !== "pending",
		[email, status],
	);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!email.trim()) {
			setErrorMessage("Please enter a valid email address.");
			setStatus("error");
			return;
		}
		setStatus("pending");
		setErrorMessage(null);
		try {
			trackEvent(
				"API Key Requested",
				{
					source_path: "/developers",
				},
				true,
			);
			await requestApiKey({ data: { email: email.trim() } });
			setStatus("success");
			setEmail("");
		} catch (error) {
			setStatus("error");
			setErrorMessage(
				"We could not process your request right now. Please try again shortly.",
			);
		}
	};

	const handleEmailChange = (value: string) => {
		setEmail(value);
		if (status !== "pending") {
			setStatus("idle");
			setErrorMessage(null);
		}
	};

	return (
		<main className="bg-white relative">
			<section className="relative overflow-hidden">
				<DottedBackground />
				<div className="container max-w-5xl mx-auto px-6 py-16 relative z-10">
					<div className="grid grid-cols-1 gap-12">
						<div>
							<div className="inline-flex items-center gap-2 px-3 py-1 border border-neutral-200 bg-white text-xs font-mono text-neutral-500">
								Developers
								<span className="w-1 h-1 bg-neutral-400" />
								Public API
							</div>
							<h1 className="font-nohemi text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900 mt-4">
								Build gradients programmatically with the{" "}
								<SharedBetterGradientTypo className="tracking-[4%]" /> API
							</h1>
							<p className="text-base text-neutral-600 mt-4 max-w-2xl">
								Generate mesh gradients on-demand in SVG, PNG, WebP, or CSS. The
								API is designed to be deterministic, fast, and easy to integrate
								into your product or pipeline.
							</p>
							<div className="flex flex-wrap gap-3 mt-6">
								<a
									href="#request-key"
									className="inline-flex items-center px-6 py-3 bg-black text-white font-nohemi font-semibold hover:scale-[1.02] transition-transform"
								>
									Request API key
								</a>
								<a
									href="#api-reference"
									className="inline-flex items-center px-6 py-3 border border-neutral-900 text-neutral-900 font-nohemi font-semibold hover:bg-neutral-900 hover:text-white transition-colors"
								>
									View API reference
								</a>
							</div>

							<div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
								{[
									{
										label: "Formats",
										value: "SVG, PNG, WebP, CSS",
									},
									{
										label: "Deterministic",
										value: "Seed or email inputs",
									},
									{
										label: "Canvas sizing",
										value: "width / height / size",
									},
									{
										label: "Rate limits",
										value: "30/min public • 300/min with key",
									},
								].map((item) => (
									<div
										key={item.label}
										className="relative group bg-white border border-neutral-200 p-4"
									>
										<GridCursor />
										<p className="text-xs uppercase tracking-wide text-neutral-500 font-mono">
											{item.label}
										</p>
										<p className="text-sm text-neutral-900 font-medium mt-1">
											{item.value}
										</p>
									</div>
								))}
							</div>

							<div className="mt-10 border border-neutral-200 bg-white p-6">
								<p className="text-xs uppercase tracking-wide text-neutral-500 font-mono">
									Base URL
								</p>
								<div className="mt-3 border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-sm text-neutral-800">
									https://better-gradient.com/api/gradient
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section id="api-reference" className="bg-white relative">
				<div className="container max-w-5xl mx-auto px-6 py-16">
					<div className="max-w-3xl mx-auto text-center mb-10">
						<h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
							API reference
						</h2>
						<p className="mt-3 text-base text-neutral-600">
							Everything you need to integrate the gradient API into your
							product.
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 relative">
						<div className="bg-white p-8 relative group">
							<GridCursor />
							<h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-4">
								Endpoint
							</h3>
							<div className="border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-sm text-neutral-800">
								GET /api/gradient
							</div>
							<p className="text-sm text-neutral-600 mt-4">
								Use query parameters to customize output format, size, and
								generation seed.
							</p>
						</div>

						<div className="bg-white p-8 relative group">
							<GridCursor />
							<h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-4">
								Authentication
							</h3>
							<p className="text-sm text-neutral-600">
								Add your API key as a bearer token to access higher limits
								(300/min per key). Public traffic is limited to 30/min per IP.
							</p>
							<div className="mt-4 border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-sm text-neutral-800">
								Authorization: Bearer YOUR_API_KEY
							</div>
						</div>
					</div>

					<div className="mt-10 border border-neutral-200 bg-white">
						<div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr_0.6fr] gap-px bg-neutral-200">
							{[
								{ label: "Parameter", value: "" },
								{ label: "Description", value: "" },
								{ label: "Default", value: "" },
							].map((item) => (
								<div
									key={item.label}
									className="bg-neutral-50 px-4 py-3 text-xs font-mono uppercase tracking-wide text-neutral-500"
								>
									{item.label}
								</div>
							))}
						</div>
						{[
							{
								name: "format",
								description: "Output type: svg, png, webp, css.",
								defaultValue: "svg",
							},
							{
								name: "width",
								description: "Output width in pixels.",
								defaultValue: "1920",
							},
							{
								name: "height",
								description: "Output height in pixels.",
								defaultValue: "1080",
							},
							{
								name: "size",
								description: "Shortcut to set both width and height.",
								defaultValue: "-",
							},
							{
								name: "seed",
								description: "Deterministic seed for repeatable gradients.",
								defaultValue: "-",
							},
							{
								name: "email",
								description: "Derive a deterministic seed from email.",
								defaultValue: "-",
							},
							{
								name: "count",
								description: "Number of shapes (3-10).",
								defaultValue: "6",
							},
							{
								name: "quality",
								description: "WebP quality (0-1 or 1-100).",
								defaultValue: "0.95",
							},
						].map((row) => (
							<div
								key={row.name}
								className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr_0.6fr] gap-px bg-neutral-200"
							>
								<div className="bg-white px-4 py-3 text-sm font-mono text-neutral-900">
									{row.name}
								</div>
								<div className="bg-white px-4 py-3 text-sm text-neutral-600">
									{row.description}
								</div>
								<div className="bg-white px-4 py-3 text-sm text-neutral-600">
									{row.defaultValue}
								</div>
							</div>
						))}
					</div>
					<div className="mt-4 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
						If you pass both <span className="font-mono">seed</span> and{" "}
						<span className="font-mono">email</span>, the seed takes precedence.
						Width and height override size when both are provided.
					</div>

					<div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 relative">
						<div className="bg-white p-8 relative group">
							<GridCursor />
							<h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-3">
								cURL example
							</h3>
							<div className="bg-neutral-900 text-neutral-100 border border-neutral-300 p-4 font-mono text-sm overflow-x-auto">
								<pre>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  -o mesh.webp \\
  "https://better-gradient.com/api/gradient?format=webp&width=1600&height=900&seed=hello"`}</pre>
							</div>
							<p className="text-sm text-neutral-600 mt-4">
								Replace the seed value to generate a unique gradient.
							</p>
						</div>

						<div className="bg-white p-8 relative group">
							<GridCursor />
							<h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-3">
								Fetch SVG
							</h3>
							<div className="bg-neutral-900 text-neutral-100 border border-neutral-300 p-4 font-mono text-sm overflow-x-auto">
								<pre>{`const res = await fetch(
  "https://better-gradient.com/api/gradient?format=svg&size=1200&seed=sunrise"
);
const svg = await res.text();`}</pre>
							</div>
							<p className="text-sm text-neutral-600 mt-4">
								The response body is the raw SVG markup.
							</p>
						</div>
					</div>

					<div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 relative">
						<div className="bg-white p-8 relative group">
							<GridCursor />
							<h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-3">
								CSS background
							</h3>
							<div className="bg-neutral-900 text-neutral-100 border border-neutral-300 p-4 font-mono text-sm overflow-x-auto">
								<pre>{`const css = await fetch(
  "https://better-gradient.com/api/gradient?format=css&size=1200&seed=studio"
).then((r) => r.text());
document.body.style.cssText = css;`}</pre>
							</div>
						</div>

						<div className="bg-white p-8 relative group">
							<GridCursor />
							<h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-3">
								Response types
							</h3>
							<ul className="space-y-3 text-sm text-neutral-600">
								<li>
									<span className="font-mono text-neutral-900">svg</span> →
									image/svg+xml
								</li>
								<li>
									<span className="font-mono text-neutral-900">png</span> →
									image/png
								</li>
								<li>
									<span className="font-mono text-neutral-900">webp</span> →
									image/webp
								</li>
								<li>
									<span className="font-mono text-neutral-900">css</span> →
									text/css
								</li>
							</ul>
							<div className="mt-5 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
								Errors return plain text with status 400 or 500. Rate limits
								respond with 429 and include X-RateLimit headers.
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="bg-white relative">
				<div className="container max-w-5xl mx-auto px-6 pb-20">
					<div className="max-w-3xl mx-auto text-center mb-10">
						<h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
							Confirmation flow
						</h2>
						<p className="mt-3 text-base text-neutral-600">
							Secure confirmation ensures keys are generated only by the owner.
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 relative">
						{[
							{
								step: "01",
								title: "Request access",
								description:
									"Submit your email to receive the confirmation link.",
							},
							{
								step: "02",
								title: "Confirm your email",
								description:
									"Open the email link to generate a key tied to your address.",
							},
							{
								step: "03",
								title: "Receive your API key",
								description: "Your key is revealed once and ready to use.",
							},
						].map((item) => (
							<div
								key={item.step}
								className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
							>
								<GridCursor />
								<div className="text-sm font-mono text-neutral-400 mb-4 group-hover:text-neutral-900 transition-colors">
									{item.step}
								</div>
								<h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-3">
									{item.title}
								</h3>
								<p className="text-sm text-neutral-600 leading-relaxed">
									{item.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="bg-white relative">
				<div className="container max-w-5xl mx-auto px-6 pb-20">
					<div className="relative  mx-auto">
						<div className="absolute -top-8 -right-10 w-48 h-48 bg-neutral-100 " />
						<div className="absolute -bottom-10 -left-6 w-40 h-40 bg-neutral-200 " />
						<div
							id="request-key"
							className="relative bg-white border border-neutral-200 p-8"
						>
							<GridCursor />
							<div className="flex items-center justify-between mb-6">
								<div>
									<p className="text-xs font-mono uppercase tracking-wide text-neutral-500">
										Request Access
									</p>
									<h2 className="font-nohemi text-2xl font-semibold text-neutral-900">
										Get your API key
									</h2>
								</div>
								<div className="relative w-12 h-12 overflow-hidden border border-neutral-200">
									<img
										src="/gradients/gradient-1.webp"
										alt="Gradient sample"
										className="w-full h-full object-cover"
										loading="lazy"
									/>
								</div>
							</div>
							<form onSubmit={handleSubmit} className="flex flex-col gap-4">
								<label className="text-sm font-medium text-neutral-900">
									Work email
									<input
										className="mt-2 w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
										placeholder="you@company.com"
										type="email"
										value={email}
										onChange={(event) => handleEmailChange(event.target.value)}
										required
									/>
								</label>
								{status === "error" && errorMessage && (
									<p className="text-sm text-red-600">{errorMessage}</p>
								)}
								<Button
									type="submit"
									intent="primary"
									size="lg"
									isPending={status === "pending"}
									isDisabled={!canSubmit}
									className="w-full justify-center rounded-none"
								>
									{status === "pending" ? "Sending request..." : "Request key"}
								</Button>
								{status === "success" && (
									<div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
										Request received. Check your inbox for a confirmation link
										to generate your key.
									</div>
								)}
							</form>
							<p className="text-xs text-neutral-500 mt-4">
								You will receive a confirmation link by email to generate your
								key.
							</p>
						</div>
					</div>
				</div>
			</section>

			<div className="container max-w-5xl mx-auto px-6 pb-20">
				<div className="border border-neutral-200 bg-neutral-50 p-12 text-center relative">
					<GridCursor />
					<h2 className="font-nohemi text-3xl font-semibold text-neutral-900 mb-4">
						Build with Better Gradient
					</h2>
					<p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
						Create your first mesh gradient in the editor or integrate the API
						into your stack.
					</p>
					<Link
						to="/editor"
						className="inline-flex items-center px-8 py-4 bg-black text-white font-nohemi font-semibold hover:scale-[1.02] transition-transform"
					>
						Open the Editor
					</Link>
				</div>
			</div>
		</main>
	);
}
