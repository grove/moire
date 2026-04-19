/**
 * Navigation — back/forward browser history and breadcrumb.
 */
import { test, expect } from "../fixtures";

test.describe("Back / Forward controls", () => {
  test("back button is disabled on the graphs browser (initial view)", async ({
    connectedPage,
  }) => {
    await expect(connectedPage.getByLabel("Go back")).toBeDisabled();
  });

  test("forward button is disabled on the graphs browser (initial view)", async ({
    connectedPage,
  }) => {
    await expect(connectedPage.getByLabel("Go forward")).toBeDisabled();
  });

  test("back button is enabled after navigating into a graph", async ({
    bsbmPage,
  }) => {
    await expect(bsbmPage.getByLabel("Go back")).toBeEnabled();
  });

  test("clicking back returns to graphs browser", async ({ bsbmPage }) => {
    await bsbmPage.getByLabel("Go back").click();
    await expect(bsbmPage.getByText(/named graphs/)).toBeVisible({ timeout: 5_000 });
  });

  test("clicking back then forward restores the types browser", async ({
    bsbmPage,
  }) => {
    // Currently on types browser
    await expect(bsbmPage.getByText(/classes discovered/)).toBeVisible();

    // Go back to graphs browser
    await bsbmPage.getByLabel("Go back").click();
    await expect(bsbmPage.getByText(/named graphs/)).toBeVisible({ timeout: 5_000 });

    // Forward should be enabled now
    await expect(bsbmPage.getByLabel("Go forward")).toBeEnabled();

    // Go forward — types browser returns
    await bsbmPage.getByLabel("Go forward").click();
    await expect(bsbmPage.getByText(/classes discovered/)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("back button disabled after going all the way back", async ({
    bsbmPage,
  }) => {
    await bsbmPage.getByLabel("Go back").click();
    await expect(bsbmPage.getByLabel("Go back")).toBeDisabled();
  });
});

test.describe("Breadcrumb", () => {
  test("breadcrumb visible in the header area", async ({ connectedPage }) => {
    await expect(
      connectedPage.locator("nav[aria-label='Navigation breadcrumb']"),
    ).toBeVisible();
  });

  test("breadcrumb shows endpoint label after activating endpoint", async ({
    connectedPage,
  }) => {
    const breadcrumb = connectedPage.locator("nav[aria-label='Navigation breadcrumb']");
    // Endpoint label "Local SPARQL" (set in auth.setup.ts) should appear
    await expect(breadcrumb).toContainText("Local SPARQL");
  });

  test("breadcrumb grows deeper on graph navigation", async ({ bsbmPage }) => {
    const breadcrumb = bsbmPage.locator("nav[aria-label='Navigation breadcrumb']");
    // After drilling into bsbm graph, breadcrumb has at least 2 segments (endpoint + graph)
    const chevrons = breadcrumb.locator("svg");
    const count = await chevrons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("breadcrumb is non-empty on entity set view", async ({ reviewPage }) => {
    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    const text = await breadcrumb.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

test.describe("Search palette", () => {
  test("search button is visible after connecting endpoint", async ({
    bsbmPage,
  }) => {
    await expect(bsbmPage.getByRole("button", { name: /search/i })).toBeVisible();
  });

  test("search palette opens on button click", async ({ bsbmPage }) => {
    await bsbmPage.getByRole("button", { name: /search/i }).click();
    // The Dialog opens with a search input
    await expect(bsbmPage.locator("input[placeholder*='Search']")).toBeVisible({
      timeout: 3_000,
    });
  });

  test("search palette closes on Escape", async ({ bsbmPage }) => {
    await bsbmPage.getByRole("button", { name: /search/i }).click();
    await expect(
      bsbmPage.locator("input[placeholder*='Search']"),
    ).toBeVisible({ timeout: 3_000 });

    await bsbmPage.keyboard.press("Escape");
    await expect(
      bsbmPage.locator("input[placeholder*='Search']"),
    ).not.toBeVisible({ timeout: 2_000 });
  });
});
