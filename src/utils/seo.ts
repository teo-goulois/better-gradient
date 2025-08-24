import { defaultDescription, defaultOgImage, defaultTitle, siteName, siteUrl } from "./site";

type SEOArgs = {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  canonical?: string;
};

export const seo = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  canonical,
}: SEOArgs) => {
  const resolvedTitle = title || defaultTitle;
  const resolvedDescription = description || defaultDescription;
  const resolvedImage = image || defaultOgImage;
  const resolvedUrl = url || siteUrl;
  const resolvedCanonical = canonical || resolvedUrl;

  const tags = [
    { title: resolvedTitle },
    { name: "description", content: resolvedDescription },
    ...(keywords ? [{ name: "keywords", content: keywords }] : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: resolvedTitle },
    { name: "twitter:description", content: resolvedDescription },
    { name: "og:type", content: type },
    { name: "og:site_name", content: siteName },
    { name: "og:title", content: resolvedTitle },
    { name: "og:description", content: resolvedDescription },
    { name: "og:image", content: resolvedImage },
    { name: "og:url", content: resolvedUrl },
  ];

  const links = [
    { rel: "canonical", href: resolvedCanonical },
  ];

  return { meta: tags, links };
};

export const buildAbsoluteUrl = (pathname: string): string =>
  `${siteUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
