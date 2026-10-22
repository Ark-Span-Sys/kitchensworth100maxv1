"use client";

import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";

/**
 * Small client-side wrapper used inside server components to add a menu item
 * or party pack to the cart without navigating away.
 */
export function AddToCartButton({
  kind,
  id,
  name,
  priceNgn,
  imageUrl,
  label = "Add to cart",
  size = "sm",
  variant = "primary",
}: {
  kind: "menu_item" | "party_pack";
  id: string;
  name: string;
  priceNgn: number;
  imageUrl?: string | null;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "green";
}) {
  const cart = useCart();

  return (
    <Button
      size={size}
      variant={variant}
      onClick={() =>
        cart.add({
          key: `${kind}:${id}`,
          kind,
          refId: id,
          name,
          unitPriceNgn: priceNgn,
          image_url: imageUrl ?? null,
        })
      }
    >
      {label}
    </Button>
  );
}
