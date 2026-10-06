import { access, readFile } from "node:fs/promises";
const { workerCpuMsPerRequest } = JSON.parse(await readFile("src/lib/config/config.quota.json", "utf8"));
await access(".cloudflare/worker/server/index.mjs");
const config = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
if (config.limits.cpu_ms !== workerCpuMsPerRequest) throw new Error("Worker CPU limit and request budget disagree");
if (config.containers?.length) throw new Error("The production build must not start Containers");
