import { brand } from "./brand";
import { formatNgn } from "./pricing";
import type { CartLine, SiteSettings } from "./types";

/**
 * WhatsApp order-card builder.
 *
 * Normalises Nigerian numbers to international format for `wa.me` links:
 *  - strips `+`, spaces, dashes, parentheses
 *  - drops a leading `00`
 *  - converts a leading `0` (local NG format) to `234`
 *  - leaves anything already in international form untouched
 */
export function normaliseNumber(raw: string | null | undefined): string {
  if (!raw) return "2347030606021"; // fallback
  let s = raw.replace(/[^\d]/g, "");
  if (s.startsWith("00")) s = s.slice(2);
  if (s.startsWith("0")) s = "234" + s.slice(1);
  return s;
}

export function buildWaLink(number: string, text: string): string {
  return `https://wa.me/${normaliseNumber(number)}?text=${encodeURIComponent(text)}`;
}

export interface OrderForMessage {
  order_number: string;
  customer_name: string;
  phone: string;
  order_type: "pickup" | "delivery";
  zone_name?: string | null;
  address?: string | null;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  credit_applied?: number;
  payable?: number;
  payment_line: string;
}

/**
 * Build the WhatsApp order card body. Uses `*bold*` markers, one item per
 * bullet, and a fixed payment line so the kitchen team can scan it fast.
 */
export function buildOrderMessage(o: OrderForMessage): string {
  const lines: string[] = [];
  lines.push(`*New ${brand.name} Order ${o.order_number}*`);
  lines.push(`👤 Name: ${o.customer_name || "Guest"}`);
  lines.push(`📞 Phone: ${o.phone}`);
  lines.push(`🛍️ Type: ${o.order_type === "delivery" ? "Delivery" : "Pickup"}`);
  if (o.order_type === "delivery") {
    if (o.zone_name) lines.push(`🚚 Zone: ${o.zone_name}`);
    if (o.address) lines.push(`📍 Address: ${o.address}`);
  }
  lines.push(`*Items*`);
  for (const l of o.lines) {
    const extras = l.extras?.length
      ? ` (+${l.extras.map((e) => e.name).join(", ")})`
      : "";
    lines.push(`• ${l.quantity}× ${l.name}${extras}: ${formatNgn(l.unitPriceNgn * l.quantity)}`);
  }
  const parts = [`Subtotal: ${formatNgn(o.subtotal)}`];
  if (o.discount > 0) parts.push(`Bulk discount: -${formatNgn(o.discount)}`);
  if (o.delivery_fee > 0) parts.push(`Delivery: ${formatNgn(o.delivery_fee)}`);
  lines.push(parts.join("   "));
  if (o.credit_applied && o.credit_applied > 0) {
    lines.push(`Credits applied: -${formatNgn(o.credit_applied)}`);
    lines.push(`*Total: ${formatNgn(o.total)}*   Payable: ${formatNgn(o.payable ?? o.total - o.credit_applied)}`);
  } else {
    lines.push(`*Total: ${formatNgn(o.total)}*`);
  }
  lines.push(`💳 Payment: ${o.payment_line}`);
  return lines.join("\n");
}

export function buildOrderWaLink(order: OrderForMessage, settings: Pick<SiteSettings, "whatsapp_number">) {
  return buildWaLink(settings.whatsapp_number, buildOrderMessage(order));
}

/** Convenience links used across the site (dock, floating bubble, contact form). */
export const GENERIC_LINKS = {
  orderIntent: (n: string) =>
    buildWaLink(n, `Hello ${brand.name}, I'd like to place an order.`),
  enquiry: (n: string) =>
    buildWaLink(n, `Hello ${brand.name}, I have an enquiry.`),
  checkingOnOrder: (n: string, code: string) =>
    buildWaLink(n, `Hi ${brand.name}, I'm checking on order ${code}.`),
};
