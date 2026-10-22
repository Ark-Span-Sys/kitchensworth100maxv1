import type { CartLine } from "./types";

/**
 * Pricing engine for Kitchen's Worth.
 *
 * Rules:
 *  - All displayed prices are VAT-inclusive (7.5% by default).
 *  - Bulk discount is per-line: if a single item's qty >= tier.min_qty,
 *    the tier discount applies to that line's subtotal (not the whole cart).
 *  - The highest applicable tier wins for each line.
 *  - Delivery fee is added once, from the selected zone.
 */

export interface BulkTier {
  min_qty: number;
  discount_percent: number;
}

export interface PricedCart {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  /** Per-line discount breakdown, useful for the WhatsApp order card. */
  lineDiscounts: { key: string; discount: number; tierApplied: number | null }[];
}

export function formatNgn(amount: number): string {
  return "₦" + Math.round(amount).toLocaleString("en-NG");
}

export function lineSubtotal(line: CartLine): number {
  const extras = (line.extras ?? []).reduce((s, e) => s + e.priceNgn, 0);
  return (line.unitPriceNgn + extras) * line.quantity;
}

export function bestTierFor(qty: number, tiers: BulkTier[]): BulkTier | null {
  const eligible = tiers.filter((t) => qty >= t.min_qty);
  if (eligible.length === 0) return null;
  return eligible.reduce((a, b) => (b.min_qty > a.min_qty ? b : a));
}

export function priceCart(
  lines: CartLine[],
  tiers: BulkTier[],
  deliveryFee: number,
): PricedCart {
  let subtotal = 0;
  let discount = 0;
  const lineDiscounts: PricedCart["lineDiscounts"] = [];

  for (const line of lines) {
    const lineTotal = lineSubtotal(line);
    subtotal += lineTotal;
    const tier = bestTierFor(line.quantity, tiers);
    if (tier) {
      const lineDisc = Math.round((lineTotal * tier.discount_percent) / 100);
      discount += lineDisc;
      lineDiscounts.push({ key: line.key, discount: lineDisc, tierApplied: tier.min_qty });
    } else {
      lineDiscounts.push({ key: line.key, discount: 0, tierApplied: null });
    }
  }

  const total = Math.max(0, subtotal - discount) + deliveryFee;
  return { subtotal, discount, deliveryFee, total, lineDiscounts };
}

/** Extract the VAT portion from a VAT-inclusive amount. */
export function vatFromInclusive(inclusive: number, vatPercent: number): number {
  return Math.round(inclusive - inclusive / (1 + vatPercent / 100));
}
