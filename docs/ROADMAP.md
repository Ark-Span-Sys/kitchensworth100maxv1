# Roadmap

What's next. Ordered by how much the client has hinted at wanting it, and how much it's likely to earn back.

## v1.1 — small polish, high leverage

| Item | Why | Rough size |
| --- | --- | --- |
| **Order cancel from `/track`** | Currently customers WhatsApp to cancel. A button saves 20+ min/day of back-and-forth for the kitchen. | 1 day |
| **Password + WebAuthn admin sign-in** | Magic-link is fine but slow for the client on a hot kitchen tablet. Add a passkey. | 2 days |
| **Analytics: Plausible** | Right now we can't see conversion rate or top drop-off step. Plausible is 1 script tag, no cookie banner. | 1 day |
| **Order-not-found empty state on `/track`** | Currently just says "no orders found." Should offer "WhatsApp us instead" and "Browse the menu." | 0.5 day |
| **Zone fee per city, not global** | Once Lagos goes live, fees and tiers should differ from Abuja. Right now `zones.fee_ngn` is per-zone so it works, but bulk tiers are global. | 2 days |

## v2 — new capability

| Item | Why | Rough size |
| --- | --- | --- |
| **City-by-city delivery rollout playbook** | Launch Lagos → PH → Ibadan cleanly. Requires: per-city pricing, per-city categories (e.g. seafood in PH), per-city opening hours. | 1–2 weeks |
| **Live rider tracking** | Even a simple "your rider has left the kitchen" timestamp per status change would cut "where is my order?" WhatsApps by ~70%. Full map integration is later. | 3 days |
| **WhatsApp Business Cloud API** | Right now we hand off to the customer's WhatsApp. The reverse — us messaging them on status change — requires Meta-approved templates + Cloud API integration. | 1 week |
| **Paystack fallback** | Second payment processor so we have redundancy if Monnify has a bad day. Provider toggle already supports N providers; just add Paystack adapter. | 3 days |
| **Loyalty / stamps** | "Buy 10 jollofs, get 1 free." Digital stamp card on `/track`. Client has asked about this twice. | 1 week |
| **Creator club** | Rahmies has one. A page with an application form + admin approval flow + a special pricing tier. | 1 week |
| **Referral link** | Deep link with `?ref=KW-ABC123`. Give the referrer ₦500 credit on their next order, referee ₦500 off first order. Ledger table needed. | 1 week |
| **Multi-language (Hausa, Yoruba, Igbo)** | Public site English-only today. i18n routing under `/[lang]/…`. Copy needs translation. | 1–2 weeks |
| **Reviews / ratings on menu items** | Post-delivery WhatsApp template invites a rating. Displayed on the item page. | 1 week |

## v3 — bigger swings

- **Kitchen display screen** — wall-mounted order board that filters to `confirmed` + `preparing`, tick to advance status. Simple Next page + polling.
- **Delivery-partner integration** (Kwik, Gokada, Uber Eats) so orders dispatch to riders automatically instead of the kitchen WhatsApp group.
- **Party-pack "build your own"** — currently the `/build` page is a limited picker. Full custom pack builder with per-slot choices and dynamic pricing.
- **Reorder from WhatsApp** — customer replies `REORDER KW-ABC123` to the business number; a webhook creates a duplicate order. Needs the WhatsApp Cloud API first.
- **Inventory + supplier POs** — track protein/rice/veg stock, auto-generate weekly supplier orders. Whole new admin section.
- **Native iOS + Android wrapper** (Capacitor) — the client will ask when order volume justifies push notifications for status changes.

## Not on the roadmap (rejected)

- **Crypto payments** — compliance + volatility + no real customer demand.
- **In-house delivery fleet** — partner riders are strictly better for our volume.
- **Subscriptions** (weekly jollof box) — the operational complexity of recurring fulfilment outweighs the revenue predictability for a QSR.
- **Full headless-CMS migration** (Sanity/Contentful for menu) — Supabase + admin dashboard already gives the client what they need with lower latency and no third-party CMS bill.

## How we prioritise

Every quarter the client + dev team pick 3–5 items from this file for the next milestone. Items move up or down based on:

1. **Customer pain** — WhatsApp threads where the same complaint appears 3+ times in a week.
2. **Revenue impact** — anything that unblocks a new city or lifts conversion.
3. **Operational drag** — anything the kitchen spends > 30 min/day doing manually.
4. **Risk** — payment-provider redundancy, admin auth, backup/restore tooling.

If you (the client) want something not on this list, ping the dev team; we'll add it, discuss scope, and slot it if it beats the current candidates on the four axes.
