import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature, isPaidEvent, type MonnifyWebhookPayload } from "@/lib/monnify";

/**
 * POST /api/monnify/webhook
 * Monnify calls this endpoint when a payment event occurs.
 * We verify the Bepin-Signature HMAC, then idempotently transition
 * the matching order from `pending` to `paid`.
 *
 * The customer's browser is redirected to /track?new=<code> which
 * auto-opens the WhatsApp handoff.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("bepin-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: MonnifyWebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isPaidEvent(payload)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const ref = String(payload.payment_reference ?? "");
  if (!ref) return NextResponse.json({ error: "Missing payment_reference" }, { status: 400 });

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id, status")
    .eq("order_number", ref)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "paid" || order.status === "confirmed") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  await admin
    .from("orders")
    .update({ status: "paid", whatsapp_sent_at: new Date().toISOString() })
    .eq("id", order.id);

  await admin.from("order_status_events").insert({
    order_id: order.id,
    from_status: order.status,
    to_status: "paid",
    note: "Monnify webhook confirmed payment",
  });

  return NextResponse.json({ ok: true });
}
