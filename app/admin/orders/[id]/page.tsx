import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { formatNgn } from "@/lib/pricing";
import { Badge } from "@/components/ui/Badge";
import { buildOrderMessage, buildWaLink } from "@/lib/whatsapp";
import { setOrderStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUSES = [
  "pending",
  "awaiting_payment",
  "paid",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
];

/** /admin/orders/[id] — full order detail with status transitions. */
export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: items }, { data: events }, { data: settings }, { data: zone }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase
      .from("order_status_events")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("site_settings").select("whatsapp_number").eq("id", 1).single(),
    orderZoneLookup(supabase, id),
  ]);

  if (!order) notFound();

  const waLink = buildWaLink(
    settings?.whatsapp_number ?? "2347030606021",
    buildOrderMessage({
      order_number: order.order_number,
      customer_name: order.customer_name,
      phone: order.phone,
      order_type: order.order_type,
      zone_name: zone?.name ?? null,
      address: order.address,
      lines: (items ?? []).map((i) => ({
        key: `${i.kind}:${i.ref_id}`,
        kind: i.kind,
        refId: i.ref_id,
        name: i.item_name_snapshot,
        unitPriceNgn: i.unit_price_snapshot,
        quantity: i.quantity,
      })),
      subtotal: order.subtotal_ngn,
      discount: order.discount_ngn,
      delivery_fee: order.delivery_fee_ngn,
      total: order.total_ngn,
      payment_line:
        order.payment_provider === "manual_bank"
          ? "Bank transfer, proof to follow"
          : `Monnify ${order.status === "paid" ? "PAID" : "pending"} ref=${order.monnify_reference ?? "n/a"}`,
    }),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="muted text-sm">
            ← All orders
          </Link>
          <h1 className="heading-lg mt-1">Order {order.order_number}</h1>
        </div>
        <Badge tone="green">{order.status.replace(/_/g, " ")}</Badge>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="heading-md mb-3">Customer</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Name" value={order.customer_name} />
            <Row label="Phone" value={order.phone} />
            <Row label="Email" value={order.email ?? "Not set"} />
            <Row label="Type" value={order.order_type} />
            {order.order_type === "delivery" && (
              <>
                <Row label="Zone" value={zone?.name ?? "Not set"} />
                <Row label="Address" value={order.address ?? "Not set"} />
              </>
            )}
            <Row label="Note" value={order.notes ?? "Not set"} />
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="heading-md mb-3">Money</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Subtotal" value={formatNgn(order.subtotal_ngn)} />
            <Row label="Delivery fee" value={formatNgn(order.delivery_fee_ngn)} />
            <Row label="Bulk discount" value={`-${formatNgn(order.discount_ngn)}`} />
            <Row label="Total" value={<b>{formatNgn(order.total_ngn)}</b>} />
            <Row label="Provider" value={order.payment_provider ?? "Not set"} />
            <Row label="Monnify ref" value={order.monnify_reference ?? "Not set"} />
            <Row label="Placed" value={new Date(order.created_at).toLocaleString("en-NG")} />
          </dl>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-green mt-4 w-full text-xs"
          >
            Re-send WhatsApp order card
          </a>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="heading-md mb-3">Items</h2>
        <table className="w-full text-sm">
          <thead className="bg-brand-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2 text-right">Line</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((i) => (
              <tr key={i.id} className="border-t border-brand-black/5">
                <td className="px-3 py-2">{i.item_name_snapshot}</td>
                <td className="px-3 py-2">{i.quantity}</td>
                <td className="px-3 py-2">{formatNgn(i.unit_price_snapshot)}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatNgn(i.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-5">
        <h2 className="heading-md mb-3">Change status</h2>
        <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-5">
          {STATUSES.map((s) => {
            const disabled = s === order.status;
            const bound = setOrderStatus.bind(null, order.id, s);
            return (
              <form key={s} action={bound}>
                <button
                  type="submit"
                  disabled={disabled}
                  className={`w-full rounded-full px-3 py-2 text-xs font-semibold transition ${
                    disabled
                      ? "bg-brand-black text-white"
                      : "border border-brand-black/15 bg-white hover:border-brand-black"
                  }`}
                >
                  {s.replace(/_/g, " ")}
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="heading-md mb-3">Audit trail</h2>
        <ul className="space-y-2 text-sm">
          {(events ?? []).map((e) => (
            <li key={e.id} className="flex justify-between gap-3 border-b border-brand-black/5 pb-2">
              <span>
                <b>{e.from_status ?? "New"}</b> → <b>{e.to_status}</b>
                {e.note && <span className="muted ml-2">{e.note}</span>}
              </span>
              <span className="muted text-xs">{new Date(e.created_at).toLocaleString("en-NG")}</span>
            </li>
          ))}
          {(events ?? []).length === 0 && <li className="muted">No events yet.</li>}
        </ul>
      </section>
    </div>
  );
}

async function orderZoneLookup(supabase: Awaited<ReturnType<typeof createClient>>, orderId: string) {
  const { data: order } = await supabase.from("orders").select("zone_id").eq("id", orderId).single();
  if (!order?.zone_id) return null;
  const { data: zone } = await supabase.from("zones").select("id,name").eq("id", order.zone_id).single();
  return zone ?? null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
