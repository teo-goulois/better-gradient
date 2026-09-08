import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { parse } from "dotenv";

const local = parse(await readFile(".env", "utf8").catch(() => ""));
const keys = [
  "VITE_PH_ENABLED", "VITE_POSTHOG_KEY", "VITE_POSTHOG_HOST",
  "VITE_POSTHOG_DISABLED", "VITE_POSTHOG_DEBUG", "VITE_POSTHOG_REPLAY_FORCE",
  "VITE_POSTHOG_REPLAY_SAMPLE_RATE", "VITE_APP_TITLE",
];
const values = Object.fromEntries(keys.flatMap((key) => {
  const value = process.env[key] ?? local[key];
  return value === undefined ? [] : [[key, value]];
}));
values.VITE_SITE_URL = process.env.VITE_SITE_URL || "https://better-gradient.com";
values.VITE_SERVER_URL = process.env.VITE_SERVER_URL || "https://better-gradient.com";

await mkdir(".cloudflare", { recursive: true });
const path = ".cloudflare/build.env";
const publicEnvHash = createHash("sha256").update(JSON.stringify(values)).digest("hex");
await writeFile(path, Object.entries(values).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n"), { mode: 0o600 });
try {
  await rm(".output", { recursive: true, force: true });
  const result = spawnSync("docker", [
    "build", "--platform", "linux/amd64", "--file", "Dockerfile.build",
    "--build-arg", `PUBLIC_ENV_HASH=${publicEnvHash}`,
    "--target", "output", "--secret", `id=build_env,src=${path}`,
    "--output", "type=local,dest=.output", ".",
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(path, { force: true });
}
