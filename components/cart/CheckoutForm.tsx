"use client";
import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCart } from "./CartProvider";
import { createClient } from "@/lib/supabase/client";
import { formatNgn, type PricedCart } from "@/lib/pricing";
import type { PaymentProviderKey } from "@/lib/types";

interface Provider {
  key: PaymentProviderKey;
  label: string;
  description: string | null;
  is_enabled?: boolean;
}

/**
 * Checkout form: name, phone, address (if delivery), payment provider, submit.
 *
 * Two submit paths:
 *   1. Manual bank: POST /api/orders -> save order -> immediately open WhatsApp
 *   2. Monnify:     POST /api/monnify/initialize -> redirect to Monnify; the
 *                   webhook fires the WhatsApp handoff on success (see
 *                   /track?new=<code> which auto-opens WhatsApp).
 *
 * If the popup is blocked, we render an "Open WhatsApp" fallback link.
 */
export function CheckoutForm({
  orderType,
  zoneId,
  zoneName,
  priced,
  onPlaced,
}: {
  orderType: "pickup" | "delivery";
  zoneId: string | null;
  zoneName: string | null;
  priced: PricedCart;
  onPlaced: () => void;
}) {
  const { lines, clear } = useCart();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [bank, setBank] = useState<{ bank_name: string; bank_account_name: string; bank_account_number: string } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [provider, setProvider] = useState<PaymentProviderKey>("manual_bank");
  const [bankPaid, setBankPaid] = useState(false);
  const [credit, setCredit] = useState(0);
  const [applyCredits, setApplyCredits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    order_number: string;
    wa_link: string | null;
    checkout_url: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/bootstrap/cart")
      .then((r) => r.json())
      .then((d) => {
        setProviders(d.providers ?? []);
        setBank(d.bank ?? null);
        const first = d.providers?.find((p: Provider) => p.is_enabled);
        if (first) setProvider(first.key);
      })
      .catch(() => {});
  }, []);

  // Load any KW credit the signed-in customer holds (RLS scopes to own row).
  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from("profiles")
          .select("credit_balance_ngn")
          .eq("id", user.id)
          .single()
          .then(({ data }) => setCredit(Math.max(0, data?.credit_balance_ngn ?? 0)));
      })
      .catch(() => {});
  }, []);

  const creditToApply = applyCredits ? Math.min(credit, priced.total) : 0;
  const payable = Math.max(0, priced.total - creditToApply);
  const fullyCovered = creditToApply > 0 && payable === 0;
  const creditOn = applyCredits && credit > 0;
  const effectiveProvider: PaymentProviderKey = creditOn ? "manual_bank" : provider;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) return setError("Please enter your name.");
    if (!phone.trim() || phone.trim().length < 10) return setError("Please enter a valid phone number.");
    if (orderType === "delivery") {
      if (!zoneId) return setError("Please select a delivery zone.");
      if (!address.trim()) return setError("Please enter your delivery address.");
    }
    if (effectiveProvider === "manual_bank" && !bankPaid && !fullyCovered) {
      return setError("Please confirm you have made the bank transfer.");
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        order_type: orderType,
        zone_id: zoneId,
        zone_name: zoneName,
        address: orderType === "delivery" ? address.trim() : null,
        notes: notes.trim() || null,
        payment_provider: effectiveProvider,
        use_credit: creditOn,
        lines,
        subtotal: priced.subtotal,
        discount: priced.discount,
        delivery_fee: priced.deliveryFee,
        total: priced.total,
      };

      if (effectiveProvider === "manual_bank") {
        const r = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Could not save your order.");
        setResult({ order_number: d.order_number, wa_link: d.wa_link, checkout_url: null });
        if (d.wa_link) {
          const w = window.open(d.wa_link, "_blank", "noopener,noreferrer");
          if (!w) {
            /* popup blocked — the fallback link will be shown */
          }
        }
        clear();
      } else {
        const r = await fetch("/api/monnify/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Could not start payment.");
        window.location.href = d.checkout_url;
      }
      onPlaced();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-brand-green/40 bg-brand-green/5 p-4">
        <p className="text-sm font-semibold">Order placed 🎉</p>
        <p className="mt-1 text-xs text-brand-black/70">
          Your order code is <b>{result.order_number}</b>. Send it via WhatsApp to confirm payment.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs">{result.order_number}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.order_number);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg p-2 hover:bg-white"
            aria-label="Copy order code"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        {result.wa_link && (
          <a href={result.wa_link} target="_blank" rel="noopener noreferrer" className="btn-green mt-3 w-full">
            <ExternalLink size={16} /> Open WhatsApp
          </a>
        )}
        <a href={`/track?code=${result.order_number}`} className="btn-secondary mt-2 w-full">
          Track my order
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Input label="Your name *" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input
        label="Phone number *"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        placeholder="08012345678"
      />
      <Input
        label="Email (optional)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        hint="Only used for Monnify receipts."
      />
      {orderType === "delivery" && (
        <Input
          label="Delivery address *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="House number, street, area"
        />
      )}
      <Input
        label="Order note (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Allergies, spice level, extra napkins..."
      />

      {/* KW credit redemption (signed-in customers with a balance only) */}
      {credit > 0 && (
        <div className="rounded-xl border border-brand-green/40 bg-brand-green/10 p-3">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="font-semibold text-brand-green-dark">Apply your credit</span>
              <span className="block text-xs text-brand-black/60">
                You have {formatNgn(credit)} in KW credit
              </span>
            </span>
            <input
              type="checkbox"
              checked={applyCredits}
              onChange={(e) => setApplyCredits(e.target.checked)}
              className="mt-0.5 h-5 w-5 accent-brand-green-dark"
            />
          </label>
          {creditOn && (
            <p className="mt-2 text-xs text-brand-black/70">
              −{formatNgn(creditToApply)} applied · you pay {formatNgn(payable)}
              {fullyCovered && ", nothing left to pay 🎉"}
            </p>
          )}
        </div>
      )}

      {/* Payment provider selection */}
      {!creditOn && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-black/60">
            Payment Method
          </h3>
          <div className="space-y-2">
            {providers.map((p) => (
              <label
                key={p.key}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                  provider === p.key
                    ? "border-brand-green bg-brand-green/5"
                    : "border-brand-black/10 hover:border-brand-black/30"
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  className="mt-1"
                  checked={provider === p.key}
                  onChange={() => setProvider(p.key)}
                />
                <div>
                  <p className="font-semibold">{p.label}</p>
                  {p.description && <p className="text-xs text-brand-black/60">{p.description}</p>}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {(creditOn || provider === "manual_bank") && bank && !fullyCovered && (
        <div className="rounded-xl border border-brand-black/10 bg-brand-black/3 p-3 text-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-black/60">
            Transfer to
          </p>
          <div className="space-y-1">
            <BankRow label="Bank" value={bank.bank_name} />
            <BankRow label="Account name" value={bank.bank_account_name} />
            <BankRow label="Account number" value={bank.bank_account_number} mono />
          </div>
          <p className="mt-2 text-xs text-brand-black/60">
            Amount: <b>{formatNgn(creditOn ? payable : priced.total)}</b>
          </p>
          <label className="mt-3 flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={bankPaid}
              onChange={(e) => setBankPaid(e.target.checked)}
              className="mt-0.5"
            />
            <span>I have made the payment of {formatNgn(creditOn ? payable : priced.total)}.</span>
          </label>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="sticky bottom-0 z-10 mt-3 pt-4 bg-gradient-to-t from-white via-white/95 to-transparent pb-safe">
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Placing order…
            </>
          ) : fullyCovered ? (
            "Place order (paid with credits)"
          ) : effectiveProvider === "manual_bank" ? (
            "Place Order via WhatsApp"
          ) : (
            `Continue to ${providers.find((p) => p.key === provider)?.label ?? "Payment"}`
          )}
        </Button>
      </div>
    </form>
  );
}

function BankRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-brand-black/60">{label}</span>
      <div className="flex items-center gap-1">
        <span className={mono ? "font-mono" : "font-semibold"}>{value}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded p-1 hover:bg-brand-black/5"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
}
