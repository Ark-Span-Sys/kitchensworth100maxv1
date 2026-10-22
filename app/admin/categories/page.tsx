import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { createRow, updateRow, deleteRow } from "../crud-actions";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

/**
 * /admin/categories — list + inline create + inline edit.
 * The whole page is server-rendered; the "New category" form is always open
 * at the top so adding is a one-tap flow. Each existing row expands into a
 * small edit form via a details/summary toggle.
 */
export default async function AdminCategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase.from("categories").select("*").order("sort_order");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Categories</h1>
        <p className="muted text-sm">{rows?.length ?? 0} categories</p>
      </header>

      <form action={createRow.bind(null, "categories")} className="card grid gap-3 p-5 md:grid-cols-5">
        <input required name="name" placeholder="Name" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm md:col-span-1" />
        <input name="slug" placeholder="slug (auto if blank)" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm md:col-span-1" />
        <input name="description" placeholder="Short description" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm md:col-span-2" />
        <input name="sort_order" type="number" defaultValue={0} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
        <button className="btn-green text-sm md:col-span-5">+ Add category</button>
      </form>

      <ul className="space-y-3">
        {(rows ?? []).map((c) => {
          const update = updateRow.bind(null, "categories", c.id);
          const del = deleteRow.bind(null, "categories", c.id);
          return (
            <li key={c.id} className="card p-4">
              <details>
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="muted w-8 font-mono text-xs">{c.sort_order}</span>
                    <span className="font-semibold">{c.name}</span>
                    {c.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="outline">Hidden</Badge>}
                  </div>
                  <span className="muted text-xs">Edit ▾</span>
                </summary>
                <form action={update} className="mt-4 grid gap-3 border-t border-brand-black/5 pt-4 md:grid-cols-4">
                  <input required name="name" defaultValue={c.name} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input name="slug" defaultValue={c.slug} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input name="description" defaultValue={c.description ?? ""} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm md:col-span-2" />
                  <input name="sort_order" type="number" defaultValue={c.sort_order} className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm" />
                  <input name="image_url" defaultValue={c.image_url ?? ""} placeholder="Image URL" className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm md:col-span-3" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="is_active" defaultChecked={c.is_active} className="h-4 w-4 accent-brand-green" /> Active
                  </label>
                  <div className="md:col-span-4 flex justify-end gap-3">
                    <button type="submit" className="btn-secondary text-xs">Save</button>
                  </div>
                </form>
                <form action={del} className="mt-2 text-right">
                  <button
                    type="submit"
                    onClick={(e) => !confirm(`Delete category "${c.name}"? Items in it will be orphaned.`) && e.preventDefault()}
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

      <Link href="/admin/menu" className="text-sm text-brand-green-dark hover:underline">
        Manage menu items &rarr;
      </Link>
    </div>
  );
}
