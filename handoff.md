# Kitchen's Worth — Client Handoff

Everything the Kitchen's Worth team needs to run the site day-to-day. No code, no jargon. Read once, then bookmark the sections you come back to.

---

## What's live (v1)

| Area | What it does |
| --- | --- |
| Public site | Home, full menu, item pages, party packs, bulk tiers, catering, zones, build-your-own, about, contact, policy, track-order |
| Floating dock | Always-visible 5-icon bar at the bottom — Menu · Party Packs · Cart · Track · WhatsApp |
| Cart & checkout | Slide-out drawer. Pickup or Delivery. Auto bulk discount at 6+ qty. |
| Payment | Manual bank transfer + Monnify (card and bank-transfer). All three toggled from the admin. |
| WhatsApp handoff | After payment (or with a bank-transfer receipt pending), the customer's WhatsApp opens pre-filled with a structured order card to `+234 703 060 6021`. |
| Admin dashboard | `/admin` — menu, categories, party packs, bulk tiers, catering, cities, zones, orders, payments, settings |
| Order tracking | `/track` — by phone or by order code (`KW-XXXXXX`) |

Delivery is live in **Abuja (FCT)**. Lagos, Port Harcourt and Ibadan are already in the database as inactive — flip them on when you're ready (see *Expanding to a new city*).

---

## Credentials inventory

Nothing sensitive is in this repo. Every secret lives in one of three places:

| Credential | Where it's stored | Who owns it | Rotate how |
| --- | --- | --- | --- |
| Supabase project URL + anon key | Vercel env vars + `.env.local` (dev only) | Dev team | Never rotates |
| Supabase service-role key | Vercel env var only, never in the browser | Dev team | Supabase dashboard → API keys |
| `DATABASE_URL` (for seeding) | Local `.env.local` only, not on Vercel | Dev team | Supabase dashboard → Database |
| Monnify secret key + contract code + webhook hash | Vercel env vars | Payments owner | Monnify dashboard → Settings → API keys |
| Admin login (email magic link) | Supabase Auth | Kitchen's Worth owner | Send a magic link, tick "Is Admin" in `profiles` |
| WhatsApp business number | Site Settings → WhatsApp | Kitchen's Worth owner | Change it in `/admin/settings` |
| Bank account (manual transfer) | Site Settings → Payments | Kitchen's Worth owner | Change it in `/admin/payments` |
| Vercel project | Team login | Dev team | Vercel dashboard |
| Domain (`kitchensworth-ng.vercel.app` staging, prod TBD) | Registrar | Client | Ask the dev team |

If any credential leaks, rotate immediately and ping the dev team.

---

## Signing in to the admin

1. Go to `https://<your-domain>/admin/login`.
2. Enter the admin email — you'll get a magic link in your inbox.
3. Click the link. You're in.

Only emails whose `profiles.is_admin` row is `true` can get past the login screen. Anyone else gets bounced back to the login page. See *Onboarding a second admin* at the bottom.

---

## Day in the life (walkthrough)

**07:00** — Open `/admin`. The dashboard shows yesterday's orders, revenue, pending-payment count, top sellers.

**08:30** — A delivery rider messages: "Ada's order KW-AB12CD says out-for-delivery but she says nobody's come." Go to `/admin/orders`, search `KW-AB12CD`, click **Out for delivery** → the status transitions and an entry is written to the audit trail. The customer will see it next time they visit `/track`.

**11:00** — Chicken is running low. In `/admin/menu`, edit *Fried Rice & Chicken* and set *Stock today* to `15`. When it hits zero, the item grays out on the public menu automatically (still shown, but the add-to-cart button reads "Sold out today").

**14:00** — New dish tomorrow. In `/admin/menu/new`, fill in name, category, price (VAT-inclusive), upload a photo. Tick *Best seller* if you want it on the homepage strip. Save. It's live.

**19:00** — Close of business. In `/admin/payments`, everything with `awaiting_payment` older than 4 hours: call the customer or click **Cancel**. Cancelled orders are still recorded, they just fall out of the kitchen queue.

---

## How to… (recipes)

### …add a dish

1. `/admin/menu/new`
2. Fill in **name**, **slug** (auto-generated from name), **category** (dropdown), **price** (VAT-inclusive, whole Naira), **description**, **ingredients** (comma-separated).
3. Upload an image — goes into the Supabase `menu-images` bucket, ~1200×900 or larger looks best.
4. Tick badges: *Best seller* (homepage strip), *Signature* (gold star), *Spicy* (chilli chip), *Vegan*.
5. Optional: set *Stock today* if you want to cap daily sales.
6. Save. The menu page updates instantly.

### …change a price

`/admin/menu` → click the row → edit `price_ngn` → Save. Every cached copy of the menu on Vercel is revalidated within ~10 seconds.

### …upload a new hero photo

The homepage pulls from the *Signature* flag on menu items — set an item as Signature with a good photo and it lands in the hero. Party-pack imagery lives in `/admin/party-packs`.

### …toggle a payment provider

`/admin/payments` — three big switches:

- **Monnify Card** — customer pays with card on Monnify's hosted page, redirect back, WhatsApp fires.
- **Monnify Transfer** — Monnify generates a virtual account, customer transfers into it, webhook fires, WhatsApp opens.
- **Manual Bank Transfer** — you show your own bank details in the drawer; customer ticks "I've paid"; WhatsApp fires immediately.

Turning one off hides it from the checkout drawer within 10 seconds. Turn at least one on or customers can't checkout.

### …edit bank account details

`/admin/payments` → bottom section. Bank name / account name / account number. Only visible to customers when *Manual Bank* is enabled.

### …change the WhatsApp number

`/admin/settings` → **WhatsApp number (international)** field. Digits only, no `+`, no spaces. Currently `2347030606021`.

### …edit the ticker messages

`/admin/settings` → **Ticker messages (one per line)**. Each non-empty line becomes one slide in the scrolling bar under the header. Suggested max 6 lines so the rotation isn't too fast.

### …change VAT

`/admin/settings` → **VAT percent**. Currently `7.5`. Displayed prices are *VAT-inclusive* — this field is used only to compute the "VAT included" line in the checkout totals, not to add on top.

### …change the tagline

`/admin/settings` → **Tagline**. Currently *...eat well & spend less.*

### …configure the floating dock

`/admin/settings` → **Dock config** (comma-separated slot keys). Reorder the 5 slots; the left-most appears on the far left. Allowed keys: `menu, party-packs, cart, track, whatsapp, home, catering, bulk, build`. To hide the dock entirely (site-wide, no deploy), uncheck **Enable floating dock**.

### …respond to an order / mark paid / cancel

1. `/admin/orders` — filter by status.
2. Click a row → detail page shows customer, items, totals, payment provider, Monnify reference (if any), and the current status.
3. **Status buttons** at the top: `Confirmed → Preparing → Ready → Out for delivery → Delivered → Completed`. Any transition writes an audit row. **Cancel** is always available.
4. **Re-send WhatsApp card** link at the top-right — same message the customer originally sent, so the kitchen sees a fresh copy if the first was buried.

### …see the WhatsApp order card the customer sent

Click **Re-send WhatsApp card** on the order detail. The exact original message opens in your own WhatsApp. Every card contains:
```
*New Kitchen's Worth Order KW-XXXXXX*
👤 Name: <customer name>
📞 Phone: <customer phone>
🛍️ Type: Delivery / Pickup
🚚 Zone: <zone>          ← delivery only
📍 Address: <address>    ← delivery only
*Items*
• 2× Jollof Rice — ₦3,000
• 1× Large Foodies Box — ₦18,000
Subtotal: ₦21,000   Bulk discount: -₦2,100   Delivery: ₦2,500
*Total: ₦21,400*
💳 Payment: Bank transfer — proof to follow
```

### …expanding to a new city (Abuja → Lagos / PH / Ibadan playbook)

Zero code required. Steps:

1. `/admin/cities` → Lagos is already there but marked inactive. Click **Activate**.
2. `/admin/zones` → the page groups by city. Under **Lagos**, add: *Island – Lekki/Ajah*, *Island – Ikoyi/VI*, *Mainland – Yaba*, etc., with an **ETA (minutes)** and a **fee (₦)** for each.
3. Wait ~10 seconds. The public `/zones` page and the checkout drawer now show a city selector (because more than one city is active) and the new Lagos zones appear.
4. Prices and tiers are shared across cities. Per-city pricing is a v2 feature (see *Roadmap*).

To pause a city, click **Deactivate** — its zones vanish from the checkout drawer immediately but historical orders keep their zone snapshot.

---

## Do-not-touch list

Please don't do any of these without calling the dev team first:

- ✋ Editing or deleting anything in `supabase/migrations/` — those files are the source of truth for the DB and can't be re-run once applied.
- ✋ Rotating the Supabase **service-role key** without pasting the new value into Vercel env vars — the Monnify webhook will start 500ing within seconds.
- ✋ Changing the Vercel env var names (e.g. renaming `MONNIFY_SECRET_KEY`). Every reference in `lib/monnify.ts` and `lib/supabase/admin.ts` breaks.
- ✋ Changing the Monnify **webhook URL** in the Monnify dashboard — must remain `https://<your-domain>/api/monnify/webhook` or payments won't reflect in the admin.
- ✋ Deleting the `site_settings` row where `id = 1` — it's the only row that holds the WhatsApp number and dock config.

---

## Manual admin smoke checklist (run this once a week)

- [ ] Sign out, sign back in via magic link.
- [ ] Add a test item, view it on the public menu, delete it.
- [ ] Fire a test order end-to-end (Manual Bank), confirm it appears in `/admin/orders` and the WhatsApp card opens.
- [ ] Confirm the `/track` page finds that order by phone *and* by order code.
- [ ] Check `/admin/payments` — the enabled providers match reality.
- [ ] Read `/admin/settings` WhatsApp number and bank details — still correct?

---

## Contacting the dev team

- **Bugs / urgent site down** — reply on the WhatsApp thread you've been using, or email the team lead. Include the order code and a screenshot if it's an order issue.
- **Feature requests** — add to the shared Notion board; we batch them into releases.
- **Credential rotation** — always do this with the dev team on the call.

---

## Where things live

- Code repository: private GitHub (access via the dev team)
- Staging: `https://kitchensworth-ng.vercel.app`
- Production: `TBD` (client will supply domain)
- Supabase project: `kitchensworth` (`supabase.com/dashboard`)
- Vercel project: `kitchensworth-ng`
- Monnify dashboard: `merchant.monnify.com`

Deeper documentation is in `docs/` inside the repository — see `README.md` for the index.
