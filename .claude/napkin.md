# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-03-07 | self | Started exploring before a repo napkin existed | Create `.claude/napkin.md` immediately when missing, then keep it updated during the session |
| 2026-03-07 | self | Assumed the earlier Vite crash came only from an unused dependency | When reintroducing `better-auth`, budget for a Vite dev-server compatibility pass; in this repo, `optimizeDeps.noDiscovery=true` with empty `include` lists was needed to keep `pnpm dev` from crashing |
| 2026-03-07 | self | Tried to append to the napkin with a shell one-liner and broke on shell quoting | Use `apply_patch` for napkin updates too when the line contains apostrophes or mixed quotes |
| 2026-03-07 | self | Overestimated the first Vite config fix | TanStack Start re-injects `better-auth` into `optimizeDeps.include`; filter it out in a late `configResolved` plugin instead of relying only on top-level Vite config |
| 2026-03-07 | self | Assumed Vite client stubs would be an acceptable long-term fix for the editor white screen | In this repo, `createServerFn` modules must not import `@/lib/db`, `@/lib/auth`, schema files, or `node:crypto` at module scope; move that logic into dynamically imported server services |
| 2026-03-07 | self | Left non-`createServerFn` helper exports inside a route action module | If an action file is imported by client routes, even plain exported helpers can pull server dynamic imports into the browser transform; keep API-only helpers in server service files |
| 2026-03-07 | self | Tried to keep a client-side CommonJS dependency alive under `optimizeDeps.noDiscovery=true` | For tiny deterministic utilities used in the browser, prefer an in-repo implementation over depending on fragile CJS interop in Vite dev |
| 2026-03-07 | self | Assumed the old `@dnd-kit/react/sortable` wiring was still valid after the package upgrade | With `@dnd-kit/react@0.1.x`, prefer explicit sortable `group`/`type` and explicit `sourceRef`/`targetRef` instead of relying on a bare `sortable.ref` |
| 2026-03-07 | self | Started Better Auth with async dynamic imports instead of matching the TanStack Start example | Prefer a static exported `auth = betterAuth({...})` singleton and a separate `authClient = createAuthClient()` for client-side login/logout/session hooks |
| 2026-03-07 | self | Left broad `optimizeDeps.noDiscovery` workarounds in place after stabilizing Better Auth | Keep only the targeted `stripBetterAuthFromOptimizer()` patch; the global `noDiscovery` blocks are not needed anymore and can break unrelated CJS interop in dev |
| 2026-03-07 | self | Left legacy `createServerFileRoute`/`ServerRoute` exports in route files after upgrading TanStack Start | In TanStack Start 1.166.x here, route files should export `Route = createFileRoute(path)({ server: { handlers } })`; otherwise the route generator warns and skips them |
| 2026-03-07 | self | Missed the `createServerFn` chaining API change after the TanStack Start upgrade | In the installed `@tanstack/start-client-core@1.166.2`, use `.inputValidator(...)`, not `.validator(...)`; stale server-fn helpers can crash unrelated routes during module evaluation |
| 2026-03-07 | self | Reused a `createServerFn` fetcher directly inside a server route handler | For TanStack Start server routes in this repo, call a plain server helper (for example under `src/lib/server/*`) instead of invoking the server-fn wrapper from the route handler |
| 2026-03-07 | self | Left the router entry on the old export name after upgrading TanStack Start | `src/router.tsx` must export `getRouter` for Start 1.166.x; keeping only `createRouter` breaks hydration/build and surfaces as generic `HTTPError` responses |
| 2026-03-07 | self | Kept old request-context helper imports in auth after upgrading Start server helpers | Replace `getHeaders()`/`getEvent()` with `getRequestHeaders()`/`getRequestIP()` from `@tanstack/react-start/server` in Start 1.166.x |
| 2026-03-07 | self | Left Vite React plugin wired twice during the Start upgrade | Duplicated `viteReact()` causes the React Refresh preamble to be injected twice; with TanStack Start, use one `tanstackStart({ customViteReactPlugin: true })` plus one configured `viteReact(...)` |
| 2026-03-07 | self | Assumed the `g.$slug` route's loader return type was the problem | When TanStack Router infers a file route loader as `=> never` on this repo, treat it as a route typing mismatch and remove or restructure the loader instead of trying different serializable returns |
| 2026-03-26 | self | Internal tabs on product pages used raw `<a href>` links, which forced full document navigations and remounted auth UI | For in-app route/search changes in this repo, use TanStack Router `Link` with typed `to`/`params`/`search` instead of bare anchors |
| 2026-03-07 | self | Left `better-auth` in package.json even though the auth flow was implemented manually and the package was unused | Remove orphan auth deps after changing implementation strategy; unused server-auth packages can break Vite dev optimization |
| 2026-05-10 | self | Created the initial napkin through a shell `printf` with an apostrophe in the content, which broke quoting and truncated the file. | Use `apply_patch` for repo file creation/edits, especially when text contains quotes. |
| 2026-05-10 | self | Tried `npm install` in a pnpm-lock repo and hit an npm arborist error. | Use `pnpm add` in this repo; the authoritative lockfile is `pnpm-lock.yaml`. |

## User Preferences
- Prefer implementation over extended discussion once the spec is settled.
- For product strategy discussions, prefer a wide, creative brainstorm first before narrowing to a roadmap.
- Product direction preference: keep the core generator free and monetize through many paid features, personalization, collections, and integrations rather than relying on a company/brand-system positioning alone.
- After ideation, user wants concrete packaging: named plans, exact feature splits, and phased implementation.
- Follow AGENTS.md: concise, decisive, senior-engineer style; prefer official primitives and long-term integration over local workarounds.

## Patterns That Work
- Preserve the existing stateless share flow at `/share/$state` when adding heavier product features.
- Build new authenticated product features beside the current export/share pipeline instead of mutating the legacy flow into something else.
- The repo already has partial Google auth + saved gradient services; resume from the existing tables/actions/routes instead of replacing them.
- For strategy deliverables in this repo, a standalone Markdown doc at the repository root works well when there is no `docs/` directory.
- `pnpm build` is the reliable validation pass here; repo-wide `biome check` currently includes a large backlog of unrelated formatting/lint issues, so use scoped checks on touched files when iterating.
- Better Auth integration here needs Better Auth-compatible Drizzle tables (`users`, `sessions`, `accounts`, `verifications`) rather than the earlier hand-rolled Google OAuth schema.
- For owner-facing export history, keep anonymous `created_gradients` for global/share-level stats and add a separate per-user table instead of overloading the global deduped record.
- Keep analytics instrumentation thin and centralized; avoid noisy low-value events.
- For PostHog in Vite production builds, provide a client-side fallback project key or ensure `VITE_POSTHOG_KEY` is present during build; runtime-only env changes will not affect already-built client bundles.
- Do not gate PostHog on the legacy `VITE_PH_ENABLED` flag; Vercel can carry stale public build env values. Use `VITE_POSTHOG_DISABLED=true` only for an explicit analytics opt-out.

## Patterns That Don't Work
- Reusing legacy anonymous persistence tables as the canonical owner-facing model will couple unrelated behaviors and migrations.
- Assuming product routes exist because services exist. In this repo, server actions landed before the corresponding pages and editor integration.
- Avoid shell string writes for markdown content with quotes.

## Domain Notes
- Better Gradient currently stores anonymous exported gradients in `created_gradients` keyed by `share`.
- Shared gradient page views are already sent to Umami, but creator-facing analytics need first-party storage in app tables.
- New authenticated features are being added alongside the legacy editor/share flow, not on top of it.
- Current product question: explore premium features that feel differentiated from existing gradient tools, including unusual or creative ideas aimed at professional users.
- User points to Coolors as a useful product inspiration, so premium ideas should consider toolbox/workflow expansion instead of only adding more gradient generation knobs.
- Better Gradient is a TanStack Start/Vite app with an existing Umami-style analytics helper in `src/lib/tracking.ts`.
- Local browser validation can use `pnpm dev-localify` and `https://better-gradient.localify`; Vite HMR websocket errors through Localify are expected noise.
