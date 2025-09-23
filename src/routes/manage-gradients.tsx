import {
  type CreatedGradient,
  CreatedGradientCard,
} from "@/components/shared/created-gradient-card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  deleteGradientFromDb,
  getGradientsInfiniteOptions,
  updateGradientStatusInDb,
} from "@/lib/actions/actions.gradient";
import type { CreatedGradientTable } from "@/lib/db/schema";
import {
  type InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
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
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: deleteGradientFromDb,
    onSuccess: (_res, variables: { data: { id: string } }) => {
      // Remove the deleted item from all cached infinite pages
      queryClient.setQueriesData<
        InfiniteData<{ gradients: CreatedGradientTable[] }>
      >({ queryKey: ["gradientsInfinite"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            gradients: p.gradients.filter((g) => g.id !== variables.data.id),
          })),
        };
      });
    },
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
                onDelete={() => setConfirmDeleteId(it.id)}
              />
            ))}
          </ul>
        )}
        <div ref={sentinelRef} className="h-8" />
        {isFetchingNextPage && (
          <p className="mt-4 text-center">Loading more…</p>
        )}
        <Modal
          isOpen={!!confirmDeleteId}
          onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        >
          <Modal.Content role="alertdialog" size="sm">
            <Modal.Header
              title="Delete gradient?"
              description="This action cannot be undone."
            />
            <Modal.Footer>
              <Button
                intent="outline"
                onPress={() => setConfirmDeleteId(null)}
                isPending={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                intent="danger"
                isPending={deleteMutation.isPending}
                onPress={() => {
                  if (!confirmDeleteId) return;
                  deleteMutation.mutate({ data: { id: confirmDeleteId } });
                  setConfirmDeleteId(null);
                }}
              >
                Delete
              </Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      </div>
    </div>
  );
}
