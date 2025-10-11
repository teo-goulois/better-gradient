import { DottedBackground } from "@/components/ui/dotted-background";
import { GridCursor } from "@/components/ui/grid-cursor";

export function Features() {
  const features = [
    {
      title: "No Signup Required",
      description:
        "Start creating immediately. No account needed, no barriers to creativity.",
    },
    {
      title: "100% Free to Use",
      description:
        "All features available at no cost. Create unlimited gradients without any restrictions.",
    },
    {
      title: "Multiple Export Formats",
      description:
        "Export as PNG, SVG, or copy CSS code directly. Perfect for any workflow.",
    },
    {
      title: "Full Customization",
      description:
        "Control every aspect: colors, blur intensity, shape positions, and canvas size.",
    },
    {
      title: "Modern Mesh Gradients",
      description:
        "Create trendy blurred mesh backgrounds that stand out in contemporary design.",
    },
    {
      title: "Real-time Preview",
      description:
        "See changes instantly as you design. What you see is what you get.",
    },
  ];

  return (
    <section className="bg-white relative">
      <DottedBackground />

      <div className="container max-w-5xl mx-auto px-6 pt-12 py-24 relative z-10">
        <div className="max-w-3xl ml-auto text-right mb-10">
          <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
            Features
          </h2>
          <p className="mt-3 text-base text-neutral-600">
            Powerful features that make gradient creation effortless
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 max-w-6xl mx-auto relative">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
            >
              <GridCursor />

              {/* Index number */}
              <div className="absolute top-3 right-3 text-5xl font-mono text-neutral-100 group-hover:text-neutral-200 transition-colors leading-none">
                {String(index + 1).padStart(2, "0")}
              </div>

              <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-3 relative z-10">
                {feature.title}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed relative z-10">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
