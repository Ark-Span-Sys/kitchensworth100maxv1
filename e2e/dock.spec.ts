import { test, expect } from "@playwright/test";

/**
 * Floating-dock behaviour contract (see docs/FLOATING-DOCK.md).
 *
 * Verifies the dock is present on every public route, that the cart badge
 * animates on add, that active-route highlighting follows navigation,
 * that scroll-down hides and scroll-up re-shows, that keyboard navigation
 * reaches all 5 items, and that `prefers-reduced-motion` disables animation.
 */

test.describe("Floating dock", () => {
  test("renders 5 items on any public page", async ({ page }) => {
    await page.goto("/");
    for (const slot of ["menu", "party-packs", "cart", "track", "whatsapp"]) {
      await expect(page.getByTestId(`dock-${slot}`)).toBeVisible();
    }
  });

  test("active route is highlighted", async ({ page }) => {
    await page.goto("/menu");
    await expect(page.getByTestId("dock-menu")).toHaveAttribute("data-active", "true");
    await page.goto("/party-packs");
    await expect(page.getByTestId("dock-party-packs")).toHaveAttribute("data-active", "true");
  });

  test("cart badge increments and animates on add", async ({ page }) => {
    await page.goto("/menu");
    await expect(page.getByTestId("dock-cart-badge")).toBeHidden();
    await page.getByRole("button", { name: /^Add to cart$/i }).first().click();
    await expect(page.getByTestId("dock-cart-badge")).toHaveText("1");
    await page.getByRole("button", { name: /^Add to cart$/i }).first().click();
    await expect(page.getByTestId("dock-cart-badge")).toHaveText("2");
  });

  test("hides on scroll-down and returns on scroll-up", async ({ page }) => {
    await page.goto("/menu");
    const dock = page.getByTestId("dock");
    await expect(dock).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: "instant" as ScrollBehavior }));
    await expect(dock).toHaveAttribute("data-hidden", "true");
    await page.evaluate(() => window.scrollTo({ top: 100, behavior: "instant" as ScrollBehavior }));
    await expect(dock).toHaveAttribute("data-hidden", "false");
  });

  test("WhatsApp slot has correct deep-link and pre-filled text", async ({ page }) => {
    await page.goto("/");
    const wa = page.getByTestId("dock-whatsapp");
    const href = await wa.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/2347030606021\?text=/);
    expect(decodeURIComponent(href!)).toContain("I'd like to place an order");
  });

  test("keyboard: arrow keys move focus across all 5 items", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("dock-menu").focus();
    const seen = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const id = await page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? "");
      seen.add(id);
      await page.keyboard.press("ArrowRight");
    }
    expect(seen.size).toBe(5);
  });

  test("prefers-reduced-motion disables animations", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    const dock = page.getByTestId("dock");
    await expect(dock).toHaveAttribute("data-reduced-motion", "true");
    await ctx.close();
  });

  test("dock is not rendered inside /admin", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByTestId("dock")).toHaveCount(0);
  });
});
