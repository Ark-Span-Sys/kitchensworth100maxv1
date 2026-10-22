import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orderDraftSchema } from "@/lib/validation/schemas";
import { generateOrderNumber, generateOrderNumberWithRetry } from "@/lib/orders";
import { buildOrderMessage, buildWaLink } from "@/lib/whatsapp";
import { priceCart } from "@/lib/pricing";
import { getCreditBalance, clampCredit, recordRedemption } from "@/lib/credits";

/**
 * POST /api/orders
 * Creates an order for the manual-bank path.
 * Saves the row as `awaiting_payment`, then returns the WhatsApp link
 * the browser should open.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = orderDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid order" }, { status: 400 });
  }
  const draft = parsed.data;

  const supabase = await createClient();

  // Fetch the zone to get its fee + name.
  let zoneFee = 0;
  let zoneName: string | null = null;
  if (draft.order_type === "delivery" && draft.zone_id) {
    const { data: zone } = await supabase
      .from("zones")
      .select("name,fee_ngn,eta_minutes")
      .eq("id", draft.zone_id)
      .single();
    if (!zone) return NextResponse.json({ error: "Invalid delivery zone." }, { status: 400 });
    zoneFee = zone.fee_ngn;
    zoneName = zone.name;
  }

  // Server-side re-pricing (never trust client totals).
  const { data: tiersRaw } = await supabase.from("bulk_tiers").select("min_qty,discount_percent");
  const tiers = (tiersRaw ?? []).map((t) => ({
    min_qty: t.min_qty,
    discount_percent: Number(t.discount_percent),
  }));
  const priced = priceCart(draft.lines, tiers, zoneFee);

  // Additive credit path: only applies when a signed-in user opts in. The
  // authoritative balance is read server-side; guests are untouched.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let creditApplied = 0;
  if (user && draft.use_credit) {
    const balance = await getCreditBalance(user.id);
    creditApplied = clampCredit(balance, priced.total);
  }
  const payable = Math.max(0, priced.total - creditApplied);
  const status = payable === 0 ? "paid" : "awaiting_payment";

  // Fetch settings for WhatsApp number.
  const { data: settings } = await supabase.from("site_settings").select("whatsapp_number").eq("id", 1).single();
  const waNumber = settings?.whatsapp_number ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2347030606021";

  // Try to insert; retry once on order_number collision.
  let orderNumber = generateOrderNumber();
  let orderRow: { id: string; order_number: string } | null = null;
  for (let attempt = 0; attempt < 2 && !orderRow; attempt++) {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: draft.customer_name,
        phone: draft.phone,
        email: draft.email ?? null,
        order_type: draft.order_type,
        zone_id: draft.zone_id ?? null,
        address: draft.address ?? null,
        status,
        subtotal_ngn: priced.subtotal,
        delivery_fee_ngn: priced.deliveryFee,
        discount_ngn: priced.discount,
        total_ngn: priced.total,
        credit_applied_ngn: creditApplied,
        payment_provider: draft.payment_provider,
        user_id: user?.id ?? null,
        estimated_minutes: draft.order_type === "delivery" ? 45 : 25,
        notes: draft.notes ?? null,
      })
      .select("id, order_number")
      .single();
    if (!error) {
      orderRow = data;
      break;
    }
    if (error.code === "23505") {
      orderNumber = generateOrderNumberWithRetry();
      continue;
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!orderRow) return NextResponse.json({ error: "Could not save order." }, { status: 500 });

  // Insert order_items.
  const items = draft.lines.map((l) => ({
    order_id: orderRow!.id,
    kind: l.kind,
    ref_id: l.refId,
    item_name_snapshot: l.name,
    unit_price_snapshot: l.unitPriceNgn,
    quantity: l.quantity,
    line_total: l.unitPriceNgn * l.quantity,
    extras: l.extras ?? [],
  }));
  await supabase.from("order_items").insert(items);

  // Deduct redeemed credit (writes a negative ledger entry; a DB trigger
  // decrements the profile balance).
  if (user && creditApplied > 0) {
    await recordRedemption(user.id, creditApplied, orderRow.id);
  }

  // Build the WhatsApp link.
  const waLink = buildWaLink(
    waNumber,
    buildOrderMessage({
      order_number: orderRow.order_number,
      customer_name: draft.customer_name,
      phone: draft.phone,
      order_type: draft.order_type,
      zone_name: zoneName,
      address: draft.address ?? null,
      lines: draft.lines,
      subtotal: priced.subtotal,
      discount: priced.discount,
      delivery_fee: priced.deliveryFee,
      total: priced.total,
      credit_applied: creditApplied,
      payable,
      payment_line:
        payable === 0
          ? "Fully covered by KW credit — nothing to pay."
          : creditApplied > 0
            ? "Bank transfer for the remaining balance, I will send proof of payment."
            : "Bank transfer, I will send proof of payment.",
    }),
  );

  return NextResponse.json({
    order_number: orderRow.order_number,
    wa_link: waLink,
    total: priced.total,
    credit_applied: creditApplied,
    payable,
  });
}
