"use server";

import { createClient } from "@/lib/supabase/server";

export interface ReviewResult {
  error?: string;
  ok?: boolean;
}

/**
 * Submit (or update) a review for a menu item. Requires a signed-in KW
 * account; new reviews start un-approved and appear once an admin approves.
 */
export async function submitReview(
  _prev: ReviewResult | null,
  formData: FormData,
): Promise<ReviewResult> {
  const itemId = typeof formData.get("item_id") === "string" ? (formData.get("item_id") as string) : "";
  const rating = Number(formData.get("rating"));
  const comment = (typeof formData.get("comment") === "string" ? (formData.get("comment") as string) : "").trim();

  if (!itemId) return { error: "Missing item." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Pick a rating from 1 to 5." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to leave a review." };

  const { error } = await supabase.from("reviews").upsert(
    {
      item_id: itemId,
      user_id: user.id,
      rating,
      comment: comment || null,
      is_approved: false,
    },
    { onConflict: "user_id,item_id" },
  );
  if (error) return { error: error.message };

  return { ok: true };
}
