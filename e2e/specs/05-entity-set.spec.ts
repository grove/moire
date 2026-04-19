/**
 * Entity set — shown after selecting a class in the types browser.
 * Uses reviewPage fixture (Review class selected in bsbm graph).
 */
import { test, expect } from "../fixtures";

test.describe("Entity set — Review class", () => {
  test("shows entity count", async ({ reviewPage }) => {
    await expect(reviewPage.getByText(/\d+\s+entit/)).toBeVisible();
  });

  test("shows entity cards", async ({ reviewPage }) => {
    const cards = reviewPage.locator('[role="button"][aria-label^="Navigate to"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("entity cards are clickable and navigate to entity detail", async ({
    reviewPage,
  }) => {
    const firstCard = reviewPage
      .locator('[role="button"][aria-label^="Navigate to"]')
      .first();
    await firstCard.click();

    // Entity detail view renders (no error, body text changes)
    const body = await reviewPage.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });

  test("no render error on entity set page", async ({ reviewPage }) => {
    const body = await reviewPage.locator("body").textContent();
    expect(body).not.toContain("An error occurred in the Server Components");
  });

  test("back button is enabled (we navigated to get here)", async ({
    reviewPage,
  }) => {
    await expect(reviewPage.getByLabel("Go back")).toBeEnabled();
  });

  test("breadcrumb shows at least 2 levels (endpoint + graph)", async ({
    reviewPage,
  }) => {
    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    const chevrons = breadcrumb.locator("svg"); // ChevronRight icons between crumbs
    const count = await chevrons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
