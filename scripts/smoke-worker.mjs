import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";

// Use a disposable SQLite database behind Turso's HTTP wire protocol.
const directory = await mkdtemp(resolve(".cloudflare/worker-smoke-"));
const db = createClient({ url: `file:${directory}/fixture.db` });
const key = "bg_worker_fixture";
await db.executeMultiple(`
CREATE TABLE created_gradients (id TEXT PRIMARY KEY, share TEXT, width INTEGER, height INTEGER, shapes_count INTEGER, colors_count INTEGER, exported_formats TEXT, status TEXT, created_at INTEGER, updated_at INTEGER);
CREATE TABLE api_keys (id TEXT PRIMARY KEY, email TEXT, key_hash TEXT, prefix TEXT, tier TEXT, status TEXT, created_at INTEGER, last_used_at INTEGER, revoked_at INTEGER);
CREATE TABLE api_rate_limits (bucket TEXT PRIMARY KEY, scope TEXT, identifier TEXT, window_start INTEGER, count INTEGER, updated_at INTEGER);
`);
await db.execute({ sql: "INSERT INTO api_keys VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)", args: ["fixture", "fixture@example.invalid", createHash("sha256").update(key).digest("hex"), "bg_fixture", "verified", "active", Date.now()] });
const decode = (value) => value.type === "null" ? null : value.type === "integer" ? Number(value.value) : value.value;
const encode = (value) => value === null ? { type: "null" } : typeof value === "number" || typeof value === "bigint" ? { type: Number.isInteger(Number(value)) ? "integer" : "float", value: Number.isInteger(Number(value)) ? String(value) : value } : { type: "text", value };
const fixture = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (!request.url.includes("pipeline")) { response.end(JSON.stringify({ posts: [], tags: [], categories: [], authors: [] })); return; }
  try {
    let body = "";
    for await (const chunk of request) body += chunk;
    const pipeline = JSON.parse(body);
    const results = [];
    for (const command of pipeline.requests) {
      if (command.type === "close") { results.push({ type: "ok", response: { type: "close" } }); continue; }
      assert.equal(command.type, "execute");
      const result = await db.execute({ sql: command.stmt.sql, args: command.stmt.args.map(decode) });
      results.push({ type: "ok", response: { type: "execute", result: {
        cols: result.columns.map((name) => ({ name, decltype: null })),
        rows: result.rows.map((row) => Array.from(row).map(encode)),
        affected_row_count: result.rowsAffected,
        last_insert_rowid: result.lastInsertRowid?.toString() ?? null,
        replication_index: null,
      } } });
    }
    response.end(JSON.stringify({ baton: null, base_url: null, results }));
  } catch (error) { response.statusCode = 500; response.end(JSON.stringify({ error: String(error) })); }
});
fixture.listen(0, "127.0.0.1");
await once(fixture, "listening");
const fixtureUrl = `http://127.0.0.1:${fixture.address().port}`;
const config = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
Object.assign(config, {
  main: `${directory}/entry.ts`, routes: [], dev: { enable_containers: false },
  assets: { ...config.assets, directory: resolve(config.assets.directory) },
  vars: { ...config.vars, TURSO_DATABASE_URL: fixtureUrl, TURSO_AUTH_TOKEN: "fixture",
    MARBLE_API_URL: fixtureUrl, MARBLE_WORKSPACE_KEY: "fixture",
    RESEND_API_KEY: "fixture", RESEND_FROM_EMAIL: "fixture@example.invalid", POSTHOG_DISABLED: "true" },
});
delete config.browser;
await writeFile(`${directory}/wrangler.json`, JSON.stringify(config));
await writeFile(`${directory}/entry.ts`, `import worker from ${JSON.stringify(resolve("cloudflare/worker.ts"))};
import { UsageBudget as BaseBudget } from ${JSON.stringify(resolve("cloudflare/usage-budget.ts"))};
export class UsageBudget extends BaseBudget {
 constructor(ctx, env) { super(ctx, { ...env, BROWSER: { quickAction: async (_action, options) => new Response('fixture raster', { headers: { 'Content-Type': 'image/' + options.screenshotOptions.type, 'X-Browser-Ms-Used': '100' } }) } }); this.testCtx = ctx; }
 async fetch(request) {
  if (new URL(request.url).pathname.startsWith('/test-exhaust-')) {
   const ledger = await this.testCtx.storage.get('usage-v1');
   const day = ledger.days[ledger.days.length - 1];
   if (request.url.endsWith('browser')) day.browserMs = 11880000; else day.requests = 49500;
   await this.testCtx.storage.put('usage-v1', ledger);
   return new Response(null, {status:204});
  }
  return super.fetch(request);
 }
}
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input.url ?? input);
  return url.hostname === '127.0.0.1' ? originalFetch(input, init) : Promise.resolve(new Response('{}'));
};
export default { ...worker, async fetch(request, env, ctx) {
  if (new URL(request.url).pathname.startsWith('/_test/exhaust-')) {
   return env.BUDGET.getByName('better-gradient-usage-v1').fetch('https://budget/test-exhaust-' + new URL(request.url).pathname.split('exhaust-')[1]);
  }
  const original = await worker.fetch(request, env, ctx);
  const response = new Response(original.body, original);
  response.headers.set('Content-Security-Policy', "connect-src 'self'");
  return response;
} };
`);
const video = new Uint8Array(Array.from({ length: 2048 }, (_, index) => index % 256));
await writeFile(`${directory}/video.mp4`, video);
const cli = resolve("node_modules/.bin/wrangler");
let server;
let logs = "";
try {
  const upload = spawnSync(cli, ["r2", "object", "put", "better-gradient-public-videos/step-2-position.mp4", "--file", `${directory}/video.mp4`, "--local", "--config", `${directory}/wrangler.json`, "--persist-to", `${directory}/state`], { encoding: "utf8" });
  assert.equal(upload.status, 0, upload.stdout + upload.stderr);
  server = spawn(cli, ["dev", "--config", `${directory}/wrangler.json`, "--port", "0", "--inspector-port", "0", "--local", "--persist-to", `${directory}/state`], { stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => { logs += chunk; });
  server.stderr.on("data", (chunk) => { logs += chunk; });
  const deadline = Date.now() + 30_000;
  while (!/Ready on http:\/\/localhost:\d+/.test(logs)) {
    assert.equal(server.exitCode, null, logs);
    assert.ok(Date.now() < deadline, logs);
    await new Promise((done) => setTimeout(done, 100));
  }
  const base = logs.match(/Ready on (http:\/\/localhost:\d+)/)[1];
  const request = (path, init) => fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(15_000) });
  for (const path of ["/", "/editor", "/gallery", "/blog", "/developers", "/robots.txt", "/sitemap.xml"]) {
    const response = await request(path);
    assert.equal(response.status, 200, `${path}: ${await response.text()}\n${logs}`);
    console.log(`Worker: ${path} OK`);
  }
  for (const format of ["svg", "css"]) {
    const response = await request(`/api/gradient?seed=worker-smoke&format=${format}&size=128`, { headers: { Authorization: `Bearer ${key}` } });
    assert.equal(response.status, 200, await response.text());
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
    console.log(`Worker: API ${format} OK`);
  }
  for (const format of ["png", "webp"]) {
    const path = `/api/gradient?seed=worker-raster-smoke&format=${format}&size=128&background=transparent`;
    const first = await request(path, { headers: { Authorization: `Bearer ${key}` } });
    assert.equal(first.status, 200, await first.clone().text());
    assert.equal(first.headers.get("Content-Type"), `image/${format}`);
    assert.equal(first.headers.get("X-Render-Cache"), "MISS");
    await first.arrayBuffer();
    await new Promise(resolve => setTimeout(resolve, 100));
    const cached = await request(path, { headers: { Authorization: `Bearer ${key}` } });
    assert.equal(cached.headers.get("X-Render-Cache"), "HIT");
    await cached.arrayBuffer();
    assert.equal((await request(path, { headers: { Authorization: "Bearer invalid" } })).status, 401);
    console.log(`Worker: API ${format}, cache and auth boundary OK (mock Browser Run)`);
  }
  assert.equal((await request("/api/gradient", { headers: { Authorization: "Bearer invalid" } })).status, 401);
  assert.equal((await request("/api/gradient", { method: "OPTIONS" })).status, 204);
  const ranged = await request("/video/step-2-position.mp4", { headers: { Range: "bytes=100-199" } });
  assert.equal(ranged.status, 206);
  assert.deepEqual(new Uint8Array(await ranged.arrayBuffer()), video.subarray(100, 200));
  const head = await request("/video/step-2-position.mp4", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Length"), "2048");
  console.log("Worker: API auth/CORS and R2 video range/HEAD OK");
  if (!process.argv.includes("--browser")) {
    await request('/_test/exhaust-browser');
    const denied = await request('/api/gradient?seed=uncached-quota-test&format=png&size=128');
    assert.equal(denied.status, 503);
    assert.ok((await denied.text()).includes('Contact me'));
    assert.equal((await request('/api/gradient?seed=quota-test-svg&format=svg')).status, 200);
    await request('/_test/exhaust-worker');
    assert.equal((await request('/api/gradient?format=svg')).status, 503);
    assert.equal((await request('/favicon.ico')).status, 200);
    console.log('Worker: persistent render/site quota refusals and free static assets OK');
  }
  if (process.argv.includes("--browser")) {
    console.log(`Browser QA ready: ${base}/editor (press Enter to stop)`);
    process.stdin.resume();
    await once(process.stdin, "data");
    process.stdin.pause();
  }
} finally {
  if (server && server.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
  db.close();
  await new Promise((done) => fixture.close(done));
  await rm(directory, { recursive: true, force: true });
}
