import { describe, it, expect } from "vitest";
import {
  buildOrderMessage,
  buildWaLink,
  normaliseNumber,
  GENERIC_LINKS,
  type OrderForMessage,
} from "../whatsapp";
import type { CartLine } from "../../lib/types";

describe("normaliseNumber", () => {
  it("strips spaces, dashes, parentheses and the leading +", () => {
    expect(normaliseNumber("+234 (703) 060-6021")).toBe("2347030606021");
  });

  it("converts a leading local 0 to the 234 country code", () => {
    expect(normaliseNumber("07030606021")).toBe("2347030606021");
  });

  it("strips a leading 00 international prefix", () => {
    expect(normaliseNumber("002347030606021")).toBe("2347030606021");
  });

  it("leaves an already-international number untouched", () => {
    expect(normaliseNumber("2347030606021")).toBe("2347030606021");
  });
});

describe("buildWaLink", () => {
  it("produces a wa.me URL with URL-encoded text", () => {
    const url = buildWaLink("07030606021", "Hello there");
    expect(url).toBe("https://wa.me/2347030606021?text=Hello%20there");
  });

  it("preserves WhatsApp bold markers when encoded", () => {
    const url = buildWaLink("2347030606021", "*Bold*");
    expect(decodeURIComponent(url.split("?text=")[1])).toBe("*Bold*");
  });
});

describe("buildOrderMessage", () => {
  const lines: CartLine[] = [
    {
      key: "menu_item:rice",
      kind: "menu_item",
      refId: "rice",
      name: "Jollof Rice",
      unitPriceNgn: 1500,
      quantity: 2,
    },
    {
      key: "menu_item:chick",
      kind: "menu_item",
      refId: "chick",
      name: "Fried Rice & Chicken",
      unitPriceNgn: 2500,
      quantity: 1,
      extras: [{ name: "Extra chicken", priceNgn: 800 }],
    },
  ];

  const base: OrderForMessage = {
    order_number: "KW-ABC123",
    customer_name: "Ada",
    phone: "08012345678",
    order_type: "delivery",
    zone_name: "Wuse & Maitama",
    address: "12 Ademola St, Wuse 2",
    lines,
    subtotal: 6300,
    discount: 0,
    delivery_fee: 2500,
    total: 8800,
    payment_line: "Bank transfer, proof to follow",
  };

  it("renders the header, contact block, and total in WhatsApp bold", () => {
    const msg = buildOrderMessage(base);
    expect(msg).toContain("*New Kitchen's Worth Order KW-ABC123*");
    expect(msg).toContain("👤 Name: Ada");
    expect(msg).toContain("📞 Phone: 08012345678");
    expect(msg).toContain("🛍️ Type: Delivery");
    expect(msg).toContain("*Total: ₦8,800*");
  });

  it("includes zone and address only for delivery orders", () => {
    const pickup = buildOrderMessage({ ...base, order_type: "pickup" });
    expect(pickup).not.toContain("🚚 Zone");
    expect(pickup).not.toContain("📍 Address");
  });

  it("renders one bullet per line and appends extras", () => {
    const msg = buildOrderMessage(base);
    expect(msg).toContain("• 2× Jollof Rice: ₦3,000");
    expect(msg).toContain("• 1× Fried Rice & Chicken (+Extra chicken): ₦2,500");
  });

  it("adds a bulk-discount line when > 0", () => {
    const msg = buildOrderMessage({ ...base, discount: 630 });
    expect(msg).toContain("Bulk discount: -₦630");
  });

  it("falls back to Guest when customer_name is empty", () => {
    const msg = buildOrderMessage({ ...base, customer_name: "" });
    expect(msg).toContain("👤 Name: Guest");
  });
});

describe("GENERIC_LINKS", () => {
  it("orderIntent points to wa.me with a pre-filled greeting", () => {
    const url = GENERIC_LINKS.orderIntent("07030606021");
    expect(url).toMatch(/^https:\/\/wa\.me\/2347030606021\?text=/);
    expect(decodeURIComponent(url)).toContain("I'd like to place an order");
  });

  it("checkingOnOrder interpolates the order code", () => {
    const url = GENERIC_LINKS.checkingOnOrder("07030606021", "KW-XYZ789");
    expect(decodeURIComponent(url)).toContain("checking on order KW-XYZ789");
  });
});
