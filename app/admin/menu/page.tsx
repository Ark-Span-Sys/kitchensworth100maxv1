import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { formatNgn } from "@/lib/pricing";
import { Badge } from "@/components/ui/Badge";
import { deleteMenuItem } from "@/app/admin/menu/actions";

export const dynamic = "force-dynamic";

/**
 * /admin/menu — table of every menu item (active or not) with quick edit
 * and delete actions. Filter by category via query string.
 */
export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const sp = await searchParams;

  let query = supabase
    .from("menu_items")
    .select("id,slug,name,price_ngn,image_url,is_active,is_best_seller,is_signature,is_spicy,is_vegan,category_id,sort_order")
    .order("sort_order")
    .order("name");

  if (sp.category) query = query.eq("category_id", sp.category);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);

  const [{ data: items }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id,name").order("sort_order"),
  ]);

  const catName = (id: string) => categories?.find((c) => c.id === id)?.name ?? "Uncategorised";

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-lg">Menu items</h1>
          <p className="muted text-sm">{items?.length ?? 0} items</p>
        </div>
        <Link href="/admin/menu/new" className="btn-green text-xs">
          + New item
        </Link>
      </header>

      <form className="card flex flex-wrap gap-3 p-4" method="get">
        <input
          name="q"
          placeholder="Search by name"
          defaultValue={sp.q ?? ""}
          className="flex-1 rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue={sp.category ?? ""}
          className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="btn-secondary text-xs">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-brand-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-black/5 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Badges</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it) => (
              <tr key={it.id} className="border-t border-brand-black/5">
                <td className="px-4 py-3 font-medium">{it.name}</td>
                <td className="muted px-4 py-3">{catName(it.category_id)}</td>
                <td className="px-4 py-3">{formatNgn(it.price_ngn)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {it.is_signature && <Badge tone="green">Sig</Badge>}
                    {it.is_best_seller && <Badge tone="yellow">Best</Badge>}
                    {it.is_spicy && <Badge tone="red">Spicy</Badge>}
                    {it.is_vegan && <Badge tone="outline">Vegan</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">{it.is_active ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link href={`/admin/menu/${it.id}`} className="btn-secondary text-xs">
                      Edit
                    </Link>
                    <form action={deleteMenuItem.bind(null, it.id)}>
                      <button
                        type="submit"
                        onClick={(e) => {
                          if (!confirm(`Delete "${it.name}"?`)) e.preventDefault();
                        }}
                        className="rounded-full border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="muted px-4 py-10 text-center">
                  No items match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
