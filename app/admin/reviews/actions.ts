"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";

/**
 * Approve or hide (un-approve) a review. Logs the action to `admin_audit` and
 * busts both the admin queue and the public item page cache.
 */
export async function setReviewApproved(reviewId: string, approved: boolean) {
  const supabase = await requireAdmin();

  const { data: review } = await supabase
    .from("reviews")
    .select("id,item_id")
    .eq("id", reviewId)
    .single();
  if (!review) throw new Error("Review not found");

  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: approved })
    .eq("id", reviewId);
  if (error) throw new Error(error.message);

  await supabase.from("admin_audit").insert({
    action: approved ? "review_approve" : "review_hide",
    entity: "reviews",
    entity_id: reviewId,
    payload: { item_id: review.item_id },
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/menu");
}
