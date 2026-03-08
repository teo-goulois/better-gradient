import { AuthInlineCta } from "@/components/gradients/product-shell";
import { SharedFooter } from "@/components/shared/shared-footer";
import { SharedNavbar } from "@/components/shared/shared-navbar";
import { getViewerQueryOptions } from "@/lib/actions/actions.auth";
import { seo } from "@/utils/seo";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const errorMessages: Record<string, string> = {
	google_auth_failed:
		"Google sign-in failed or was cancelled. Please try again.",
};

export const Route = createFileRoute("/login")({
	validateSearch: z.object({
		next: z.string().optional(),
		error: z.string().optional(),
	}),
	loaderDeps: ({ search }) => ({
		next: search.next,
	}),
	head: () => ({
		...seo({
			title: "Login | Better Gradient",
			description:
				"Sign in with Google to save gradients, unlock analytics, manage favorites and publish public links.",
			noindex: true,
		}),
	}),
	loader: async ({ context, deps }) => {
		const viewer = await context.queryClient.ensureQueryData(
			getViewerQueryOptions(),
		);
		if (viewer.user) {
			throw redirect({ href: deps.next ?? "/dashboard" });
		}
		return null;
	},
	component: LoginPage,
});

const features = [
	{
		title: "Gradient library",
		description: "Save unlimited gradients and organise your personal collection.",
		icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z",
	},
	{
		title: "Published links",
		description: "Share public or unlisted permalinks to any gradient you create.",
		icon: "M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244",
	},
	{
		title: "Private analytics",
		description: "Track views, visitors, referrers and leaderboard position.",
		icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
	},
	{
		title: "Upvotes & favorites",
		description: "Vote on public gradients and bookmark the ones you love.",
		icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z",
	},
];

function LoginPage() {
	const search = Route.useSearch();
	const next = search.next ?? "/dashboard";
	const errorMessage = search.error ? errorMessages[search.error] : null;

	return (
		<div className="flex min-h-screen flex-col">
			<SharedNavbar />

			<main className="flex-1">
				<div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
					{/* Hero */}
					<div className="text-center">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
							Account
						</p>
						<h1 className="mt-4 font-nohemi text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
							Sign in to unlock
							<br />
							<span className="bg-linear-to-r from-neutral-950 via-neutral-500 to-neutral-950 bg-clip-text text-transparent">
								your gradient library
							</span>
						</h1>
						<p className="mx-auto mt-4 max-w-lg text-base leading-7 text-neutral-500">
							The editor stays free and anonymous. Sign in only when you want to
							save, publish, and track your work.
						</p>
					</div>

					{/* Sign-in card */}
					<div className="mt-10 border border-neutral-200 bg-white p-6 sm:p-8">
						<div className="flex flex-col items-center gap-6">
							{/* Google icon */}
							<div className="flex size-14 items-center justify-center border border-neutral-200 bg-neutral-50">
								<svg className="size-6" viewBox="0 0 24 24">
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
										fill="#4285F4"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
										fill="#34A853"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
										fill="#FBBC05"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
										fill="#EA4335"
									/>
								</svg>
							</div>

							<div className="text-center">
								<h2 className="font-nohemi text-xl font-semibold tracking-tight text-neutral-950">
									Continue with Google
								</h2>
								<p className="mt-1.5 text-sm text-neutral-500">
									No password, no extra steps. One click and you're in.
								</p>
							</div>

							<div className="flex w-full max-w-xs flex-col gap-3">
								<AuthInlineCta
									next={next}
									label="Sign in with Google"
								/>
								<a
									href="/editor"
									className="inline-flex items-center justify-center border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-950"
								>
									Continue without an account
								</a>
							</div>

							{errorMessage ? (
								<div className="w-full max-w-xs border border-red-200 bg-red-50/80 px-4 py-3">
									<p className="text-center text-sm text-red-600">
										{errorMessage}
									</p>
								</div>
							) : null}
						</div>
					</div>

					{/* Features */}
					<div className="mt-10 grid gap-px bg-neutral-200 border border-neutral-200 sm:grid-cols-2">
						{features.map((feature) => (
							<div
								key={feature.title}
								className="group bg-white p-5 transition-colors duration-150 hover:bg-neutral-50"
							>
								<div className="flex items-start gap-4">
									<div className="flex size-10 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50 transition-colors duration-150 group-hover:border-neutral-300 group-hover:bg-neutral-100">
										<svg
											className="size-[18px] text-neutral-400 transition-colors duration-150 group-hover:text-neutral-600"
											viewBox="0 0 24 24"
											fill="none"
											strokeWidth={1.5}
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d={feature.icon}
											/>
										</svg>
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-neutral-950">
											{feature.title}
										</p>
										<p className="mt-1 text-sm leading-relaxed text-neutral-500">
											{feature.description}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Tier comparison */}
					<div className="mt-10 grid gap-px bg-neutral-200 border border-neutral-200 sm:grid-cols-2">
						<div className="bg-white p-5">
							<div className="flex items-center gap-3">
								<span className="size-2 rounded-full bg-neutral-300" />
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
									Without account
								</p>
							</div>
							<ul className="mt-4 space-y-2.5 text-sm text-neutral-500">
								<li className="flex items-center gap-2.5">
									<CheckIcon className="text-neutral-300" />
									Full editor access
								</li>
								<li className="flex items-center gap-2.5">
									<CheckIcon className="text-neutral-300" />
									PNG, SVG and CSS export
								</li>
								<li className="flex items-center gap-2.5">
									<CheckIcon className="text-neutral-300" />
									Legacy share links
								</li>
							</ul>
						</div>
						<div className="bg-neutral-950 p-5 text-white">
							<div className="flex items-center gap-3">
								<span className="size-2 rounded-full bg-white/40" />
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
									With an account
								</p>
							</div>
							<ul className="mt-4 space-y-2.5 text-sm text-white/70">
								<li className="flex items-center gap-2.5">
									<CheckIcon className="text-white/40" />
									Everything above, plus
								</li>
								<li className="flex items-center gap-2.5">
									<CheckIcon className="text-white/40" />
									Personal gradient library
								</li>
								<li className="flex items-center gap-2.5">
									<CheckIcon className="text-white/40" />
									Published pages & analytics
								</li>
								<li className="flex items-center gap-2.5">
									<CheckIcon className="text-white/40" />
									Upvotes, favorites & leaderboard
								</li>
							</ul>
						</div>
					</div>
				</div>
			</main>

			<SharedFooter />
		</div>
	);
}

function CheckIcon({ className }: { className?: string }) {
	return (
		<svg
			className={`size-4 shrink-0 ${className ?? ""}`}
			viewBox="0 0 24 24"
			fill="none"
			strokeWidth={2.5}
			stroke="currentColor"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="m4.5 12.75 6 6 9-13.5"
			/>
		</svg>
	);
}
