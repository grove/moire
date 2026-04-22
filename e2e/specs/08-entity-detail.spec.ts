/**
 * Entity detail view — opened by clicking an entity card from the Review set.
 * Uses entityDetailPage fixture (one Review entity open at layer 0, LayerSelector visible).
 * Tests that need the predicate table explicitly wait for `dl dt` inside the test body.
 */
import { test, expect } from "../fixtures";

// Allow extra time: each test rebuilds the full fixture chain (connectedPage → bsbmPage
// → reviewPage → entityDetailPage), which includes multiple SPARQL round trips.
// entityDetailPage waits up to 90s for entity cards on a loaded endpoint.
test.setTimeout(180_000);

test.describe("Entity detail view", () => {
  test("shows entity label as heading", async ({ entityDetailPage }) => {
    // CardTitle renders immediately when EntityDetail mounts (no extra SPARQL)
    await expect(entityDetailPage.locator("h3, h2, h1").first()).toBeVisible();
  });

  test("shows entity IRI in monospace", async ({ entityDetailPage }) => {
    // Wait for entity IRI which appears when EntityDetail renders
    const iriEl = await entityDetailPage.waitForSelector("p.font-mono", { timeout: 30_000 });
    const text = await iriEl.textContent();
    expect(text).toMatch(/^https?:\/\//);
  });

  test("shows predicate table with at least one row", async ({ entityDetailPage }) => {
    await entityDetailPage.waitForSelector("dl dt", { timeout: 40_000 });
    const rows = entityDetailPage.locator("dl dt");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("predicate table has predicate labels and values", async ({ entityDetailPage }) => {
    await entityDetailPage.waitForSelector("dl dt", { timeout: 40_000 });
    const firstDt = entityDetailPage.locator("dl dt").first();
    const firstDd = entityDetailPage.locator("dl dd").first();
    await expect(firstDt).toBeVisible();
    await expect(firstDd).toBeVisible();
    const dtText = await firstDt.textContent();
    expect(dtText?.trim().length).toBeGreaterThan(0);
  });

  test("IRI-valued predicate renders as a clickable link", async ({ entityDetailPage }) => {
    // Review entities have rdf:type and other IRI links
    await entityDetailPage.waitForSelector("dl dd button", { timeout: 40_000 });
    const iriLink = entityDetailPage.locator("dl dd button").first();
    await expect(iriLink).toBeVisible();
  });

  test("clicking an IRI link navigates to a new entity detail", async ({ entityDetailPage }) => {
    await entityDetailPage.waitForSelector("dl dd button", { timeout: 40_000 });
    const iriLink = entityDetailPage.locator("dl dd button").first();
    await iriLink.click();

    // After navigation, the layer selector is still visible (still entity context)
    await expect(entityDetailPage.locator('[aria-label="Layer depth selector"]')).toBeVisible({ timeout: 5_000 });
    const body = await entityDetailPage.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });

  test("back button is enabled after navigating to a linked entity", async ({
    entityDetailPage,
  }) => {
    await entityDetailPage.waitForSelector("dl dd button", { timeout: 40_000 });
    const iriLink = entityDetailPage.locator("dl dd button").first();
    await iriLink.click();
    await expect(entityDetailPage.locator('[aria-label="Layer depth selector"]')).toBeVisible({ timeout: 5_000 });
    await expect(entityDetailPage.getByLabel("Go back")).toBeEnabled();
  });

  test("no render error on entity detail page", async ({ entityDetailPage }) => {
    const body = await entityDetailPage.locator("body").textContent();
    expect(body).not.toContain("An error occurred in the Server Components");
  });
});
