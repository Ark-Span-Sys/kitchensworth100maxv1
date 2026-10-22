# Architecture

How Kitchen's Worth fits together, and why each choice was made.

## System diagram

```
                    ┌────────────────────────────────────────────┐
                    │                                            │
   Customer ────────┼──► Next.js 15 on Vercel (edge + serverless)│
   browser          │    ├─ RSC pages (public + admin)           │
                    │    ├─ Route handlers (/api/*)              │
                    │    └─ Server actions (admin mutations)     │
                    │                                            │
                    └───────────┬────────────────────────┬───────┘
                                │                        │
                        anon key│             service key│
                                ▼                        ▼
                        ┌──────────────┐        ┌─────────────────┐
                        │   Supabase   │        │   Supabase      │
                        │  Postgres +  │        │  (service-role  │
                        │  RLS + Auth  │        │   bypasses RLS) │
                        └──────────────┘        └─────────────────┘
                                ▲
                                │ webhook (Bepin-Signature HMAC)
                                │
                        ┌───────┴────────┐
                        │    Monnify     │  ◄──── hosted checkout page
                        │  (payments)    │
                        └────────────────┘

    Customer WhatsApp ─────► wa.me/234… deep link ─────► Kitchen's Worth business inbox
```

## Why Next.js App Router + RSC

- **Fast first paint of the menu.** The `/menu` page is a server component that queries Supabase on the server and streams HTML — no client-side fetch, no spinner, indexable by Google.
- **Route handlers replace a separate API tier.** `/api/monnify/webhook`, `/api/orders`, `/api/track` and `/api/uploads` live inside the same Vercel project — no cross-origin config, no second deploy pipeline.
- **Server actions replace most of what would be `POST /api/admin/…` mutations.** Every admin form uses `<form action={serverAction}>` and revalidates the affected path. This keeps the whole CRUD layer under 200 LOC (`app/admin/crud-actions.ts`).

## Why Supabase

- **One service covers Postgres + Auth + Storage + RLS.** The client's menu images live in a Supabase Storage bucket; the admin session cookie is set by Supabase Auth; the row-level security policies enforce "public read only where `is_active = true`" and "admin full CRUD everywhere" declaratively, in SQL.
- **Typed client.** `types/database.ts` is generated (or hand-mirrored) from the schema; every `.from("orders")` call is fully typed end-to-end.
- **Local dev matches prod.** `supabase start` boots the whole stack in Docker; `supabase db push` applies the same migrations to hosted.

## Why Monnify (not Paystack / Flutterwave)

- Nigerian card + bank-transfer in one integration, single webhook contract.
- Paystack fallback is planned for v2 (see `docs/ROADMAP.md`).
- Manual bank transfer (showing the client's own account) is a first-class provider because it costs nothing and works even during a Monnify outage — it's the third toggle in `/admin/payments` and the fallback path in the checkout drawer.

## Why WhatsApp is the confirmation channel

The client already runs WhatsApp Business on `+234 703 060 6021`. Every order, regardless of payment path, ends with the customer opening a `wa.me` link whose `?text=` is a structured order card. The kitchen sees the same card as a normal WhatsApp message and replies. No email delivery, no SMS cost, no missed orders.

The site stores the order row in Postgres first (so `/track` works), then hands off to WhatsApp. If popup-blocked, the drawer renders an "Open WhatsApp" button with the same deep link.

## The floating dock as a first-class navigation primitive

`components/dock/FloatingDock.tsx` is a client component mounted once inside `CartProvider` at the root layout. It reads:

- `usePathname()` for active-route highlighting
- cart count from context for the badge
- `site_settings.dock_enabled` + `dock_config` for whether to render and which slots to show

See `docs/FLOATING-DOCK.md` for the full design spec.

## Data flow: one checkout, three payment paths

```
[customer fills cart drawer]
        │
        ├─ Manual Bank ──► POST /api/orders ──► row status = 'awaiting_payment'
        │                                        └─► window.open(wa.me…)?
        │
        ├─ Monnify Card ─► POST /api/monnify/initialize ─► redirect to Monnify
        │                                                     │
        │                                          Monnify calls /api/monnify/webhook
        │                                                     │
        │                                          order → 'paid', redirect /track?new=KW-…
        │                                                     │
        │                                          /track auto-fires the wa.me handoff
        │
        └─ Monnify Transfer ─► same as Card but the checkout page shows the virtual account
                                to transfer into; webhook still transitions to 'paid'
```

## Multi-city architecture

- `cities` has an `is_active` boolean; zones belong to a city (`zones.city_id FK`).
- Public cart drawer queries `cities where is_active` and shows a city selector only if more than one is active.
- Activating a new city (Lagos, PH, Ibadan are seeded but inactive) requires **zero code changes** — see `handoff.md`.

## Files worth knowing

| Path | What lives here |
| --- | --- |
| `app/layout.tsx` | Root layout, mounts `CartProvider`, conditionally hides site chrome on `/admin` |
| `middleware.ts` | Supabase session refresh + `x-pathname` header injection |
| `lib/supabase/{client,server,admin}.ts` | Three client factories: anon in browser, RLS-aware on server, service-role for webhooks |
| `lib/admin/guard.ts` | `requireAdmin()` — called by every admin action and page |
| `app/admin/crud-actions.ts` | Generic `createRow` / `updateRow` / `deleteRow` for the seven simple tables |
| `lib/pricing.ts` | VAT + per-line bulk discount engine |
| `lib/whatsapp.ts` | Order-card builder + Nigerian number normaliser |
| `lib/monnify.ts` | Signed requests + `Bepin-Signature` verifier |
| `supabase/migrations/001_init.sql` | The whole schema, enums, indexes |
| `supabase/migrations/003_rls.sql` | Every RLS policy |
