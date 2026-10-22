import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { createRow, updateRow, deleteRow } from "../crud-actions";
import { formatNgn } from "@/lib/pricing";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

/** /admin/party-packs — list + inline create/edit. */
export default async function AdminPartyPacksPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase.from("party_packs").select("*").order("price_ngn");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Party packs</h1>
        <p className="muted text-sm">{rows?.length ?? 0} packs</p>
      </header>

      <form action={createRow.bind(null, "party_packs")} className="card grid gap-3 p-5 md:grid-cols-4">
        <input required name="name" placeholder="Name" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input required name="price_ngn" type="number" min={0} placeholder="Price ₦" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input name="serves_min" type="number" placeholder="Serves min" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input name="serves_max" type="number" placeholder="Serves max" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input name="contents_csv" placeholder="Contents (comma-separated)" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm md:col-span-3" />
        <input name="image_url" placeholder="Image URL" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4 accent-brand-green" /> Active
        </label>
        <button className="btn-green text-sm md:col-start-4">+ Add pack</button>
      </form>

      <ul className="space-y-3">
        {(rows ?? []).map((p) => {
          const update = updateRow.bind(null, "party_packs", p.id);
          const del = deleteRow.bind(null, "party_packs", p.id);
          return (
            <li key={p.id} className="card p-4">
              <details>
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{p.name}</span>
                    <span className="muted text-sm">
                      Serves {p.serves_min} to {p.serves_max} · {formatNgn(p.price_ngn)}
                    </span>
                    {!p.is_active && <Badge tone="outline">Hidden</Badge>}
                  </div>
                  <span className="muted text-xs">Edit ▾</span>
                </summary>
                <form action={update} className="mt-4 grid gap-3 border-t border-brand-black/5 pt-4 md:grid-cols-4">
                  <input required name="name" defaultValue={p.name} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input required name="price_ngn" type="number" defaultValue={p.price_ngn} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input name="serves_min" type="number" defaultValue={p.serves_min} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input name="serves_max" type="number" defaultValue={p.serves_max} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input name="contents_csv" defaultValue={(p.contents ?? []).join(", ")} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm md:col-span-3" />
                  <input name="image_url" defaultValue={p.image_url ?? ""} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="is_active" defaultChecked={p.is_active} className="h-4 w-4 accent-brand-green" /> Active
                  </label>
                  <div className="md:col-span-4 flex justify-end">
                    <button type="submit" className="btn-secondary text-xs">Save</button>
                  </div>
                </form>
                <form action={del} className="mt-2 text-right">
                  <button
                    type="submit"
                    onClick={(e) => !confirm(`Delete "${p.name}"?`) && e.preventDefault()}
                    className="rounded-full border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </form>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
