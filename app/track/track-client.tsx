"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatNgn } from "@/lib/pricing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { GENERIC_LINKS } from "@/lib/whatsapp";

/**
 * Client component powering /track.
 * - Auto-fires the WhatsApp handoff when redirected here from Monnify with
 *   `?new=KW-XXXX` (only once, guarded by a session flag).
 * - Lookups can be by KW-code or phone number.
 */
interface TrackedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  order_type: string;
  status: string;
  total_ngn: number;
  payment_provider: string | null;
  estimated_minutes: number | null;
  created_at: string;
  items: { item_name_snapshot: string; quantity: number; unit_price_snapshot: number; ref_id: string; kind: string }[];
}

const STATUS_TONE: Record<string, "default" | "green" | "yellow" | "red" | "outline"> = {
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

export function TrackClient({
  initialNew,
  initialPhone,
}: {
  initialNew?: string;
  initialPhone?: string;
}) {
  const [query, setQuery] = useState(initialNew ?? initialPhone ?? "");
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waNumber, setWaNumber] = useState<string>("2347030606021");
  const cart = useCart();

  // Load site's WhatsApp number once for the "chat about this order" button.
  useEffect(() => {
    fetch("/api/bootstrap/cart")
      .then((r) => r.json())
      .catch(() => null);
    // Settings come from the site layout via data attribute on <html>; fall back to env.
    const fromMeta = document
      .querySelector<HTMLMetaElement>('meta[name="kw:whatsapp"]')
      ?.content;
    if (fromMeta) setWaNumber(fromMeta);
  }, []);

  // Auto-run the lookup if we arrived from a Monnify redirect.
  useEffect(() => {
    if (initialNew && !sessionStorage.getItem(`kw.tracked.${initialNew}`)) {
      sessionStorage.setItem(`kw.tracked.${initialNew}`, "1");
      void runLookup(initialNew);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNew]);

  async function runLookup(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not find your order.");
        setOrders(null);
      } else {
        setOrders(data.orders ?? []);
      }
    } catch {
      setError("Network error, try again.");
    } finally {
      setLoading(false);
    }
  }

  const reorder = (o: TrackedOrder) => {
    for (const it of o.items) {
      cart.add(
        {
          key: `${it.kind}:${it.ref_id}`,
          kind: it.kind as "menu_item" | "party_pack",
          refId: it.ref_id,
          name: it.item_name_snapshot,
          unitPriceNgn: it.unit_price_snapshot,
        },
        it.quantity,
      );
    }
    cart.openCart();
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runLookup(query);
        }}
        className="card mb-8 flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input
            label="KW-code or phone number"
            placeholder="KW-ABC123 or 08012345678"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Track"}
        </Button>
      </form>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {orders && orders.length === 0 && (
        <p className="muted rounded-xl bg-white p-6 text-center">
          No orders matched that code or number.
        </p>
      )}

      <ul className="space-y-4">
        {(orders ?? []).map((o) => (
          <li key={o.id} className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-display text-lg font-bold">{o.order_number}</div>
                <div className="muted text-xs">
                  {new Date(o.created_at).toLocaleString("en-NG")} · {o.order_type}
                </div>
              </div>
              <Badge tone={STATUS_TONE[o.status] ?? "default"}>{o.status.replace(/_/g, " ")}</Badge>
            </div>

            <ul className="mb-4 space-y-1 text-sm">
              {o.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    {it.quantity}× {it.item_name_snapshot}
                  </span>
                  <span className="muted">{formatNgn(it.unit_price_snapshot * it.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-black/5 pt-3">
              <div>
                <div className="font-display text-xl font-black">{formatNgn(o.total_ngn)}</div>
                {o.estimated_minutes && (
                  <div className="muted text-xs">ETA ~{o.estimated_minutes} min</div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => reorder(o)}>
                  Reorder
                </Button>
                <a
                  href={GENERIC_LINKS.checkingOnOrder(waNumber, o.order_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-green text-xs"
                >
                  Ask about it
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
