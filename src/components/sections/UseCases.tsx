import { DottedBackground } from "@/components/ui/dotted-background";
import { GridCursor } from "@/components/ui/grid-cursor";

export function UseCases() {
  const useCases = [
    {
      title: "Website Backgrounds",
      description:
        "Create elegant hero sections and landing page backgrounds that capture attention without overwhelming content.",
    },
    {
      title: "UI/UX Design Elements",
      description:
        "Design modern cards, buttons, and interface components with subtle mesh gradient accents.",
    },
    {
      title: "Social Media Graphics",
      description:
        "Stand out on Instagram, Twitter, and LinkedIn with eye-catching gradient backgrounds for posts and stories.",
    },
    {
      title: "Presentation Slides",
      description:
        "Elevate your presentations with professional gradient backgrounds that keep your audience engaged.",
    },
    {
      title: "App Interfaces",
      description:
        "Add depth and visual interest to mobile and web applications with smooth, modern mesh gradients.",
    },
    {
      title: "Marketing Materials",
      description:
        "Create stunning banners, ads, and promotional graphics that drive conversions and brand recognition.",
    },
  ];

  return (
    <section className=" bg-white relative">
      <DottedBackground />

      <div className="container max-w-6xl mx-auto px-6 pt-12 py-24 relative z-10">
        <div className="max-w-3xl mr-auto text-left mb-10">
          <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
            Use Cases
          </h2>
          <p className="mt-3 text-base text-neutral-600">
            From web design to social media, mesh gradients enhance any creative
            project
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200  mx-auto relative">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
            >
              <GridCursor />

              <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-3">
                {useCase.title}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {useCase.description}
              </p>

              {/* Subtle corner accent */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
