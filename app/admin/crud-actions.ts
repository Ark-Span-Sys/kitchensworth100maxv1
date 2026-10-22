"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, slugify } from "@/lib/admin/guard";

/**
 * Generic entity CRUD actions.
 * Every table follows the same insert/update/delete pattern, so instead of
 * writing one file per section we expose a `saveRow(table, id, data)` action
 * that any admin page can call with the correct fields.
 *
 * Field-level validation lives in each page's server-side form reader.
 */

type Table =
  | "categories"
  | "menu_items"
  | "party_packs"
  | "bulk_tiers"
  | "catering_packages"
  | "cities"
  | "zones";

const PATHS: Record<Table, string> = {
  categories: "/admin/categories",
  menu_items: "/admin/menu",
  party_packs: "/admin/party-packs",
  bulk_tiers: "/admin/bulk-tiers",
  catering_packages: "/admin/catering",
  cities: "/admin/cities",
  zones: "/admin/zones",
};

export async function createRow(table: Table, fd: FormData) {
  await requireAdmin();
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const data = formToObject(fd);
  if (data.name && !data.slug) data.slug = slugify(String(data.name));
  const { error } = await supabase.from(table).insert(data);
  if (error) throw new Error(error.message);
  revalidatePath(PATHS[table]);
  if (table === "menu_items" || table === "categories") revalidatePath("/menu");
  if (table === "party_packs") revalidatePath("/party-packs");
  if (table === "bulk_tiers") revalidatePath("/bulk");
  if (table === "catering_packages") revalidatePath("/catering");
  if (table === "zones" || table === "cities") revalidatePath("/zones");
}

export async function updateRow(table: Table, id: string, fd: FormData) {
  await requireAdmin();
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const data = formToObject(fd);
  if (data.name && !data.slug) data.slug = slugify(String(data.name));
  const { error } = await supabase.from(table).update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(PATHS[table]);
}

export async function deleteRow(table: Table, id: string) {
  await requireAdmin();
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(PATHS[table]);
}

function formToObject(fd: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, vRaw] of fd.entries()) {
    if (typeof vRaw !== "string") continue;
    const v = vRaw.trim();
    if (v === "") {
      obj[k] = null;
      continue;
    }
    // Numeric coercion for anything that looks numeric or has _ngn / _percent / _qty / _order suffix
    if (/^(price_ngn|fee_ngn|sort_order|min_qty|serves_min|serves_max|eta_minutes|vat_percent|discount_percent|stock_today|price|fee|qty|order)$/.test(k) || /^.+_(ngn|percent|qty|order|minutes|min|max)$/.test(k)) {
      obj[k] = Number(v);
    } else if (v === "on") {
      obj[k] = true;
    } else if (v === "off") {
      obj[k] = false;
    } else if (v === "true" || v === "false") {
      obj[k] = v === "true";
    } else if (k.endsWith("_csv")) {
      obj[k] = v.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (k === "contents_csv") {
      obj[k] = v.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      obj[k] = v;
    }
  }
  // Checkbox unchecked values are absent from FormData — mark them false when key is is_*.
  for (const k of Object.keys(obj)) {
    if (k.startsWith("is_") && obj[k] === undefined) obj[k] = false;
  }
  return obj;
}

/**
 * The form uses checkboxes with a preceding hidden input of "off". Convert
 * "off" to false and "on" to true.
 */
export function formToObjectWithChecks(fd: FormData) {
  const obj = formToObject(fd);
  for (const [k, v] of Object.entries(obj)) {
    if (v === "off") obj[k] = false;
  }
  return obj;
}
