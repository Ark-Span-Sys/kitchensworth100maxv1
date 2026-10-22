import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/track?q=KW-XXXXXX or ?q=08012345678
 * Calls the `track_orders` SECURITY DEFINER RPC so customers can look up
 * their own orders by code or phone without logging in.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 4) {
    return NextResponse.json({ error: "Enter a valid KW-code or phone number." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("track_orders", { query: q });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (data ?? []) as Record<string, unknown>[];
  return NextResponse.json({ orders });
}
