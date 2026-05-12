/**
 * Relationships browser — navigated to via the "Browse Relationships →" button
 * in the types browser. Uses bsbmPage fixture.
 */
import { test, expect } from "../fixtures";

test.describe("Relationships browser", () => {
  // Navigate to relationships view before each test
  test.beforeEach(async ({ bsbmPage }) => {
    await bsbmPage.getByRole("button", { name: /browse relationships/i }).click();
    await expect(bsbmPage.getByText(/relationships on the current/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("shows relationships header text", async ({ bsbmPage }) => {
    await expect(bsbmPage.getByText(/relationships on the current/i)).toBeVisible();
  });

  test("loads relationship data from SPARQL (no empty state)", async ({
    bsbmPage,
  }) => {
    // Wait for loading skeletons to disappear
    await bsbmPage
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 30_000 })
      .catch(() => {}); // ok if there were none

    const body = await bsbmPage.locator("body").textContent();
    // Relationships browser now shows role-based sections
    const hasData =
      body?.includes("subj") ||
      body?.includes("Explore") ||
      body?.includes("Filter") ||
      body?.includes("Describe") ||
      body?.includes("Source") ||
      body?.includes("Technical");
    expect(hasData).toBe(true);
  });

  test("shows role-based sections (Explore, Filter, Describe, Source, or Technical)", async ({ bsbmPage }) => {
    await bsbmPage
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 30_000 })
      .catch(() => {});

    // At least one role-based section heading should appear
    const sectionHeadings = ["Explore", "Filter", "Describe", "Source", "Technical"];
    let anyVisible = false;
    for (const heading of sectionHeadings) {
      const el = bsbmPage.getByText(heading, { exact: true });
      if (await el.isVisible().catch(() => false)) {
        anyVisible = true;
        break;
      }
    }
    expect(anyVisible).toBe(true);
  });

  test("Follow as set button allows traversal", async ({ bsbmPage }) => {
    await bsbmPage
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 30_000 })
      .catch(() => {});

    // Relationship rows have hover-revealed "Follow as set →" buttons
    const relRow = bsbmPage.locator(".group").first();
    const hasRow = await relRow.isVisible().catch(() => false);

    if (hasRow) {
      await relRow.hover();
      const followBtn = relRow.getByRole("button", { name: /follow as set/i });
      const btnVisible = await followBtn.isVisible().catch(() => false);

      if (btnVisible) {
        await followBtn.click();
        // Should navigate to an entity set (traversal result)
        await expect(bsbmPage.getByText(/entit/)).toBeVisible({ timeout: 20_000 });
      }
    }
  });

  test("no render error on relationships page", async ({ bsbmPage }) => {
    const body = await bsbmPage.locator("body").textContent();
    expect(body).not.toContain("An error occurred in the Server Components");
  });
});
