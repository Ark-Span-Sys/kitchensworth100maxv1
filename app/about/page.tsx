import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description:
    "Kitchen's Worth is a Nigerian quick-service kitchen based in Abuja, cooking honest, well-priced plates, party packs and catering for the city that works hard.",
};

/**
 * /about — brand story + values. Kept short and voice-forward to match the
 * "...eat well & spend less." tagline.
 */
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="heading-xl">Our story</h1>
      <p className="mt-4 text-lg leading-relaxed">
        {brand.name} started in a rented kitchen off Wuse 2 with one wok, one griddle and a WhatsApp
        broadcast list. We were cooking for friends who wanted proper Nigerian food: heavy on flavour,
        light on the wallet, without the two-hour wait.
      </p>
      <p className="mt-4 text-lg leading-relaxed">
        Two years later we run a full line across Abuja: quick-service plates for lunch crews, party packs
        for weekend functions, and catering for the weddings people actually talk about afterwards. The
        wok is bigger. The griddle is louder. The price is still the honest one we opened with.
      </p>

      <h2 className="heading-lg mt-10">What we stand for</h2>
      <ul className="mt-4 space-y-4 text-brand-black/80">
        <li>
          <b>Real portions, real prices.</b> Nothing is plated for a photo. Every dish is priced so a working
          person can eat like a king on a Tuesday.
        </li>
        <li>
          <b>Cook it fresh, deliver it fast.</b> We don't hold trays under heat lamps. When your order
          hits our screen, the kitchen starts. That's why the ETA is 30 minutes, not 90.
        </li>
        <li>
          <b>Nigerian first.</b> Jollof over quinoa. Suya over sliders. Where we borrow, like burgers and cocktails,
          we make them ours.
        </li>
        <li>
          <b>Zero hidden charges.</b> VAT is in every displayed price. Delivery fee is on-screen before you
          confirm. Bulk discount is automatic, no coupon codes.
        </li>
      </ul>

      <h2 className="heading-lg mt-10">Where we cook</h2>
      <p className="mt-2">
        Main kitchen in Wuse 2, Abuja. Dispatch riders across six zones from Asokoro to Kubwa. We serve every
        district on our {brand.city.primary} delivery map, and we're expanding.
      </p>

      <div className="mt-10 rounded-3xl bg-brand-black p-6 text-white">
        <h2 className="heading-md text-white">Hungry already?</h2>
        <p className="mt-2 text-white/70">
          Add a plate to your cart or send us a WhatsApp. The {brand.contact.whatsappDisplay} line is
          monitored through service hours.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/menu" className="btn-green">
            Browse menu
          </Link>
          <Link href="/contact" className="btn-secondary border-white/30 bg-transparent text-white hover:border-white">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
