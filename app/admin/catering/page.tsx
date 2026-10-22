import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { createRow, updateRow, deleteRow } from "../crud-actions";
import { formatNgn } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/** /admin/catering — event catering packages (price per head, tier label). */
export default async function AdminCateringPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase.from("catering_packages").select("*").order("price_ngn");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Catering packages</h1>
        <p className="muted text-sm">Guideline pricing per guest shown on the public /catering page.</p>
      </header>

      <form action={createRow.bind(null, "catering_packages")} className="card grid gap-3 p-5 md:grid-cols-4">
        <input required name="name" placeholder="Package name" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input required name="tier" placeholder="Tier (Basic/Premium/Signature)" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input required name="price_ngn" type="number" placeholder="Price per guest ₦" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input name="image_url" placeholder="Image URL" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input name="description" placeholder="Short description" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm md:col-span-4" />
        <button className="btn-green text-sm md:col-span-4">+ Add package</button>
      </form>

      <ul className="space-y-3">
        {(rows ?? []).map((p) => {
          const update = updateRow.bind(null, "catering_packages", p.id);
          const del = deleteRow.bind(null, "catering_packages", p.id);
          return (
            <li key={p.id} className="card p-4">
              <details>
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold">{p.name}</span>
                    <span className="muted ml-2 text-sm">{p.tier} · {formatNgn(p.price_ngn)}/guest</span>
                  </div>
                  <span className="muted text-xs">Edit ▾</span>
                </summary>
                <form action={update} className="mt-4 grid gap-3 border-t border-brand-black/5 pt-4 md:grid-cols-4">
                  <input required name="name" defaultValue={p.name} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input required name="tier" defaultValue={p.tier} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input required name="price_ngn" type="number" defaultValue={p.price_ngn} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input name="image_url" defaultValue={p.image_url ?? ""} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input name="description" defaultValue={p.description ?? ""} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm md:col-span-4" />
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
