import { envServer } from "@/env-server";
import { createClient } from "@libsql/client";
import { type LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
declare const globalThis: {
	drizzle: LibSQLDatabase<typeof schema> | undefined;
} & typeof global;

const client = createClient({
	url: envServer.TURSO_DATABASE_URL,
	authToken: envServer.TURSO_AUTH_TOKEN,
});
const db = globalThis.drizzle || drizzle(client);

export { db, schema };
