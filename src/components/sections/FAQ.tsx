import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/ui/disclosure";
import { DottedBackground } from "@/components/ui/dotted-background";

export function FAQ() {
  const faqs = [
    {
      question: "What are mesh gradients?",
      answer:
        "Mesh gradients are a modern design technique that creates smooth, organic color transitions by blending multiple colored shapes with blur effects. Unlike linear or radial gradients, mesh gradients produce more natural, flowing color patterns perfect for contemporary UI design and backgrounds.",
    },
    {
      question: "How do I use gradients in CSS?",
      answer:
        "You can use our gradients in CSS by either exporting as CSS code (which gives you a complete background property) or as an SVG that can be used as a background-image. Our CSS export provides optimized code ready to paste into your stylesheets.",
    },
    {
      question: "Can I use these gradients commercially?",
      answer:
        "Yes! All gradients created with Better Gradient can be used freely in both personal and commercial projects. There are no attribution requirements or licensing restrictions. Create, export, and use them however you need.",
    },
    {
      question: "What export formats are supported?",
      answer:
        "Better Gradient supports PNG (raster images with transparency), SVG (scalable vector graphics), and CSS code export. PNG is perfect for images and graphics, SVG works great for web and maintains quality at any size, while CSS export lets you implement gradients directly in code.",
    },
    {
      question: "What's the difference between mesh and linear gradients?",
      answer:
        "Linear gradients transition colors in a straight line (top to bottom, left to right, etc.), while mesh gradients blend multiple color points with blur effects to create organic, flowing patterns. Mesh gradients offer more visual depth and natural-looking color transitions, making them ideal for modern, sophisticated designs.",
    },
    {
      question: "Do I need to create an account?",
      answer:
        "No signup required! Better Gradient works immediately without any account creation. Just open the editor and start designing. We believe in removing barriers to creativity.",
    },
    {
      question: "Can I save my gradients?",
      answer:
        "Each gradient generates a unique shareable URL that you can bookmark or save. This URL contains all your gradient settings and can be reopened anytime to continue editing or exporting.",
    },
    {
      question: "Is Better Gradient free?",
      answer:
        "Yes, Better Gradient is completely free to use with all features available to everyone. No premium tiers, no hidden costs, no limitations.",
    },
  ];

  return (
    <section className="bg-white relative">
      <DottedBackground />

      <div className="container mx-auto px-6 pt-12 py-24 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-base text-neutral-600">
              Everything you need to know about mesh gradients and our tool
            </p>
          </div>

          <DisclosureGroup className="border border-neutral-200 relative">
            {faqs.map((faq, index) => (
              <Disclosure
                key={faq.question}
                className="bg-white border-0 border-b has-[&>button:hover]:bg-neutral-50 border-neutral-200 last:border-b-0 group/item relative "
              >
                <DisclosureTrigger className="w-full text-left px-6 py-5  flex items-center justify-between transition-all duration-200 border-0 relative">
                  <span className="font-nohemi font-medium text-base text-neutral-900 pr-8 relative z-10">
                    {faq.question}
                  </span>

                  {/* Question number */}
                  <span className="absolute right-11 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-300 group-has-[&>button:hover]/item:text-neutral-400 transition-colors">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </DisclosureTrigger>
                <DisclosurePanel className="px-6 border-0 bg-neutral-50/50">
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </DisclosurePanel>
              </Disclosure>
            ))}
          </DisclosureGroup>
        </div>
      </div>
    </section>
  );
}
