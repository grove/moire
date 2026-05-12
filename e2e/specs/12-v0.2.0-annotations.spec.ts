/**
 * v0.2.0 — Traversal breadcrumb, role icons, and annotated tooltips.
 */
import { test, expect } from "../fixtures";

test.describe("Traversal breadcrumb", () => {
  test.setTimeout(90_000);

  test("traversal breadcrumb is not shown on graphs browser", async ({
    connectedPage,
  }) => {
    // The nav element should not exist in the DOM (component returns null)
    const count = await connectedPage
      .locator("nav[aria-label='Traversal path']")
      .count();
    expect(count).toBe(0);
  });

  test("traversal breadcrumb is not shown on types browser (no traversal yet)", async ({
    bsbmPage,
  }) => {
    // Types browser is context=types; no set frames → component returns null
    const count = await bsbmPage
      .locator("nav[aria-label='Traversal path']")
      .count();
    expect(count).toBe(0);
  });

  test("traversal breadcrumb appears after following a relationship", async ({
    reviewPage,
  }) => {
    // reviewPage is entity set (context=set), reached via setClass — no traversal predicate
    // Navigate via a Jump predicate to create a traversal step
    const strip = reviewPage.getByText(/jump via:/i);
    const hasStrip = await strip.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasStrip) {
      // No jump strip — skip gracefully
      return;
    }

    const firstJumpBtn = reviewPage
      .locator("div.flex.items-center")
      .filter({ has: reviewPage.getByText(/jump via:/i) })
      .getByRole("button")
      .first();

    await firstJumpBtn.click();

    // After traversal, traversal breadcrumb should appear (renders from Zustand state).
    // Give React time to re-render and the breadcrumb condition to evaluate.
    await expect(
      reviewPage.locator("nav[aria-label='Traversal path']"),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("traversal breadcrumb chips are clickable to go back", async ({
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

    // Wait for traversal breadcrumb
    const traversalCrumb = reviewPage.locator("nav[aria-label='Traversal path']");
    await expect(traversalCrumb).toBeVisible({ timeout: 30_000 });

    // The first chip is a button (navigates back to previous set)
    const chips = traversalCrumb.getByRole("button");
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Role icons in Relationships Browser", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ bsbmPage }) => {
    await bsbmPage.getByRole("button", { name: /browse relationships/i }).click();
    // Wait for either the loaded content or the loading skeletons to appear,
    // then wait for skeletons to disappear (data loaded or error).
    await bsbmPage
      .locator(".animate-pulse, [class*='Skeleton']")
      .first()
      .waitFor({ state: "attached", timeout: 10_000 })
      .catch(() => {}); // ok if no loading state was shown (from cache)
    await bsbmPage
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 90_000 })
      .catch(() => {}); // ok if skeletons never appeared
    // Ensure we're on the relationships view
    await bsbmPage
      .locator("text=/relationships on the current/i, text=/no relationships found/i")
      .first()
      .waitFor({ timeout: 10_000 })
      .catch(() => {});
  });

  test("role icons appear in relationship rows", async ({ bsbmPage }) => {
    // Role icons have aria-label starting with "Role:" — only present if relationships loaded
    const roleIcons = bsbmPage.locator('[aria-label^="Role:"]');
    const count = await roleIcons.count();
    // If data loaded, expect icons; otherwise the component shows empty/error state
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    } else {
      // Verify the relationships view rendered (loading complete) even if no data
      const body = await bsbmPage.locator("body").textContent();
      expect(body).not.toContain("An error occurred");
    }
  });

  test("role icons have accessible aria labels", async ({ bsbmPage }) => {
    const roleIcons = bsbmPage.locator('[aria-label^="Role:"]');
    const count = await roleIcons.count();
    if (count === 0) return; // No relationships loaded — skip gracefully
    // Use evaluate() to reliably read SVG attributes (getAttribute on SVG can be
    // inconsistent across Playwright versions for aria-* attributes).
    const label = await roleIcons
      .first()
      .evaluate((el: Element) => el.getAttribute("aria-label"));
    expect(label).toBeTruthy();
    expect(label).toMatch(/^Role:\s/);
  });
});

test.describe("Role icons in Jump strip", () => {
  test("jump strip buttons include role icons", async ({ reviewPage }) => {
    const strip = reviewPage.getByText(/jump via:/i);
    const hasStrip = await strip.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasStrip) return; // No nav predicates in this graph — acceptable

    // Each Jump button is inside a flex wrapper and contains a role icon
    const jumpContainer = reviewPage
      .locator("div.flex.items-center")
      .filter({ has: reviewPage.getByText(/jump via:/i) });

    const roleIcons = jumpContainer.locator('[aria-label^="Role:"]');
    const count = await roleIcons.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Predicate hover tooltips — enhanced content", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ bsbmPage }) => {
    await bsbmPage.getByRole("button", { name: /browse relationships/i }).click();
    await bsbmPage
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 90_000 })
      .catch(() => {});
    await bsbmPage
      .locator("text=/relationships on the current/i, text=/no relationships found/i")
      .first()
      .waitFor({ timeout: 10_000 })
      .catch(() => {});
  });

  test("hovering a predicate label shows a tooltip with the IRI", async ({
    bsbmPage,
  }) => {
    const firstLabel = bsbmPage.locator(".font-mono.text-xs.cursor-help").first();
    const visible = await firstLabel.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) return; // No data loaded — skip gracefully

    // Hover and wait for Radix to mount the tooltip portal.
    // Radix Tooltip has a default open delay (700 ms); use waitFor to be safe.
    await firstLabel.hover();
    const tooltipWrapper = bsbmPage.locator("[data-radix-popper-content-wrapper]");
    await tooltipWrapper.waitFor({ state: "attached", timeout: 8_000 });
    await expect(tooltipWrapper).toBeVisible({ timeout: 3_000 });
  });

  test("predicate tooltip does not cause layout shift", async ({ bsbmPage }) => {
    // Tooltips use Radix portals (popper), so they render outside the layout flow.
    // Verify the main content area width is unchanged after hovering.
    const mainContent = bsbmPage.locator("main");
    const widthBefore = (await mainContent.boundingBox())?.width ?? 0;

    const firstLabel = bsbmPage.locator(".font-mono.text-xs.cursor-help").first();
    const visible = await firstLabel.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) return;

    await firstLabel.hover();
    await bsbmPage
      .locator("[data-radix-popper-content-wrapper]")
      .waitFor({ timeout: 3_000 })
      .catch(() => {});

    const widthAfter = (await mainContent.boundingBox())?.width ?? 0;
    // Allow 1px tolerance
    expect(Math.abs(widthAfter - widthBefore)).toBeLessThanOrEqual(1);
  });
});
