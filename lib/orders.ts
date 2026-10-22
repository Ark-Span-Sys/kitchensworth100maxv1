/**
 * Order-number generator.
 *
 * Format: KW-<6 chars>. The 6 chars are the last 6 of `Date.now().toString(36)`
 * upper-cased, matching Presikitchen's `PK-` scheme. Uniqueness is enforced
 * at the DB level (`orders.order_number` is unique); if two orders land in
 * the same millisecond the caller retries once with a random suffix.
 */
export function generateOrderNumber(now: number = Date.now()): string {
  const base = now.toString(36).toUpperCase();
  return "KW-" + base.slice(-6);
}

export function generateOrderNumberWithRetry(now: number = Date.now()): string {
  const primary = generateOrderNumber(now);
  // 1-in-36 chance of collision if two orders share the same ms; add a
  // random letter suffix on retry (callers detect via DB unique violation).
  const suffix = Math.random().toString(36).slice(2, 3).toUpperCase();
  return primary + suffix;
}
