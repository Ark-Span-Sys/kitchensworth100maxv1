import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatNgn } from "@/lib/pricing";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

/**
 * /admin — dashboard KPIs. Today's revenue, order count, pending payments,
 * top items this week, and quick links into the CRUD screens.
 */
export default async function AdminDashboard() {
  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    { data: todays },
    { data: awaiting },
    { data: recent },
    { data: topItems },
    { count: activeItems },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total_ngn,status")
      .gte("created_at", startOfToday.toISOString())
      .in("status", ["paid", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "completed"]),
    supabase
      .from("orders")
      .select("id,order_number,total_ngn,created_at")
      .eq("status", "awaiting_payment")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("orders")
      .select("id,order_number,customer_name,total_ngn,status,created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("order_items")
      .select("item_name_snapshot,quantity,unit_price_snapshot")
      .order("line_total", { ascending: false })
      .limit(10),
    supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const revenue = (todays ?? []).reduce((s, o) => s + o.total_ngn, 0);
  const orderCount = todays?.length ?? 0;
  const awaitingCount = awaiting?.length ?? 0;

  const topMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const it of topItems ?? []) {
    const cur = topMap.get(it.item_name_snapshot) ?? {
      name: it.item_name_snapshot,
      qty: 0,
      revenue: 0,
    };
    cur.qty += it.quantity;
    cur.revenue += it.quantity * it.unit_price_snapshot;
    topMap.set(it.item_name_snapshot, cur);
  }
  const top = [...topMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-lg">Dashboard</h1>
          <p className="muted text-sm">Kitchen's Worth control room</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/menu/new" className="btn-green text-xs">
            + New item
          </Link>
          <Link href="/admin/orders" className="btn-secondary text-xs">
            Manage orders
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue today" value={formatNgn(revenue)} hint="Paid orders since midnight" tone="green" />
        <Kpi label="Orders today" value={String(orderCount)} hint="Paid + completed" />
        <Kpi
          label="Awaiting payment"
          value={String(awaitingCount)}
          hint="Manual bank, chase on WhatsApp"
          tone={awaitingCount > 0 ? "yellow" : "default"}
        />
        <Kpi label="Active menu items" value={String(activeItems ?? 0)} hint="Public on /menu" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="heading-md mb-3">Latest orders</h2>
          <ul className="divide-y divide-brand-black/5">
            {(recent ?? []).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 py-2 hover:bg-brand-black/5"
                >
                  <div>
                    <div className="font-mono text-xs">{o.order_number}</div>
                    <div className="text-sm font-medium">{o.customer_name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatNgn(o.total_ngn)}</span>
                    <Badge tone={statusTone(o.status)}>{o.status.replace(/_/g, " ")}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="heading-md mb-3">Top sellers (all time)</h2>
          <ol className="space-y-2">
            {top.map((t, i) => (
              <li key={t.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className="muted font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-medium">{t.name}</span>
                </span>
                <span className="muted text-xs">
                  {t.qty} sold · {formatNgn(t.revenue)}
                </span>
              </li>
            ))}
            {top.length === 0 && <li className="muted text-sm">No orders yet.</li>}
          </ol>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="heading-md mb-3">Waiting on payment proof</h2>
        <ul className="divide-y divide-brand-black/5 text-sm">
          {(awaiting ?? []).map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-2">
              <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs hover:underline">
                {o.order_number}
              </Link>
              <span className="muted text-xs">{new Date(o.created_at).toLocaleString("en-NG")}</span>
              <span className="font-semibold">{formatNgn(o.total_ngn)}</span>
            </li>
          ))}
          {(awaiting ?? []).length === 0 && (
            <li className="muted py-6 text-center">Nothing waiting. Kitchen is up to date.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "green" | "yellow";
}) {
  const bg =
    tone === "green" ? "bg-brand-green/10" : tone === "yellow" ? "bg-brand-yellow/20" : "bg-white";
  return (
    <div className={`card p-5 ${bg}`}>
      <div className="muted text-xs uppercase tracking-wider">{label}</div>
      <div className="mt-1 font-display text-3xl font-black">{value}</div>
      {hint && <div className="muted mt-1 text-xs">{hint}</div>}
    </div>
  );
}

function statusTone(s: string): "default" | "green" | "yellow" | "red" | "outline" {
  if (s === "paid" || s === "confirmed" || s === "delivered" || s === "completed") return "green";
  if (s === "awaiting_payment" || s === "preparing" || s === "ready") return "yellow";
  if (s === "cancelled") return "red";
  return "outline";
}
