import {
  getPublicGradientsFromDbQueryOptions,
  updateGradientStatusInDb,
} from "@/lib/actions/actions.gradient";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/discovery")({
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(
      getPublicGradientsFromDbQueryOptions()
    );

    return data;
  },
  component: CreatedPage,
});

function CreatedPage() {
  const [status, setStatus] = useState<string | "">("");

  const { data, isLoading } = useSuspenseQuery(
    getPublicGradientsFromDbQueryOptions()
  );

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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
        ) : data.gradients.length === 0 ? (
          <p>No gradients yet. Export one from the editor.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.gradients.map((it) => {
              const formats = JSON.parse(it.exportedFormats) as string[];
              return (
                <li key={it.id} className="rounded-xl bg-white shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-neutral-600">
                      {it.width}×{it.height} • {it.shapesCount} shapes •{" "}
                      {it.colorsCount} colors
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(it.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {formats.map((f) => (
                      <span
                        key={f}
                        className="text-xs px-2 py-1 rounded-full bg-neutral-100"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <Link
                      to="/share/$state"
                      params={{ state: it.share }}
                      className="inline-flex items-center px-3 py-2 rounded-lg bg-black text-white"
                    >
                      Open
                    </Link>
                    <div className="flex items-center gap-2">
                      <label
                        className="text-xs text-neutral-500"
                        htmlFor={`status-${it.id}`}
                      >
                        {it.status}
                      </label>
                      <select
                        id={`status-${it.id}`}
                        className="border rounded px-2 py-1 text-xs"
                        value={it.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            data: { id: it.id, status: e.target.value },
                          })
                        }
                      >
                        <option value="draft">Draft</option>
                        <option value="featured">Featured</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
