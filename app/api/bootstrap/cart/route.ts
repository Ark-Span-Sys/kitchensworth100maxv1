import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/bootstrap/cart
 * Bundles everything the cart drawer needs in one request:
 *  - active cities + zones
 *  - bulk tiers
 *  - top best-sellers (for upsell chips)
 *  - enabled payment providers
 *  - bank details (only if manual_bank is enabled — via view_bank RPC)
 */
export async function GET() {
  const supabase = await createClient();
  const [cities, zones, tiers, bestSellers, providers, bank] = await Promise.all([
    supabase.from("cities").select("id,slug,name,state,is_active").eq("is_active", true).order("sort_order"),
    supabase.from("zones").select("id,city_id,name,area_label,eta_minutes,fee_ngn,is_active").eq("is_active", true),
    supabase.from("bulk_tiers").select("min_qty,discount_percent").order("min_qty"),
    supabase
      .from("menu_items")
      .select("id,name,price_ngn,image_url")
      .eq("is_active", true)
      .eq("is_best_seller", true)
      .limit(10),
    supabase
      .from("payment_providers")
      .select("key,label,description,is_enabled,sort_order")
      .eq("is_enabled", true)
      .order("sort_order"),
    supabase.rpc("view_bank"),
  ]);

  return NextResponse.json({
    cities: cities.data ?? [],
    zones: zones.data ?? [],
    tiers: (tiers.data ?? []).map((t) => ({
      min_qty: t.min_qty,
      discount_percent: Number(t.discount_percent),
    })),
    bestSellers: bestSellers.data ?? [],
    providers: providers.data ?? [],
    bank: bank.data?.[0] ?? null,
  });
}
