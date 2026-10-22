import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Credit wallet helpers.
 *
 * These run on the service-role client (bypass RLS) because the balance is
 * the single source of truth at checkout and redemption rows must be written
 * server-side. Never trust a client-sent credit number.
 */

/** Authoritative available credit for a user (never negative). */
export async function getCreditBalance(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("credit_balance_ngn")
    .eq("id", userId)
    .single();
  const bal = data?.credit_balance_ngn ?? 0;
  return bal > 0 ? bal : 0;
}

/** How much credit can be applied to a given total. */
export function clampCredit(balance: number, total: number): number {
  return Math.max(0, Math.min(balance, total));
}

/**
 * Record a redemption (negative ledger entry) for an order. The DB trigger
 * `bump_credit_balance` decrements the profile balance automatically.
 */
export async function recordRedemption(
  userId: string,
  amountNgn: number,
  orderId: string,
): Promise<void> {
  if (amountNgn <= 0) return;
  const admin = createAdminClient();
  await admin.from("credit_transactions").insert({
    user_id: userId,
    amount_ngn: -amountNgn,
    kind: "redemption",
    reason: "Credit applied at checkout",
    order_id: orderId,
  });
}
