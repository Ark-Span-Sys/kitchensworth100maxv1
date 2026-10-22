import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { Badge } from "@/components/ui/Badge";
import { setReviewApproved } from "./actions";

export const dynamic = "force-dynamic";

interface ReviewWithRefs {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  menu_items: { name: string; slug: string } | null;
  profiles: { full_name: string | null } | null;
}

/**
 * /admin/reviews — moderation queue. Pending reviews sit on top; approved
 * ones can be hidden back to pending.
 */
export default async function AdminReviewsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("reviews")
    .select(
      "id,rating,comment,is_approved,created_at,menu_items(name,slug),profiles(full_name)",
    )
    .order("is_approved")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as ReviewWithRefs[];
  const pending = rows.filter((r) => !r.is_approved).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="heading-lg">Reviews</h1>
        <p className="muted text-sm">
          {rows.length} total · {pending} awaiting approval
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-brand-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-black/5 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Dish</th>
              <th className="px-4 py-3 font-semibold">Reviewer</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Comment</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-brand-black/5 align-top">
                <td className="px-4 py-3 font-medium">{r.menu_items?.name ?? "—"}</td>
                <td className="muted px-4 py-3">{r.profiles?.full_name ?? "Anonymous"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {"★".repeat(r.rating)}
                  <span className="text-brand-black/25">{"☆".repeat(5 - r.rating)}</span>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="line-clamp-3">{r.comment ?? <span className="muted">No comment</span>}</p>
                  <span className="muted text-xs">{new Date(r.created_at).toLocaleDateString("en-NG")}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={r.is_approved ? "green" : "outline"}>
                    {r.is_approved ? "Published" : "Pending"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    {!r.is_approved && (
                      <form action={setReviewApproved.bind(null, r.id, true)}>
                        <button className="btn-green text-xs">Approve</button>
                      </form>
                    )}
                    {r.is_approved && (
                      <form action={setReviewApproved.bind(null, r.id, false)}>
                        <button className="btn-secondary text-xs">Hide</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted px-4 py-10 text-center">
                  No reviews yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
