"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { submitReview, type ReviewResult } from "@/app/menu/[slug]/actions";

/**
 * Review form for a single dish. Requires a signed-in account (the parent
 * decides whether to render this or a "log in to review" prompt). One review
 * per user per item — submitting again updates the pending review.
 */
export function ReviewForm({ itemId }: { itemId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, formAction, pending] = useActionState<ReviewResult | null, FormData>(
    submitReview,
    null,
  );

  if (state?.ok) {
    return (
      <div className="rounded-xl bg-brand-green/10 p-4 text-sm">
        <p className="font-semibold text-brand-green-dark">Thanks for your review!</p>
        <p className="muted mt-1">It&apos;s pending approval and will appear once our team publishes it.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
          Your rating *
        </span>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className={
                "text-2xl leading-none transition " +
                ((hover || rating) >= n ? "text-brand-yellow" : "text-brand-black/20")
              }
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <textarea
        name="comment"
        rows={3}
        placeholder="What did you think? (optional)"
        className="w-full rounded-xl border border-brand-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green"
      />

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || rating === 0}
        className="btn-green w-full disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Submitting…
          </>
        ) : (
          "Submit review"
        )}
      </button>
    </form>
  );
}
