import { cache } from "react";
import { createClient } from "./supabase/server";
import type { SiteSettings } from "./types";

/**
 * Cached site-settings loader.
 * React's `cache()` dedupes calls within a single request, so header,
 * footer, dock, and any RSC that needs settings share one Supabase round-trip.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (error || !data) {
    // Safe fallbacks if the row is missing (e.g. before seed runs).
    return {
      whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2347030606021",
      bank_name: null,
      bank_account_name: null,
      bank_account_number: null,
      opening_hours: {},
      ticker_messages: [],
      tagline: "...eat well & spend less.",
      vat_percent: 7.5,
      dock_enabled: true,
      dock_config: ["menu", "party-packs", "cart", "track", "whatsapp"],
    };
  }
  return data as SiteSettings;
});
