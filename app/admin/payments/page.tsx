import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { toggleProvider, saveBank } from "@/app/admin/payments/actions";

export const dynamic = "force-dynamic";

/** /admin/payments — three provider toggles + manual-bank account fields. */
export default async function AdminPaymentsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: providers }, { data: settings }] = await Promise.all([
    supabase.from("payment_providers").select("*").order("sort_order"),
    supabase
      .from("site_settings")
      .select("bank_name,bank_account_name,bank_account_number")
      .eq("id", 1)
      .single(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="heading-lg">Payments</h1>
        <p className="muted text-sm">
          Toggles which providers customers see at checkout. Manual bank transfer also needs account
          details set below.
        </p>
      </header>

      <section className="card divide-y divide-brand-black/5 p-5">
        <h2 className="heading-md mb-3">Providers</h2>
        {(providers ?? []).map((p) => {
          const next = !p.is_enabled;
          const bound = toggleProvider.bind(null, p.key, next);
          return (
            <form key={p.key} action={bound} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="font-semibold">{p.label}</div>
                <div className="muted text-xs">{p.description ?? p.key}</div>
                <div className="muted mt-1 font-mono text-[10px]">{p.key}</div>
              </div>
              <button
                type="submit"
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  p.is_enabled ? "bg-brand-green text-brand-black" : "bg-brand-black/10 text-brand-black/60"
                }`}
              >
                {p.is_enabled ? "Enabled · click to disable" : "Disabled · click to enable"}
              </button>
            </form>
          );
        })}
      </section>

      <section className="card p-5">
        <h2 className="heading-md mb-3">Manual bank transfer details</h2>
        <p className="muted mb-3 text-xs">
          Shown in the checkout drawer only when the <b>manual_bank</b> provider is enabled. Exposed to the
          public through the <code>view_bank()</code> RPC.
        </p>
        <form action={saveBank} className="grid gap-3 md:grid-cols-3">
          <input
            name="bank_name"
            defaultValue={settings?.bank_name ?? ""}
            placeholder="Bank name (e.g. Zenith)"
            className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm"
          />
          <input
            name="bank_account_name"
            defaultValue={settings?.bank_account_name ?? ""}
            placeholder="Account name"
            className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm"
          />
          <input
            name="bank_account_number"
            defaultValue={settings?.bank_account_number ?? ""}
            placeholder="Account number (10 digits)"
            inputMode="numeric"
            className="rounded-xl border border-brand-black/15 bg-white px-3 py-2 text-sm"
          />
          <div className="md:col-span-3 flex justify-end">
            <button className="btn-green text-xs">Save account details</button>
          </div>
        </form>
      </section>
    </div>
  );
}
