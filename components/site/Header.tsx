"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { brand, NAV_LINKS } from "@/lib/brand";
import { useCart } from "@/components/cart/CartProvider";
import { BrandLogo } from "@/components/site/BrandLogo";
import { AccountControl } from "@/components/site/AccountControl";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-brand-black/8 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label={brand.name} className="flex items-center">
          <BrandLogo theme="dark" showWordmark className="h-14 w-auto sm:h-16" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition ${
                pathname === l.href
                  ? "text-brand-green-dark"
                  : "text-brand-black/70 hover:text-brand-black"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <AccountControl />
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={openCart}
            aria-label={`Open cart, ${count} items`}
            className="relative rounded-full p-2 text-brand-black hover:bg-brand-black/5"
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-yellow px-1 text-[10px] font-black text-brand-black">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="rounded-full p-2 text-brand-black hover:bg-brand-black/5 md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-brand-black/8 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`py-2 text-sm font-medium ${
                  pathname === l.href ? "text-brand-green-dark" : "text-brand-black/70"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <AccountControl mobile onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  );
}
