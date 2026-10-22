import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface CreditTxnRow {
  id: string;
  amount_ngn: number;
  kind: string;
  reason: string | null;
  created_at: string;
}

export interface ReferralRow {
  id: string;
  status: string;
  rewarded_order_id: string | null;
  created_at: string;
}

export interface MyReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  item_id: string;
  menu_items: { name: string; slug: string } | null;
}

export interface AccountData {
  userId: string;
  fullName: string | null;
  email: string | null;
  referralCode: string;
  referralLink: string;
  creditBalance: number;
  txns: CreditTxnRow[];
  referrals: ReferralRow[];
  rewarded: number;
  reviews: MyReviewRow[];
}

/**
 * Loads everything the /account and /refer pages render, using the request's
 * auth context (RLS scopes every query to the signed-in user).
 */
export async function getAccountData(): Promise<AccountData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const h = await headers();
  const origin =
    h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [profileRes, txnsRes, referralsRes, reviewsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,referral_code,credit_balance_ngn")
      .eq("id", user.id)
      .single(),
    supabase
      .from("credit_transactions")
      .select("id,amount_ngn,kind,reason,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("referrals")
      .select("id,status,rewarded_order_id,created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("id,rating,comment,is_approved,created_at,item_id,menu_items(name,slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const referralCode = profileRes.data?.referral_code ?? "";

  return {
    userId: user.id,
    fullName: profileRes.data?.full_name ?? null,
    email: user.email ?? null,
    referralCode,
    referralLink: referralCode ? `${origin}/signup?ref=${referralCode}` : `${origin}/refer`,
    creditBalance: profileRes.data?.credit_balance_ngn ?? 0,
    txns: (txnsRes.data ?? []) as CreditTxnRow[],
    referrals: (referralsRes.data ?? []) as ReferralRow[],
    rewarded: (referralsRes.data ?? []).filter((r) => r.status === "rewarded").length,
    reviews: (reviewsRes.data ?? []) as unknown as MyReviewRow[],
  };
}
