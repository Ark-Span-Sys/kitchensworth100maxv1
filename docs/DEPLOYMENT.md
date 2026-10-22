# Deployment

From `git push` to a live `kitchensworth-ng` on Vercel.

## Prerequisites

- A GitHub repository containing this codebase.
- A Supabase project (hosted at `supabase.com` or a self-hosted instance).
- A Monnify merchant account with approved KYC (see `docs/PAYMENTS.md`).
- A Vercel team or personal account.
- (Optional) A custom domain — e.g. `kitchensworth.ng`.

## 1. Supabase — production project

1. Create a project. Region: `eu-west-2` (London) is the closest to Lagos/Abuja. Note the project ref (`abcd1234.supabase.co`).
2. Run every migration in order:
   ```bash
   supabase link --project-ref abcd1234
   pnpm db:migrate          # pushes 001_init.sql → 004_storage.sql
   psql "$DATABASE_URL" -f supabase/migrations/005_seed.sql
   ```
3. Authentication → Providers → Email. Turn **magic link** on; disable password sign-in (the admin only ever uses magic links).
4. Authentication → Site URL: `https://<your-domain>`. Redirect URLs: add `https://<your-domain>/admin/**` and `https://<your-domain>/auth/callback`.
5. Storage: verify the three buckets (`menu-images`, `party-pack-images`, `catering-images`) exist and are public-read.
6. API → copy the **anon key**, the **service_role key**, and the **database connection string**.

## 2. Vercel project

1. Vercel → New Project → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Build command: `pnpm build`. Install: `pnpm install --frozen-lockfile`. Output: default.
3. Project → Settings → Environment Variables — Production, Preview and Development:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (Protect) |
   | `NEXT_PUBLIC_MONNIFY_PUBLIC_KEY` | Monnify public key |
   | `MONNIFY_SECRET_KEY` | Monnify secret key (Protect) |
   | `MONNIFY_CONTRACT_CODE` | contract code |
   | `MONNIFY_WEBHOOK_AUTH_HASH` | webhook auth hash (Protect) |
   | `MONNIFY_BASE_URL` | `https://api.monnify.com` |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | `2347030606021` (or updated) |
   | `ADMIN_EMAIL` | first admin's email |

4. Settings → Domain names → add `kitchensworth-ng.vercel.app` (auto) and, when ready, the custom domain.

## 3. `vercel.json` — already committed

The repo ships a `vercel.json` that:

- pins the build to `pnpm build`
- sets function `maxDuration` for the four API routes that call out (Monnify, uploads)
- adds three security headers to every response (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
- long-caches `/_next/static/*` for a year (immutable)

Nothing to change unless the region needs to move off `iad1`.

## 4. First deploy

1. `git push` to `main`.
2. Vercel auto-builds. Watch the deploy log — first build ~90 s.
3. Visit `https://<preview-url>/`. Home, `/menu`, `/party-packs` should render with seeded data.
4. Visit `/admin/login`, enter the bootstrap admin email, follow the magic link.

## 5. Bootstrap the first admin

If you set `ADMIN_EMAIL` in Vercel env vars, run once from a `psql` session against the production DB:

```sql
insert into profiles (id, full_name, phone, is_admin)
select u.id, 'Kitchen Worth Owner', null, true
from auth.users u
where u.email = lower(current_setting('app.admin_email', true))
on conflict (id) do update set is_admin = true;
```

Or the manual path: Supabase dashboard → Authentication → find the user by email → copy their UUID → Table Editor → `profiles` → insert a row with that UUID and `is_admin = true`.

## 6. Monnify production cutover

1. Once the production URL is stable, log into `merchant.monnify.com` → Settings → Webhooks → **edit** the webhook URL to point at `https://<prod-domain>/api/monnify/webhook`.
2. Rotate `MONNIFY_WEBHOOK_AUTH_HASH` in Vercel if you also change it on the Monnify side. Redeploy to pick it up.
3. Fire a ₦100 test card payment end-to-end:
   - Add any item to the cart, choose Monnify Card, pay.
   - Confirm the order transitions to `paid` in `/admin/orders` within ~10 seconds.
   - Confirm the WhatsApp handoff fires on the redirect back to `/track?new=KW-…`.

## 7. Custom domain

1. Add the domain in Vercel → Settings → Domains.
2. Follow the DNS instructions — usually a `CNAME` to `cname.vercel-dns.com` at your registrar.
3. Wait for propagation, Vercel will issue a Let's Encrypt cert automatically.
4. Update Supabase → Auth → Site URL and Redirect URLs to the new domain.
5. Update Monnify webhook URL.
6. Update `NEXT_PUBLIC_SITE_URL` and redeploy.

## 8. Environment strategy

| Environment | Deploy trigger | Supabase project | Monnify keys | Notes |
| --- | --- | --- | --- | --- |
| Local dev | `pnpm dev` | local `supabase start` or shared dev project | Sandbox | `.env.local` |
| Preview | Every PR branch | Shared dev project | Sandbox | Auto URL `*.vercel.app` |
| Staging | Push to `main` | Shared dev project | Sandbox | `kitchensworth-ng.vercel.app` |
| Production | Tag `v*` or manual promote | Prod project | Live | Custom domain |

## 9. Post-deploy checklist

- [ ] Home page renders.
- [ ] `/menu` shows the seeded categories and items.
- [ ] Adding to cart increments the dock badge.
- [ ] `/track` opens with the empty state.
- [ ] Firing a full manual-bank test order creates an admin order row + opens WhatsApp.
- [ ] Monnify sandbox test card transitions to `paid`.
- [ ] `/admin/*` requires login; a non-admin email gets bounced.
- [ ] Images upload to Supabase Storage successfully.
- [ ] `/sitemap.xml` and `/robots.txt` respond.

## Rollback

Because Supabase migrations are additive and Vercel keeps the last 20 deploys, rollback is:

1. Vercel → Deployments → find the last-known-good → **Promote to Production**. One click.
2. If the DB schema changed incompatibly, apply a forward-fix migration — never `supabase migration repair --status rolled-back`.

## Contact

Dev team handles all of the above for the client. If credentials rotate, ping us to update Vercel.
