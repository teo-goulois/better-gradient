export const siteUrl: string =
	(import.meta as unknown as { env: { VITE_SITE_URL: string } }).env
		?.VITE_SITE_URL || "https://better-gradient.com";

export const siteName = "Better Gradient";

export const defaultTitle = "Better Gradient";

export const defaultDescription =
	"Better Gradient is a tool for creating beautiful gradients.";

export const defaultOgImage = `${siteUrl}/og-image.png`;
