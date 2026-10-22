"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DishCard } from "./DishCard";

/**
 * MenuBrowser — client-side category filter for /menu.
 *
 * Mirrors the Presikitchen menu: a single flat grid with an "All" + category
 * tab bar (each tab shows its item count) rather than stacked anchor sections.
 * Reads the URL hash so home-page category chips (`/menu#soups`) preselect a
 * tab, and updates the hash on selection so the behaviour is shareable/back-
 * button friendly.
 */
export interface MenuBrowserCategory {
  id: string;
  slug: string;
  name: string;
}

export interface MenuBrowserItem {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string | null;
  price_ngn: number;
  image_url: string | null;
  is_best_seller: boolean;
  is_signature: boolean;
  is_spicy: boolean;
  is_vegan: boolean;
}

export function MenuBrowser({
  categories,
  items,
}: {
  categories: MenuBrowserCategory[];
  items: MenuBrowserItem[];
}) {
  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const q = query.trim().toLowerCase();
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Preselect a category from the URL hash (e.g. /menu#soups).
  useEffect(() => {
    const sync = () => {
      const h = decodeURIComponent(window.location.hash.replace("#", ""));
      setActive(categories.some((c) => c.slug === h) ? h : "all");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [categories]);

  // Land on the "Explore the menu" section (search + tabs) rather than the hero
  // for every entry point into /menu. The heading carries scroll-mt so it sits
  // clear of the sticky header; scroll-margin is honoured by scrollIntoView.
  useEffect(() => {
    const el = document.getElementById("explore");
    if (!el) return;
    const doScroll = () => el.scrollIntoView({ behavior: "auto", block: "start" });
    const raf = requestAnimationFrame(doScroll);
    const t = setTimeout(doScroll, 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  // Keep the active tab visible in the horizontally-scrollable strip (e.g. when
  // a deep link like /menu#soups preselects a tab that is off-screen). Horizontal
  // only, so it never disturbs the vertical "Explore" landing scroll. Uses instant
  // positioning and re-asserts after layout settles so it can't lose a race
  // against the browser's scroll restoration on cold loads.
  useEffect(() => {
    const bar = tabBarRef.current;
    if (!bar) return;
    const btn = bar.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (!btn) return;
    const center = () => {
      const btnRect = btn.getBoundingClientRect();
      const barRect = bar.getBoundingClientRect();
      const delta = btnRect.left - barRect.left - (bar.clientWidth / 2 - btn.clientWidth / 2);
      bar.scrollTo({ left: bar.scrollLeft + delta, behavior: "auto" });
    };
    center();
    const raf = requestAnimationFrame(center);
    const t = setTimeout(center, 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [active, categories]);

  const slugOf = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c.slug]));
    return (item: MenuBrowserItem) => byId.get(item.category_id) ?? "";
  }, [categories]);

  // When a search query is active, look across every category (so a dish in a
  // non-selected section still surfaces); otherwise honour the tab filter.
  const scoped = q ? items : active === "all" ? items : items.filter((it) => slugOf(it) === active);
  const visible = q
    ? scoped.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          (it.description ?? "").toLowerCase().includes(q),
      )
    : scoped;

  function pick(slug: string) {
    setActive(slug);
    const next = slug === "all" ? "" : `#${slug}`;
    window.history.replaceState(null, "", next || window.location.pathname);
  }

  const tabs: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    ...categories.map((c) => ({ key: c.slug, label: c.name })),
  ];

  return (
    <div>
      <div className="relative mb-4">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-black/40"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dishes, e.g. jollof, chicken, shawarma"
          aria-label="Search the menu"
          className="w-full appearance-none rounded-full border border-brand-black/10 bg-white py-3 pl-12 pr-10 text-sm outline-none transition focus:border-brand-black/25 focus:ring-2 focus:ring-brand-black/5 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg text-brand-black/40 transition hover:bg-brand-black/5 hover:text-brand-black"
          >
            ×
          </button>
        )}
      </div>

      <div
        ref={tabBarRef}
        className="sticky top-14 z-10 -mx-4 mb-8 overflow-x-auto border-y border-brand-black/5 bg-brand-cream/90 px-4 py-3 backdrop-blur"
        role="tablist"
        aria-label="Filter menu by category"
      >
        <ul className="flex gap-2 whitespace-nowrap pr-6">
          {tabs.map((t) => {
            const on = t.key === active;
            return (
              <li key={t.key}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  data-active={on ? "true" : undefined}
                  onClick={() => pick(t.key)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition " +
                    (on
                      ? "bg-brand-green-dark text-white"
                      : "bg-white text-brand-black ring-1 ring-black/10 hover:bg-brand-green/10")
                  }
                >
                  {t.label}
                  {on && t.key !== "all" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((it) => (
          <DishCard key={it.id} item={it} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="muted py-16 text-center">
          {q ? (
            <>
              No dishes match “{query.trim()}”.{" "}
              <button
                type="button"
                onClick={() => setQuery("")}
                className="font-semibold text-brand-green-dark underline"
              >
                Clear search
              </button>
            </>
          ) : (
            "Nothing in this section yet."
          )}
        </p>
      )}
    </div>
  );
}
