import { Link } from "@tanstack/react-router";
import { GridCursor } from "../ui/grid-cursor";

interface CallToActionProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  className?: string;
}

export function CallToAction({
  title = "Create Your Own Gradient",
  description = "Join thousands of designers using Better Gradient to create stunning mesh backgrounds. It's free, no signup required.",
  buttonText = "Open Gradient Generator",
  buttonLink = "/editor",
  className = "",
}: CallToActionProps) {
  return (
    <div
      className={`text-center relative group  p-12 border bg-neutral-50 border-neutral-200 ${className}`}
    >
      <GridCursor />
      <h2 className="font-nohemi text-3xl font-semibold text-neutral-900 mb-4">
        {title}
      </h2>
      <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">{description}</p>
      <Link
        to={buttonLink}
        className="inline-flex items-center px-8 py-4 rounded-full bg-black text-white font-nohemi font-semibold hover:scale-105 transition-transform"
      >
        {buttonText}
      </Link>
    </div>
  );
}
