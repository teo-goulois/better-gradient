# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-05-10 | self | Created the initial napkin through a shell `printf` with an apostrophe in the content, which broke quoting and truncated the file. | Use `apply_patch` for repo file creation/edits, especially when text contains quotes. |
| 2026-05-10 | self | Tried `npm install` in a pnpm-lock repo and hit an npm arborist error. | Use `pnpm add` in this repo; the authoritative lockfile is `pnpm-lock.yaml`. |

## User Preferences
- Follow AGENTS.md: concise, decisive, senior-engineer style; prefer official primitives and long-term integration over local workarounds.

## Patterns That Work
- Keep analytics instrumentation thin and centralized; avoid noisy low-value events.

## Patterns That Don't Work
- Avoid shell string writes for markdown content with quotes.

## Domain Notes
- Better Gradient is a TanStack Start/Vite app with an existing Umami-style analytics helper in `src/lib/tracking.ts`.
- Local browser validation can use `pnpm dev-localify` and `https://better-gradient.localify`; Vite HMR websocket errors through Localify are expected noise.
