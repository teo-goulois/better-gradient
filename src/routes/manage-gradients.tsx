import {
  type CreatedGradient,
  CreatedGradientCard,
} from "@/components/shared/created-gradient-card";
import {
  getGradientsInfiniteOptions,
  updateGradientStatusInDb,
} from "@/lib/actions/actions.gradient";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
} from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/manage-gradients")({
  loader: async ({ context }) => {
    // Prefetch first page for infinite query
    await context.queryClient.ensureInfiniteQueryData(
      getGradientsInfiniteOptions({ limit: 10, status: null })
    );
    return null;
  },

  component: CreatedPage,
});

function CreatedPage() {
  if (process.env.NODE_ENV !== "development") throw notFound();

  const [status, setStatus] = useState<"draft" | "public" | null>(null);

  const infiniteOptions = useMemo(
    () => getGradientsInfiniteOptions({ limit: 10, status }),
    [status]
  );

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      ...infiniteOptions,
      placeholderData: keepPreviousData,
    });

  const allGradients = useMemo(
    () => data?.pages.flatMap((p) => p.gradients) ?? [],
    [data]
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const updateStatusMutation = useMutation({
    mutationFn: updateGradientStatusInDb,
  });

  return (
    <div className="flex-1 w-full min-h-screen bg-bg">
      <div className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-semibold">Created gradients</h1>
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-600" htmlFor="statusFilter">
              Status
            </label>
            <select
              id="statusFilter"
              className="border rounded px-2 py-1 text-sm"
              value={status ?? "all"}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "all") {
                  setStatus(null);
                } else {
                  setStatus(value as "draft" | "public");
                }
              }}
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="featured">Featured</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>
        {isLoading ? (
          <p>Loading…</p>
        ) : allGradients.length === 0 ? (
          <p>No gradients yet. Export one from the editor.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allGradients.map((it) => (
              <CreatedGradientCard
                key={it.id}
                item={it as CreatedGradient}
                onStatusChange={(next) =>
                  updateStatusMutation.mutate({
                    data: { id: it.id, status: next },
                  })
                }
              />
            ))}
          </ul>
        )}
        <div ref={sentinelRef} className="h-8" />
        {isFetchingNextPage && (
          <p className="mt-4 text-center">Loading more…</p>
        )}
      </div>
    </div>
  );
}
