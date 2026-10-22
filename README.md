# Kitchen's Worth

**Nigerian quick-service restaurant + party-pack storefront.** Abuja-first, multi-city-ready.

- Public site — menu, party packs, bulk tiers, catering, track-order
- Floating 5-icon dock (signature UX): menu · party packs · cart · track · WhatsApp
- Cart drawer checkout with manual-bank transfer and Monnify (card + transfer)
- WhatsApp handoff: after payment the customer's WhatsApp opens with a structured order card to `+234 703 060 6021`
- Admin dashboard: menu/categories/zones/cities/party-packs/bulk-tiers/catering/orders/payments/settings — every table is admin-editable, no code changes to launch a new city

**Stack:** Next.js 15 App Router (TypeScript, RSC + route handlers + server actions) · Tailwind CSS · Supabase (Postgres + Auth + Storage + RLS) · Monnify API · Vercel.

**Tagline:** *...eat well & spend less.*

---

## Quickstart (local)

```bash
pnpm install                              # Node 20+, pnpm 9+

# 1. Point at a Supabase project.
cp .env.example .env.local                # fill in the values
# Or boot a local Supabase: `pnpm dlx supabase start`

# 2. Push schema + seed.
pnpm db:migrate                           # supabase db push
psql "$DATABASE_URL" -f supabase/migrations/005_seed.sql

# 3. Run.
pnpm dev                                  # http://localhost:3000
```

Admin login lives at `/admin/login`. Bootstrap the first admin by creating a
Supabase Auth user, then flipping `profiles.is_admin = true` for that row.

## Scripts

| Script                | What it does                                            |
| --------------------- | ------------------------------------------------------- |
| `pnpm dev`            | Next dev server                                         |
| `pnpm build`          | Production build                                        |
| `pnpm start`          | Serve the built app                                     |
| `pnpm typecheck`      | `tsc --noEmit`                                          |
| `pnpm lint`           | ESLint (`next lint`)                                    |
| `pnpm test`           | Vitest unit tests (`lib/**` pricing, whatsapp, orders)  |
| `pnpm test:e2e`       | Playwright happy-path + dock + Monnify webhook          |
| `pnpm db:migrate`     | Push local migrations to the linked Supabase project    |
| `pnpm db:seed`        | Run `supabase/migrations/005_seed.sql`                  |
| `pnpm db:reset`       | Drop + re-apply every migration + seed                  |
| `pnpm gen:types`      | Regenerate `types/database.ts` from the live schema     |

## Environment variables

Every variable is documented in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md). The
short version:

| Var | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Client-side anon key (safe in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (server) | Bypasses RLS for webhooks and admin mutations |
| `DATABASE_URL` | yes (dev) | `psql` connection for the seed script |
| `NEXT_PUBLIC_MONNIFY_PUBLIC_KEY` | for Monnify | Merchant public key |
| `MONNIFY_SECRET_KEY` | for Monnify | Basic-auth secret |
| `MONNIFY_CONTRACT_CODE` | for Monnify | Contract code from dashboard |
| `MONNIFY_WEBHOOK_AUTH_HASH` | for Monnify | HMAC key for `Bepin-Signature` |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical origin, used in sitemap + Monnify redirects |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | International format, no `+`, e.g. `2347030606021` |

Copy `.env.example` → `.env.local` and fill in. Nothing committed.

## Documentation set

Everything the client and the next developer needs:

- [handoff.md](handoff.md) — **start here for the Kitchen's Worth team**
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system diagram + why RSC + route handlers
- [docs/SCHEMA.md](docs/SCHEMA.md) — every table, column, RLS policy + ERD
- [docs/CHECKOUT-FLOW.md](docs/CHECKOUT-FLOW.md) — Monnify + manual-bank + WhatsApp card
- [docs/FLOATING-DOCK.md](docs/FLOATING-DOCK.md) — design rationale, animation spec, a11y
- [docs/PAYMENTS.md](docs/PAYMENTS.md) — Monnify setup, webhook, refunds
- [docs/ADMIN.md](docs/ADMIN.md) — every dashboard screen
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel env vars + Supabase prod + Monnify cutover
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) — every env var, owner, example
- [docs/API.md](docs/API.md) — every route handler
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — popup blocked, webhook 401, stuck orders
- [docs/SEO-AND-CONTENT.md](docs/SEO-AND-CONTENT.md) — meta, JSON-LD, brand voice
- [docs/ROADMAP.md](docs/ROADMAP.md) — v2 candidates

## Testing

- Unit (`vitest`): `lib/pricing`, `lib/whatsapp`, `lib/orders`, `lib/monnify-webhook`
- E2E (`playwright`): `e2e/checkout`, `e2e/dock`, `e2e/monnify-flow`
- Run against a staging URL: `PLAYWRIGHT_BASE_URL=https://kitchensworth-ng.vercel.app pnpm test:e2e`

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Staging target is
`kitchensworth-ng.vercel.app`; the production domain is TBD by the client.

## License / ownership

© Kitchen's Worth. All code in this repository is a client deliverable.
Monnify, Supabase and Vercel are third-party services under their own terms.
