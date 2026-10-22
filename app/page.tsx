import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DishCard } from "@/components/site/DishCard";
import { Reveal } from "@/components/site/Reveal";
import type { Category } from "@/lib/types";
import { brand } from "@/lib/brand";
import { formatNgn } from "@/lib/pricing";

/**
 * Home page — hero, category browse cards, popular dishes, build-your-own
 * list, trust stats, party packs, delivery callout and a closing CTA band.
 *
 * Visual language follows the Presikitchen benchmark (soft-green browse band,
 * big rounded photo cards with arrows, bordered list cards, dark bulk band,
 * solid-green closer) with Kitchen's Worth copy and brand tokens. Sections
 * ease into view on scroll via <Reveal>.
 */
export const revalidate = 60;

/** Small right-arrow used next to card/row labels, like the benchmark. */
function ArrowLink({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** Green uppercase eyebrow above section headings. */
function Eyebrow({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-[0.14em] ${
        light ? "text-white/70" : "text-brand-green-dark"
      }`}
    >
      {children}
    </p>
  );
}

function CategoryCard({
  cat,
  count,
  priority,
}: {
  cat: Category;
  count: number;
  priority?: boolean;
}) {
  return (
    <Link href={`/menu#${cat.slug}`} className="group block">
      <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-brand-black/5">
        {cat.image_url ? (
          <Image
            src={cat.image_url}
            alt=""
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-5xl font-black text-brand-black/15">
            {cat.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 px-0.5 pt-3">
        <div>
          <h3 className="font-display text-lg font-bold tracking-tight sm:text-xl">{cat.name}</h3>
          <p className="muted mt-0.5 text-sm">
            {count} {count === 1 ? "choice" : "choices"}
          </p>
        </div>
        <ArrowLink className="text-brand-black" />
      </div>
    </Link>
  );
}

/** Rows on the "assemble your own" card, keyed to real menu category slugs. */
const BUILD_ROWS = [
  {
    slug: "rice",
    title: "Build a plate",
    blurb: "Mix jollof, fried or white rice with the protein you want.",
    href: "/menu#rice",
  },
  {
    slug: "swallow",
    title: "Swallow and soup",
    blurb: "Pounded yam, eba, fufu or semo, paired with your favourite soup.",
    href: "/menu#swallow",
  },
  {
    slug: "smallchops",
    title: "Small chops spread",
    blurb: "Suya, spring rolls, samosas and puff-puff for the table.",
    href: "/menu#smallchops",
  },
  {
    slug: "party-packs",
    title: "Party pack for the room",
    blurb: "Fixed-price packs that feed 10 to 50, drinks included.",
    href: "/party-packs",
  },
] as const;

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: categoriesRaw },
    { data: bestSellersRaw },
    { data: packsRaw },
    { data: citiesRaw },
    { data: countsRaw },
    { data: rowImagesRaw },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id,slug,name,description,sort_order,image_url,is_active")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("id,slug,name,description,price_ngn,image_url,is_best_seller,is_signature,is_spicy,is_vegan")
      .eq("is_active", true)
      .eq("is_best_seller", true)
      .order("sort_order")
      .limit(8),
    supabase
      .from("party_packs")
      .select("id,slug,name,serves_min,serves_max,price_ngn,contents,image_url,is_active")
      .eq("is_active", true)
      .limit(3),
    supabase.from("cities").select("id,slug,name,state,is_active").eq("is_active", true),
    // Per-category dish counts for the "N choices" labels.
    supabase.from("menu_items").select("category_id").eq("is_active", true),
    // A representative image per category for the build rows; ordered by
    // category so every category gets a deterministic first pick.
    supabase
      .from("menu_items")
      .select("category_id,name,image_url")
      .eq("is_active", true)
      .not("image_url", "is", null)
      .order("category_id")
      .order("sort_order"),
  ]);

  const categories = categoriesRaw ?? [];
  const bestSellers = bestSellersRaw ?? [];
  const packs = packsRaw ?? [];
  const cities = citiesRaw ?? [];

  const countByCat = new Map<string, number>();
  for (const r of countsRaw ?? []) {
    countByCat.set(r.category_id, (countByCat.get(r.category_id) ?? 0) + 1);
  }

  const catByName = new Map(categories.map((c) => [c.slug, c]));
  const imageByCatId = new Map<string, string>();
  for (const r of rowImagesRaw ?? []) {
    if (!imageByCatId.has(r.category_id)) imageByCatId.set(r.category_id, r.image_url as string);
  }

  // Round photo per build row: menu categories resolve through their slug;
  // the party-pack row has no menu category, so use the first pack with an
  // image. Falls back to the category tile image, then the letter avatar.
  const packImage = packs.find((p) => p.image_url)?.image_url ?? null;
  const rowImage = (slug: string): string | null => {
    if (slug === "party-packs") return packImage;
    const cat = catByName.get(slug);
    if (!cat) return null;
    return imageByCatId.get(cat.id) ?? cat.image_url;
  };

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-brand-black text-white">
        {/* Mouth-watering dish faded into the black backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=1600&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
            className="h-full w-full object-cover object-center opacity-60 [mask-image:radial-gradient(120%_95%_at_78%_40%,#000_30%,transparent_75%)]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/20 to-brand-black/40" />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <div className="max-w-xl">
            <span className="chip mb-5 bg-brand-green/20 text-brand-green">
              {brand.city.copy}
            </span>
            <h1 className="heading-xl text-white">
              Nigerian flavours, <span className="text-brand-yellow">honest prices</span>, delivered fast.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/70">
              {brand.tagline} Burgers, chicken, shawarma, small chops, party packs and full catering,
              cooked fresh in Abuja and delivered to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu#explore" className="btn-green">
                Browse menu
              </Link>
              <Link href="/party-packs" className="btn-secondary border-white/30 bg-transparent text-white hover:border-white">
                Party packs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category browse — soft-green band with big photo cards */}
      <Reveal as="section" className="bg-brand-green/10">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <Eyebrow>Whatever you are craving</Eyebrow>
          <h2 className="heading-xl mt-3">Order it your way</h2>
          <Link
            href="/menu#explore"
            className="group mt-4 inline-flex items-center gap-2 font-display text-lg font-bold text-brand-green-dark hover:text-brand-black"
          >
            See everything
            <ArrowLink />
          </Link>

          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
            {categories.map((c, i) => (
              <CategoryCard key={c.id} cat={c} count={countByCat.get(c.id) ?? 0} priority={i < 4} />
            ))}
          </div>
        </div>
      </Reveal>

      {/* Popular dishes */}
      <Reveal as="section">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <Eyebrow>Straight off the pass</Eyebrow>
          <h2 className="heading-xl mt-3">Ordered again and again</h2>
          <Link
            href="/menu#explore"
            className="group mt-4 inline-flex items-center gap-2 font-display text-lg font-bold text-brand-green-dark hover:text-brand-black"
          >
            View the full menu
            <ArrowLink />
          </Link>

          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((it) => (
              <DishCard key={it.id} item={it} />
            ))}
          </div>
        </div>
      </Reveal>

      {/* Build-your-own — bordered card with a photo inset and arrow rows */}
      <Reveal as="section">
        <div className="mx-auto max-w-6xl px-4 pb-14 md:pb-16">
          <div className="relative overflow-hidden rounded-3xl border border-brand-black/10 bg-white">
            <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <Eyebrow>Made the way you like it</Eyebrow>
                <h2 className="heading-lg mt-3 max-w-md">Assemble the meal in your head, dish by dish.</h2>
                <p className="muted mt-4 max-w-md leading-relaxed">
                  Pick a base, add proteins and sides, or put together a generous party spread. Your
                  total updates as you go.
                </p>

                <div className="mt-8">
                  {BUILD_ROWS.map((row, i) => {
                    const img = rowImage(row.slug);
                    return (
                      <Link
                        key={row.href}
                        href={row.href}
                        className={`group flex items-center gap-4 py-5 ${
                          i > 0 ? "border-t border-brand-black/8" : ""
                        }`}
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-cream sm:h-[72px] sm:w-[72px]">
                          {img ? (
                            <Image src={img} alt="" fill sizes="72px" className="object-cover transition duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="flex h-full items-center justify-center font-display text-xl font-black text-brand-black/25">
                              {row.title.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg font-bold tracking-tight">{row.title}</h3>
                          <p className="muted mt-0.5 text-sm">{row.blurb}</p>
                        </div>
                        <ArrowLink className="text-brand-green-dark" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="relative hidden min-h-[420px] overflow-hidden rounded-2xl bg-brand-cream lg:block">
                <Image
                  src="https://images.unsplash.com/photo-1604329760661-e71dc3448ba4?auto=format&fit=crop&w=1200&q=80"
                  alt="A fresh pot of jollof rice being served"
                  fill
                  sizes="46vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Trust stats */}
      <Reveal as="section" className="border-y border-brand-black/5 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4">
          {[
            { label: "Orders delivered", value: "12,400+" },
            { label: "Avg. delivery time", value: "42 min" },
            { label: "Districts covered", value: "6 zones" },
            { label: "Bulk discount", value: "Up to 46%" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display text-2xl font-black text-brand-black md:text-3xl">{s.value}</div>
              <div className="muted mt-1 text-xs uppercase tracking-wider md:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Party packs band — dark, like the bulk-size section on the benchmark */}
      <Reveal as="section" className="bg-brand-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow light>For gatherings and celebrations</Eyebrow>
              <h2 className="heading-xl mt-3 max-w-2xl text-white">More guests. Same home-cooked care.</h2>
              <p className="mt-4 max-w-xl text-white/60">
                Compare 2L packs, half coolers and full coolers side by side, or ask us to plan the
                whole spread for you.
              </p>
            </div>
            <Link
              href="/party-packs"
              className="group mt-4 hidden shrink-0 items-center gap-2 rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-brand-black transition hover:bg-white md:inline-flex"
            >
              Browse all packs
              <ArrowLink />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {packs.map((p) => (
              <Link
                key={p.id}
                href="/party-packs"
                className="group flex flex-col overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:ring-white/25"
              >
                <div className="relative aspect-video overflow-hidden bg-white/5">
                  {p.image_url ? (
                    <Image src={p.image_url} alt={p.name} fill sizes="33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-white/20">🎉</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-lg font-bold tracking-tight text-white">{p.name}</h3>
                  <p className="muted mt-1 text-sm text-white/55">
                    Serves {p.serves_min} to {p.serves_max}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="font-display text-lg font-bold text-brand-green">{formatNgn(p.price_ngn)}</span>
                    <ArrowLink className="text-white/70 group-hover:text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/party-packs"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-brand-black transition hover:bg-white md:hidden"
          >
            Browse all packs
            <ArrowLink />
          </Link>
        </div>
      </Reveal>

      {/* Delivery callout */}
      <Reveal as="section" className="bg-brand-green/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="heading-lg">Now delivering in {cities.map((c) => c.name).join(", ") || "Abuja"}</h2>
            <p className="muted mt-2">
              {brand.city.copy}. Choose your zone at checkout. Fees from ₦2,500, ETA 30 to 70 min.
            </p>
          </div>
          <Link href="/zones" className="btn-green group shrink-0">
            See delivery zones
            <ArrowLink />
          </Link>
        </div>
      </Reveal>

      {/* Closing CTA band */}
      <Reveal as="section" className="bg-brand-green-dark text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-20">
          <Eyebrow light>Cooked to order in Abuja</Eyebrow>
          <h2 className="heading-xl mt-4 text-white">Bring home the food everyone gathers around.</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Order tonight, plan a celebration, or find out what Kitchen&apos;s Worth is cooking.
          </p>
          <Link
            href="/menu#explore"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-brand-cream px-8 py-4 font-display text-base font-bold text-brand-green-dark transition hover:bg-white"
          >
            Start your order
            <ArrowLink />
          </Link>
        </div>
      </Reveal>
    </>
  );
}
