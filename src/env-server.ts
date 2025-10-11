import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import "dotenv/config";

export const envServer = createEnv({
	server: {
		TURSO_DATABASE_URL: z.string(),
		TURSO_AUTH_TOKEN: z.string(),
		MARBLE_API_URL: z.url(),
		MARBLE_WORKSPACE_KEY: z.string(),
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: {
		TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
		TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
		MARBLE_API_URL: process.env.MARBLE_API_URL,
		MARBLE_WORKSPACE_KEY: process.env.MARBLE_WORKSPACE_KEY,
	},
});
