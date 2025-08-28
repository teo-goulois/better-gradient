import { createFileRoute } from "@tanstack/react-router";
import { MeshSidebar } from "@/components/mesh/sidebar/mesh-sidebar";
import { MeshPreview } from "@/components/mesh/mesh-preview";
import { twJoin } from "tailwind-merge";
import { trackEvent } from "@/lib/tracking";
import { useEffect } from "react";

export const Route = createFileRoute("/editor")({
  component: Editor,
});

function Editor() {
  useEffect(() => {
    trackEvent("Editor Loaded");
  }, []);

  return (
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
  );
}
