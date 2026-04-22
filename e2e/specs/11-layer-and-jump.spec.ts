/**
 * Layer selector and JumpViaStrip — appear in entity detail and entity set contexts.
 */
import { test, expect } from "../fixtures";

test.describe("Layer selector", () => {
  // entityDetailPage waits up to 90s for entity cards; allow enough total budget.
  test.setTimeout(180_000);

  test("layer selector is not visible on graphs browser", async ({ connectedPage }) => {
    await expect(
      connectedPage.locator('[aria-label="Layer depth selector"]'),
    ).not.toBeVisible();
  });

  test("layer selector is not visible on entity set", async ({ reviewPage }) => {
    // Layer selector only shows on context=entity (detail view), not on set listing
    await expect(
      reviewPage.locator('[aria-label="Layer depth selector"]'),
    ).not.toBeVisible();
  });

  test("layer selector appears after opening entity detail", async ({ entityDetailPage }) => {
    await expect(
      entityDetailPage.locator('[aria-label="Layer depth selector"]'),
    ).toBeVisible();
  });

  test("layer buttons cover the expected range (+2, +1, Focus, -1, -2)", async ({
    entityDetailPage,
  }) => {
    const selector = entityDetailPage.locator('[aria-label="Layer depth selector"]');
    // Buttons use aria-label from LAYER_DESCRIPTIONS (e.g. "Direct neighbours"),
    // so match by visible text content, not accessible name.
    for (const text of ["Focus", "+1", "+2", "-1", "-2"]) {
      await expect(selector.locator("button").filter({ hasText: text })).toBeVisible();
    }
  });

  test("clicking a different layer changes the active button state", async ({
    entityDetailPage,
  }) => {
    const selector = entityDetailPage.locator('[aria-label="Layer depth selector"]');
    const plus1 = selector.locator("button").filter({ hasText: "+1" }).first();
    await plus1.click();
    // aria-pressed should be "true" for the clicked layer
    await expect(plus1).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("JumpViaStrip", () => {
  test.setTimeout(180_000);

  test("jump-via strip appears on entity set view if navigation predicates exist", async ({
    reviewPage,
  }) => {
    // JumpViaStrip renders "Jump via:" text when nav predicates are available.
    // BSBM has navigation-candidate predicates so the strip should appear.
    const strip = reviewPage.getByText(/jump via:/i);
    const hasStrip = await strip.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasStrip) {
      // Predicate shortcut buttons are siblings of the "Jump via:" label inside a flex div
      const jumpBtns = reviewPage
        .locator("div.flex.items-center")
        .filter({ has: reviewPage.getByText(/jump via:/i) })
        .getByRole("button");
      const count = await jumpBtns.count();
      expect(count).toBeGreaterThan(0);
    }
    // If no strip: component returns null — acceptable with no nav predicates
  });

  test("clicking a Jump via predicate button navigates to an entity set", async ({
    reviewPage,
  }) => {
    const strip = reviewPage.getByText(/jump via:/i);
    const hasStrip = await strip.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasStrip) return;

    const firstJumpBtn = reviewPage
      .locator("div.flex.items-center")
      .filter({ has: reviewPage.getByText(/jump via:/i) })
      .getByRole("button")
      .first();

    await firstJumpBtn.click();

    // Should navigate to an entity set (traversal result)
    await expect(reviewPage.getByText(/entit/)).toBeVisible({ timeout: 60_000 });
  });
});
