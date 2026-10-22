"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";

/**
 * Move an order to a new status and log an audit event.
 * Status enum values are validated server-side by the DB.
 */
export async function setOrderStatus(orderId: string, to: string, note?: string) {
  await requireAdmin();
  const supabase = await (await import("@/lib/supabase/server")).createClient();

  const { data: current } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();
  if (!current) throw new Error("Order not found");

  const { error } = await supabase.from("orders").update({ status: to }).eq("id", orderId);
  if (error) throw new Error(error.message);

  await supabase.from("order_status_events").insert({
    order_id: orderId,
    from_status: current.status,
    to_status: to,
    note: note ?? null,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
