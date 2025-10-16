import { CallToAction } from "@/components/shared/call-to-action";
import { SharedBetterGradientTypo } from "@/components/shared/shared-better-gradient-typo";
import { SharedFooter } from "@/components/shared/shared-footer";
import { DottedBackground } from "@/components/ui/dotted-background";
import { GridCursor } from "@/components/ui/grid-cursor";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";

export const Route = createFileRoute("/_pages/guide")({
  head: () => ({
    meta: [
      {
        name: "description",
        content:
          "Complete guide to creating mesh gradients. Learn how to use the gradient generator, export options, and implement gradients in your projects.",
      },
      {
        name: "keywords",
        content:
          "gradient tutorial, how to create gradients, mesh gradient guide, gradient generator tutorial, css gradient tutorial",
      },
    ],
  }),
  component: GuidePage,
});

let currentlyPlayingVideo: HTMLVideoElement | null = null;

function TutorialStep({
  stepNumber,
  title,
  videoSrc,
  description,
}: {
  stepNumber: string;
  title: string;
  videoSrc: string;
  description: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (currentlyPlayingVideo && currentlyPlayingVideo !== videoRef.current) {
      currentlyPlayingVideo.pause();
      currentlyPlayingVideo.currentTime = 0;
    }

    if (videoRef.current) {
      videoRef.current.play();
      currentlyPlayingVideo = videoRef.current;
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (currentlyPlayingVideo === videoRef.current) {
      currentlyPlayingVideo = null;
    }
  };

  return (
    <div
      className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <GridCursor />

      <div className="text-sm font-mono text-neutral-400 mb-4 group-hover:text-neutral-900 transition-colors">
        {stepNumber}
      </div>
      <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-3">
        {title}
      </h3>
      <video
        ref={videoRef}
        className="w-full border border-neutral-200 mb-4"
        loop
        muted
        playsInline
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>
    </div>
  );
}

function GuidePage() {
  return (
    <>
      <main className="flex-1 w-full bg-white relative">
        <DottedBackground />

        <div className="container mx-auto px-6 py-24 relative z-10">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="font-nohemi text-5xl font-semibold tracking-tight text-neutral-900">
              How to Create Mesh Gradients
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              A complete guide to using <SharedBetterGradientTypo /> and
              implementing gradients in your projects
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-5xl mx-auto space-y-20">
            {/* Getting Started */}
            <section>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
                  Getting Started
                </h2>
                <p className="mt-3 text-base text-neutral-600">
                  Everything you need to begin creating beautiful gradients
                </p>
              </div>
              <div className="border border-neutral-200 bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300">
                <GridCursor />

                <p className="text-neutral-600 leading-relaxed mb-6">
                  <SharedBetterGradientTypo /> is a free mesh gradient generator
                  that helps you create beautiful, modern backgrounds without
                  any design experience. No account needed - just open the
                  editor and start creating.
                </p>
                <Link
                  to="/editor"
                  className="inline-flex items-center px-6 py-3 border-2 border-neutral-900 bg-neutral-900 text-white font-nohemi font-semibold hover:bg-white hover:text-neutral-900 transition-colors"
                >
                  Open Editor
                </Link>
              </div>
            </section>

            {/* Step by Step Tutorial */}
            <section>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
                  Step-by-Step Tutorial
                </h2>
                <p className="mt-3 text-base text-neutral-600">
                  Master gradient creation in four simple steps
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 relative">
                <TutorialStep
                  stepNumber="01"
                  title="Choose Your Colors"
                  videoSrc="/video/step-1-colors.mp4"
                  description="Start by selecting colors from the color palette. Right click on any shape to change its color, or use the color picker to create custom colors. You can add or remove shapes to adjust the complexity of your gradient by either right clicking."
                />
                <TutorialStep
                  stepNumber="02"
                  title="Position Your Shapes"
                  videoSrc="/video/step-2-position.mp4"
                  description="Drag shapes around the canvas to create your desired gradient pattern. The shapes will automatically blend together to create smooth color transitions. Experiment with different positions to find the perfect composition. Tip: you can update single shape properties by right clicking."
                />
                <TutorialStep
                  stepNumber="03"
                  title="Adjust Blur and Settings"
                  videoSrc="/video/step-3-blur.mp4"
                  description="Fine-tune the blur, grain and opacity intensity to control how soft your gradient appears. You can also adjust the canvas size to match your project requirements. Use the sidebar controls to perfect your design."
                />
                <TutorialStep
                  stepNumber="04"
                  title="Export Your Gradient"
                  videoSrc="/video/step-4-export.mp4"
                  description="When you're happy with your gradient, export it in your preferred format: PNG for images, SVG for scalable graphics, or copy the CSS code to use directly in your stylesheets."
                />
              </div>
            </section>

            {/* Export Options */}
            <section>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
                  Export Formats Explained
                </h2>
                <p className="mt-3 text-base text-neutral-600">
                  Choose the right format for your project needs
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 relative">
                <div className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300">
                  <GridCursor />

                  <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-2">
                    PNG Export
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Best for: Images, graphics, social media posts,
                    presentations. PNG files are raster images that work
                    everywhere but have a fixed size. Choose PNG when you need a
                    simple image file.
                  </p>
                </div>

                <div className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300">
                  <GridCursor />

                  <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-2">
                    WebP Export
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Best for: Web optimization, modern browsers, faster loading.
                    WebP files offer better compression than PNG with similar
                    quality, resulting in smaller file sizes. Ideal for web
                    performance.
                  </p>
                </div>

                <div className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300">
                  <GridCursor />

                  <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-2">
                    SVG Export
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Best for: Web backgrounds, responsive designs, retina
                    displays. SVG files are vector graphics that scale perfectly
                    to any size without losing quality. Perfect for modern web
                    development.
                  </p>
                </div>

                <div className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300">
                  <GridCursor />

                  <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-2">
                    CSS Code
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Best for: Web developers, direct CSS implementation. Copy
                    the generated CSS code and paste it directly into your
                    stylesheet. The code uses modern CSS techniques for optimal
                    performance.
                  </p>
                </div>
              </div>
            </section>

            {/* Implementation Guide */}
            <section>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
                  Implementation Guide
                </h2>
                <p className="mt-3 text-base text-neutral-600">
                  Learn how to use gradients in your projects
                </p>
              </div>
              <div className="grid grid-cols-1 gap-px bg-neutral-200 border border-neutral-200 relative">
                <div className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300">
                  <GridCursor />

                  <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-4">
                    Using in HTML/CSS
                  </h3>
                  <div className="bg-neutral-900 text-neutral-100 border border-neutral-300 p-4 font-mono text-sm overflow-x-auto">
                    <pre>{`/* Copy the CSS from export */
.hero-section {
  background: /* gradient code */;
}

/* Or use as background image with SVG */
.header {
  background-image: url('gradient.svg');
  background-size: cover;
}`}</pre>
                  </div>
                </div>

                <div className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300">
                  <GridCursor />

                  <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-4">
                    Using in React/Next.js
                  </h3>
                  <div className="bg-neutral-900 text-neutral-100 border border-neutral-300 p-4 font-mono text-sm overflow-x-auto">
                    <pre>{`// Import the SVG
import GradientBg from './gradient.svg';

// Use as background
<div style={{
  backgroundImage: \`url(\${GradientBg})\`,
  backgroundSize: 'cover'
}}>
  Content here
</div>`}</pre>
                  </div>
                </div>

                <div className="bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300">
                  <GridCursor />

                  <h3 className="font-nohemi text-lg font-semibold text-neutral-900 mb-3">
                    Using in Figma/Design Tools
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Export as PNG and import into Figma, Sketch, or Adobe XD.
                    The PNG maintains full quality and can be used as a
                    background layer in your designs.
                  </p>
                </div>
              </div>
            </section>

            {/* Tips and Best Practices */}
            <section>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="font-nohemi text-3xl font-semibold tracking-tight text-neutral-900">
                  Tips & Best Practices
                </h2>
                <p className="mt-3 text-base text-neutral-600">
                  Pro tips to create stunning gradients
                </p>
              </div>
              <div className="border border-neutral-200 bg-white p-8 relative group hover:bg-neutral-50 transition-all duration-300">
                <GridCursor />

                <ul className="space-y-4">
                  <li className="flex gap-4 text-sm text-neutral-600">
                    <span className="text-neutral-400 flex-shrink-0 mt-1">
                      →
                    </span>
                    <span>
                      Use 3-5 shapes for subtle, elegant gradients. Too many
                      shapes can look busy.
                    </span>
                  </li>
                  <li className="flex gap-4 text-sm text-neutral-600">
                    <span className="text-neutral-400 flex-shrink-0 mt-1">
                      →
                    </span>
                    <span>
                      Choose colors from the same color family for harmonious
                      results.
                    </span>
                  </li>
                  <li className="flex gap-4 text-sm text-neutral-600">
                    <span className="text-neutral-400 flex-shrink-0 mt-1">
                      →
                    </span>
                    <span>
                      Higher blur values create softer, more subtle transitions.
                    </span>
                  </li>
                  <li className="flex gap-4 text-sm text-neutral-600">
                    <span className="text-neutral-400 flex-shrink-0 mt-1">
                      →
                    </span>
                    <span>
                      Match your canvas size to your project dimensions for best
                      results.
                    </span>
                  </li>
                  <li className="flex gap-4 text-sm text-neutral-600">
                    <span className="text-neutral-400 flex-shrink-0 mt-1">
                      →
                    </span>
                    <span>
                      Save the share URL to come back and edit your gradient
                      later.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Call to Action */}
            <CallToAction
              title="Ready to Create?"
              description="Now that you know how it works, start creating your own stunning mesh gradients."
              buttonText="Open Gradient Generator"
              buttonLink="/editor"
              className="mt-20"
            />
          </div>
        </div>
      </main>
    </>
  );
}
