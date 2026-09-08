# Cloudflare deployment

Better Gradient uses a Worker for public requests and static files, with its
existing TanStack Start Node server in a Cloudflare Container. This keeps sharp,
SVG filters, PNG/WebP quality settings, and the API's 6,000-pixel dimension limit.
Turso, Marble, Resend, PostHog and Umami remain the existing external services.
There is no database migration or API key regeneration.

The Container requires Workers Paid. Its compute, memory and disk usage are
[billed separately](https://developers.cloudflare.com/containers/platform/pricing/).
The initial configuration allows one `standard-1` instance and sleeps after five
minutes without requests. The first server request after sleep can take longer.
Static asset requests do not start the Container. This is a single-instance
configuration; raise both the instance limit and routing pool if traffic needs
more capacity.

`step-2-position.mp4` exceeds the Workers static asset limit. `public/.assetsignore`
keeps it out of the asset upload. The Node server streams the original file and
the Worker handles byte ranges for seeking. The file is not loaded into Worker
memory in full.

## GitHub Actions

`.github/workflows/deploy.yml` runs only on pushes to `main`. It installs the
locked dependencies with Node 22 and pnpm 10.33.0, checks the Worker types, runs
tests, builds the Node server on Linux, exercises that build, and deploys it.
Deployments run one at a time; a new push does not interrupt an active deploy.
There are no preview deploys or database schema commands.

In the repository's **Settings > Secrets and variables > Actions**, add:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | The account containing the `better-gradient` Worker |
| `CLOUDFLARE_API_TOKEN` | A dedicated deployment token for that account, authorized to deploy Workers and Containers and push container images |

Create a custom token with Account > Workers Scripts > Edit and Account >
Containers > Edit/Write. For domain management, add Zone > Workers Routes > Edit
and Zone > Zone > Read, limited to `better-gradient.com`. Limit account access to
the account hosting the Worker.

Use a persistent API token, not Wrangler's expiring local OAuth token. See
[Cloudflare's GitHub Actions setup](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
and [Container deployment](https://developers.cloudflare.com/containers/guides/deploy/).
If custom domains are managed through Wrangler, the token also needs permission
to edit Worker routes for the target zone.

Public `VITE_*` settings are GitHub repository **variables**. The workflow supplies
production defaults for the site URL and current analytics configuration. Set
`VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` to the current project values if they
change. Runtime Worker secrets cannot change JavaScript already built for the
browser; rebuild after changing public settings.

## Server secrets

Copy these values from the existing production deployment into Worker secrets:

| Name | Feature |
| --- | --- |
| `TURSO_DATABASE_URL` | Existing gradients, export counts, API keys and quotas |
| `TURSO_AUTH_TOKEN` | Turso access |
| `MARBLE_API_URL` | Blog API base URL |
| `MARBLE_WORKSPACE_KEY` | Existing blog workspace |
| `RESEND_API_KEY` | API key confirmation emails |
| `RESEND_FROM_EMAIL` | Existing verified sender |

For example, `pnpm exec wrangler secret put TURSO_AUTH_TOKEN` prompts for the
value without committing it. Optional `POSTHOG_KEY`, `POSTHOG_HOST`,
`POSTHOG_ENABLED`, `POSTHOG_DISABLED`, `POSTHOG_DEBUG` and `VITE_SITE_URL` are
forwarded to the Container as well. `cloudflare/config.ts` explicitly selects
these application settings; infrastructure credentials are not passed through.
Secrets are preserved by ordinary deploys. When rotating a runtime secret, also
restart the running Container so its process receives the new environment.

## Local builds and first deployment

Keep using `pnpm dev` or the existing Localify command for development.

Cloudflare runs Linux x64. On macOS, build through Docker so sharp and libSQL
have the correct native binaries:

```sh
pnpm install --frozen-lockfile
pnpm check:cloudflare
pnpm test
pnpm build:cloudflare
pnpm exec wrangler login
pnpm run deploy
```

Docker must be running. `Dockerfile.build` builds Linux artifacts into `.output`;
`Dockerfile` packages those artifacts for deployment. The local build passes only
listed public Vite settings through a temporary build secret. `.env` and server
credentials are excluded from both Docker contexts. On a Linux x64 CI runner,
`pnpm build:server` produces the same layout directly. The deploy script rejects a
build missing the Linux x64 sharp binary.

`pnpm test:smoke` executes the production Node build with a temporary SQLite
database, a local CMS fixture, and blocked external analytics/email requests.
On macOS, run it inside the built Linux image:

```sh
docker build --platform linux/amd64 -t better-gradient-check .
docker run --rm --platform linux/amd64 \
  --mount type=bind,src="$PWD/scripts",dst=/app/scripts,readonly \
  better-gradient-check node scripts/smoke.mjs
```

The smoke test covers SSR, database reads, blog responses, SEO files, static
files, API SVG/CSS/PNG/WebP output, valid and invalid API keys, quotas, CORS and
delivery of the large video. Worker tests cover forwarding headers and video
ranges. Email delivery and a full editor interaction still need separate live
verification; the fixture checks do not prove those external services work.

## Domain cutover and rollback

First deploy to the `workers.dev` URL printed by Wrangler. Container provisioning
can continue after the command finishes. Verify the homepage, editor, gallery,
blog, API formats and a video range request on that URL before switching DNS.

`wrangler.jsonc` declares `better-gradient.com` as a Worker custom domain. Check whether
`www.better-gradient.com` is in use and preserve its redirect. Save the existing
Vercel DNS records before replacing any record. Keep the Vercel deployment and
its environment settings until the Cloudflare domain has been verified.

`vercel.json` disables automatic Vercel builds for commits containing that file,
using [Vercel's Git configuration](https://vercel.com/docs/project-configuration/git-configuration).
The existing live deployment remains available. After cutover, disconnect the
Vercel Git integration as well if older branches without this file can still
receive pushes.

For an application rollback, redeploy the previous known-good source commit
with its Container image. A Worker version rollback alone does not establish
that the Container image was rolled back. For a hosting rollback, restore the
saved Vercel DNS records and remove the Worker custom domain or route that
intercepts that hostname. The unchanged Turso database keeps both deployments
on the same data.

## Verification on September 8, 2026

The Worker and Container were deployed and one active instance was confirmed.
The `workers.dev` hostname returned the homepage, editor, gallery, blog,
developers page, robots file and sitemap. SVG, CSS, PNG and WebP API responses
were checked remotely; PNG and WebP retained transparency. Video range requests
at the start and at byte 100,000 returned HTTP 206 with the requested 1,024 bytes.
The editor rendered in the browser and its square size preset responded.

Twenty tests and the isolated Linux production smoke test passed. Worker types
passed. The full application typecheck still reports the same 27 pre-existing
errors as before this migration.

The deployment token is configured. The first GitHub Actions run for commit
`ceea489` passed all checks and deployed the Worker and Container in under two
minutes. The apex custom domain is declared in Wrangler for the next deployment.
Before cutover, authoritative DNS returned `216.198.79.1` with a 300-second TTL;
`www.better-gradient.com` did not exist. Confirmation email delivery was not exercised.
