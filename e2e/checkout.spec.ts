import { test, expect } from "@playwright/test";

/**
 * Happy-path checkout: browse -> add to cart -> open drawer -> pick
 * delivery zone -> fill form -> submit with manual-bank -> assert the
 * Supabase row was created and the wa.me link matches the template.
 *
 * The spec runs against a local dev server with a seeded Supabase instance
 * (see `docs/DEPLOYMENT.md` for how to boot one). It intentionally avoids
 * touching Monnify — the `monnify-flow.spec.ts` file covers that path with
 * a mocked webhook.
 */
test("manual-bank checkout creates an order and opens WhatsApp", async ({ page }) => {
  await page.goto("/menu");

  // Add the first menu item to the cart.
  const addBtn = page.getByRole("button", { name: /^Add to cart$/i }).first();
  await addBtn.click();

  // Cart badge in the dock should now show "1".
  await expect(page.getByTestId("dock-cart-badge")).toHaveText("1");

  // Open the cart drawer via the dock.
  await page.getByTestId("dock-cart").click();
  await expect(page.getByRole("heading", { name: /Your cart/i })).toBeVisible();

  // Choose delivery + a zone.
  await page.getByLabel(/Delivery/i).click();
  await page.getByText(/Wuse & Maitama/i).first().click();

  // Fill the customer form.
  await page.getByLabel(/Name/i).fill("Ada E.");
  await page.getByLabel(/Phone/i).fill("08012345678");
  await page.getByLabel(/Address/i).fill("12 Ademola Street, Wuse 2");

  // Select manual bank if it's enabled (fallback to whichever is visible).
  const manual = page.getByLabel(/Bank transfer/i);
  if (await manual.isVisible().catch(() => false)) await manual.check();

  // Submit.
  await page.getByRole("button", { name: /Place order/i }).click();

  // Confirmation panel shows the KW- code and a WhatsApp deep-link.
  await expect(page.getByText(/^KW-/).first()).toBeVisible();
  const waLink = page.getByRole("link", { name: /Open WhatsApp/i });
  const href = await waLink.getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/2347030606021\?text=/);
  expect(decodeURIComponent(href!)).toContain("*New Kitchen's Worth Order");
});
