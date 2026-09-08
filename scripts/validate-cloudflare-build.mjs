import { access } from "node:fs/promises";

await access(".output/server/index.mjs");
try {
  await access(".output/server/node_modules/@img/sharp-linux-x64/lib/sharp-linux-x64.node");
} catch {
  throw new Error("Cloudflare needs a Linux x64 build of sharp. Run pnpm build:cloudflare with Docker, or pnpm build:server on Linux x64.");
}
