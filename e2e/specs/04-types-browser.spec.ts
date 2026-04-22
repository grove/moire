/**
 * Types browser — shown after entering a named graph.
 * Uses bsbmPage fixture (bsbm graph selected).
 */
import { test, expect } from "../fixtures";

test.describe("Types browser", () => {
  test("shows class count message", async ({ bsbmPage }) => {
    await expect(bsbmPage.getByText(/classes discovered/)).toBeVisible();
  });

  test("shows at least 5 classes for bsbm", async ({ bsbmPage }) => {
    const text = await bsbmPage.getByText(/classes discovered/).textContent();
    const match = text?.match(/^(\d+)/);
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(5);
  });

  test("shows known BSBM classes", async ({ bsbmPage }) => {
    await expect(bsbmPage.getByText("Review")).toBeVisible();
    await expect(bsbmPage.getByText("Product", { exact: true })).toBeVisible();
    await expect(bsbmPage.getByText("Person")).toBeVisible();
  });

  test("class rows show instance counts", async ({ bsbmPage }) => {
    await expect(bsbmPage.getByText(/instances/).first()).toBeVisible();
  });

  test("shows Browse Relationships button", async ({ bsbmPage }) => {
    await expect(
      bsbmPage.getByRole("button", { name: /browse relationships/i }),
    ).toBeVisible();
  });

  test("Browse Relationships button navigates to relationships view", async ({
    bsbmPage,
  }) => {
    await bsbmPage.getByRole("button", { name: /browse relationships/i }).click();
    await expect(bsbmPage.getByText(/relationships on the current/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("clicking a class navigates to entity set", async ({ bsbmPage }) => {
    const reviewRow = bsbmPage
      .locator(".group")
      .filter({ has: bsbmPage.locator("span.font-medium", { hasText: /^Review$/ }) })
      .first();
    await reviewRow.hover();
    await reviewRow.getByRole("button", { name: /browse as set/i }).click();

    await expect(bsbmPage.getByText(/entit/)).toBeVisible({ timeout: 20_000 });
  });

  test("breadcrumb shows graph context", async ({ bsbmPage }) => {
    const breadcrumb = bsbmPage.locator("nav[aria-label='Navigation breadcrumb']");
    await expect(breadcrumb).toBeVisible();
    const text = await breadcrumb.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test("no render error on page", async ({ bsbmPage }) => {
    const body = await bsbmPage.locator("body").textContent();
    expect(body).not.toContain("An error occurred in the Server Components");
  });
});
