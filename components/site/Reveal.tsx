"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveal — wraps a section/block and eases it into view the first time it
 * crosses the viewport (fade + rise), mirroring the scroll-in feel of the
 * benchmark site. Purely presentational: content is visible immediately when
 * JS is unavailable or the visitor prefers reduced motion (the CSS layer in
 * globals.css flattens the transform for that case).
 */
export function Reveal({
  children,
  className = "",
  as: Tag = "div",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      // Trigger a little before the block is fully on screen so sections
      // animate while still entering the viewport.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} className={`kw-reveal ${shown ? "kw-reveal-in" : ""} ${className}`}>
      <div className="kw-reveal-inner" style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
        {children}
      </div>
    </Tag>
  );
}
