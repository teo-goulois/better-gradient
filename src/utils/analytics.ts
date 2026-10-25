export const umamiConfig = {
	hostUrl: "https://analytics.teogoulois.com",
	websiteId: "662a5822-5471-4b96-a504-eea1913d0221",
	// The script counts these hosts only, not workers.dev previews or localhost.
	domains: "better-gradient.com,www.better-gradient.com",
} as const;

export const umamiScriptUrl = `${umamiConfig.hostUrl}/script.js`;
