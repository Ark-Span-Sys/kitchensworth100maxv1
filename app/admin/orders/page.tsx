import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { formatNgn } from "@/lib/pricing";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const FILTERS = [
  "",
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

const TONE: Record<string, "default" | "green" | "yellow" | "red" | "outline"> = {
  pending: "outline",
  awaiting_payment: "yellow",
  paid: "green",
  confirmed: "green",
  preparing: "yellow",
  ready: "yellow",
  out_for_delivery: "green",
  delivered: "green",
  completed: "default",
  cancelled: "red",
};

/** /admin/orders — filter by status, list rows, click through to detail. */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const sp = await searchParams;

  let q = supabase
    .from("orders")
    .select("id,order_number,customer_name,phone,order_type,status,total_ngn,payment_provider,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.q) q = q.or(`order_number.ilike.%${sp.q}%,phone.ilike.%${sp.q}%,customer_name.ilike.%${sp.q}%`);

  const { data: rows } = await q;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="heading-lg">Orders</h1>
        <p className="muted text-sm">{rows?.length ?? 0} matching</p>
      </header>

      <div className="card flex flex-wrap gap-2 p-3">
        {FILTERS.map((f) => (
          <Link
            key={f || "all"}
            href={f ? `?status=${f}` : "/admin/orders"}
            className={`chip ${sp.status === f ? "bg-brand-black text-white" : ""}`}
          >
            {f ? f.replace(/_/g, " ") : "All"}
          </Link>
        ))}
      </div>

      <form className="card flex gap-2 p-3" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search by KW code, phone or customer"
          className="flex-1 rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm"
        />
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <button className="btn-secondary text-xs">Search</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-black/5 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Placed</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((o) => (
              <tr key={o.id} className="border-t border-brand-black/5 hover:bg-brand-black/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{o.customer_name}</div>
                  <div className="muted text-xs">{o.phone}</div>
                </td>
                <td className="px-4 py-3">{o.order_type}</td>
                <td className="px-4 py-3 font-semibold">{formatNgn(o.total_ngn)}</td>
                <td className="px-4 py-3 text-xs">{o.payment_provider ?? "Not set"}</td>
                <td className="px-4 py-3">
                  <Badge tone={TONE[o.status] ?? "default"}>{o.status.replace(/_/g, " ")}</Badge>
                </td>
                <td className="muted px-4 py-3 text-xs">{new Date(o.created_at).toLocaleString("en-NG")}</td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="muted px-4 py-10 text-center">
                  No orders matched.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
