import { FrameProvider } from "@/components/mesh/frame/frame-context";
import { MeshPreview } from "@/components/mesh/mesh-preview";
import { MeshSidebar } from "@/components/mesh/sidebar/mesh-sidebar";
import { trackEvent } from "@/lib/tracking";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { twJoin } from "tailwind-merge";

export const Route = createFileRoute("/editor")({
  component: Editor,
  ssr: false,
});

function Editor() {
  useEffect(() => {
    trackEvent("Editor Loaded");
  }, []);

  return (
    <FrameProvider>
      <div
        className={twJoin(
          "flex-1 w-full overflow-hidden bg-gray-100 relative pl-[17rem] editor-container",
          "[background-size:16px_16px] bg-[position:0_0] bg-repeat-round",
          "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]"
        )}
        style={{}}
      >
        <MeshSidebar />
        <MeshPreview />
      </div>
    </FrameProvider>
  );
}
