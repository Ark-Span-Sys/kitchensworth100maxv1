# Admin dashboard

Every screen, what each field does, the role model, and how to onboard another admin.

## Route map

| Path | Purpose |
| --- | --- |
| `/admin/login` | Magic-link sign-in |
| `/admin` | Dashboard — today's orders, revenue, pending-payment count, top items |
| `/admin/orders` | List with filters (status, date, order type) |
| `/admin/orders/[id]` | Detail, status transitions, audit trail, re-send WhatsApp card |
| `/admin/menu` | Menu items — filter, sort, delete |
| `/admin/menu/new` | Create a menu item |
| `/admin/menu/[id]` | Edit a menu item |
| `/admin/categories` | Inline CRUD for menu categories |
| `/admin/party-packs` | Inline CRUD for party packs |
| `/admin/bulk-tiers` | Inline CRUD for `min_qty` → `discount_percent` tiers |
| `/admin/catering` | Inline CRUD for catering packages |
| `/admin/cities` | Activate/deactivate a city; add new cities |
| `/admin/zones` | Zones grouped by city; name, area label, ETA, fee |
| `/admin/payments` | Three provider toggles + bank account fields |
| `/admin/settings` | WhatsApp, tagline, VAT, ticker messages, dock config |

Every page under `/admin/*` is guarded by `requireAdmin()` (in `lib/admin/guard.ts`). Non-admins and unauthenticated users are redirected to `/admin/login`.

## The role model

There is exactly one role: **admin**. Anyone with `profiles.is_admin = true` can do everything.

We considered super-admin vs editor but rejected it for v1 — the client has two owners who both need full control, and role separation adds RLS complexity without reducing risk. Multi-role is on the v2 roadmap.

## Onboarding a second admin

1. Supabase dashboard → Authentication → Users → **Add user** (email + password, or "Invite by email").
2. Confirm their email.
3. Supabase dashboard → Table Editor → `profiles` → **Insert row**:
   - `id` = the new user's UUID from step 2
   - `full_name` = their name
   - `phone` = optional
   - `is_admin` = `true`
4. They visit `/admin/login`, enter their email, click the magic link. They're in.

To revoke admin access: flip `is_admin` back to `false`. Their next request bounces them to login and signs them out.

## Screen-by-screen

### Dashboard (`/admin`)

Four KPI cards + a top-items table:

- **Today's orders** — count where `created_at >= startOfDay(now)` and status not `cancelled`
- **Revenue** — sum of `total_ngn` for the same filter, excluding `awaiting_payment`
- **Pending payment** — orders in `awaiting_payment` older than 10 minutes (needs a human to reconcile)
- **Top items today** — `order_items.item_name_snapshot` grouped, count, sum

### Orders

**List** (`/admin/orders`) — filter by status, order type, date range. Each row shows the code, customer name, phone, type badge, status badge, total, and time.

**Detail** (`/admin/orders/[id]`) — three columns:

- Left: customer info (name, phone, address, email, zone), payment info (provider, Monnify reference, `whatsapp_sent_at`)
- Middle: money breakdown (subtotal, delivery fee, discount, total), items table (snapshot names + prices)
- Right: **status transitions** — a row of pill buttons for each legal next state (`Confirmed → Preparing → Ready → Out for delivery → Delivered → Completed`). Cancel is always available and opens a small "reason" field.
- Bottom: **Audit trail** — every `order_status_events` row: from → to, changed_by, note, timestamp.

A **Re-send WhatsApp card** link at the top-right builds the same `wa.me` message and opens it.

### Menu

**List** (`/admin/menu`) — searchable, category filter. Each row: thumbnail, name, category, price, badges, active toggle, edit link, delete form.

**New / Edit** — full form:

| Field | Notes |
| --- | --- |
| Category | Dropdown of active categories |
| Name | Text; slug auto-generated (edit explicitly to override) |
| Slug | URL-friendly, unique |
| Description | Textarea |
| Ingredients | Comma-separated string, stored as `text[]` |
| Price (₦) | Integer, VAT-inclusive |
| Image | Drag-drop or click; uploads to Supabase Storage `menu-images` bucket via `/api/uploads` signed URL |
| Badges | Four checkboxes: Best seller, Signature, Spicy, Vegan |
| Stock today | Optional integer; `null` = unlimited |
| Sort order | Integer, default 0 |
| Is active | Checkbox, default true |

Extras are managed inline at the bottom of the edit page. Each extra is a `menu_extras` row: `name`, `price_ngn`, `is_required`.

### Categories

Inline CRUD list. Fields: `slug`, `name`, `description`, `sort_order`, `image_url`, `is_active`. Deleting a category is blocked by FK if any menu item still references it.

### Party Packs

Same pattern. Fields: `slug`, `name`, `serves_min`, `serves_max`, `price_ngn`, `contents` (comma-separated), `image_url`, `description`, `is_active`.

### Bulk Tiers

Tiny form: `min_qty` (integer, unique), `discount_percent` (numeric 0–100). Seeded with 6/10, 12/20, 24/30, 50/46.4.

### Catering Packages

Fields: `name`, `tier` (text label — Bronze / Silver / Gold / Custom), `price_ngn`, `description`, `image_url`.

### Cities

Two sections: **Active cities** and **Inactive cities**. Toggle flips `is_active`. New city form: `name`, `state`, `slug` (auto-generated). Abuja is seeded active; Lagos, Port Harcourt and Ibadan are seeded inactive.

### Zones

Grouped by city. Each zone: `name`, `area_label` (short suffix like "Wuse 2 & Garki 2"), `eta_minutes`, `fee_ngn`, `is_active`. Add/edit/delete inline.

### Payments

Three provider toggles + the bank-account form. See `docs/PAYMENTS.md`.

### Settings

- WhatsApp number (international, digits only)
- Tagline
- VAT percent (numeric, default 7.5)
- Ticker messages (textarea, one per line)
- **Dock enabled** checkbox
- **Dock config** (comma-separated slot keys)

## What happens on every admin mutation

- The generic CRUD server actions (`app/admin/crud-actions.ts`) call `revalidatePath` for both the affected admin route and the public route that renders the data (`/menu`, `/party-packs`, `/zones`, `/bulk`, `/catering`). This is why changes show up on the public site within seconds.
- Order status transitions write to `order_status_events` inside a small Postgres trigger (`supabase/migrations/002_functions.sql`) — the audit trail is guaranteed by the DB, not by application code.
- Sign-out is a single server action calling `supabase.auth.signOut()` and redirecting to `/admin/login`.

## What admins *cannot* do (by design)

- Change the `id = 1` primary key on `site_settings`. There's only ever one row.
- Delete a category that still has menu items (FK constraint `on delete restrict`).
- Delete a city that still has zones (FK cascade is intentional but the UI warns).
- Delete an order row. Cancel only — historical revenue must remain in reports.
