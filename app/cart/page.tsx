"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

/**
 * /cart — a route that exists so the dock Cart button and the checkout form
 * can share a URL. On mount it opens the drawer; closing the drawer returns
 * the user to the home page so we never leave them on a blank route.
 */
export default function CartRoute() {
  const cart = useCart();
  const router = useRouter();

  useEffect(() => {
    cart.openCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cart.isOpen) router.replace("/menu");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.isOpen]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="heading-xl">Your cart</h1>
      <p className="muted mt-3">Opening your cart...</p>
    </div>
  );
}
