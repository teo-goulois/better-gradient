import { FrameProvider } from "@/components/mesh/frame/frame-context";
import { MeshPreviewShared } from "@/components/mesh/mesh-preview-shared";
import { trackEvent } from "@/lib/tracking";
import { useMeshStore } from "@/store/store-mesh";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/share/$state")({
  component: Share,
});

function Share() {
  const params = Route.useParams();
  const fromShareString = useMeshStore((s) => s.fromShareString);
  const palette = useMeshStore((state) => state.palette);
  const shapes = useMeshStore((state) => state.shapes);

  useEffect(() => {
    if (params.state) {
      fromShareString(params.state);
      trackEvent("View Shared Gradient", {
        share_state: `${params.state.slice(0, 20)}...`,
        shapes_count: shapes.length,
        colors_count: palette.length,
      });
    }
  }, [params.state, fromShareString, shapes.length, palette.length]);

  return (
    <FrameProvider>
      <div className="flex-1 w-full bg-gray-100 relative">
        <MeshPreviewShared />
      </div>
    </FrameProvider>
  );
}
