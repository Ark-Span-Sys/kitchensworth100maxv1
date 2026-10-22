import type { CSSProperties } from "react";

/**
 * BrandLogo — the authentic Kitchen's Worth logo as inline SVG.
 *
 * Recreates `public/kitchensworth-logo.svg` (pot, steam, arms, hands, fork/spoon,
 * soup, lid, smile, wordmark, tagline) so we can (a) recolour it per surface and
 * (b) animate individual layers (steam + pot) in the hero. The wordmark and
 * tagline use the site's `--font-display` (Space Grotesk) for consistency.
 *
 * Themes:
 *   - "dark"  → black art, for light backgrounds (header, hero medallion)
 *   - "light" → white art with background-coloured negative space, for dark
 *               backgrounds (footer). `gap` falls back to the brand black.
 */

type Theme = "dark" | "light";

export function BrandLogo({
  className = "",
  theme = "dark",
  animated = false,
  showWordmark = true,
  showTagline = false,
}: {
  className?: string;
  theme?: Theme;
  animated?: boolean;
  showWordmark?: boolean;
  showTagline?: boolean;
}) {
  // STRUCT = solid art (pot, arms, lid, utensils, outlines). GAP = negative space
  // (highlights, pot mouth interior, hand fills) that should read as the background.
  const struct = theme === "light" ? "#ffffff" : "#111111";
  const gap = theme === "light" ? "#0b0b0b" : "#ffffff";
  const steam = "#ffea4a";
  const soup = "#6ff03a";
  const tagGreen = "#6bea50";

  const wordmarkStyle: CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
  };
  const taglineStyle: CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontStyle: "italic",
  };

  const viewBox = showWordmark
    ? showTagline
      ? "0 0 1100 940"
      : "0 0 1100 700"
    : "270 100 560 450";

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label="Kitchen's Worth"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {animated && (
        <style>{`
          .kw-bob{transform-box:fill-box;transform-origin:center;animation:kw-bob 3.6s ease-in-out infinite}
          .kw-steam{transform-box:fill-box;transform-origin:center;animation:kw-steam 2.8s ease-in-out infinite}
          .kw-s2{animation-delay:.5s}
          @keyframes kw-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
          @keyframes kw-steam{0%{opacity:.35;transform:translateY(4px) scale(.96)}45%{opacity:1;transform:translateY(-8px) scale(1.04)}100%{opacity:.35;transform:translateY(4px) scale(.96)}}
          @media (prefers-reduced-motion: reduce){.kw-bob,.kw-steam{animation:none}}
        `}</style>
      )}

      {/* Steam */}
      <g className={animated ? "kw-steam" : undefined}>
        <path d="M672 118 C700 135 735 165 722 205 C712 238 668 245 650 275 C640 295 650 305 665 300 C645 318 610 322 592 310 C615 305 628 285 640 262 C655 230 705 215 700 185 C690 160 668 145 672 118 Z" fill={steam} />
      </g>
      <g className={animated ? "kw-steam kw-s2" : undefined}>
        <path d="M552 318 C575 305 610 296 640 300 C625 318 590 325 552 318 Z" fill={steam} />
      </g>

      <g className={animated ? "kw-bob" : undefined}>
        {/* Yellow underline / smile */}
        <path d="M396 474 C391 483 393 496 400 503 C440 530 500 546 560 546 C630 546 700 525 740 505 C743 495 738 486 732 476 C722 484 712 494 690 504 C650 520 600 526 550 526 C490 526 440 510 410 492 C404 488 400 482 396 474 Z" fill={steam} />

        {/* Arms */}
        <path d="M368 372 C385 395 405 412 430 425 L445 395 C420 385 400 370 385 355 Z" fill={struct} />
        <path d="M720 345 C740 335 755 330 775 335 L790 370 C770 365 750 375 728 392 Z" fill={struct} />

        {/* Pot body + highlight */}
        <path d="M405 375 C400 430 410 470 455 488 C500 502 590 500 650 485 C705 470 728 430 722 372 C690 395 620 405 560 405 C500 405 440 395 405 375 Z" fill={struct} />
        <path d="M428 405 C422 425 424 448 432 462 C438 440 438 420 440 408 Z" fill={gap} />

        {/* Pot rim (back) + soup */}
        <ellipse cx="560" cy="345" rx="165" ry="55" transform="rotate(-6 560 345)" fill={struct} />
        <ellipse cx="560" cy="345" rx="148" ry="42" transform="rotate(-6 560 345)" fill={gap} />
        <path d="M440 358 C470 342 520 340 560 345 C610 350 650 340 670 318 C690 315 692 335 678 350 C655 372 600 380 548 378 C500 378 455 372 440 358 Z" fill={soup} />

        {/* Lid + knob */}
        <path d="M392 335 C410 300 470 268 540 252 C590 240 625 238 632 262 C635 290 585 320 520 340 C470 355 420 360 400 352 Z" fill={struct} />
        <path d="M410 340 C440 322 480 306 520 296" stroke={gap} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M462 255 C470 238 495 228 525 230 C515 245 500 258 480 268 C470 270 462 265 462 255 Z" fill={struct} />

        {/* Fork */}
        <g fill={struct}>
          <rect x="309" y="200" width="8" height="42" rx="4" />
          <rect x="323" y="200" width="8" height="42" rx="4" />
          <rect x="337" y="200" width="8" height="42" rx="4" />
          <path d="M309 235 H345 V246 C345 262 340 270 333 273 H321 C314 270 309 262 309 246 Z" />
          <path d="M322 270 L332 270 L346 405 L336 405 Z" />
        </g>
        {/* Left hand */}
        <path d="M300 305 C296 290 315 282 335 282 C352 284 358 300 352 318 C366 328 372 352 360 370 C348 384 325 382 312 366 C300 352 298 325 300 305 Z" fill={gap} stroke={struct} strokeWidth={8} strokeLinejoin="round" />
        <path d="M312 318 C322 322 336 322 346 318 M315 340 C326 344 340 344 352 338" stroke={struct} strokeWidth={6} fill="none" strokeLinecap="round" />

        {/* Spoon */}
        <g fill={struct}>
          <ellipse cx="832" cy="215" rx="24" ry="38" transform="rotate(12 832 215)" />
          <path d="M818 245 L838 250 L788 375 L774 372 Z" />
        </g>
        {/* Right hand */}
        <path d="M758 322 C760 305 782 288 805 262 C820 258 836 262 840 278 C846 298 836 320 818 336 C806 350 780 350 765 342 C758 336 756 330 758 322 Z" fill={gap} stroke={struct} strokeWidth={8} strokeLinejoin="round" />
        <path d="M770 318 C782 312 796 306 808 296 M780 338 C794 334 806 326 816 316" stroke={struct} strokeWidth={6} fill="none" strokeLinecap="round" />

        {/* Wordmark */}
        {showWordmark && (
          <text x="125" y="662" fill={struct} textLength={895} lengthAdjust="spacingAndGlyphs" style={wordmarkStyle} fontSize={128}>
            KITCHENSWORTH
          </text>
        )}

        {/* Tagline */}
        {showTagline && (
          <text x="200" y="757" fill={tagGreen} textLength={745} lengthAdjust="spacingAndGlyphs" style={taglineStyle} fontSize={72}>
            ...eat well &amp; spend less.
          </text>
        )}
      </g>
    </svg>
  );
}
