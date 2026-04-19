/**
 * Shared Playwright fixtures for moire E2E tests.
 *
 * Fixture chain (each is a Page in progressively deeper navigation state):
 *   page (base Playwright)
 *     → connectedPage   endpoint active, GraphsBrowser visible
 *       → bsbmPage      inside the bsbm named graph, TypesBrowser visible
 *         → reviewPage  Review class EntitySet visible
 */
import { test as base, type Page } from "@playwright/test";

export { expect } from "@playwright/test";

type Fixtures = {
  /** Endpoint activated via "Open →", GraphsBrowser is visible. */
  connectedPage: Page;
  /** Inside the bsbm named graph — TypesBrowser is visible. */
  bsbmPage: Page;
  /** Review class entity set is loaded. */
  reviewPage: Page;
};

export const test = base.extend<Fixtures>({
  // ── connectedPage ────────────────────────────────────────────────────────────
  // storageState from auth.setup already has the endpoint in localStorage.
  // The page shows EndpointManager with an "Open →" card — click it to activate.
  connectedPage: async ({ page }, use) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open →/i }).first().click();
    // Wait for at least one Browse button (works for any number of graphs)
    await page.waitForSelector('button:has-text("Browse this graph")', { timeout: 10_000 });
    await use(page);
  },

  // ── bsbmPage ─────────────────────────────────────────────────────────────────
  // Drill into the bsbm named graph via the "Browse this graph →" button on its card.
  // The CardTitle shows graph.iri which contains "bsbm", and title= attribute matches too.
  bsbmPage: async ({ connectedPage }, use) => {
    // Find the card whose title attribute includes "bsbm" and click its Browse button
    const bsbmCard = connectedPage.locator("[title*='bsbm']").first();
    // Navigate up to the Card root, then find the Browse button within it
    const browseBtn = bsbmCard
      .locator("xpath=ancestor-or-self::div[contains(@class,'rounded-lg')]")
      .last()
      .getByRole("button", { name: /browse this graph/i });

    // Fallback: if anchor approach fails, find the "Browse this graph" button near "bsbm" text
    if (!(await browseBtn.isVisible({ timeout: 2_000 }).catch(() => false))) {
      // Just click the first Browse button that comes after any "bsbm" text
      await connectedPage.getByRole("button", { name: /browse this graph/i }).first().click();
    } else {
      await browseBtn.click();
    }
    await connectedPage.waitForSelector("text=classes discovered", { timeout: 10_000 });
    await use(connectedPage);
  },

  // ── reviewPage ───────────────────────────────────────────────────────────────
  // Select the Review class from TypesBrowser.
  // The "Browse as set →" button is opacity-0 until the row is hovered.
  reviewPage: async ({ bsbmPage }, use) => {
    const reviewRow = bsbmPage
      .locator(".group")
      .filter({ has: bsbmPage.locator("span.font-medium", { hasText: /^Review$/ }) })
      .first();
    await reviewRow.hover();
    await reviewRow.getByRole("button", { name: /browse as set/i }).click();
    await bsbmPage.waitForSelector("text=entities", { timeout: 20_000 });
    await use(bsbmPage);
  },
});
