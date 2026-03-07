import { defaultDescription, defaultOgImage, defaultTitle, siteName, siteUrl } from "./site";

type SEOArgs = {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  canonical?: string;
  noindex?: boolean;
};

export const seo = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  canonical,
  noindex,
}: SEOArgs) => {
  const resolvedTitle = title || defaultTitle;
  const resolvedDescription = description || defaultDescription;
  const resolvedImage = image || defaultOgImage;
  const resolvedUrl = url || siteUrl;
  const resolvedCanonical = canonical || resolvedUrl;

  const meta = [
    { title: resolvedTitle },
    { name: "description", content: resolvedDescription },
    ...(keywords ? [{ name: "keywords", content: keywords }] : []),
    ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    { property: "og:type", content: type },
    { property: "og:site_name", content: siteName },
    { property: "og:title", content: resolvedTitle },
    { property: "og:description", content: resolvedDescription },
    { property: "og:image", content: resolvedImage },
    { property: "og:url", content: resolvedUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: resolvedTitle },
    { name: "twitter:description", content: resolvedDescription },
    { name: "twitter:image", content: resolvedImage },
  ];

  const links = [
    { rel: "canonical", href: resolvedCanonical },
  ];

  return { meta, links };
};

export const buildAbsoluteUrl = (pathname: string): string =>
  `${siteUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
