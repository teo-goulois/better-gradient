import { DottedBackground } from "@/components/ui/dotted-background";
import { GridCursor } from "@/components/ui/grid-cursor";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Choose Your Colors",
      description:
        "Start with our curated color palette or create your own custom gradient colors. Perfect for any design style.",
    },
    {
      number: "02",
      title: "Customize Your Mesh",
      description:
        "Drag and position gradient shapes, adjust blur intensity, and fine-tune your mesh gradient in real-time.",
    },
    {
      number: "03",
      title: "Export & Use",
      description:
        "Download your gradient as PNG, SVG, or copy CSS code. Ready to use in your designs immediately.",
    },
  ];

  return (
    <section className=" bg-white relative">
      <DottedBackground />

      <div className="container mx-auto max-w-5xl px-6 py-24 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
            How It Works
          </h2>
          <p className="mt-3 text-base text-neutral-600">
            Create stunning mesh gradients in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 max-w-5xl mx-auto relative">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
            >
              <GridCursor />

              <div className="text-sm font-mono text-neutral-400 mb-4 group-hover:text-neutral-900 transition-colors">
                {step.number}
              </div>
              <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
