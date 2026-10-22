# Environment variables

Every variable the app reads, its purpose, an example value, and who owns it. Copy `.env.example` → `.env.local` for dev. On Vercel, mirror the names exactly (Project → Settings → Environment Variables).

## Supabase

| Name | Required | Example | Owner | Purpose |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | `https://abcd1234.supabase.co` | Dev team | Supabase project origin. Safe in the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (JWT) | Dev team | Client-side key. Restricted by RLS. Safe in the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (server) | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (JWT) | Dev team | **Bypasses RLS**. Server-only, never prefix with `NEXT_PUBLIC_`. |
| `DATABASE_URL` | dev only | `postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres` | Dev team | Used by `pnpm db:seed` to run raw SQL. Not used by the app. |

## Monnify

| Name | Required | Example | Owner | Purpose |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_MONNIFY_PUBLIC_KEY` | for Monnify | `MK_PUBLIC_...` | Payments owner | Used by the checkout page to render the Monnify iframe where relevant. |
| `MONNIFY_SECRET_KEY` | for Monnify | `MK_SECRET_...` | Payments owner | Basic-auth for server-to-server calls. **Never** in the browser. |
| `MONNIFY_CONTRACT_CODE` | for Monnify | `MC_2504...` | Payments owner | Identifies the merchant in payment-intent calls. |
| `MONNIFY_WEBHOOK_AUTH_HASH` | for Monnify | long random string | Payments owner | HMAC-SHA512 key for the `Bepin-Signature` header. |
| `MONNIFY_BASE_URL` | no (has default) | `https://api.monnify.com` (prod), `https://testapi.monnify.com/` (sandbox) | Dev team | Flip for sandbox testing without rotating every key. |

## Site

| Name | Required | Example | Owner | Purpose |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://kitchensworth-ng.vercel.app` | Dev team | Canonical origin used in `sitemap.ts`, `robots.ts`, JSON-LD, Monnify redirect URL. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | `2347030606021` | Kitchen's Worth owner | Fallback for the DB value if `site_settings` hasn't been seeded yet. |
| `ADMIN_EMAIL` | one-off (bootstrap) | `owner@kitchensworth.ng` | Dev team | Referenced by the bootstrap SQL that promotes the first admin. Not read by the app. |

## Framework / runtime

| Name | Required | Example | Owner | Purpose |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | (set by Next/Vercel) | `production` / `development` | Vercel | |
| `VERCEL_URL` | (set by Vercel) | `kitchensworth-ng-git-main-….vercel.app` | Vercel | Falls back into `NEXT_PUBLIC_SITE_URL` if that's not set — see `lib/brand.ts`. |
| `PLAYWRIGHT_BASE_URL` | (tests only) | `https://kitchensworth-ng.vercel.app` | Dev team | Points Playwright at a staging URL instead of booting a local `next dev`. |

## Rotation checklist

If any secret leaks or is rotated:

1. Rotate at the source (Supabase dashboard, Monnify dashboard).
2. Update Vercel env vars.
3. **Redeploy** — env vars are baked into the running functions.
4. For `MONNIFY_WEBHOOK_AUTH_HASH`, also update the value stored in Monnify → Settings → Webhooks so both sides sign/verify with the same key.
5. For `SUPABASE_SERVICE_ROLE_KEY`, confirm the Monnify webhook still writes to `orders` — that route uses the service role to bypass RLS.

## Non-negotiables

- Any variable prefixed with `NEXT_PUBLIC_` is visible in the browser bundle. **Never** prefix secrets.
- Any variable containing "secret" or "service_role" is Vercel **Protect** — mark it as such so it's write-only.
- The webhook auth hash appears in exactly two places: Vercel env var and the Monnify dashboard. Nowhere else.
