"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";

/** Save global site settings (WhatsApp number, ticker, tagline, dock config). */
export async function saveSettings(fd: FormData) {
  await requireAdmin();
  const supabase = await (await import("@/lib/supabase/server")).createClient();

  const ticker = String(fd.get("ticker_messages") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const dockConfig = String(fd.get("dock_config") ?? "menu,party-packs,cart,track,whatsapp")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("site_settings")
    .upsert({
      id: 1,
      whatsapp_number: String(fd.get("whatsapp_number") ?? ""),
      tagline: String(fd.get("tagline") ?? ""),
      vat_percent: Number(fd.get("vat_percent") ?? 7.5),
      ticker_messages: ticker,
      dock_enabled: fd.get("dock_enabled") === "on",
      dock_config: dockConfig,
    });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
