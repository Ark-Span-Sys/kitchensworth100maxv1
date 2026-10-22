import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { createMenuItem } from "./actions";

export const dynamic = "force-dynamic";

/** /admin/menu/new — create form. */
export default async function NewMenuItemPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .eq("is_active", true)
    .order("sort_order");

  const opts = (categories ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-4">
      <h1 className="heading-lg">New menu item</h1>
      <MenuItemFormServer categories={opts} action={createMenuItem} />
    </div>
  );
}

// Server wrapper so we can bind the FormData action to a plain prop.
async function MenuItemFormServer({
  categories,
  action,
}: {
  categories: { id: string; name: string }[];
  action: (fd: FormData) => Promise<void>;
}) {
  return <MenuItemForm categories={categories} action={action} submitLabel="Create item" />;
}
