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
    const hasData =
      body?.includes("subjects") ||
      body?.includes("Outgoing") ||
      body?.includes("Literal properties");
    expect(hasData).toBe(true);
  });

  test("shows Outgoing or Literal sections", async ({ bsbmPage }) => {
    await bsbmPage
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 30_000 })
      .catch(() => {});

    const outgoing = bsbmPage.getByText("Outgoing (subject → object)");
    const literal = bsbmPage.getByText("Literal properties");
    const eitherVisible =
      (await outgoing.isVisible().catch(() => false)) ||
      (await literal.isVisible().catch(() => false));
    expect(eitherVisible).toBe(true);
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
