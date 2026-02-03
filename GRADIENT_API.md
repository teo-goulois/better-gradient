# Gradient API v1 - Feature Summary

## Overview
This release adds a cost-controlled Gradient API with two tiers:
- Public demo tier (no API key, strict limits)
- Verified key tier (email verification, higher limits)

It also adds caching with ETag + CDN-friendly headers, and a Developers page with docs and key request flow.

## Endpoint
`GET /api/gradient`

### Auth headers (optional)
- `Authorization: Bearer <key>`
- `x-api-key: <key>`

## Formats
- `svg`
- `css`
- `share`

Note: `json` is reserved for Better Gradient internal use and is blocked on the public tier.

## Query Parameters
- `seed` or `email`: deterministic identity (same value = same gradient)
- `size`: sets both width and height
- `width`, `height`: override one or both dimensions
- `count`: number of shapes blended
- `format`: `svg`, `css`, or `share`

## Public Tier (no key)
- Rate limits: 20/min, 200/day
- Max size: 2048px
- Max count: 8
- Requires `seed` or `email` (random output not allowed)

## Verified Tier (key)
- Rate limits: 60/min, 1000/day
- Max size: 6000px
- Max count: 10
- Random output allowed

## Rate Limit Headers
Responses include:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `X-RateLimit-Limit-Minute`
- `X-RateLimit-Remaining-Minute`
- `X-RateLimit-Reset-Minute`
- `X-RateLimit-Limit-Day`
- `X-RateLimit-Remaining-Day`
- `X-RateLimit-Reset-Day`
- `Retry-After` (when limited)

## Caching Behavior
- Seeded requests return ETag and long-lived cache headers.
- Random output is `no-store`.
- LRU in-memory cache stores seeded outputs to reduce compute.

## API Key Flow
1. User requests a key with email on `/developers`.
2. Verification link is emailed (Resend).
3. Link returns the key once; only the hash is stored.

## Data Model
New tables:
- `api_keys`: stores hashed keys and usage metadata
- `api_key_requests`: stores hashed verification tokens and expiry

## Developers Page
Route: `/developers`
- Docs, examples, rate limits, and key request form
- Added to navbar and sitemap

## New Env Vars
Required in `src/env-server.ts`:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Setup Checklist
1. `pnpm install`
2. Set env vars above
3. `pnpm db:push`
4. `pnpm dev`

## Key Files
- `src/routes/api/gradient.ts`
- `src/lib/actions/actions.api-keys.ts`
- `src/lib/api/api-keys.ts`
- `src/lib/api/rate-limit.ts`
- `src/lib/api/gradient-cache.ts`
- `src/lib/config/api-limits.ts`
- `src/routes/_pages/developers.tsx`
- `src/lib/db/schema/api-keys.ts`
- `src/lib/db/drizzle/0000_natural_scorpion.sql`
