"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatNgn } from "@/lib/pricing";

/**
 * Floating Cart Badge — appears when user adds items to cart.
 * Positioned right above the floating dock at bottom-32 with higher z-index
 * to ensure it sits cleanly above footer without overlapping.
 */
export function FloatingCartBadge() {
  const { count, subtotal, openCart } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [count]);

  if (!visible) return null;

  return (
    <Link
      href="#"
      onClick={(e) => {
        e.preventDefault();
        openCart();
      }}
      className="fixed right-4 top-auto bottom-32 transform rounded-full bg-brand-black px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur transition hover:bg-brand-green-dark group z-[60]"
      aria-label={`View cart with ${count} items totaling ${formatNgn(subtotal)}`}
    >
      <div className="flex items-center gap-3">
        {/* Shopping bag icon */}
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition group-hover:bg-white/20">
          <ShoppingCart className="h-4 w-4 text-white" />
        </div>

        {/* Text + price */}
        <span className="text-white group-hover:text-white/90">
          View cart · {formatNgn(subtotal)}
        </span>

        {/* Item count badge */}
        <span className="inline-flex h-5 min-w-5 place-items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-black text-brand-black shadow">
          {count}
        </span>
      </div>
    </Link>
  );
}
