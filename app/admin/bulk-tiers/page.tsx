import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { createRow, deleteRow } from "../crud-actions";

export const dynamic = "force-dynamic";

/** /admin/bulk-tiers — simple qty/threshold + discount_percent editor. */
export default async function AdminBulkTiersPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase.from("bulk_tiers").select("*").order("min_qty");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Bulk discount tiers</h1>
        <p className="muted text-sm">
          Customers get the highest applicable tier per line. Discount is VAT-inclusive.
        </p>
      </header>

      <form action={createRow.bind(null, "bulk_tiers")} className="card grid gap-3 p-5 sm:grid-cols-3">
        <input required name="min_qty" type="number" min={1} placeholder="Buy quantity (min_qty)" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input required name="discount_percent" type="number" min={1} max={100} step={0.1} placeholder="Discount %" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <button className="btn-green text-sm">+ Add tier</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-black/5 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Buy ≥</th>
              <th className="px-4 py-3 font-semibold">Save %</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((t) => (
              <tr key={t.id} className="border-t border-brand-black/5">
                <td className="px-4 py-3 font-semibold">{t.min_qty}</td>
                <td className="px-4 py-3">{Number(t.discount_percent)}%</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteRow.bind(null, "bulk_tiers", t.id)} className="inline">
                    <button
                      type="submit"
                      onClick={(e) => !confirm("Delete this tier?") && e.preventDefault()}
                      className="rounded-full border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted text-xs">
        To edit a tier, delete and re-add it. Tiers are cheap and rarely change.
      </p>
    </div>
  );
}
