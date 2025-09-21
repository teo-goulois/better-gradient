import { FrameProvider } from "@/components/mesh/frame/frame-context";
import { MeshPreview } from "@/components/mesh/mesh-preview";
import { MeshSidebar } from "@/components/mesh/sidebar/mesh-sidebar";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";
import { Link, createFileRoute } from "@tanstack/react-router";
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
          "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]",
          "max-md:hidden"
        )}
        style={{}}
      >
        <MeshSidebar />
        <MeshPreview />
      </div>

      {/* Mobile message */}
      <div className="md:hidden flex-1 w-full min-h-screen bg-bg relative overflow-hidden">
        <div className="container mx-auto px-6 py-28 z-10 relative h-full flex items-center justify-center min-h-screen">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-nohemi text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900 mb-6">
              Desktop Experience Required
            </h1>

            <p className="text-lg leading-relaxed text-neutral-600 mb-10 max-w-xl mx-auto">
              The gradient editor is currently optimized for desktop devices.
              We're working on mobile support and will be available soon!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <Link
                to="/"
                onClick={() => trackEvent("Navigate to Home from Mobile")}
                className="inline-flex items-center gap-3 relative overflow-hidden rounded-full text-white px-8 py-4 text-lg font-medium transition-colors duration-200 group w-full sm:w-auto justify-center"
              >
                <img
                  src="/gradients/gradient-1.webp"
                  alt=""
                  className="h-full w-full object-cover -z-10 absolute top-0 left-0"
                  loading="eager"
                />
                <span className="relative z-10 font-nohemi font-semibold">
                  Go to Homepage
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </FrameProvider>
  );
}
