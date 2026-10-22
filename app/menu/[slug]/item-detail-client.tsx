"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { formatNgn } from "@/lib/pricing";
import { Button } from "@/components/ui/Button";

interface Extra {
  id: string;
  name: string;
  priceNgn: number;
  is_required: boolean;
}

/**
 * Client island on /menu/[slug]. Handles extras multi-select, required extras,
 * quantity stepper, and adds to cart with a snapshot of the extras chosen.
 */
export function ItemDetailClient({
  item,
  extras,
  disabled,
}: {
  item: { id: string; name: string; price_ngn: number; image_url: string | null };
  extras: Extra[];
  disabled: boolean;
}) {
  const cart = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const chosenExtras = useMemo(
    () => extras.filter((e) => selected.has(e.id)),
    [extras, selected],
  );

  const unitTotal = item.price_ngn + chosenExtras.reduce((s, e) => s + e.priceNgn, 0);
  const lineTotal = unitTotal * qty;

  return (
    <div className="mt-8 flex flex-col gap-6">
      {extras.length > 0 && (
        <fieldset className="card p-4">
          <legend className="heading-md mb-3 px-1">Pick your extras</legend>
          <ul className="space-y-2">
            {extras.map((e) => (
              <li key={e.id}>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-brand-black/8 p-3 transition hover:border-brand-green">
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(e.id) || e.is_required}
                      disabled={e.is_required}
                      onChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(e.id)) next.delete(e.id);
                          else next.add(e.id);
                          return next;
                        })
                      }
                      className="h-4 w-4 accent-brand-green"
                    />
                    <span className="text-sm font-medium">
                      {e.name}
                      {e.is_required && <span className="muted ml-2 text-xs">(required)</span>}
                    </span>
                  </span>
                  <span className="text-sm font-semibold">+{formatNgn(e.priceNgn)}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-brand-black/10 bg-white p-1">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="h-8 w-8 rounded-full hover:bg-brand-black/5"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="h-8 w-8 rounded-full hover:bg-brand-black/5"
          >
            +
          </button>
        </div>
        <span className="font-display text-xl font-bold">{formatNgn(lineTotal)}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          variant="primary"
          disabled={disabled}
          onClick={() => {
            cart.add(
              {
                key: `menu_item:${item.id}`,
                kind: "menu_item",
                refId: item.id,
                name: item.name,
                unitPriceNgn: item.price_ngn,
                image_url: item.image_url,
                extras: chosenExtras.map((e) => ({ name: e.name, priceNgn: e.priceNgn })),
              },
              qty,
            );
            cart.openCart();
            router.push("/cart");
          }}
        >
          {disabled ? "Sold out today" : `Add ${qty} to cart · ${formatNgn(lineTotal)}`}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => cart.openCart()}>
          View cart
        </Button>
      </div>

      {qty >= 6 && (
        <p className="rounded-xl bg-brand-yellow/30 px-4 py-2 text-sm font-medium">
          Heads up: 6+ of the same item triggers our bulk discount automatically at checkout.
        </p>
      )}
    </div>
  );
}
