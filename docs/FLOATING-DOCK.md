# Floating dock

The signature UX element of Kitchen's Worth. A persistent, glass-morphism pill anchored to the bottom-centre of every public page — the primary quick-access navigation on mobile and a complementary shortcut bar on desktop.

## Design rationale

Presikitchen and Rahmies both hide navigation behind a hamburger on mobile, forcing three taps to reach a delivery zone or a WhatsApp fallback. Kitchen's Worth puts five actions within thumb's reach at all times: browse, party packs, cart, track, WhatsApp. Two of those (party packs and WhatsApp) are business-critical surfaces that deserve permanent real estate.

On desktop, the top header still exists — the dock becomes an *ambient* shortcut strip that follows the user down long menu pages.

## Anatomy

```
      ┌──────────────────────────────────────────────┐
      │  🍴        🎁         🛍(3)      📍       💬  │
      │ Menu  Party-packs   Cart      Track   WhatsApp │
      └──────────────────────────────────────────────┘
      64px tall · pill · rgba(11,11,11,0.72) · blur(18px)
      1px lime border @ 20% · deep drop shadow
```

- **Position**: fixed bottom-centre.
- **Mobile**: sits above the iOS safe area via `padding-bottom: env(safe-area-inset-bottom)`.
- **Desktop**: floats 24 px above the bottom edge, max-width 560 px, centred.
- **Cart slot is 8 px larger** than the other four — the primary action.
- **Cart badge**: warm-yellow circle (`#F5D74A`), black text, caps at `9+`, subtle bounce on each add.

## The 5 slots (default config)

| # | Key | Icon | Route | Notes |
| - | --- | ---- | ----- | ----- |
| 1 | `menu` | Utensils | `/menu` | Standard navigation |
| 2 | `party-packs` | Gift / box | `/party-packs` | Visually elevated because party packs are a core business line |
| 3 | `cart` | Shopping bag | opens drawer | Badge shows count; primary tap target |
| 4 | `track` | Map pin | `/track` | |
| 5 | `whatsapp` | WhatsApp glyph (custom SVG) | `wa.me/2347030606021?text=Hello Kitchen's Worth, I'd like to place an order.` | External link, opens in new tab |

Alternative keys admins can swap in via `site_settings.dock_config`: `home`, `catering`, `bulk`, `build`. Reordering is just reordering the JSON array.

## Interaction model

| Trigger | Effect |
| --- | --- |
| Route matches the slot's href | Icon scales to 1.15×, background chip fades in lime at 18% opacity, tooltip label appears above the icon for 1.5 s then fades |
| Hover (desktop only) | Icon lifts 4 px, tooltip slides up (200 ms, `cubic-bezier(0.2, 0.9, 0.3, 1.2)`) |
| Tap (mobile) | 90 ms spring scale (1 → 0.94 → 1.06 → 1), `navigator.vibrate(8)` where supported |
| Add to cart | Cart badge pops (scale 1 → 1.25 → 1, 340 ms spring) |
| Scroll down past 200 px | Dock translates Y by 80% (peeks 20%) over 260 ms with `cubic-bezier(0.4, 0, 0.2, 1)` |
| Scroll up / reach top | Dock returns to `translateY(0)` |
| Drawer open | Dock is fully hidden (`display: none`) so it never competes with checkout |

## Animation spec

| Element | Duration | Easing |
| --- | --- | --- |
| Hover lift | 200 ms | `cubic-bezier(0.2, 0.9, 0.3, 1.2)` |
| Active chip fade | 180 ms | `ease-out` |
| Tooltip appear | 220 ms | `cubic-bezier(0.2, 0.9, 0.3, 1.2)` |
| Tooltip fade out | 320 ms | `ease-in` after 1 500 ms delay |
| Cart badge pop | 340 ms | spring: mass 0.9, stiffness 380, damping 18 |
| Dock hide on scroll | 260 ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Dock re-show | 240 ms | same |

All animation values are declared once as CSS custom properties in `app/globals.css` (`--dock-*`) and consumed by the dock component — no magic numbers in the JSX.

## Accessibility contract

- Each slot is a real `<a>` or `<button>` with a text `aria-label` (e.g. `"Cart — 3 items"`).
- Focus ring in lime (`outline: 2px solid #5CD15C; outline-offset: 2px`).
- Full keyboard navigation:
  - `Tab` into the dock lands focus on the first slot.
  - `Tab` again exits the dock (slots use `tabIndex=-1` on non-first elements so a whole dock is one tab stop).
  - `ArrowRight` / `ArrowLeft` move focus *within* the dock, wrapping at the ends.
  - `Enter` / `Space` activates the focused slot.
- Live region: when the cart count changes, an `aria-live="polite"` node announces *"Cart updated, N items"*.
- `prefers-reduced-motion: reduce`:
  - All animations become instant state changes.
  - Dock never hides on scroll.
  - No haptics.
- Contrast: all icon strokes meet WCAG AA against `rgba(11,11,11,0.72)` — white icons at 90% opacity over the dark glass.

## Admin configuration semantics

`/admin/settings` writes two fields:

- `dock_enabled` (bool). If `false`, the dock renders nothing at all (no CSS, no JS). This is the site-wide kill switch — no deploy needed.
- `dock_config` (JSON array of strings). Valid keys: `menu, party-packs, cart, track, whatsapp, home, catering, bulk, build`. The array *is* the visual order, left to right. Missing `cart` disables the drawer entry point (the checkout is still reachable via `/cart`).

Unknown keys are ignored with a `console.warn` in dev. Fewer than 5 slots: renders as many as given. More than 5: still renders 5, warns in dev.

## Adding a slot without touching the dock code

1. Add an entry to the `SLOT_REGISTRY` map in `components/dock/FloatingDock.tsx` — key, href (or handler), icon, `aria-label` template.
2. Add the key to the allowed list in `/admin/settings` help text.
3. Admin pastes the new key into the `dock_config` field. Done — no per-page code change.

The registry pattern means the dock is data-driven; new slots are additive, never destructive.

## Implementation notes

- **No third-party dock library.** Custom, ~180 LOC, so we own the animation timing and brand polish.
- Mounted once in `app/layout.tsx` inside `CartProvider`. Reads `usePathname()` for active state and cart count from context.
- Icons are inline SVGs from `lucide-react`; the WhatsApp glyph is a hand-authored path in the brand-lime colour.
- Scroll detection uses `requestAnimationFrame`-throttled passive listener — no layout thrash.
- Test coverage in `e2e/dock.spec.ts` locks the behaviour contract: presence on public pages, hidden on `/admin`, active-route tracking, badge increment, hide-on-scroll, keyboard nav, `prefers-reduced-motion`.
