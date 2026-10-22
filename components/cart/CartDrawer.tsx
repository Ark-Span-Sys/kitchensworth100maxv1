"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useCart } from "./CartProvider";
import { formatNgn, priceCart, type BulkTier } from "@/lib/pricing";
import { CheckoutForm } from "./CheckoutForm";
import type { City, Zone } from "@/lib/types";

/**
 * Right-side cart drawer.
 * Sections (in order):
 *   1. Order type toggle (Pickup / Delivery)
 *   2. Line items with qty steppers
 *   3. Upsell chips (top 3 best sellers not already in cart)
 *   4. City selector (if multiple cities active) + zone cards (if delivery)
 *   5. Totals block
 *   6. CheckoutForm (name, phone, address, payment provider, submit)
 */
export function CartDrawer() {
  const { lines, isOpen, closeCart, setQty, remove, add, subtotal } = useCart();
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("delivery");
  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tiers, setTiers] = useState<BulkTier[]>([]);
  const [bestSellers, setBestSellers] = useState<
    { id: string; name: string; price_ngn: number; image_url: string | null }[]
  >([]);
  const [cityId, setCityId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/bootstrap/cart")
      .then((r) => r.json())
      .then((d) => {
        setCities(d.cities ?? []);
        setZones(d.zones ?? []);
        setTiers(d.tiers ?? []);
        setBestSellers(d.bestSellers ?? []);
        if (d.cities?.[0] && !cityId) setCityId(d.cities[0].id);
      })
      .catch(() => {});
  }, [isOpen, cityId]);

  const cityZones = useMemo(
    () => zones.filter((z) => !cityId || z.city_id === cityId),
    [zones, cityId],
  );
  const selectedZone = cityZones.find((z) => z.id === zoneId) ?? null;
  const deliveryFee = orderType === "delivery" ? selectedZone?.fee_ngn ?? 0 : 0;
  const priced = priceCart(lines, tiers, deliveryFee);

  const upsells = bestSellers
    .filter((b) => !lines.some((l) => l.refId === b.id))
    .slice(0, 3);

  return (
    <Drawer open={isOpen} onClose={closeCart} title="Your Order">
      {lines.length === 0 ? (
        <div className="grid place-items-center py-16 text-center">
          <p className="muted">Your cart is empty.</p>
          <button onClick={closeCart} className="btn-primary mt-4">
            Browse the menu
          </button>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          {/* Order type */}
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-black/60">
              Order Type
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(["pickup", "delivery"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                    orderType === t
                      ? "border-brand-green bg-brand-green/10"
                      : "border-brand-black/10 hover:border-brand-black/30"
                  }`}
                >
                  {t === "pickup" ? "Pickup (~25 min)" : "Delivery"}
                </button>
              ))}
            </div>
          </div>

          {/* Line items */}
          <ul className="mb-4 space-y-3">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-3">
                {l.image_url ? (
                  <Image
                    src={l.image_url}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-brand-black/5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-brand-black/60">{formatNgn(l.unitPriceNgn)} each</p>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-brand-black/10">
                    <button
                      onClick={() => setQty(l.key, l.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="p-1.5 hover:bg-brand-black/5 rounded-full"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold">{l.quantity}</span>
                    <button
                      onClick={() => setQty(l.key, l.quantity + 1)}
                      aria-label="Increase quantity"
                      className="p-1.5 hover:bg-brand-black/5 rounded-full"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => remove(l.key)}
                  aria-label={`Remove ${l.name}`}
                  className="self-start rounded-full p-2 text-brand-black/40 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>

          {/* Upsell chips */}
          {upsells.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-black/60">
                Add to your order
              </h3>
              <div className="flex flex-wrap gap-2">
                {upsells.map((u) => (
                  <button
                    key={u.id}
                    onClick={() =>
                      add({
                        key: `menu_item:${u.id}`,
                        kind: "menu_item",
                        refId: u.id,
                        name: u.name,
                        unitPriceNgn: u.price_ngn,
                        image_url: u.image_url,
                      })
                    }
                    className="chip hover:bg-brand-green/20"
                  >
                    <Plus size={12} /> {u.name} · {formatNgn(u.price_ngn)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* City + zones */}
          {orderType === "delivery" && (
            <div className="mb-4">
              {cities.length > 1 && (
                <>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-black/60">
                    City
                  </h3>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {cities.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCityId(c.id);
                          setZoneId(null);
                        }}
                        className={`chip ${
                          cityId === c.id ? "!bg-brand-green/20 !text-brand-black" : ""
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-black/60">
                Delivery Zone *
              </h3>
              <div className="space-y-2">
                {cityZones.map((z) => (
                  <label
                    key={z.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
                      zoneId === z.id
                        ? "border-brand-green bg-brand-green/5"
                        : "border-brand-black/10 hover:border-brand-black/30"
                    }`}
                  >
                    <div>
                      <input
                        type="radio"
                        name="zone"
                        className="sr-only"
                        checked={zoneId === z.id}
                        onChange={() => setZoneId(z.id)}
                      />
                      <p className="font-semibold">{z.name}</p>
                      <p className="text-xs text-brand-black/60">
                        {z.area_label} · ~{z.eta_minutes} min
                      </p>
                    </div>
                    <span className="font-bold">{formatNgn(z.fee_ngn)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="mb-4 rounded-xl bg-brand-black/3 p-3 text-sm">
            <Row label="Subtotal" value={formatNgn(priced.subtotal)} />
            {priced.discount > 0 && (
              <Row label="Bulk discount" value={`-${formatNgn(priced.discount)}`} tone="green" />
            )}
            {deliveryFee > 0 && <Row label="Delivery" value={formatNgn(deliveryFee)} />}
            <div className="my-2 border-t border-brand-black/10" />
            <Row label="Total" value={formatNgn(priced.total)} bold />
            <p className="mt-1 text-[10px] text-brand-black/50">Prices VAT-inclusive.</p>
          </div>

          <CheckoutForm
            orderType={orderType}
            zoneId={zoneId}
            zoneName={selectedZone?.name ?? null}
            priced={priced}
            onPlaced={closeCart}
          />
        </div>
      )}
    </Drawer>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "green";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-bold" : "text-brand-black/70"}>{label}</span>
      <span
        className={`${bold ? "font-bold" : ""} ${tone === "green" ? "text-brand-green-dark" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
