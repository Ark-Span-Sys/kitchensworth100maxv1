"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * MenuInfoCarousel — the soft-green info slider that sits under the menu hero
 * (delivery fees, party packs, catering, WhatsApp ordering). Mirrors the
 * Presikitchen card: white icon tile, title + badge, a supporting line, round
 * prev/next arrows over the edges, and dot indicators below.
 */
export type InfoIcon = "truck" | "pack" | "catering" | "chat" | "gift";

export interface InfoSlide {
  key: string;
  icon: InfoIcon;
  title: string;
  badge?: string;
  subtitle: string;
  href: string;
}

function Icon({ name }: { name: InfoIcon }) {
  const common = {
    className: "h-7 w-7",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
  };
  switch (name) {
    case "truck":
      return (
        <svg {...common}>
          <path d="M3 6h11v9H3z" />
          <path d="M14 9h4l3 3v3h-7z" />
          <circle cx="7" cy="18" r="1.6" />
          <circle cx="17.5" cy="18" r="1.6" />
        </svg>
      );
    case "pack":
      return (
        <svg {...common}>
          <path d="M4 8h16l-1.2 11a1 1 0 0 1-1 .9H6.2a1 1 0 0 1-1-.9z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
        </svg>
      );
    case "catering":
      return (
        <svg {...common}>
          <path d="M4 16h16" />
          <path d="M6 16a6 6 0 0 1 12 0" />
          <path d="M12 6v2" />
          <path d="M3 20h18" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <path d="M4 11h16v9H4z" />
          <path d="M2 7h20v4H2z" />
          <path d="M12 7v13" />
          <path d="M12 7S10.5 3 8.5 3a2 2 0 0 0 0 4H12zM12 7s1.5-4 3.5-4a2 2 0 0 1 0 4H12z" />
        </svg>
      );
  }
}

export function MenuInfoCarousel({ slides }: { slides: InfoSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  // Auto-advance every 5s; pauses on hover/focus and for reduced-motion.
  // `i` is a dependency so manual navigation restarts the timer.
  useEffect(() => {
    if (n <= 1 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((p) => (p + 1) % n), 5000);
    return () => clearInterval(id);
  }, [n, paused, i]);

  if (n === 0) return null;

  const go = (d: number) => setI((p) => (p + d + n) % n);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative">
        <div className="overflow-hidden rounded-2xl bg-brand-green/15">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${i * 100}%)` }}
          >
            {slides.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                className="flex w-full shrink-0 items-center gap-4 p-4 sm:p-5"
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white text-brand-green-dark">
                  <Icon name={s.icon} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold tracking-tight">{s.title}</h3>
                    {s.badge && (
                      <span className="rounded-md bg-brand-green-dark px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="muted mt-0.5 text-sm">{s.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg text-brand-black shadow-sm ring-1 ring-black/5 transition hover:scale-110"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg text-brand-black shadow-sm ring-1 ring-black/5 transition hover:scale-110"
            >
              ›
            </button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Go to ${s.title}`}
              aria-current={idx === i}
              className={
                "h-2 rounded-full transition-all " +
                (idx === i ? "w-6 bg-brand-green-dark" : "w-2 bg-brand-black/15 hover:bg-brand-black/30")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
