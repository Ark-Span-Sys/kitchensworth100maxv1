import { redirect } from "next/navigation";
import { CreditCard, Gift, Star } from "lucide-react";
import { getAccountData } from "@/lib/account";
import { formatNgn } from "@/lib/pricing";
import { ReferralLinkBox } from "@/components/site/ReferralLinkBox";
import { Badge } from "@/components/ui/Badge";
import { logout } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const data = await getAccountData();
  if (!data) redirect("/login?next=%2Faccount");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-green-dark">
            My account
          </p>
          <h1 className="heading-lg mt-1">{data.fullName ?? "Welcome back"}</h1>
          {data.email && <p className="muted text-sm">{data.email}</p>}
        </div>
        <form action={logout}>
          <button className="btn-secondary px-4 py-2 text-sm">Sign out</button>
        </form>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-brand-green-dark">
            <CreditCard size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wide">Credit balance</h2>
          </div>
          <p className="mt-2 font-display text-3xl font-black">{formatNgn(data.creditBalance)}</p>
          <p className="muted mt-1 text-sm">Applied at checkout on the WhatsApp order path.</p>
          <a href="/refer" className="btn-green mt-4 w-full text-sm">
            Refer &amp; earn
          </a>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-brand-green-dark">
            <Gift size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wide">Referrals</h2>
          </div>
          <p className="mt-2 font-display text-3xl font-black">
            {data.referrals.length}
            <span className="ml-1 text-base font-medium text-brand-black/50">sent</span>
          </p>
          <p className="muted mt-1 text-sm">{data.rewarded} rewarded (friends who ordered)</p>
        </div>
      </div>

      <section className="card mt-4 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <Star size={18} className="text-brand-green-dark" /> Your referral link
        </h2>
        <ReferralLinkBox link={data.referralLink} />
      </section>

      {data.txns.length > 0 && (
        <section className="card mt-4 p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Credit activity</h2>
          <ul className="divide-y divide-brand-black/5 text-sm">
            {data.txns.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{t.reason ?? t.kind}</span>
                  <span className="muted text-xs">{new Date(t.created_at).toLocaleDateString("en-NG")}</span>
                </span>
                <span className={t.amount_ngn >= 0 ? "font-bold text-brand-green-dark" : "font-bold text-red-600"}>
                  {t.amount_ngn >= 0 ? "+" : "-"}
                  {formatNgn(Math.abs(t.amount_ngn))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-4 p-5">
        <h2 className="mb-3 font-display text-lg font-bold">My reviews</h2>
        {data.reviews.length === 0 ? (
          <p className="muted text-sm">
            You haven&apos;t reviewed anything yet. Find a dish you love and rate it from its menu page.
          </p>
        ) : (
          <ul className="divide-y divide-brand-black/5 text-sm">
            {data.reviews.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <span className="font-semibold">{r.menu_items?.name ?? "Dish"}</span>
                  <span className="muted ml-2">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  {r.comment && <p className="muted mt-0.5 line-clamp-2">{r.comment}</p>}
                </div>
                <Badge tone={r.is_approved ? "green" : "outline"}>
                  {r.is_approved ? "Published" : "Pending"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
