# API

Every Next.js route handler the app exposes. Server actions (used by `/admin/*` forms) are documented in `docs/ADMIN.md`.

## Public

### `POST /api/orders`

Create an order row for the manual-bank path.

- **Auth**: none (public, but RLS restricts `status IN ('pending','awaiting_payment')` and blocks updates).
- **Body (JSON)**:
  ```json
  {
    "order_number": "KW-ABC123",
    "customer_name": "Ada E.",
    "phone": "08012345678",
    "email": "ada@example.com",
    "order_type": "delivery",
    "zone_id": "uuid",
    "address": "12 Ademola St, Wuse 2",
    "notes": "call on arrival",
    "payment_provider": "manual_bank",
    "lines": [
      { "kind": "menu_item", "ref_id": "uuid", "item_name": "Jollof Rice", "unit_price": 1500, "quantity": 2, "line_total": 3000 }
    ],
    "subtotal_ngn": 6300,
    "delivery_fee_ngn": 2500,
    "discount_ngn": 0,
    "total_ngn": 8800
  }
  ```
- **Response `200 OK`**: `{ "order_number": "KW-ABC123", "status": "awaiting_payment", "whatsapp_link": "https://wa.me/…" }`
- **Response `400`**: validation errors from the Zod schema in `lib/validation/order.ts`.
- **Idempotency**: if `order_number` already exists, the existing row is returned unchanged (no duplicate `order_items`).

### `POST /api/monnify/initialize`

Create a Monnify payment intent for a cart, save the order as `pending`, return the checkout URL for the browser to redirect to.

- **Auth**: none (public).
- **Body**: same shape as `/api/orders` plus `payment_provider` = `monnify_card` or `monnify_transfer`.
- **Response `200 OK`**: `{ "checkout_url": "https://api.monnify.com/…", "order_number": "KW-ABC123", "payment_intent_code": "MHX-…" }`
- **Response `502`**: Monnify returned `requestSuccessful: false`. Message is passed through.

### `POST /api/monnify/webhook`

Monnify calls this on every payment event. Verifies HMAC, transitions order status.

- **Auth**: `Bepin-Signature` header — HMAC-SHA512 of the raw body with `MONNIFY_WEBHOOK_AUTH_HASH`.
- **Body**: raw JSON as sent by Monnify. We read it as text first (never re-parse-then-stringify) to keep the HMAC stable.
- **Response `200`**: accepted (paid / non-paid / unknown / already-paid — all return 200 so Monnify doesn't retry).
- **Response `401`**: signature mismatch or missing. Monnify will retry — this is intentional.

### `GET /api/track`

Look up orders by order number OR by phone. Used by `/track` on the client.

- **Auth**: none.
- **Query**: `?code=KW-ABC123` **or** `?phone=08012345678` (one required).
- **Response `200`**: `{ "orders": [ { "order_number", "status", "created_at", "total_ngn", "items": [...] } ] }` — most recent first, capped at 20.
- Phone matches are normalised via `normaliseNumber` before the query.

### `POST /api/uploads`

Request a signed Supabase Storage URL for admin image uploads.

- **Auth**: session cookie must map to a `profiles` row with `is_admin = true`.
- **Body (JSON)**: `{ "bucket": "menu-images", "content_type": "image/jpeg", "size_bytes": 240000, "filename": "jollof-hero.jpg" }`
- **Response `200`**: `{ "url": "https://<ref>.supabase.co/storage/v1/object/sign/…", "public_path": "menu-images/<uuid>/jollof-hero.jpg" }`
- **Response `403`**: not admin.
- **Response `413`**: size > 5 MB or content-type not in `{image/jpeg, image/png, image/webp}`.

The signed URL expires in 60 seconds and is single-use.

### `GET /api/sitemap`

`app/sitemap.ts` writes to `/sitemap.xml` directly. Included here for completeness — dynamic list of menu items, categories and public pages.

## Server actions (admin-only)

Server actions are `use server` functions invoked from `<form action=…>`. They run under the same origin, protected by CSRF via Next's built-in action id + `requireAdmin()` inside every action.

| Action | File | Table | Notes |
| --- | --- | --- | --- |
| `createRow(table, formData)` | `app/admin/crud-actions.ts` | categories, menu_items, party_packs, bulk_tiers, catering_packages, cities, zones | Generic insert + revalidate |
| `updateRow(table, id, formData)` | same | same | Generic update |
| `deleteRow(table, id)` | same | same | Generic delete |
| `createMenuItem(fd)` / `updateMenuItem(id, fd)` / `deleteMenuItem(id)` | `app/admin/menu/actions.ts` | menu_items + menu_extras | Full CRUD wrapper |
| `setOrderStatus(id, status, note)` | `app/admin/orders/actions.ts` | orders + order_status_events | Transition guard + audit row |
| `toggleProvider(key, next)` | `app/admin/payments/actions.ts` | payment_providers | Enable/disable |
| `saveBank(fd)` | same | site_settings | Update bank fields |
| `saveSettings(fd)` | `app/admin/settings/actions.ts` | site_settings | WhatsApp, tagline, VAT, ticker, dock |
| `signOut()` | `app/admin/actions.ts` | — | Supabase session clear |

Every action calls `requireAdmin()` on the first line — the DB is never touched if the caller isn't an admin.

## Response conventions

- Errors from route handlers are `{ "error": "…", "code": "…" }` and use the appropriate HTTP status. Never 500 with a stack trace.
- Every response includes the three security headers configured in `vercel.json`.
- Every JSON body has `Cache-Control: no-store` on POST, and `public, max-age=30, s-maxage=300` on GET `/api/track` (order status can be slightly stale).

## Rate limiting

Not built into the app — Vercel's DDoS protection is the first line. The `POST /api/orders` route relies on the client-side idempotency of `order_number` for dedupe. If the site starts seeing abuse we'll add Upstash Ratelimit on `/api/orders`, `/api/monnify/initialize` and `/api/uploads`.
