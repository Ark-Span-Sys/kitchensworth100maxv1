import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initializePayment } from "@/lib/monnify";
import { orderDraftSchema } from "@/lib/validation/schemas";
import { generateOrderNumber, generateOrderNumberWithRetry } from "@/lib/orders";
import { priceCart } from "@/lib/pricing";

/**
 * POST /api/monnify/initialize
 * Creates an order row in `pending` state and returns the Monnify
 * checkout URL. Monnify's webhook will later flip it to `paid` and
 * the customer will land on /track?new=<code> which fires the
 * WhatsApp handoff.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = orderDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid order" }, { status: 400 });
  }
  const draft = parsed.data;

  const supabase = await createClient();

  let zoneFee = 0;
  if (draft.order_type === "delivery" && draft.zone_id) {
    const { data: zone } = await supabase.from("zones").select("fee_ngn").eq("id", draft.zone_id).single();
    if (!zone) return NextResponse.json({ error: "Invalid delivery zone." }, { status: 400 });
    zoneFee = zone.fee_ngn;
  }

  const { data: tiersRaw } = await supabase.from("bulk_tiers").select("min_qty,discount_percent");
  const tiers = (tiersRaw ?? []).map((t) => ({
    min_qty: t.min_qty,
    discount_percent: Number(t.discount_percent),
  }));
  const priced = priceCart(draft.lines, tiers, zoneFee);

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
        status: "pending",
        subtotal_ngn: priced.subtotal,
        delivery_fee_ngn: priced.deliveryFee,
        discount_ngn: priced.discount,
        total_ngn: priced.total,
        payment_provider: draft.payment_provider,
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

  await supabase.from("order_items").insert(
    draft.lines.map((l) => ({
      order_id: orderRow!.id,
      kind: l.kind,
      ref_id: l.refId,
      item_name_snapshot: l.name,
      unit_price_snapshot: l.unitPriceNgn,
      quantity: l.quantity,
      line_total: l.unitPriceNgn * l.quantity,
      extras: l.extras ?? [],
    })),
  );

  try {
    const result = await initializePayment({
      amountNgn: priced.total,
      paymentReference: orderRow.order_number,
      customerName: draft.customer_name,
      customerEmail: draft.email ?? "orders@kitchensworth.ng",
      description: `Kitchen's Worth order ${orderRow.order_number}`,
    });
    // Store the Monnify reference so the webhook can find the order.
    await supabase
      .from("orders")
      .update({ monnify_reference: result.paymentIntentCode })
      .eq("id", orderRow.id);

    return NextResponse.json({
      order_number: orderRow.order_number,
      checkout_url: result.checkoutUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Monnify init failed" },
      { status: 502 },
    );
  }
}
