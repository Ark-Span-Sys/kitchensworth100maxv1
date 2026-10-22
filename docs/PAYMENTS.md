# Payments

How money moves through Kitchen's Worth, and how to configure each provider.

## The three providers

| Key | Label | How it works | Cost | When it's the right choice |
| --- | --- | --- | --- | --- |
| `monnify_card` | Card (via Monnify) | Redirect to Monnify's hosted page, card or USSD, webhook fires on success | ~1.5% + ₦100 per txn | Instant confirmation, best for first-time customers |
| `monnify_transfer` | Bank transfer (via Monnify) | Monnify generates a virtual account + reference; customer transfers in; webhook fires on reconciliation | ~1% capped | Customers who prefer their banking app |
| `manual_bank` | Direct bank transfer | We show *our* bank details in the drawer; customer transfers; ticks "I have paid"; WhatsApp fires immediately | Free | Zero integration cost, works during a Monnify outage |

All three are visible in `/admin/payments` as three big toggle switches. Toggling one off hides it from the drawer within ~10 s (path revalidation). **At least one must be enabled** or customers cannot check out.

## Monnify setup (one-off, 15 min)

### 1. Get credentials

1. Sign in to `https://merchant.monnify.com`.
2. Complete KYC (CAC docs, bank account, board resolution).
3. Settings → API keys. Copy:
   - **Contract Code** — `MK_…`
   - **Consumer API Key (secret)** — long hex string
   - **Public Key** — starts with `MK_PUBLIC`
   - **Webhook auth hash** — set one, store it in a password manager

### 2. Paste into Vercel

Project → Settings → Environment Variables. Production, Preview and Development:

```
MONNIFY_CONTRACT_CODE=<your contract code>
MONNIFY_SECRET_KEY=<your secret key>              # server-only
NEXT_PUBLIC_MONNIFY_PUBLIC_KEY=<your public key>  # safe in browser
MONNIFY_WEBHOOK_AUTH_HASH=<your hash>             # server-only
MONNIFY_BASE_URL=https://api.monnify.com
```

For local dev the same names go in `.env.local`. **Never** commit.

### 3. Register the webhook

Monnify dashboard → Settings → Webhooks → add:

- **URL**: `https://<your-domain>/api/monnify/webhook`
- **Secret / auth hash**: the same value as `MONNIFY_WEBHOOK_AUTH_HASH`
- **Events**: `SUCCESS` (payment completed) — we don't need failure events because the customer just retries

### 4. Test with the sandbox

Sandbox base URL is `https://testapi.monnify.com/`. Set `MONNIFY_BASE_URL` accordingly and use the sandbox contract code. Test card: `5060 6666 6666 6666`, any future expiry, OTP `123456`.

## Webhook contract

**Endpoint**: `POST /api/monnify/webhook`

**Headers**:
- `Content-Type: application/json`
- `Bepin-Signature: <hex HMAC-SHA512>` — Monnify signs the raw body with the webhook auth hash.

**Body (relevant fields)**:
```json
{
  "event_type": "SUCCESS",
  "transaction_status": "PAID",
  "payment_reference": "KW-ABC123",
  "payment_intent_code": "MHX-…",
  "paid_on": "2026-10-21T12:34:56.000Z",
  "amount": 8800
}
```

**Our handling** (`app/api/monnify/webhook/route.ts`):

1. Read the raw body as text — do NOT parse it first (HMAC requires the exact bytes).
2. `verifyWebhookSignature(raw, sig)`. Fail → HTTP 401.
3. Parse JSON. If `!isPaidEvent(payload)`, respond 200 (no-op).
4. Look up `orders where monnify_reference = payment_reference`.
5. If not found, respond 200 (Monnify retries don't hit us with unknown refs, but idempotency matters).
6. If already `paid`, respond 200 (replay safe).
7. Update to `paid`, write an `order_status_events` row with `changed_by = 'monnify'`.
8. Respond 200.

## Manual bank setup

1. `/admin/payments` → bottom card.
2. Fill **Bank name**, **Account name**, **Account number** (10 digits).
3. Save.
4. Ensure the `manual_bank` provider toggle is on.

**Public exposure**: bank fields are *never* returned by a plain `SELECT * FROM site_settings`. The `/api/orders` route and the checkout drawer call the `view_bank()` Postgres RPC, which returns them only when `manual_bank` is enabled and only when the request has a valid anon key.

## Refunds

Kitchen's Worth doesn't take card payments directly — Monnify handles refunds on their side.

1. Admin opens the order in `/admin/orders/[id]`.
2. Copies the `monnify_reference`.
3. Logs into `merchant.monnify.com` → Transactions → search reference → **Refund**.
4. Back in the admin, click **Cancelled**, add an audit note "Refunded via Monnify dashboard".

Manual-bank refunds are done out-of-band (mobile banking app). Same audit note applies.

## Reconciliation

For each day's close, cross-check:

- `/admin/orders?date=today&status=paid` → sum of `total_ngn` where `payment_provider = 'monnify_card'`.
- Monnify dashboard → Transactions → today → sum of settled.
- These two should match within one Monnify settlement cycle (T+1 on weekdays).

Manual-bank orders remain `awaiting_payment` until the admin manually marks them `paid` after verifying the transfer in their bank app.

## Failure modes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Card payment succeeds on Monnify but the order stays `pending` in the admin | Webhook URL wrong, or `MONNIFY_WEBHOOK_AUTH_HASH` differs between Monnify dashboard and Vercel | Verify both; redeploy |
| 401 in the webhook log | Signature mismatch — body was parsed and re-stringified before HMAC | Ensure the route reads raw body via `await req.text()` before `JSON.parse` |
| Drawer shows no payment options | All three providers are toggled off | Turn at least one on in `/admin/payments` |
| Bank account shows as "—" in the drawer | `manual_bank` enabled but bank fields empty | Fill them in `/admin/payments` |
