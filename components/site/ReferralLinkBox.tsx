"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Referral link box with a copy button. Shared by /account and /refer so the
 * "your link" card looks and behaves identically in both places.
 */
export function ReferralLinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Kitchen's Worth", text: "Get credit on your first order:", url: link });
      } catch {
        /* user dismissed the sheet */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded-xl border border-brand-black/15 bg-white px-4 py-3 text-sm outline-none"
          aria-label="Your referral link"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-black/15 bg-white px-4 text-sm font-semibold transition hover:border-brand-black"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <button
        type="button"
        onClick={share}
        className="btn-green w-full text-sm"
      >
        Share referral link
      </button>
    </div>
  );
}
