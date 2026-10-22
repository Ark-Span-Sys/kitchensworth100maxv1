import { redirect } from "next/navigation";
import Link from "next/link";
import { Gift, Users, CheckCircle2 } from "lucide-react";
import { getAccountData } from "@/lib/account";
import { formatNgn } from "@/lib/pricing";
import { ReferralLinkBox } from "@/components/site/ReferralLinkBox";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Refer & earn",
  description:
    "Share your Kitchen's Worth link. Friends get credit on their first order, and you earn too.",
  robots: { index: false, follow: false },
};

const STEPS = [
  { icon: Gift, title: "Share your link", text: "Send it to friends via WhatsApp, SMS or anywhere." },
  { icon: Users, title: "They order", text: "When a friend signs up and places their first paid order…" },
  { icon: CheckCircle2, title: "You both earn", text: "They get ₦1,000 and you get ₦1,500 in credit." },
];

export default async function ReferPage() {
  const data = await getAccountData();
  if (!data) redirect("/login?next=%2Frefer");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-green-dark">
          Refer &amp; earn
        </p>
        <h1 className="heading-lg mt-1">Give credit, get credit</h1>
        <p className="muted mx-auto mt-3 max-w-xl text-base">
          Share your link and earn Kitchen&apos;s Worth credit every time a friend places their first
          order. Credit is applied straight at checkout.
        </p>
      </header>

      <div className="mb-6 rounded-2xl bg-brand-green/15 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-green-dark">
              Your balance
            </p>
            <p className="font-display text-3xl font-black">{formatNgn(data.creditBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-green-dark">Invited</p>
            <p className="font-display text-3xl font-black">
              {data.referrals.length}
              <span className="ml-1 text-base font-medium text-brand-black/50">
                ({data.rewarded} rewarded)
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ReferralLinkBox link={data.referralLink} />
        </div>
      </div>

      <ol className="mb-8 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s, idx) => (
          <li key={s.title} className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-green/20 text-sm font-black text-brand-green-dark">
                {idx + 1}
              </span>
              <s.icon size={18} className="text-brand-green-dark" />
            </div>
            <p className="font-semibold">{s.title}</p>
            <p className="muted mt-1 text-sm">{s.text}</p>
          </li>
        ))}
      </ol>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Your invitations</h2>
          <Link href="/account" className="text-sm font-semibold text-brand-green-dark hover:underline">
            View account →
          </Link>
        </div>
        {data.referrals.length === 0 ? (
          <p className="muted text-sm">
            No referrals yet. Share your link above — you&apos;ll earn credit as soon as a friend
            places their first paid order.
          </p>
        ) : (
          <ul className="divide-y divide-brand-black/5 text-sm">
            {data.referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <span className="muted text-xs">
                  {new Date(r.created_at).toLocaleDateString("en-NG")}
                </span>
                <Badge tone={r.status === "rewarded" ? "green" : "outline"}>
                  {r.status === "rewarded" ? "Rewarded" : "Waiting for first order"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
