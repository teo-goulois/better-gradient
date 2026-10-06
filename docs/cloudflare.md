# Cloudflare deployment

Better Gradient serves TanStack Start pages, server functions and its SVG/CSS API
in a Worker. Turso uses HTTP in this build. Editor PNG/WebP exports run in the
visitor's browser. API PNG/WebP output uses Browser Run Quick Actions, rendering
the same generated SVG in Chromium with blur, grain and transparency.
There is no production Container and no Docker build step.

The outer Worker first admits each dynamic request through the persistent
`UsageBudget` Durable Object. API validation, authentication and rate limits stay
in the application route. Raster output is rendered only after this route succeeds.
A content hash of SVG, format and quality keys the image cache; authentication is
checked even on cache hits. Random requests produce fresh SVGs. Image responses
stream to the client; conversion does not allocate full RGBA surfaces in the Worker.

The large `/video/step-2-position.mp4` is stored in `better-gradient-public-videos`.
The Worker serves GET, HEAD and byte ranges from R2. `public/.assetsignore` excludes
this file from static asset upload. This application never writes image exports to
R2; the only R2 object is the fixed video. Other static assets are served directly by
Cloudflare without invoking the Worker.

## Project allowances

`src/lib/config/config.quota.json` is the canonical policy;
`src/lib/config/config.api.ts` derives the project budgets. Better Gradient is allocated
33% of the Workers Paid included usage, preserving the remainder for other projects.
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and
[Browser Run pricing](https://developers.cloudflare.com/browser-run/pricing/).

| Resource | Project allocation | Enforcement |
| --- | --- | --- |
| Browser Run | 11,880,000 ms, or 3 h 18 min | Persistent reservations before rendering; measured usage on success |
| Workers CPU | 9,900,000 ms | Reserve 200 ms for each admitted dynamic request, including errors |
| Worker requests | At most 3,300,000 | CPU reservations impose a stricter 49,500 dynamic admissions |
| R2 reads | Below 3,300,000 included share | At most one R2 read per admitted video request |
| R2 storage | Below 3.3 GB included share | One fixed video of about 43 MB; no application writes |
| Durable Object requests | Below 330,000 included share | One admission call and at most one raster call per admitted request |

`wrangler.jsonc` sets the CPU ceiling per invocation. The deployment validator
checks that it matches the policy. The request allowance deliberately reserves the
whole ceiling, rather than claiming that runtime wall time measures CPU. Dynamic
pages, API calls and server functions share this allowance. Static assets bypass
it. The initial ledger conservatively includes pre-migration traffic and the
October 6 Browser Run probes; these credits are added only when the ledger is new.

Counters use UTC day buckets retaining at least the preceding 32 full days. They
expire conservatively at a UTC day boundary, preventing two full allowances around
a monthly reset. The same Durable Object name and storage key must be retained
across deployments. A site quota returns HTTP 503 before further application work.
An already open editor can continue exporting client-side.

Each uncached raster reserves five minutes before starting. Only one render runs
at a time; the active reservation survives isolate restarts. Browser Run is given
five-second load/selector timeouts and a 90-second action timeout. Successful
responses with valid `X-Browser-Ms-Used` replace the reservation with measured time
plus a one-second margin. Failures, invalid metering and interrupted settlements
keep the full reserve. An orphaned active reservation becomes available after five
minutes, without refunding its usage. No renderer starts if persistence fails.
There are no browser sessions kept alive between requests or Container timers.

The last five minutes of the browser allowance stay unavailable for a new render
unless a full reservation fits. HTTP 503 includes `Retry-After`, CORS and a contact
link. `src/lib/config/config.contact.ts` centralizes the existing feedback form.
The developer page explains the shared render time and offers higher-limit contact.
There is no November 7 suspension policy for Browser Run.

These guards limit application work, not the Cloudflare invoice. Rejected HTTP
requests still invoke a Worker and can be billed; a flood of rejected requests can
also invoke the budget Durable Object. No account-wide euro spending cap is
provided by this code. Already incurred Container usage, other projects, domains,
taxes and exchange rates affect the account invoice. The base plan is $5 USD for
the account. The target is zero new usage overages from normal Better Gradient
operation; a universal EUR 10 guarantee is not possible from this application's
request handlers. Runtime and provider failures can also affect strict ceilings.

The budget ledger stays a few KB, well below its storage share. There are no
application bindings to KV, Images, AI, Queues or D1. Worker Logs are disabled to
avoid their separate usage charges; ordinary Cloudflare metrics remain available.

## Builds and deployment

`pnpm dev` and Localify keep their existing local Node behavior. Sharp remains
available for local Node development and raster tests; it is excluded from the
Worker bundle. `pnpm build:worker` builds `.cloudflare/worker`, preserving `.output`.
`pnpm build:cloudflare` aliases this command. No Linux native artifact is needed.

Before the first deployment, create and populate the video bucket once:

```sh
pnpm exec wrangler r2 bucket create better-gradient-public-videos
pnpm exec wrangler r2 object put better-gradient-public-videos/step-2-position.mp4 --file public/video/step-2-position.mp4 --content-type video/mp4 --remote
```

```sh
pnpm check:cloudflare
pnpm test
pnpm build:worker
pnpm test:worker
pnpm exec wrangler deploy --dry-run
pnpm run deploy
```

The `v2-browser-run` migration creates `UsageBudget` and deletes the obsolete
`BetterGradientApp` class. It does not touch Turso data. After deploying, inspect
`wrangler containers list`; delete any leftover Better Gradient application using
its exact application ID, then confirm that no Container instance is running.
Do not delete another project's Container or R2 bucket.

The GitHub workflow deploys only pushes to `main`, using locked dependencies,
Worker types, tests, the Worker build and runtime smoke checks. Deployments run
sequentially. There are no preview deployments or database migrations. The token
needs existing Worker/custom-domain permissions, Browser Run and R2 access; the
one-time removal of the old Container also needs Containers Edit.

## Runtime configuration

Preserve the existing Worker secrets: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
`MARBLE_API_URL`, `MARBLE_WORKSPACE_KEY`, `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
Optional PostHog settings retain their existing meanings. No infrastructure token
or OAuth credential is copied into the Worker. Browser Run uses its native binding.

Public `VITE_*` settings are compiled into client JavaScript. Rebuild when they
change. Ordinary deployment preserves encrypted secrets. Use `wrangler secret put`
for changes; do not commit credentials.

## Verification and recovery

`pnpm test` covers native/SVG generation, request forwarding, video ranges,
persistent allowances, concurrent renders, measured settlements and failures.
`pnpm test:worker` runs actual workerd with isolated database/CMS/R2 fixtures and a
mock Browser Run binding. It checks routes, auth/CORS, raster routing and cache
behavior. This is not a real Chromium rendering proof.

The October 6 remote binding probe rendered PNG/WebP 1920×1080 and PNG 6000×6000
with the current SVG generator. Its metadata confirms alpha and dimensions; it
is not pixel-for-pixel parity proof with sharp. Production QA must independently
check API PNG/WebP, repeated-cache behavior, auth, editor downloads, video ranges,
site pages and absence of Containers. Full application TypeScript checks have
pre-existing errors; the Worker check remains required and clean.

Retain the current budget name and ledger when fixing or redeploying. A previous
Container-era Worker version cannot be safely rolled back after deleting its
Durable Object class and Container application. Recover by deploying a corrected
Worker with the Browser Run architecture. Reintroducing Containers needs an
explicit migration and will bring back resource charges.
