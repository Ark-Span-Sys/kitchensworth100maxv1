import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { createRow, updateRow, deleteRow } from "../crud-actions";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

/**
 * /admin/cities — activate/deactivate a city so its zones surface on the
 * checkout drawer and public /zones page. New cities can be added here.
 */
export default async function AdminCitiesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase.from("cities").select("*").order("sort_order");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Cities</h1>
        <p className="muted text-sm">
          Activate a city to publish its zones to customers. Deactivating hides every zone in that city from
          the cart drawer and the public /zones page.
        </p>
      </header>

      <form action={createRow.bind(null, "cities")} className="card grid gap-3 p-5 md:grid-cols-4">
        <input required name="name" placeholder="City (e.g. Enugu)" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input name="slug" placeholder="slug (auto if blank)" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input required name="state" placeholder="State" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input name="sort_order" type="number" defaultValue={100} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm md:col-span-3">
          <input type="checkbox" name="is_active" className="h-4 w-4 accent-brand-green" /> Activate now
        </label>
        <button className="btn-green text-sm">+ Add city</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-black/5 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((c) => (
              <tr key={c.id} className="border-t border-brand-black/5">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="muted px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">{c.state}</td>
                <td className="px-4 py-3">
                  {c.is_active ? <Badge tone="green">Live</Badge> : <Badge tone="outline">Hidden</Badge>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <form action={updateRow.bind(null, "cities", c.id)} className="inline">
                      <input type="hidden" name="is_active" value={c.is_active ? "off" : "on"} />
                      <button type="submit" className="btn-secondary text-xs">
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={deleteRow.bind(null, "cities", c.id)} className="inline">
                      <button
                        type="submit"
                        onClick={(e) => !confirm(`Delete ${c.name}? Zones in it will be orphaned.`) && e.preventDefault()}
                        className="rounded-full border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
