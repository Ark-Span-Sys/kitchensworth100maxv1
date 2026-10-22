import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatNgn } from "@/lib/pricing";
import { brand } from "@/lib/brand";
import { GENERIC_LINKS } from "@/lib/whatsapp";
import { getSiteSettings } from "@/lib/settings";
import { CateringEnquiryForm } from "./catering-form";

export const metadata: Metadata = {
  title: "Catering",
  description:
    "Kitchen's Worth catering for weddings, birthdays, corporate events and outdoor parties in Abuja. Live stations, plated service, or drop-and-go trays. Custom quote per headcount.",
};

export const revalidate = 60;

/**
 * /catering — event enquiry page. Form fields feed a WhatsApp message
 * (no separate inbox) which keeps the operation lean for the client.
 */
export default async function CateringPage() {
  const supabase = await createClient();
  const settings = await getSiteSettings();

  const { data: packs } = await supabase
    .from("catering_packages")
    .select("id,name,tier,price_ngn,description,image_url")
    .order("price_ngn");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-10">
        <span className="chip mb-3 bg-brand-green/20 text-brand-green">Events · Weddings · Corporate</span>
        <h1 className="heading-xl">Feeding 50 to 500? We've got the kitchen for it.</h1>
        <p className="muted mt-3 max-w-2xl">
          Our catering team handles menu design, staffing, setup and cleanup for events across Abuja. Pick a
          starting point below or send us a custom brief, we'll respond within 4 working hours.
        </p>
      </header>

      <section className="mb-16 grid gap-6 md:grid-cols-3">
        {(packs ?? []).map((p) => (
          <article key={p.id} className="card flex flex-col overflow-hidden">
            <div className="relative aspect-video bg-brand-black/5">
              {p.image_url && <Image src={p.image_url} alt={p.name} fill sizes="33vw" className="object-cover" />}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <span className="chip mb-2 self-start bg-brand-yellow/30">{p.tier}</span>
              <h2 className="heading-md">{p.name}</h2>
              <p className="muted mt-2 text-sm">{p.description}</p>
              <p className="mt-auto pt-4 font-display text-2xl font-black">
                {formatNgn(p.price_ngn)}
                <span className="muted ml-1 text-sm font-normal">/ guest</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="heading-lg">Tell us about your event</h2>
          <p className="muted mt-2 text-sm">
            Fill this form and we'll open WhatsApp with your enquiry pre-typed. Send it from your phone or
            desktop, the {brand.contact.whatsappDisplay} line is monitored 9am to 9pm daily.
          </p>
          <ul className="muted mt-6 space-y-2 text-sm">
            <li>✔ Free tasting for confirmed bookings above ₦1M</li>
            <li>✔ Custom menu design: halal, vegan, kids-friendly options</li>
            <li>✔ On-site chefs, service staff and setup included</li>
            <li>✔ Payment plan: 50% to book, 50% on the day</li>
          </ul>
        </div>
        <CateringEnquiryForm waNumber={settings.whatsapp_number} />
      </section>

      <section className="mt-16 rounded-3xl bg-brand-black p-8 text-white">
        <h2 className="heading-lg text-white">Prefer to just talk it through?</h2>
        <p className="mt-2 text-white/70">WhatsApp or call the events desk directly.</p>
        <a
          href={GENERIC_LINKS.enquiry(settings.whatsapp_number)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-green mt-6 inline-flex"
        >
          Chat on WhatsApp
        </a>
      </section>
    </div>
  );
}
