"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Utensils, Gift, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { GENERIC_LINKS } from "@/lib/whatsapp";
import { ForkKnifeGlyph, DispatchGlyph } from "./DockIcons";

/**
 * Kitchen's Worth — signature floating dock.
 * 4-icon glass-morphism pill pinned to bottom with cart at center (larger).
 * Configurable slots: menu, party-packs, track, whatsapp, home, catering.
 * Cart slot is always included and positioned center for quick access.
 *
 * Behaviour:
 *  - Active route scales up + shows lime-green chip
 *  - Cart badge reflects live count, bounces on every add
 *  - Auto-hides after idle; reappears on scroll; stays while hovered/focused
 *  - Hidden entirely while cart drawer is open
 *  - Respects prefers-reduced-motion
 */

type Slot = "menu" | "party-packs" | "cart" | "track" | "whatsapp" | "home" | "catering";

const SLOT_DEFS: Record<
  Slot,
  {
    label: string;
    href?: string;
    isWhatsApp?: boolean;
    iconScale?: number;
    Icon: React.FC<{ size?: number }>;
  }
> = {
  menu: { label: "Menu", href: "/menu", Icon: ForkKnifeGlyph },
  "party-packs": { label: "Party Packs", href: "/party-packs", Icon: (p) => <Gift {...p} /> },
  cart: { label: "Cart", Icon: (p) => <ShoppingCart {...p} /> },
  track: { label: "Track", href: "/track", iconScale: 1.95, Icon: DispatchGlyph },
  whatsapp: { label: "WhatsApp", isWhatsApp: true, Icon: WhatsAppGlyph },
  home: { label: "Home", href: "/", Icon: (p) => <Utensils {...p} /> },
  catering: { label: "Catering", href: "/catering", Icon: (p) => <Gift {...p} /> },
};

export function FloatingDock({
  config,
  whatsappNumber,
}: {
  config: string[];
  whatsappNumber?: string;
}) {
  const pathname = usePathname();
  const { count, pulse, openCart, isOpen: cartOpen } = useCart();
  const [hidden, setHidden] = useState(true); // Start hidden on landing
  const [bounce, setBounce] = useState(false);

  // Inactivity auto-hide: reveal on user activity, hide after idle window.
  const IDLE_MS = 6000; // 6 seconds — enough time to reach it
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interacting = useRef(false);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!interacting.current) setHidden(true);
    }, IDLE_MS);
  }, []);

  const reveal = useCallback(() => {
    setHidden(false);
    scheduleHide();
  }, [scheduleHide]);

  const hold = useCallback(() => {
    interacting.current = true;
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const release = useCallback(() => {
    interacting.current = false;
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    // Reveal on any user activity
    const onActivity = () => reveal();
    const events = ["mousemove", "click", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [reveal]);

  // Bounce the cart icon whenever `pulse` changes.
  useEffect(() => {
    if (pulse === 0) return;
    setBounce(true);
    const t = setTimeout(() => setBounce(false), 340);
    return () => clearTimeout(t);
  }, [pulse]);

  if (cartOpen) return null;

  const slots = (config as Slot[]).filter((s) => SLOT_DEFS[s]);

  return (
    <nav
      aria-label="Quick actions"
      onPointerEnter={hold}
      onPointerLeave={release}
      onFocusCapture={hold}
      onBlurCapture={release}
      className="fixed left-1/2 top-auto bottom-4 -translate-x-1/2 transform transition-transform duration-300 motion-reduce:transition-none"
      style={{
        paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        transform: hidden ? "translate(-50%, 120px)" : "translate(-50%, 0)",
      }}
    >
      <div
        className="mx-4 flex items-center gap-1 rounded-full border border-brand-green/20 px-2 shadow-2xl backdrop-blur-xl"
        style={{
          background: "rgba(11, 11, 11, 0.72)",
          height: 64,
          maxWidth: 560,
        }}
      >
        {slots.map((slot, i) => {
          const def = SLOT_DEFS[slot];
          const active = def.href && pathname === def.href;
          const size = 22 * (def.iconScale ?? 1); // Consistent size for all icons

          const shared = {
            className: `group relative grid place-items-center rounded-full text-white transition ${
              active ? "bg-brand-green/20 scale-110" : "hover:bg-white/10"
            } h-11 w-11 ${slot === "cart" && bounce ? "animate-dock-bounce" : ""}`,
            "aria-label": slot === "cart" ? `Open cart, ${count} items` : def.label,
          };

          const badge = slot === "cart" && count > 0 && (
            <span className="pointer-events-none absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-yellow px-1 text-[10px] font-black text-brand-black shadow">
              {count > 9 ? "9+" : count}
            </span>
          );

          const tooltip = (
            <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full bg-brand-black px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
              {def.label}
            </span>
          );

          if (slot === "cart") {
            return (
              <button key={slot} onClick={openCart} {...shared}>
                <ShoppingCart className="h-full w-full" />
                {badge}
                {tooltip}
              </button>
            );
          }

          if (def.isWhatsApp) {
            const href = GENERIC_LINKS.orderIntent(whatsappNumber ?? "2347030606021");
            return (
              <a
                key={slot}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...shared}
                className={`${shared.className} text-brand-green`}
              >
                <def.Icon size={size} />
                {tooltip}
              </a>
            );
          }

          return (
            <Link key={slot} href={def.href!} {...shared}>
              <def.Icon size={size} />
              {tooltip}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Hand-authored WhatsApp glyph (lucide does not ship one). */
function WhatsAppGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.52 3.449A11.87 11.87 0 0 0 12.05 0C5.46 0 .1 5.36 .1 11.95c0 2.11.55 4.17 1.6 5.98L0 24l6.22-1.63a11.94 11.94 0 0 0 5.83 1.49h.01c6.58 0 11.94-5.36 11.94-11.95 0-3.19-1.24-6.19-3.48-8.45zM12.06 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.7.97.99-3.61-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.46 4.45-9.9 9.91-9.9 2.65 0 5.13 1.03 7.01 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.46-4.44 9.9-9.9 9.9zm5.44-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.91-2.19-.24-.57-.48-.5-.66-.5l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.19 5.06 4.47.71.3 1.26.48 1.69.62.71.22 1.35.19 1.86.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
    </svg>
  );
}
