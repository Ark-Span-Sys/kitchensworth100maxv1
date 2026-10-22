# Troubleshooting

Real symptoms, real causes, real fixes. Ordered by how often they come up.

## WhatsApp popup is blocked

**Symptom**: customer completes checkout, the "Order placed" panel appears, but WhatsApp doesn't auto-open.

**Cause**: browsers block `window.open` after an async boundary. Because the `/api/orders` fetch is awaited before the popup, iOS Safari and Chrome often block it.

**Fix (already in place)**: the drawer detects `window.open` returning `null` and swaps in a big green **Open WhatsApp** button whose `href` is the exact same deep link. The customer taps it once. Nothing lost.

**If it keeps happening**: the button may be off-screen on very short viewports. Scroll the drawer; the button lives directly under the order-code block.

## Monnify webhook returns 401

**Symptom**: card payment succeeds on Monnify, order row never transitions to `paid`, Vercel logs show 401s on `/api/monnify/webhook`.

**Cause**: HMAC mismatch. Either the auth hash differs between Monnify dashboard and Vercel env var, or the route body has been parsed and re-stringified before verification.

**Fix**:

1. Vercel → Settings → Environment Variables → confirm `MONNIFY_WEBHOOK_AUTH_HASH` exactly matches the value in Monnify → Settings → Webhooks.
2. Redeploy (env vars are baked into functions).
3. Fire a test payment. In Vercel → Observability → Logs, grep the webhook route — the signature failure message includes the first 8 chars of each hash so you can eyeball them.

**Never** log the raw body or the full signature.

## Order stuck in `awaiting_payment`

**Symptom**: admin sees many orders in `awaiting_payment` that are 24+ hours old.

**Cause**: manual-bank path — the customer never WhatsApp'd the receipt, or the receipt arrived and the admin forgot to mark it paid.

**Fix**:

1. `/admin/orders?status=awaiting_payment` — sort by age.
2. For anything > 4 h: click into the order, hit **Re-send WhatsApp card** to remind your own team, or call the customer directly on the phone shown.
3. If the transfer actually landed, click **Confirmed** — this transitions `awaiting_payment → paid → confirmed` and writes an audit row.
4. If it didn't, click **Cancelled** and add a note.

**Prevention**: run the daily reconciliation script (`docs/PAYMENTS.md` § Reconciliation) at close.

## Image upload fails

**Symptom**: "Upload image" in the admin returns a red `403` or `413`.

**Cause**: file over 5 MB, wrong MIME type, or the session isn't admin.

**Fix**:

1. Check the file size and type — we accept `image/jpeg`, `image/png`, `image/webp` up to 5 MB.
2. Compress at squoosh.app if needed; the site displays at max 1200×900.
3. If the file is fine and it's still 403, sign out and back in via `/admin/login` — session token may have expired.
4. Supabase dashboard → Storage → verify the `menu-images` bucket still exists and its policies haven't been edited.

## RLS denies an admin write

**Symptom**: `new Error: "permission denied for table menu_items"` on a server action.

**Cause**: `SUPABASE_SERVICE_ROLE_KEY` is unset, misspelled, or not marked as Protect in Vercel. Server actions use the anon client with the user's session cookie, and RLS on menu_items should still allow admin writes if `profiles.is_admin` is true — but a broken session means the policy check falls through.

**Fix**:

1. Confirm the calling user's `profiles.is_admin` is `true` (Supabase dashboard → Table Editor → `profiles`).
2. Sign out and sign back in via magic link — stale JWTs get rejected.
3. Vercel → Env vars — is `SUPABASE_SERVICE_ROLE_KEY` present in Production? Is `NEXT_PUBLIC_SUPABASE_URL` right?
4. Redeploy.

## Menu page shows an old price after an edit

**Symptom**: admin edits a price, dashboard reflects it, but the public `/menu` still shows the old one.

**Cause**: Vercel's ISR cache for `/menu` hasn't been revalidated yet.

**Fix**:

1. Wait ~10 s — the server action `revalidatePath("/menu")` should propagate.
2. If it doesn't: Vercel → Project → Deployments → current → **More** → **Clear cache**. Then hard-refresh the public page.
3. If the issue is persistent, check the server action ran without error — Vercel logs will show a revalidation failure with the reason.

## Track page finds nothing

**Symptom**: customer enters `KW-ABC123` on `/track`, sees "No orders found".

**Cause**: three possibilities.

1. Typo in the code — `/track` needs exact match; codes are case-sensitive.
2. Order was created but the customer changed their phone number after checkout — the order is still keyed by the original phone.
3. The `/api/track` route is down.

**Fix**:

1. Ask the customer to also try by **phone number** (either local `08012345678` or international `2348012345678`) — `normaliseNumber` handles both.
2. If still nothing, check the order exists in `/admin/orders?search=KW-ABC123`.
3. If it exists there but not on the public track page, verify the RLS policy `select_public_track` is enabled on `orders` (Supabase dashboard → Authentication → Policies).

## Cart badge shows wrong count after a page reload

**Symptom**: user adds 3 items, refreshes, badge shows 3. Closes the browser, opens again — badge shows 0.

**Cause**: expected — cart lives in `localStorage`, which is per-origin and per-browser. It does not sync across devices or browser profiles.

**Not a bug.** If a customer says "I paid, my cart is gone," direct them to `/track?phone=…` — the order row is safe in Postgres.

## Vercel build fails: `Missing Supabase env vars`

**Symptom**: build logs show an error at `middleware.ts` init.

**Cause**: `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` not set in the Vercel build environment.

**Fix**: Vercel → Settings → Env vars — make sure they're ticked for **Production** *and* **Preview** and **Development**. Redeploy.

## Vercel build succeeds but every page is 500

**Cause**: usually `SUPABASE_SERVICE_ROLE_KEY` — the middleware reads it server-side to refresh the session, and a missing/typo'd value crashes every RSC page.

**Fix**: same as above — check env vars and redeploy.

## `pnpm typecheck` fails on `types/database.ts`

**Cause**: schema drifted from the hand-authored types mirror.

**Fix**: run `pnpm gen:types` (needs a linked Supabase project) to regenerate, then commit the diff.

## Something's wrong and this page doesn't help

Ping the dev team on the shared WhatsApp thread with:

1. URL of the affected page
2. Order code if relevant
3. Timestamp (with timezone — usually WAT / Africa/Lagos)
4. Screenshot

We'll triage within 4 business hours.
