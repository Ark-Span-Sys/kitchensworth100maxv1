import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { createRow, updateRow, deleteRow } from "../crud-actions";
import { formatNgn } from "@/lib/pricing";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

/**
 * /admin/zones — grouped by city. Each zone has a name, area label, ETA and fee.
 * New zones can be added to any city (including cities that aren't active yet).
 */
export default async function AdminZonesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: cities }, { data: zones }] = await Promise.all([
    supabase.from("cities").select("id,name,slug,is_active").order("sort_order"),
    supabase.from("zones").select("*").order("name"),
  ]);

  const zonesByCity = new Map<string, NonNullable<typeof zones>>();
  for (const z of zones ?? []) {
    const arr = zonesByCity.get(z.city_id) ?? [];
    arr.push(z);
    zonesByCity.set(z.city_id, arr);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Delivery zones</h1>
        <p className="muted text-sm">Grouped by city. Only zones in active cities appear at checkout.</p>
      </header>

      <form action={createRow.bind(null, "zones")} className="card grid gap-3 p-5 md:grid-cols-5">
        <select required name="city_id" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm">
          {(cities ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input required name="name" placeholder="Zone name (Wuse 2)" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input name="area_label" placeholder="Area covers" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm md:col-span-2" />
        <input required name="fee_ngn" type="number" placeholder="Fee ₦" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <input required name="eta_minutes" type="number" placeholder="ETA min" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm md:col-span-3">
          <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4 accent-brand-green" /> Active
        </label>
        <button className="btn-green text-sm md:col-span-2">+ Add zone</button>
      </form>

      {(cities ?? []).map((c) => {
        const list = zonesByCity.get(c.id) ?? [];
        return (
          <section key={c.id}>
            <h2 className="heading-md mb-3">
              {c.name}
              {!c.is_active && <Badge tone="outline">City hidden</Badge>}
            </h2>
            <ul className="space-y-2">
              {list.map((z) => {
                const update = updateRow.bind(null, "zones", z.id);
                const del = deleteRow.bind(null, "zones", z.id);
                return (
                  <li key={z.id} className="card p-3">
                    <details>
                      <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{z.name}</span>
                        <span className="muted">
                          {formatNgn(z.fee_ngn)} · {z.eta_minutes} min · {z.area_label}
                        </span>
                      </summary>
                      <form action={update} className="mt-3 grid gap-2 border-t border-brand-black/5 pt-3 md:grid-cols-4">
                        <input name="name" defaultValue={z.name} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                        <input name="area_label" defaultValue={z.area_label ?? ""} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                        <input name="fee_ngn" type="number" defaultValue={z.fee_ngn} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                        <input name="eta_minutes" type="number" defaultValue={z.eta_minutes} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="is_active" defaultChecked={z.is_active} className="h-4 w-4 accent-brand-green" /> Active
                        </label>
                        <div className="md:col-span-3 flex justify-end">
                          <button type="submit" className="btn-secondary text-xs">Save</button>
                        </div>
                      </form>
                      <form action={del} className="mt-2 text-right">
                        <button
                          type="submit"
                          onClick={(e) => !confirm(`Delete zone "${z.name}"?`) && e.preventDefault()}
                          className="rounded-full border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </details>
                  </li>
                );
              })}
              {list.length === 0 && <li className="muted text-sm">No zones, add one above.</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
