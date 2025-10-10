import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

import { SharedDefaultCatchBoundary } from "@/components/shared/shared-default-catch-boundary";
import { SharedNotFound } from "@/components/shared/shared-not-found";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { scan } from "react-scan";

interface MyRouterContext {
  queryClient: QueryClient;
}

const seoConfig = {
  title: "Better Gradient - Free Mesh Gradient Generator",
  description:
    "Create stunning mesh gradients for free. Design elegant blurred-shape backgrounds for UI, websites, and creative projects. No signup required",
  keywords:
    "gradient, background generator, design tool, gradient editor, css gradients, visual design",
  image: "https://better-gradient.com/og-image.png",
  url: "https://better-gradient.com",
  type: "website",
  canonical: "https://better-gradient.com",
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: seoConfig.title,
      },
      {
        name: "description",
        content: seoConfig.description,
      },
      {
        name: "keywords",
        content: seoConfig.keywords,
      },
      {
        name: "author",
        content: "Téo Goulois",
      },
      {
        name: "robots",
        content: "index, follow",
      },
      // Open Graph meta tags
      {
        property: "og:title",
        content: seoConfig.title,
      },
      {
        property: "og:description",
        content: seoConfig.description,
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: seoConfig.url,
      },
      {
        property: "og:image",
        content: seoConfig.image,
      },
      {
        property: "og:site_name",
        content: "Better Gradient",
      },
      // Twitter Card meta tags
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: seoConfig.title,
      },
      {
        name: "twitter:description",
        content: seoConfig.description,
      },
      {
        name: "twitter:image",
        content: seoConfig.image,
      },
      {
        name: "twitter:url",
        content: seoConfig.url,
      },
      // Additional SEO meta tags
      {
        name: "theme-color",
        content: "#000000",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
    ],
    links: [
      {
        rel: "preload",
        href: "/Nohemi/Nohemi-Regular-BF6438cc579d934.woff",
        as: "font",
        type: "font/woff",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/Nohemi/Nohemi-Bold-BF6438cc577b524.woff",
        as: "font",
        type: "font/woff",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/Nohemi/Nohemi-VF-BF6438cc58ad63d.ttf",
        as: "font",
        type: "font/ttf",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/x-icon",
        href: "/favicon.ico",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "canonical",
        href: "https://better-gradient.com",
      },
    ],
    scripts: [
      {
        src: "https://tally.so/widgets/embed.js",
        async: true,
      },
      {
        src: "https://analytics.teogoulois.com/script.js",
        async: true,
        defer: true,
        "data-website-id": "662a5822-5471-4b96-a504-eea1913d0221",
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: (props) => {
    return (
      <RootDocument>
        <SharedDefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <SharedNotFound />,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Make sure to run this only after hydration
    scan({
      enabled: process.env.NODE_ENV === "development",
    });
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen flex flex-col overscroll-none">
        {children}
        <TanStackDevtools
          config={{
            hideUntilHover: true,
            position: "bottom-left",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
