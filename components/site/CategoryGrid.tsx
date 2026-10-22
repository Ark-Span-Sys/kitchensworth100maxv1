import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/types";

/**
 * Horizontal marquee of category chips. Clicking a chip jumps to the
 * matching anchor on /menu (or filters the menu page client-side).
 * Uses anchor links rather than routes so we do not need a per-category page.
 *
 * The list is rendered twice inside a looping marquee track (see globals.css)
 * so it scrolls slowly and seamlessly. The animation pauses on hover/focus/press
 * so a chip is always selectable; the duplicate copy is hidden from assistive
 * tech and the tab order to avoid repeated links.
 */
export function CategoryGrid({ categories }: { categories: Category[] }) {
  // Render two copies for a gapless -50% loop; the second is decorative.
  const track = [...categories, ...categories];

  return (
    <section aria-label="Menu categories" className="border-y border-brand-black/5 bg-white">
      <div className="kw-marquee w-full py-4">
        <div className="kw-marquee-track gap-4 px-4 sm:gap-6">
          {track.map((c, i) => {
            const isDuplicate = i >= categories.length;
            return (
              <Link
                key={`${c.id}-${i}`}
                href={`/menu#${c.slug}`}
                aria-hidden={isDuplicate || undefined}
                tabIndex={isDuplicate ? -1 : undefined}
                className="group flex shrink-0 flex-col items-center gap-2 text-center"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-brand-black/5 bg-brand-cream transition group-hover:border-brand-green sm:h-20 sm:w-20">
                  {c.image_url ? (
                    <Image src={c.image_url} alt={isDuplicate ? "" : c.name} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-xl font-bold text-brand-black/30">
                      {c.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold sm:text-sm">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
