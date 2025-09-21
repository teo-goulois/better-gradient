import { TanstackDevtools } from "@tanstack/react-devtools";
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import Header from "../components/Header";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
  queryClient: QueryClient;
}

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
        title: "Create Beautiful Gradients",
      },
      {
        name: "description",
        content:
          "Create stunning gradients with our intuitive editor. Design beautiful backgrounds, export in high quality, and bring your creative vision to life.",
      },
      {
        name: "keywords",
        content:
          "gradient, background generator, design tool, gradient editor, css gradients, visual design",
      },
      {
        name: "author",
        content: "Better Gradient",
      },
      {
        name: "robots",
        content: "index, follow",
      },
      // Open Graph meta tags
      {
        property: "og:title",
        content: "Better Gradient - Beautiful Gradient Generator",
      },
      {
        property: "og:description",
        content:
          "Create stunning  gradients with our intuitive editor. Design beautiful backgrounds, export in high quality, and bring your creative vision to life.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: "https://better-gradient.com",
      },
      {
        property: "og:image",
        content: "https://better-gradient.com/og-image.png",
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
        content: "Better Gradient - Beautiful Gradient Generator",
      },
      {
        name: "twitter:description",
        content:
          "Create stunning blurred mesh gradients with our intuitive editor. Design beautiful backgrounds, export in high quality, and bring your creative vision to life.",
      },
      {
        name: "twitter:image",
        content: "https://better-gradient.com/og-image.png",
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
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen flex flex-col overscroll-none">
        {children}
        <TanstackDevtools
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
