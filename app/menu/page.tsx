import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MenuBrowser } from "@/components/site/MenuBrowser";
import { MenuInfoCarousel, type InfoSlide } from "@/components/site/MenuInfoCarousel";
import { formatNgn } from "@/lib/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Full Kitchen's Worth menu: burgers, chicken, shawarma, small chops, soups, rice, swallow, natives, cocktails, desserts and more. Prices VAT-inclusive.",
};

export const revalidate = 60;

/**
 * /menu — full catalogue. Opens with a Presikitchen-style hero band (eyebrow,
 * title, subtitle, build-your-menu link) and a delivery note, then a flat grid
 * filtered by category tabs. Home-page category chips link here with a hash
 * (e.g. /menu#soups) that MenuBrowser uses to preselect the matching tab.
 */
export default async function MenuPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: items }, { data: zones }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,slug,name")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select(
        "id,category_id,slug,name,description,price_ngn,image_url,is_best_seller,is_signature,is_spicy,is_vegan",
      )
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("zones").select("fee_ngn").eq("is_active", true),
  ]);

  const fees = (zones ?? []).map((z) => z.fee_ngn).filter((f) => typeof f === "number");
  const minFee = fees.length ? Math.min(...fees) : null;
  const maxFee = fees.length ? Math.max(...fees) : null;
  const deliverySubtitle =
    minFee != null && maxFee != null
      ? minFee === maxFee
        ? `Flat ${formatNgn(minFee)} across Abuja`
        : `Standard ${formatNgn(minFee)} · Long distance ${formatNgn(maxFee)}`
      : "Delivery across Abuja, fees shown in cart";

  const slides: InfoSlide[] = [
    { key: "refer", icon: "gift", title: "Refer & Earn", badge: "Rewards", subtitle: "Refer a friend, earn credit on their first order", href: "/refer" },
    { key: "delivery", icon: "truck", title: "Abuja Delivery", badge: "Today", subtitle: deliverySubtitle, href: "/zones" },
    { key: "packs", icon: "pack", title: "Party Packs", subtitle: "Feeding a crowd? Browse bulk sizes", href: "/party-packs" },
    { key: "catering", icon: "catering", title: "Catering", subtitle: "Full service for events and weddings", href: "/catering" },
    { key: "whatsapp", icon: "chat", title: "Order on WhatsApp", subtitle: "Add to cart, we confirm on WhatsApp", href: "/contact" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-brand-green-dark">
          Made fresh in Abuja
        </p>
        <h1 className="heading-xl">Our menu</h1>
        <p className="muted mx-auto mt-4 max-w-xl text-base sm:text-lg">
          All prices are in Naira and VAT-inclusive. Comforting classics, signature soups, rice,
          small chops, bakes and generous party packs.
        </p>
        <div className="mt-7 flex justify-center">
          <Link
            href="/build"
            className="inline-flex items-center gap-2 rounded-full bg-brand-green-dark px-7 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-black"
          >
            Build your own menu <span aria-hidden>→</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto mb-12 max-w-3xl">
        <MenuInfoCarousel slides={slides} />
      </div>

      <h2 id="explore" className="heading-lg mb-4 scroll-mt-24">Explore the menu</h2>
      <MenuBrowser categories={categories ?? []} items={items ?? []} />
    </div>
  );
}
