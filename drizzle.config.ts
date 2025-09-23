import { envServer } from "@/env-server";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/lib/db/drizzle",
  schema: "./src/lib/db/schema",
  dialect: "turso",
  verbose: true,
  dbCredentials: {
    url: envServer.TURSO_DATABASE_URL,
    authToken: envServer.TURSO_AUTH_TOKEN,
  },
});
