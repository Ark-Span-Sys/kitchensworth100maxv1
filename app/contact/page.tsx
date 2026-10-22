import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { getSiteSettings } from "@/lib/settings";
import { GENERIC_LINKS } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Kitchen's Worth on WhatsApp, phone or Instagram. We answer orders, party-pack quotes, catering briefs and delivery questions.",
};

/**
 * /contact — the fastest channels first. WhatsApp is presented as the primary
 * route because that's how the checkout handoff works.
 */
export default async function ContactPage() {
  const s = await getSiteSettings();

  const channels = [
    {
      label: "WhatsApp",
      value: brand.contact.whatsappDisplay,
      href: GENERIC_LINKS.orderIntent(s.whatsapp_number),
      hint: "Fastest, replies in 2 to 5 min during service hours.",
      external: true,
    },
    {
      label: "Instagram",
      value: `@${brand.contact.instagram}`,
      href: brand.contact.instagramUrl,
      hint: "DMs open daily, best for menu questions.",
      external: true,
    },
    {
      label: "Catering desk",
      value: "/catering",
      href: "/catering",
      hint: "Send an event brief, quote within 4 working hours.",
      external: false,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="heading-xl">Talk to us</h1>
        <p className="muted mt-3">
          The team reads every message. For active orders, please have your KW-code ready.
        </p>
      </header>

      <div className="space-y-3">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="card flex items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <div className="muted text-xs uppercase tracking-widest">{c.label}</div>
              <div className="font-display text-xl font-bold">{c.value}</div>
              <div className="muted mt-1 text-sm">{c.hint}</div>
            </div>
            <span className="text-brand-green text-2xl">→</span>
          </a>
        ))}
      </div>

      <section className="mt-10 rounded-3xl bg-brand-black p-6 text-white">
        <h2 className="heading-md text-white">Opening hours</h2>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {Object.entries(s.opening_hours).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="capitalize text-white/60">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="heading-md mb-2">Kitchen address</h2>
        <p className="muted text-sm">
          Wuse 2, Abuja (FCT), Nigeria. Pick-up available from the front counter, parking on the side street.
        </p>
      </section>
    </div>
  );
}
