"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Menu-item server actions. All check `is_admin`, then mutate `menu_items`
 * (and `menu_extras` for the per-item add-ons list).
 */

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/admin/login");
  return supabase;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readForm(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim();
  const category_id = String(fd.get("category_id") ?? "");
  const price_ngn = Number(fd.get("price_ngn") ?? 0);
  const description = String(fd.get("description") ?? "").trim();
  const ingredientsCsv = String(fd.get("ingredients") ?? "").trim();
  const image_url = String(fd.get("image_url") ?? "").trim();
  const sort_order = Number(fd.get("sort_order") ?? 0);
  const stock_raw = String(fd.get("stock_today") ?? "");
  return {
    name,
    category_id,
    price_ngn,
    description: description || null,
    ingredients: ingredientsCsv ? ingredientsCsv.split(",").map((s) => s.trim()).filter(Boolean) : [],
    image_url: image_url || null,
    sort_order,
    stock_today: stock_raw === "" ? null : Number(stock_raw),
    is_active: fd.get("is_active") === "on",
    is_best_seller: fd.get("is_best_seller") === "on",
    is_signature: fd.get("is_signature") === "on",
    is_spicy: fd.get("is_spicy") === "on",
    is_vegan: fd.get("is_vegan") === "on",
  };
}

export async function createMenuItem(fd: FormData) {
  const supabase = await requireAdmin();
  const form = readForm(fd);
  const slug = slugify(form.name);
  const { error } = await supabase.from("menu_items").insert({ ...form, slug });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  redirect("/admin/menu");
}

export async function updateMenuItem(id: string, fd: FormData) {
  const supabase = await requireAdmin();
  const form = readForm(fd);
  const slug = slugify(form.name);
  const { error } = await supabase.from("menu_items").update({ ...form, slug }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  redirect("/admin/menu");
}

export async function deleteMenuItem(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}
