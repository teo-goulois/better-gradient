import { useMeshStore } from "@/store/store-mesh";
import { useFrameContext } from "./frame/frame-context";

export const MeshDevtools = () => {
  const ui = useMeshStore((s) => s.ui);
  const { frame } = useFrameContext();
  const storeFrame = useMeshStore((s) => s.frame);

  if (!ui.container) return null;
  return (
    <div className="absolute top-0 left-0 z-50 bg-black/80 text-white text-xs font-mono p-4 max-w-sm max-h-96 overflow-auto rounded-br-lg">
      <h3 className="font-bold mb-2 text-yellow-400">Mesh DevTools</h3>

      <div className="space-y-2">
        <div>
          <span className="text-blue-400">Container:</span>
          <div className="ml-2 text-gray-300">
            {ui.container ? (
              <div>
                Width: {ui.container.width}px
                <br />
                Height: {ui.container.height}px
              </div>
            ) : (
              <span className="text-gray-500">undefined</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-green-700">Frame:</span>
          <div className="ml-2 text-gray-300">
            {storeFrame ? (
              <div>
                X: {storeFrame.x}px
                <br />
                Y: {storeFrame.y}px
                <br />
                Width: {storeFrame.width}px
                <br />
                Height: {storeFrame.height}px
                <br />
                Aspect Ratio: {storeFrame.aspectRatio?.toFixed(3) ?? "auto"}
              </div>
            ) : (
              <span className="text-gray-500">undefined</span>
            )}
          </div>
        </div>
        <div>
          <span className="text-green-400">Frame Context:</span>
          <div className="ml-2 text-gray-300">
            {frame ? (
              <div>
                X: {frame.x}px
                <br />
                Y: {frame.y}px
                <br />
                Width: {frame.width}px
                <br />
                Height: {frame.height}px
                <br />
                Aspect Ratio: {frame.aspectRatio?.toFixed(3) ?? "auto"}
              </div>
            ) : (
              <span className="text-gray-500">undefined</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-purple-400">Settings:</span>
          <div className="ml-2 text-gray-300">
            <div>
              Show Centers:{" "}
              <span
                className={ui.showCenters ? "text-green-400" : "text-red-400"}
              >
                {ui.showCenters ? "true" : "false"}
              </span>
            </div>
            <div>
              Show Vertices:{" "}
              <span
                className={ui.showVertices ? "text-green-400" : "text-red-400"}
              >
                {ui.showVertices ? "true" : "false"}
              </span>
            </div>
            <div>
              Maintain Aspect Ratio:{" "}
              <span
                className={
                  ui.maintainAspectRatio ? "text-green-400" : "text-red-400"
                }
              >
                {ui.maintainAspectRatio ? "true" : "false"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
