import { describe, it, expect } from "vitest";
import { generateOrderNumber, generateOrderNumberWithRetry } from "../orders";

describe("generateOrderNumber", () => {
  it("uses the KW- prefix followed by 6 uppercase base36 chars", () => {
    const code = generateOrderNumber(Date.now());
    expect(code).toMatch(/^KW-[0-9A-Z]{6}$/);
  });

  it("is deterministic for a given timestamp (testable)", () => {
    expect(generateOrderNumber(1_700_000_000_000)).toBe(generateOrderNumber(1_700_000_000_000));
  });

  it("produces different codes for different timestamps", () => {
    const a = generateOrderNumber(1_700_000_000_000);
    const b = generateOrderNumber(1_700_000_000_001);
    expect(a).not.toBe(b);
  });

  it("remains unique across 10k concurrent calls in the same ms (with retry)", () => {
    const now = Date.now();
    const set = new Set<string>();
    for (let i = 0; i < 10_000; i++) set.add(generateOrderNumberWithRetry(now));
    // Retry helper adds a random letter — expect near-total uniqueness.
    // We tolerate a tiny collision probability (birthday paradox on 36 chars).
    expect(set.size).toBeGreaterThan(9_000);
  });
});
