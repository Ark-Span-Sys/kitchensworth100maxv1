import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatNgn } from "@/lib/pricing";
import { Badge } from "@/components/ui/Badge";
import { ReviewForm } from "@/components/site/ReviewForm";
import { ItemDetailClient } from "./item-detail-client";

// The item page reads the viewer's session (to gate the review form), so it
// renders per-request rather than being statically cached.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("menu_items")
    .select("name,description,image_url")
    .eq("slug", slug)
    .single();
  if (!item) return { title: "Item not found" };
  return {
    title: item.name,
    description: item.description ?? `Order ${item.name} from Kitchen's Worth.`,
    openGraph: {
      title: `${item.name} · Kitchen's Worth`,
      description: item.description ?? undefined,
      images: item.image_url ? [item.image_url] : undefined,
    },
  };
}

/**
 * /menu/[slug] — item detail. Shows image, description, ingredients,
 * extras list from `menu_extras`, quantity, add-to-cart.
 */
export default async function ItemPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("menu_items")
    .select(
      "id,category_id,slug,name,description,ingredients,price_ngn,image_url,is_best_seller,is_signature,is_spicy,is_vegan,stock_today,is_active",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!item) notFound();

  const [{ data: extras }, { data: category }, { data: related }, { data: reviews }, { data: userData }] = await Promise.all([
    supabase.from("menu_extras").select("id,item_id,name,price_ngn,is_required").eq("item_id", item.id),
    supabase.from("categories").select("id,slug,name").eq("id", item.category_id).single(),
    supabase
      .from("menu_items")
      .select("id,slug,name,description,price_ngn,image_url,is_best_seller,is_signature,is_spicy,is_vegan")
      .eq("category_id", item.category_id)
      .eq("is_active", true)
      .neq("id", item.id)
      .limit(4),
    supabase
      .from("reviews")
      .select("id,rating,comment,created_at,profiles(full_name)")
      .eq("item_id", item.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const user = userData?.user ?? null;
  const reviewRows = (reviews ?? []) as unknown as {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    profiles: { full_name: string | null } | null;
  }[];
  const reviewCount = reviewRows.length;
  const avgRating = reviewCount ? reviewRows.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: item.name,
    description: item.description ?? undefined,
    image: item.image_url ?? undefined,
    offers: {
      "@type": "Offer",
      price: item.price_ngn,
      priceCurrency: "NGN",
      availability: item.stock_today === null || item.stock_today > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    audio: undefined,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="muted mb-6 text-sm">
        <Link href="/menu">Menu</Link>
        {category && (
          <>
            {" / "}
            <Link href={`/menu#${category.slug}`}>{category.name}</Link>
          </>
        )}
        {" / "}
        <span className="text-brand-black">{item.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-brand-black/5">
          {item.image_url && (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {item.is_signature && <Badge tone="green">Signature</Badge>}
            {item.is_best_seller && <Badge tone="yellow">Best seller</Badge>}
            {item.is_spicy && <Badge tone="red">Spicy</Badge>}
            {item.is_vegan && <Badge tone="outline">Vegan</Badge>}
          </div>

          <h1 className="heading-xl">{item.name}</h1>
          <p className="mt-3 font-display text-3xl font-bold">{formatNgn(item.price_ngn)}</p>
          {reviewCount > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-brand-yellow" aria-hidden>
                {"★".repeat(Math.round(avgRating))}
                <span className="text-brand-black/15">{"★".repeat(5 - Math.round(avgRating))}</span>
              </span>
              <span className="muted">
                {avgRating.toFixed(1)} · {reviewCount} review{reviewCount > 1 ? "s" : ""}
              </span>
            </p>
          )}
          {item.description && <p className="mt-4 text-brand-black/80">{item.description}</p>}

          {item.ingredients && item.ingredients.length > 0 && (
            <div className="mt-6">
              <h2 className="heading-md mb-2">Made with</h2>
              <ul className="flex flex-wrap gap-2">
                {item.ingredients.map((i: string) => (
                  <li key={i} className="chip">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.stock_today !== null && item.stock_today <= 0 && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
              Sold out today, try again tomorrow or order a similar dish.
            </p>
          )}

          <ItemDetailClient
            item={{
              id: item.id,
              name: item.name,
              price_ngn: item.price_ngn,
              image_url: item.image_url,
            }}
            extras={(extras ?? []).map((e) => ({
              id: e.id,
              name: e.name,
              priceNgn: e.price_ngn,
              is_required: e.is_required,
            }))}
            disabled={item.stock_today !== null && item.stock_today <= 0}
          />
        </div>
      </div>

      <section className="mt-16">
        <h2 className="heading-lg mb-4">Reviews</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            {reviewCount === 0 ? (
              <p className="muted text-sm">
                No reviews yet. Be the first to tell everyone what you thought.
              </p>
            ) : (
              <ul className="space-y-4">
                {reviewRows.map((r) => (
                  <li key={r.id} className="card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{r.profiles?.full_name ?? "KW diner"}</span>
                      <span className="text-brand-yellow" aria-label={`${r.rating} out of 5`}>
                        {"★".repeat(r.rating)}
                        <span className="text-brand-black/15">{"★".repeat(5 - r.rating)}</span>
                      </span>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-brand-black/80">{r.comment}</p>}
                    <p className="muted mt-1 text-xs">{new Date(r.created_at).toLocaleDateString("en-NG")}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <h3 className="heading-md mb-3">Leave a review</h3>
            {user ? (
              <ReviewForm itemId={item.id} />
            ) : (
              <div className="space-y-3">
                <p className="muted text-sm">
                  Sign in with a free KW account to rate this dish. It takes seconds and you can
                  earn refer-and-earn credit too.
                </p>
                <a
                  href={`/login?next=${encodeURIComponent(`/menu/${item.slug}`)}`}
                  className="btn-green w-full"
                >
                  Sign in to review
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="heading-lg mb-4">More from {category?.name ?? "the menu"}</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {related.map((r) => (
              <Link key={r.id} href={`/menu/${r.slug}`} className="card p-4 transition hover:shadow-md">
                <div className="mb-2 font-semibold">{r.name}</div>
                <div className="muted text-sm">{formatNgn(r.price_ngn)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
