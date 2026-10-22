import Link from "next/link";
import { brand } from "@/lib/brand";
import { GENERIC_LINKS } from "@/lib/whatsapp";
import { getSiteSettings } from "@/lib/settings";
import { BrandLogo } from "@/components/site/BrandLogo";

export async function Footer() {
  const settings = await getSiteSettings();
  const wa = GENERIC_LINKS.orderIntent(settings.whatsapp_number);

  return (
    <footer className="mt-16 border-t border-brand-black/8 bg-brand-black text-white pb-[calc(60px+env(safe-area-inset-bottom))]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="mb-3">
            <BrandLogo theme="light" showWordmark className="h-16 w-auto max-w-full" />
          </div>
          <p className="text-sm text-white/70">{brand.tagline}</p>
          <p className="mt-3 text-sm text-white/60">{brand.city.copy}</p>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-yellow">Explore</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/menu" className="hover:text-brand-green">Menu</Link></li>
            <li><Link href="/party-packs" className="hover:text-brand-green">Party Packs</Link></li>
            <li><Link href="/bulk" className="hover:text-brand-green">Bulk Orders</Link></li>
            <li><Link href="/catering" className="hover:text-brand-green">Catering</Link></li>
            <li><Link href="/zones" className="hover:text-brand-green">Delivery Zones</Link></li>
            <li><Link href="/track" className="hover:text-brand-green">Track Order</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-yellow">Company</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/about" className="hover:text-brand-green">Our Story</Link></li>
            <li><Link href="/contact" className="hover:text-brand-green">Contact</Link></li>
            <li><Link href="/policy" className="hover:text-brand-green">Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-yellow">Reach us</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.6 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.6-8.63A2 2 0 0 1 3.1 2h3a2 2 0 0 1 2 1.72c.12.9.4 1.77.82 2.55a2 2 0 0 1-.45 2.11l-.82.82a16 16 0 0 0 6.66 6.66l.82-.82a2 2 0 0 1 2.11-.45c.78.42 1.65.7 2.55.82A2 2 0 0 1 22 16.92Z"/></svg>
              <a href={`tel:${brand.contact.phone.replace(/\s|[-]/g, "")}`}>{brand.contact.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <a href={`mailto:${brand.contact.email}`} className="hover:text-brand-green">{brand.contact.email}</a>
            </li>
            <li className="flex items-center gap-2">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-brand-green inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden><path d="M12.03 2.002C6.578 2.002 2.13 6.45 2.13 11.919c0 1.815.478 3.59 1.392 5.142L2.25 21.87l5.13-1.35a9.82 9.82 0 0 0 4.65 1.168h.003c5.452 0 9.9-4.447 9.9-9.919 0-2.646-1.03-5.138-2.902-7.01C17.168 3.032 14.676 2.002 12.03 2.002z"/></svg>
                WhatsApp {brand.contact.whatsappDisplay}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <a href={brand.contact.instagramUrl} className="hover:text-brand-green inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                Instagram @{brand.contact.instagram}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto px-4 py-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {brand.name} Limited · Abuja, Nigeria
        </div>
      </div>
    </footer>
  );
}
