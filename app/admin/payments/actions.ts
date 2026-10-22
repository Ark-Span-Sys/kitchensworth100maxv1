"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";

/** Toggle one payment provider on/off. */
export async function toggleProvider(key: string, enabled: boolean) {
  await requireAdmin();
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const { error } = await supabase
    .from("payment_providers")
    .update({ is_enabled: enabled })
    .eq("key", key);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payments");
}

/** Persist manual bank account details used by the checkout drawer. */
export async function saveBank(fd: FormData) {
  await requireAdmin();
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      bank_name: (fd.get("bank_name") as string) || null,
      bank_account_name: (fd.get("bank_account_name") as string) || null,
      bank_account_number: (fd.get("bank_account_number") as string) || null,
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payments");
}
