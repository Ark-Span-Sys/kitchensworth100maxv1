import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { saveSettings } from "./actions";

export const dynamic = "force-dynamic";

/** /admin/settings — WhatsApp number, tagline, VAT %, ticker, dock config. */
export default async function AdminSettingsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: s } = await supabase.from("site_settings").select("*").eq("id", 1).single();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Site settings</h1>
        <p className="muted text-sm">Brand copy, VAT, ticker messages and floating-dock configuration.</p>
      </header>

      <form action={saveSettings} className="card grid gap-4 p-6">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
            WhatsApp number (international)
          </span>
          <input
            required
            name="whatsapp_number"
            defaultValue={s?.whatsapp_number ?? "2347030606021"}
            className="w-full rounded-xl border border-brand-black/15 bg-white px-4 py-3 text-sm"
          />
          <span className="muted mt-1 block text-xs">Digits only, no + or spaces. e.g. 2347030606021</span>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
            Tagline
          </span>
          <input
            name="tagline"
            defaultValue={s?.tagline ?? "...eat well & spend less."}
            className="w-full rounded-xl border border-brand-black/15 bg-white px-4 py-3 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
            VAT percent
          </span>
          <input
            name="vat_percent"
            type="number"
            step={0.1}
            defaultValue={s?.vat_percent ?? 7.5}
            className="w-full rounded-xl border border-brand-black/15 bg-white px-4 py-3 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
            Ticker messages (one per line)
          </span>
          <textarea
            name="ticker_messages"
            rows={5}
            defaultValue={(s?.ticker_messages ?? []).join("\n")}
            className="w-full rounded-xl border border-brand-black/15 bg-white px-4 py-3 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="dock_enabled"
            defaultChecked={s?.dock_enabled ?? true}
            className="h-4 w-4 accent-brand-green"
          />
          Enable floating dock
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-black/70">
            Dock config (comma-separated slot keys)
          </span>
          <input
            name="dock_config"
            defaultValue={(s?.dock_config ?? ["menu", "party-packs", "cart", "track", "whatsapp"]).join(",")}
            className="w-full rounded-xl border border-brand-black/15 bg-white px-4 py-3 font-mono text-sm"
          />
          <span className="muted mt-1 block text-xs">
            Allowed: menu, party-packs, cart, track, whatsapp, home, catering, bulk, build
          </span>
        </label>

        <div className="flex justify-end">
          <button className="btn-green">Save settings</button>
        </div>
      </form>
    </div>
  );
}
