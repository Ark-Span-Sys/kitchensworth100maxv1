# Checkout flow

The customer-facing path from "add to cart" to "your order is in the kitchen's WhatsApp inbox."

## Overview

```
[browse menu] ──► [+ add to cart] ──► [dock badge +1] ──► [tap Cart / drawer opens]
                                                                   │
                        ┌───────────────────────────────────────────┘
                        ▼
              [order type: pickup / delivery]
              [line items + qty steppers]
              [upsell chips: top 3 best sellers]
              [city selector if >1 active]
              [zone card if delivery]
              [name / phone / address]
              [bulk-discount banner if qty ≥ 6]
              [payment panel: Monnify Card / Transfer / Manual Bank]
              [totals: subtotal, delivery, discount, VAT-included note, TOTAL]
                        │
                        ▼
                  [Place order]
                        │
        ┌───────────────┼────────────────────┐
        ▼               ▼                    ▼
   Manual Bank     Monnify Card        Monnify Transfer
   POST /api/      POST /api/          POST /api/
   orders          monnify/            monnify/
                   initialize          initialize
        │               │                    │
        ▼               ▼                    ▼
   row saved       row saved as         row saved as
   status =        'pending' +          'pending' +
   'awaiting_      monnify_reference    monnify_reference
   payment'              │                    │
        │                ▼                    ▼
        │         redirect to          Monnify shows virtual
        │         Monnify hosted       account, customer
        │         checkout page        transfers in
        │                │                    │
        │                ▼                    ▼
        │         Monnify calls /api/monnify/webhook (Bepin-Signature)
        │                │
        │                ▼
        │         verify HMAC, order → 'paid', whatsapp_sent_at stays NULL
        │                │
        │                ▼
        │         redirect back to /track?new=KW-XXXXXX
        │                │
        ▼                ▼
   [WhatsApp auto-fires] (both paths converge here)
        │
        ▼
   window.open('https://wa.me/2347030606021?text=<order card>')
        │
        ▼
   If popup blocked:
     <button>Open WhatsApp</button>  ← same href, user clicks
        │
        ▼
   [Confirmation panel]
     • Order code + Copy
     • "Open WhatsApp" retry link
     • "Track My Order" button → /track
```

## Cart drawer sections (in order)

1. **Order-type toggle** — Pickup / Delivery. Persisted per-session; defaults to Delivery when there are active zones.
2. **Line items** — thumbnail, name, qty stepper, line total, remove. Each row reads from `CartProvider.lines`.
3. **Upsell chips** — top-3 best sellers *not already in the cart*. Tap to add.
4. **City selector** — only rendered when more than one city has `is_active = true`.
5. **Zone cards** — for the chosen city. Each shows `name · area_label · eta_minutes min · ₦fee_ngn`. Selecting sets `deliveryFee`.
6. **Customer fields** — Name (required), Phone (required), Address (required if delivery), Optional order note.
7. **Bulk-discount banner** — appears when *any* single line hits a `bulk_tiers.min_qty`. Shows the tier, the discount, and the effective unit price.
8. **Payment panel** — radio cards for every enabled provider in `payment_providers` order. At least one is required.
9. **Totals** — subtotal, delivery fee, discount, VAT-included note, TOTAL.
10. **Place order** — disabled while the submit is in-flight; becomes a spinner.

## The WhatsApp order card

Built by `buildOrderMessage` in `lib/whatsapp.ts`. Uses WhatsApp's `*bold*` for the header and total so the kitchen's inbox scans quickly.

```
*New Kitchen's Worth Order KW-XXXXXX*
👤 Name: <name>
📞 Phone: <phone>
🛍️ Type: Delivery
🚚 Zone: <zone name>
📍 Address: <address>
*Items*
• 2× Jollof Rice — ₦3,000
• 1× Large Foodies Box (+Extra chicken) — ₦18,000
Subtotal: ₦21,000   Bulk discount: -₦2,100   Delivery: ₦2,500
*Total: ₦21,400*
💳 Payment: Monnify PAID ref=MHX-…-1728… | Bank transfer — proof to follow
```

The link is `https://wa.me/2347030606021?text=<urlencoded card>`. The phone number comes from `site_settings.whatsapp_number` — no `+`, no spaces (normalised by `normaliseNumber`).

## Screenshot placeholder

![Checkout drawer](./assets/checkout-drawer.png)
*(Screenshot to be added after staging is up.)*

## Popup-blocked fallback

`window.open` returns `null` when the browser blocks it. The drawer detects this and swaps the "Order placed" panel to include a full-width green **Open WhatsApp** button with the same href. The order row is already written, so nothing is lost — the customer just needs one more tap.

## Idempotency

- Manual Bank: `POST /api/orders` requires `order_number` (client-generated). If the client retries the same number, the server returns the existing row.
- Monnify webhook: keyed off `monnify_reference`; a replayed webhook is a no-op because the order is already `paid`.

## Cancellation

Customers can't cancel from the site — they WhatsApp the kitchen, and the admin clicks **Cancel** in `/admin/orders/[id]`. The status transition is written to `order_status_events` with `changed_by = <admin email>` and a note ("Customer called, wrong address").
