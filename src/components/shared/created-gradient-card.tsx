import { svgDataUrl, svgStringFromState } from "@/lib/mesh-svg";
import { decodeShareString } from "@/lib/utils/share";
import { Link } from "@tanstack/react-router";

export type CreatedGradient = {
  id: string;
  share: string;
  width: number;
  height: number;
  shapesCount: number;
  colorsCount: number;
  exportedFormats: string; // JSON string array
  status: string;
  createdAt: number;
};

export function CreatedGradientCard({
  item,
  onStatusChange,
}: {
  item: CreatedGradient;
  onStatusChange: (status: string) => void;
}) {
  const formats = JSON.parse(item.exportedFormats) as string[];

  const decoded = decodeShareString(item.share);
  const previewDataUrl = (() => {
    if (!decoded) return null;
    const svg = svgStringFromState({
      canvas: decoded.canvas,
      shapes: decoded.shapes,
      palette: decoded.palette,
      filters: decoded.filters,
      outputSize: { width: 480, height: 300 },
    });
    return svgDataUrl(svg);
  })();

  return (
    <li className="rounded-xl bg-white shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-neutral-600">
          {item.width}×{item.height} • {item.shapesCount} shapes •{" "}
          {item.colorsCount} colors
        </span>
        <span className="text-xs text-neutral-500">
          {new Date(item.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="mb-4">
        {previewDataUrl ? (
          <div className="rounded-lg overflow-hidden border">
            <img
              src={previewDataUrl}
              alt="Gradient preview"
              className="block w-full h-40 object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div className="h-40 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm">
            No preview
          </div>
        )}
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
          params={{ state: item.share }}
          className="inline-flex items-center px-3 py-2 rounded-lg bg-black text-white"
        >
          Open
        </Link>
        <div className="flex items-center gap-2">
          <label
            className="text-xs text-neutral-500"
            htmlFor={`status-${item.id}`}
          >
            {item.status}
          </label>
          <select
            id={`status-${item.id}`}
            className="border rounded px-2 py-1 text-xs"
            value={item.status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="public">Public</option>
          </select>
        </div>
      </div>
    </li>
  );
}
