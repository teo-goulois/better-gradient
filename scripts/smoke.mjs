import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const output = process.env.BETTER_GRADIENT_NODE_OUTPUT ?? ".output";
const require = createRequire(resolve(output, "server/package.json"));
const { createClient } = await import(resolve(output, "server/node_modules/@libsql/client/lib-esm/node.js"));
const sharp = require("sharp");
const directory = await mkdtemp(`${tmpdir()}/better-gradient-smoke-`);
const dbUrl = `file:${directory}/test.db`;
const db = createClient({ url: dbUrl });
const cms = createServer((_request, response) => {
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({ posts: [], tags: [], categories: [], authors: [] }));
});
cms.listen(0, "127.0.0.1");
await once(cms, "listening");

// The production build runs against a disposable database and a local CMS fixture.
await db.executeMultiple(`
CREATE TABLE created_gradients (id TEXT PRIMARY KEY, share TEXT, width INTEGER, height INTEGER, shapes_count INTEGER, colors_count INTEGER, exported_formats TEXT, status TEXT, created_at INTEGER, updated_at INTEGER);
CREATE TABLE api_keys (id TEXT PRIMARY KEY, email TEXT, key_hash TEXT, prefix TEXT, tier TEXT, status TEXT, created_at INTEGER, last_used_at INTEGER, revoked_at INTEGER);
CREATE TABLE api_rate_limits (bucket TEXT PRIMARY KEY, scope TEXT, identifier TEXT, window_start INTEGER, count INTEGER, updated_at INTEGER);
`);
const key = "bg_smoke_fixture";
await db.execute({ sql: "INSERT INTO api_keys VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)", args: ["smoke", "smoke@example.invalid", createHash("sha256").update(key).digest("hex"), "bg_smoke", "verified", "active", Date.now()] });

// Prevent test requests from reaching analytics or email providers.
const guard = `const original = globalThis.fetch; globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input.url ?? input);
  if (url.hostname === '127.0.0.1') return original(input, init);
  return Promise.resolve(new Response('{}', {status: 200}));
};`;
const portReservation = createServer();
portReservation.listen(0, "127.0.0.1");
await once(portReservation, "listening");
const port = portReservation.address().port;
await new Promise((done) => portReservation.close(done));
const server = spawn(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(guard)}`, resolve(output, "server/index.mjs")], {
  env: {
    PATH: process.env.PATH,
    NODE_ENV: "production", HOST: "127.0.0.1", PORT: String(port),
    TURSO_DATABASE_URL: dbUrl, TURSO_AUTH_TOKEN: "",
    MARBLE_API_URL: `http://127.0.0.1:${cms.address().port}`, MARBLE_WORKSPACE_KEY: "fixture",
    RESEND_API_KEY: "fixture", RESEND_FROM_EMAIL: "test@example.invalid", POSTHOG_DISABLED: "true",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
server.stdout.on("data", (chunk) => { logs += chunk; });
server.stderr.on("data", (chunk) => { logs += chunk; });

try {
  const deadline = Date.now() + 30_000;
  while (!/http:\/\/127\.0\.0\.1:\d+/.test(logs)) {
    assert.equal(server.exitCode, null, `Server exited: ${logs}`);
    assert.ok(Date.now() < deadline, `Server startup timed out: ${logs}`);
    await new Promise((done) => setTimeout(done, 100));
  }
  const base = logs.match(/http:\/\/127\.0\.0\.1:\d+/)[0];
  const request = (path, init) => fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(30_000) });
  for (const path of ["/", "/editor", "/gallery", "/blog", "/developers", "/robots.txt", "/sitemap.xml", "/favicon.ico"]) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.ok((await response.arrayBuffer()).byteLength > 0, path);
  }
  assert.equal((await request("/missing-page-smoke")).status, 404);
  assert.equal((await request("/api/gradient", { method: "OPTIONS" })).status, 204);
  assert.equal((await request("/api/gradient?format=invalid")).status, 400);
  assert.equal((await request("/api/gradient", { headers: { Authorization: "Bearer invalid" } })).status, 401);
  for (const format of ["svg", "css", "png", "webp"]) {
    const response = await request(`/api/gradient?seed=smoke&size=64&format=${format}&background=transparent`, { headers: { Authorization: `Bearer ${key}` } });
    assert.equal(response.status, 200, format);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.equal(response.headers.get("x-ratelimit-limit"), "300");
    assert.match(response.headers.get("cache-control"), /immutable/);
    if (format === "png" || format === "webp") {
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
      assert.equal(metadata.format, format);
      assert.equal(metadata.width, 64);
      assert.equal(metadata.height, 64);
      assert.equal(metadata.hasAlpha, true);
    } else {
      const text = await response.text();
      assert.match(text, format === "svg" ? /<svg/ : /background-image:/);
    }
  }
  const anonymous = await request("/api/gradient?size=64");
  assert.equal(anonymous.status, 200);
  assert.equal(anonymous.headers.get("x-ratelimit-limit"), "30");
  assert.equal(anonymous.headers.get("cache-control"), "no-store");
  const now = Date.now();
  const window = Math.floor(now / 60_000) * 60_000;
  await db.execute({ sql: "INSERT INTO api_rate_limits VALUES (?, 'public', ?, ?, 30, ?)", args: [`public:192.0.2.8:${window}`, "192.0.2.8", window, now] });
  const limited = await request("/api/gradient?size=64", { headers: { "x-forwarded-for": "192.0.2.8" } });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  const video = await request("/video/step-2-position.mp4", { headers: { Range: "bytes=0-1023" } });
  assert.equal(video.status, 200, "Video origin response; the Worker serves ranges");
  assert.ok(Number(video.headers.get("content-length")) > 25 * 1024 * 1024);
  await video.body.cancel();
  console.log("Smoke passed: SSR, database reads, CMS, SEO, 404, API formats, keys, rate limits, CORS and video delivery.");
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  const exited = once(server, "exit");
  if (server.exitCode === null) { server.kill("SIGTERM"); await exited; }
  cms.close();
  db.close();
  await rm(directory, { recursive: true, force: true });
}
