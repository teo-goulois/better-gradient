"use client";

import { SharedNavbar } from "@/components/shared/shared-navbar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { twJoin } from "tailwind-merge";

export function ProductShell({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#fafaf8_48%,#f4f4ef_100%)] text-neutral-950">
      <SharedNavbar />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        {title || description || actions ? (
          <section className="flex flex-col gap-6 border-b border-neutral-200 pb-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                {title ? (
                  <h1 className="font-nohemi text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
                    {title}
                  </h1>
                ) : null}
                {description ? (
                  <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
                    {description}
                  </p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex flex-wrap gap-3">{actions}</div>
              ) : null}
            </div>
          </section>
        ) : null}
        {children}
      </main>
    </div>
  );
}

export function SurfaceCard({
  className,
  hoverable,
  children,
}: {
  className?: string;
  hoverable?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={twJoin(
        "border border-neutral-200 bg-white p-5 sm:p-6",
        hoverable &&
          "transition-colors duration-200 hover:border-neutral-300",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function VisibilityBadge({
  visibility,
  className,
}: {
  visibility: "private" | "public" | "unlisted";
  className?: string;
}) {
  const palette =
    visibility === "public"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : visibility === "unlisted"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-neutral-200 bg-neutral-100 text-neutral-600";

  return (
    <span
      className={twJoin(
        "inline-flex items-center border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        palette,
        className,
      )}
    >
      {visibility}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: React.ReactNode;
  helper?: string;
}) {
  return (
    <div className="border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-400">
        {label}
      </p>
      <p className="mt-2 font-nohemi text-2xl font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
      {helper ? (
        <p className="mt-1.5 text-xs text-neutral-400">{helper}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center border border-dashed border-neutral-300 bg-neutral-50/60 px-6 py-16 text-center sm:py-20">
      <div className="mb-5 flex size-12 items-center justify-center bg-neutral-100 text-neutral-400">
        <svg
          className="size-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3"
          />
        </svg>
      </div>
      <h2 className="font-nohemi text-xl font-semibold tracking-tight text-neutral-950">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
        {description}
      </p>
      {action ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {action}
        </div>
      ) : null}
    </section>
  );
}

export function AuthInlineCta({
  next,
  label = "Sign in with Google",
}: {
  next: string;
  label?: string;
}) {
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      type="button"
      className="rounded-none"
      isDisabled={isPending}
      onClick={async () => {
        try {
          setIsPending(true);
          await authClient.signIn.social({
            provider: "google",
            callbackURL: next,
            newUserCallbackURL: next,
            errorCallbackURL: "/login?error=google_auth_failed",
            disableRedirect: false,
          });
        } catch {
          window.location.assign("/login?error=google_auth_failed");
        } finally {
          setIsPending(false);
        }
      }}
    >
      {isPending ? "Redirecting..." : label}
    </Button>
  );
}
