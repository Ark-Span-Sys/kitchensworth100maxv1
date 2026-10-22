import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DishCard } from "@/components/site/DishCard";

export const metadata: Metadata = {
  title: "Bulk orders",
  description:
    "Order 6+ of the same Kitchen's Worth item and save automatically. 10% at 6, 20% at 12, 30% at 24, up to 46% at 50+. No coupon codes, discount applies at checkout.",
};

export const revalidate = 60;

/**
 * /bulk — auto-discount tiers + the best value categories for bulk orders.
 * The tier table is loaded from `bulk_tiers` so an admin can retune the
 * discount curve without a deploy.
 */
export default async function BulkPage() {
  const supabase = await createClient();

  const [{ data: tiers }, { data: signature }] = await Promise.all([
    supabase.from("bulk_tiers").select("min_qty,discount_percent").order("min_qty"),
    supabase
      .from("menu_items")
      .select("id,slug,name,description,price_ngn,image_url,is_best_seller,is_signature,is_spicy,is_vegan")
      .eq("is_active", true)
      .or("is_signature.eq.true,is_best_seller.eq.true")
      .limit(12),
  ]);

  const tierList = (tiers ?? []).map((t) => ({
    qty: t.min_qty,
    pct: Number(t.discount_percent),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="heading-xl">Buy more, pay less. Automatically</h1>
        <p className="muted mx-auto mt-3 max-w-2xl">
          Add 6 or more of the same dish to your cart and the discount is applied at checkout. No codes,
          no minimum spend, no cap on how many lines you can discount.
        </p>
      </header>

      <section aria-label="Bulk pricing tiers" className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tierList.map((t, i) => (
          <div
            key={t.qty}
            className={`card flex flex-col items-center gap-1 p-6 text-center ${
              i === tierList.length - 1 ? "ring-2 ring-brand-green" : ""
            }`}
          >
            <div className="muted text-xs font-semibold uppercase tracking-widest">Buy</div>
            <div className="font-display text-4xl font-black">{t.qty}+</div>
            <div className="muted text-xs font-semibold uppercase tracking-widest">Save</div>
            <div className="font-display text-4xl font-black text-brand-green-dark">{t.pct}%</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="heading-lg mb-4">Signature dishes customers order in bulk</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(signature ?? []).map((it) => (
            <DishCard key={it.id} item={it} />
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl bg-brand-yellow/40 p-8 md:p-10">
        <div className="max-w-3xl">
          <h2 className="heading-lg">How the discount is calculated</h2>
          <ul className="mt-4 space-y-3 text-sm md:text-base">
            <li>
              <b>Per line, not per cart.</b> 12 jollof rice + 1 chicken = jollof gets 20% off, chicken stays at
              regular price.
            </li>
            <li>
              <b>Highest applicable tier wins.</b> Buy 24 of the same item and you jump straight to the 30% tier
              (you don't get 10% + 20% + 30%).
            </li>
            <li>
              <b>VAT-inclusive.</b> Prices already include 7.5% VAT; the discount comes off the inclusive amount.
            </li>
            <li>
              <b>Delivery fee is separate.</b> Bulk discount applies to food only.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
