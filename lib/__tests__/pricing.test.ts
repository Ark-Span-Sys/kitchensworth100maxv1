import { describe, it, expect } from "vitest";
import {
  bestTierFor,
  formatNgn,
  lineSubtotal,
  priceCart,
  vatFromInclusive,
  type BulkTier,
} from "../pricing";
import type { CartLine } from "../../lib/types";

/** Standard seeded tiers (see supabase/migrations/005_seed.sql). */
const TIERS: BulkTier[] = [
  { min_qty: 6, discount_percent: 10 },
  { min_qty: 12, discount_percent: 20 },
  { min_qty: 24, discount_percent: 30 },
  { min_qty: 50, discount_percent: 46.4 },
];

function line(partial: Partial<CartLine> & Pick<CartLine, "key" | "unitPriceNgn" | "quantity">): CartLine {
  return {
    kind: "menu_item",
    refId: partial.key,
    name: "Test item",
    ...partial,
  } as CartLine;
}

describe("formatNgn", () => {
  it("renders an NGN symbol with thousand separators and rounds pence", () => {
    expect(formatNgn(1500)).toBe("₦1,500");
    expect(formatNgn(1500.4)).toBe("₦1,500");
    expect(formatNgn(1500.6)).toBe("₦1,501");
    expect(formatNgn(0)).toBe("₦0");
  });
});

describe("lineSubtotal", () => {
  it("multiplies unit price by quantity", () => {
    const l = line({ key: "a", unitPriceNgn: 1200, quantity: 3 });
    expect(lineSubtotal(l)).toBe(3600);
  });

  it("adds extras per unit before multiplication", () => {
    const l = line({
      key: "a",
      unitPriceNgn: 1200,
      quantity: 2,
      extras: [
        { name: "Extra egg", priceNgn: 200 },
        { name: "Extra sauce", priceNgn: 100 },
      ],
    });
    expect(lineSubtotal(l)).toBe((1200 + 200 + 100) * 2);
  });
});

describe("bestTierFor", () => {
  it("returns null below the lowest threshold", () => {
    expect(bestTierFor(5, TIERS)).toBeNull();
  });

  it("returns the highest tier the qty qualifies for", () => {
    expect(bestTierFor(6, TIERS)?.discount_percent).toBe(10);
    expect(bestTierFor(11, TIERS)?.discount_percent).toBe(10);
    expect(bestTierFor(12, TIERS)?.discount_percent).toBe(20);
    expect(bestTierFor(30, TIERS)?.discount_percent).toBe(30);
    expect(bestTierFor(60, TIERS)?.discount_percent).toBeCloseTo(46.4, 4);
  });

  it("handles an empty tier list", () => {
    expect(bestTierFor(99, [])).toBeNull();
  });
});

describe("priceCart", () => {
  it("sums subtotals, applies per-line discounts, adds delivery once", () => {
    const lines = [
      line({ key: "a", unitPriceNgn: 1000, quantity: 7 }), // 7000, 10% off = 700
      line({ key: "b", unitPriceNgn: 1500, quantity: 3 }), // 4500, no tier
    ];
    const priced = priceCart(lines, TIERS, 2500);
    expect(priced.subtotal).toBe(11500);
    expect(priced.discount).toBe(700);
    expect(priced.deliveryFee).toBe(2500);
    expect(priced.total).toBe(11500 - 700 + 2500);
    expect(priced.lineDiscounts).toEqual([
      { key: "a", discount: 700, tierApplied: 6 },
      { key: "b", discount: 0, tierApplied: null },
    ]);
  });

  it("returns a zero total when the discount fully covers an empty cart", () => {
    const priced = priceCart([], TIERS, 0);
    expect(priced.total).toBe(0);
  });

  it("clamps a negative total to zero when delivery fee is negative (guard)", () => {
    const lines = [line({ key: "a", unitPriceNgn: 1000, quantity: 50 })];
    const priced = priceCart(lines, TIERS, 0);
    // 50 * 1000 = 50_000; 46.4% off = 23_200 discount; total = 26_800
    expect(priced.total).toBe(26800);
  });

  it("applies the highest qualifying tier, not the largest discount", () => {
    const tiers: BulkTier[] = [
      { min_qty: 6, discount_percent: 30 },
      { min_qty: 12, discount_percent: 10 }, // intentionally inverted
    ];
    const lines = [line({ key: "a", unitPriceNgn: 1000, quantity: 12 })];
    const priced = priceCart(lines, tiers, 0);
    // Highest min_qty (12) wins, discount = 10%
    expect(priced.discount).toBe(1200);
  });
});

describe("vatFromInclusive", () => {
  it("extracts the VAT portion from a VAT-inclusive amount", () => {
    // 107.5 inclusive @ 7.5% -> 100 ex-VAT -> 7.50 VAT -> rounds to 8
    expect(vatFromInclusive(107.5, 7.5)).toBe(8);
    expect(vatFromInclusive(1000, 7.5)).toBe(70);
  });

  it("returns 0 when the VAT percent is 0", () => {
    expect(vatFromInclusive(1000, 0)).toBe(0);
  });
});
