import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * Dynamic sitemap: static marketing pages plus every active menu item.
 * Cached by Next ISR; regenerated every 12h on the production host.
 */
export const revalidate = 43200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const statics: MetadataRoute.Sitemap = [
    "",
    "/menu",
    "/party-packs",
    "/bulk",
    "/catering",
    "/build",
    "/zones",
    "/track",
    "/about",
    "/contact",
    "/policy",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: p === "/menu" ? "daily" : "weekly",
    priority: p === "" ? 1 : p.startsWith("/menu") ? 0.9 : 0.6,
  }));

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("menu_items")
    .select("slug,updated_at")
    .eq("is_active", true);

  const dynamic: MetadataRoute.Sitemap = (items ?? []).map((it) => ({
    url: `${base}/menu/${it.slug}`,
    lastModified: it.updated_at ? new Date(it.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...statics, ...dynamic];
}
