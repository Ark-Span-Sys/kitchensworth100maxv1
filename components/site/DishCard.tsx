"use client";

import Image from "next/image";
import Link from "next/link";
import { useContext, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { formatNgn } from "@/lib/pricing";
import { CartContext } from "@/components/cart/CartProvider";

/**
 * Menu card used across /menu, home "Best sellers", and search results.
 *
 * Compact Presikitchen layout: a borderless card with a square image, a
 * favourite heart over the top-left, then name + price on one line, a
 * two-line description, and a solid green "+" quick-add pinned bottom-right.
 */
export interface DishCardProps {
  item: Pick<
    MenuItem,
    "id" | "slug" | "name" | "description" | "price_ngn" | "image_url" | "is_best_seller" | "is_signature" | "is_spicy" | "is_vegan"
  >;
  compact?: boolean;
}

export function DishCard({ item, compact = false }: DishCardProps) {
  // CartContext is optional so the card also renders in the admin preview.
  const cart = useContext(CartContext);
  const [fav, setFav] = useState(false);

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-2xl bg-brand-black/5">
        <Link href={`/menu/${item.slug}`} className="relative block aspect-square">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 32vw, 24vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-4xl text-brand-black/20">
              KW
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setFav((v) => !v)}
          aria-pressed={fav}
          aria-label={fav ? `Remove ${item.name} from favourites` : `Save ${item.name} to favourites`}
          className="absolute left-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-brand-black shadow-sm ring-1 ring-black/5 transition hover:scale-110"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill={fav ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: fav ? "#e11d48" : undefined }}
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/menu/${item.slug}`}
            className="font-display text-base font-bold leading-snug tracking-tight hover:underline sm:text-lg"
          >
            {item.name}
          </Link>
          <span className="shrink-0 font-display text-base font-bold text-brand-green-dark sm:text-lg">
            {formatNgn(item.price_ngn)}
          </span>
        </div>

        {!compact && item.description && (
          <p className="muted mt-1 line-clamp-2 text-xs sm:text-sm">{item.description}</p>
        )}

        {cart && (
          <div className="mt-auto flex justify-end pt-3">
            <button
              type="button"
              onClick={() =>
                cart.add({
                  key: `menu_item:${item.id}`,
                  kind: "menu_item",
                  refId: item.id,
                  name: item.name,
                  unitPriceNgn: item.price_ngn,
                  image_url: item.image_url ?? null,
                })
              }
              aria-label={`Add ${item.name} to cart`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-green-dark text-2xl leading-none text-white shadow-sm transition hover:scale-110 hover:bg-brand-black"
            >
              +
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
