import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatNgn } from "@/lib/pricing";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export const metadata: Metadata = {
  title: "Party Packs",
  description:
    "Kitchen's Worth party packs: ready-made trays serving 10 to 50 guests. Jollof, fried rice, protein, small chops, drinks. Bulk pricing for parties, weddings and office events in Abuja.",
};

export const revalidate = 60;

/**
 * /party-packs — one-tap packs for events. Each pack is a "kind: party_pack"
 * cart line so the checkout flow works identically to menu items.
 */
export default async function PartyPacksPage() {
  const supabase = await createClient();
  const { data: packs } = await supabase
    .from("party_packs")
    .select("id,slug,name,serves_min,serves_max,price_ngn,contents,image_url,is_active")
    .eq("is_active", true)
    .order("price_ngn");

  const list = packs ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-10">
        <span className="chip mb-3 bg-brand-yellow/40">Feeds 10 to 50 guests</span>
        <h1 className="heading-xl">Party packs that do the maths for you</h1>
        <p className="muted mt-3 max-w-2xl">
          Pre-combined trays of jollof, fried rice, swallows, grilled chicken, small chops and drinks.
          One flat price, VAT-inclusive, delivered in Abuja. Add-ons and swaps available on request via WhatsApp.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {list.map((p) => (
          <article key={p.id} className="card flex flex-col overflow-hidden">
            <div className="relative aspect-video overflow-hidden bg-brand-black/5">
              {p.image_url ? (
                <Image src={p.image_url} alt={p.name} fill sizes="33vw" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl">🎉</div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <h2 className="heading-md">{p.name}</h2>
              <p className="muted text-sm">Serves {p.serves_min} to {p.serves_max} guests</p>
              {p.contents && p.contents.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {p.contents.map((c: string) => (
                    <li key={c} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="font-display text-2xl font-black">{formatNgn(p.price_ngn)}</span>
                <AddToCartButton
                  kind="party_pack"
                  id={p.id}
                  name={p.name}
                  priceNgn={p.price_ngn}
                  imageUrl={p.image_url}
                  label="Add pack"
                  size="md"
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-16 rounded-3xl bg-brand-black p-8 text-white md:p-12">
        <div className="max-w-2xl">
          <h2 className="heading-lg text-white">Planning something bigger?</h2>
          <p className="mt-2 text-white/70">
            Weddings, conferences, outdoor events with 100+ guests: our catering team builds a custom quote
            per head count. Live buffet stations, plated service, or drop-and-go trays.
          </p>
          <a href="/catering" className="btn-green mt-6 inline-flex">
            Request catering &rarr;
          </a>
        </div>
      </section>
    </div>
  );
}
