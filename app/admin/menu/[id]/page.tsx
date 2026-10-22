import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { updateMenuItem } from "./actions";

export const dynamic = "force-dynamic";

/** /admin/menu/[id] — edit an existing item. */
export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase.from("menu_items").select("*").eq("id", id).single(),
    supabase.from("categories").select("id,name").eq("is_active", true).order("sort_order"),
  ]);
  if (!item) notFound();

  const action = updateMenuItem.bind(null, item.id);

  return (
    <div className="space-y-4">
      <h1 className="heading-lg">Edit: {item.name}</h1>
      <MenuItemForm
        action={action as unknown as (fd: FormData) => Promise<void>}
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        initial={item}
        submitLabel="Save changes"
      />
    </div>
  );
}
