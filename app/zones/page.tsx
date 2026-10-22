import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatNgn } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Delivery zones",
  description:
    "Kitchen's Worth delivery coverage in Abuja: Wuse, Maitama, Garki, Asokoro, Jabi, Life Camp, Kubwa, Gwarinpa and more. Fees and ETAs per zone.",
};

export const revalidate = 60;

/**
 * /zones — every active city and its delivery zones with fees and ETAs.
 * Cities not yet activated are shown as "Coming soon" teasers.
 */
export default async function ZonesPage() {
  const supabase = await createClient();

  const [{ data: citiesActive }, { data: citiesSoon }, { data: zones }] = await Promise.all([
    supabase
      .from("cities")
      .select("id,slug,name,state,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("cities")
      .select("id,slug,name,state,is_active,sort_order")
      .eq("is_active", false)
      .order("sort_order"),
    supabase
      .from("zones")
      .select("id,city_id,name,area_label,eta_minutes,fee_ngn,is_active")
      .eq("is_active", true),
  ]);

  const zonesByCity = new Map<string, NonNullable<typeof zones>>();
  for (const z of zones ?? []) {
    const arr = zonesByCity.get(z.city_id) ?? [];
    arr.push(z);
    zonesByCity.set(z.city_id, arr);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="heading-xl">Where we deliver</h1>
        <p className="muted mt-3 max-w-2xl">
          We cook from Abuja and deliver to every major district. Fees and ETAs are per zone and are shown
          in the cart before you confirm. Lagos, Port-Harcourt and Ibadan are on the near-horizon list.
        </p>
      </header>

      {(citiesActive ?? []).map((city) => {
        const list = zonesByCity.get(city.id) ?? [];
        return (
          <section key={city.id} className="mb-10">
            <h2 className="heading-lg mb-4">
              {city.name}
              <span className="muted ml-3 text-sm font-normal">{city.state}</span>
            </h2>
            <div className="overflow-hidden rounded-2xl border border-brand-black/10 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-brand-black/5 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Zone</th>
                    <th className="px-4 py-3 font-semibold">Area covers</th>
                    <th className="px-4 py-3 font-semibold">ETA</th>
                    <th className="px-4 py-3 text-right font-semibold">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((z) => (
                    <tr key={z.id} className="border-t border-brand-black/5">
                      <td className="px-4 py-3 font-medium">{z.name}</td>
                      <td className="muted px-4 py-3">{z.area_label}</td>
                      <td className="px-4 py-3">{z.eta_minutes} min</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatNgn(z.fee_ngn)}</td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted px-4 py-6 text-center">
                        Zones coming soon, message us on WhatsApp to be notified.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {(citiesSoon ?? []).length > 0 && (
        <section className="mt-10">
          <h2 className="heading-lg mb-4">Coming soon</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {(citiesSoon ?? []).map((c) => (
              <div key={c.id} className="card flex items-center gap-3 p-4 opacity-60">
                <span className="text-2xl">🇳🇬</span>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="muted text-xs">{c.state}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="muted mt-4 text-sm">
            Business or big event in one of these cities? Talk to us, we run pop-up delivery pilots.
          </p>
        </section>
      )}
    </div>
  );
}
