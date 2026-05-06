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
    // After drilling into bsbm graph, breadcrumb has at least 2 segments (endpoint + context)
    const chevrons = breadcrumb.locator("svg");
    const count = await chevrons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("breadcrumb is non-empty on entity set view", async ({ reviewPage }) => {
    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    const text = await breadcrumb.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test("on graphs browser, endpoint crumb is plain text (not a link)", async ({
    connectedPage,
  }) => {
    const breadcrumb = connectedPage.locator("nav[aria-label='Navigation breadcrumb']");
    // On the graphs page there is no clickable button — endpoint is the current location
    await expect(breadcrumb.getByRole("button")).toHaveCount(0);
  });

  test("on types browser, endpoint crumb is a clickable link", async ({
    bsbmPage,
  }) => {
    const breadcrumb = bsbmPage.locator("nav[aria-label='Navigation breadcrumb']");
    await expect(
      breadcrumb.getByRole("button", { name: /navigate to local sparql/i }),
    ).toBeVisible();
  });

  test("on entity set, both endpoint and graph crumbs are links", async ({
    reviewPage,
  }) => {
    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    // endpoint link
    await expect(
      breadcrumb.getByRole("button", { name: /navigate to local sparql/i }),
    ).toBeVisible();
    // graph link (second button in the breadcrumb)
    const buttons = breadcrumb.getByRole("button");
    await expect(buttons).toHaveCount(2);
  });

  test("current context (last crumb) is never a button", async ({ reviewPage }) => {
    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    const text = await breadcrumb.textContent();
    // The last span (current context) is a <span>, not a <button>
    // Verify the breadcrumb has exactly 2 buttons and additional text beyond them
    const buttons = breadcrumb.getByRole("button");
    await expect(buttons).toHaveCount(2);
    // The breadcrumb as a whole contains more text than just the two button labels
    const buttonTexts = await buttons.allTextContents();
    const allText = text ?? "";
    const buttonText = buttonTexts.join("");
    expect(allText.length).toBeGreaterThan(buttonText.length);
  });
});

test.describe("Breadcrumb navigation links", () => {
  test("clicking endpoint crumb on types browser navigates to graphs browser", async ({
    bsbmPage,
  }) => {
    const breadcrumb = bsbmPage.locator("nav[aria-label='Navigation breadcrumb']");
    await breadcrumb
      .getByRole("button", { name: /navigate to local sparql/i })
      .click();
    await expect(bsbmPage.getByText(/named graphs/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("after navigating via endpoint crumb, forward button is enabled", async ({
    bsbmPage,
  }) => {
    const breadcrumb = bsbmPage.locator("nav[aria-label='Navigation breadcrumb']");
    await breadcrumb
      .getByRole("button", { name: /navigate to local sparql/i })
      .click();
    await expect(bsbmPage.getByText(/named graphs/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(bsbmPage.getByLabel("Go forward")).toBeEnabled();
  });

  test("clicking graph crumb on entity set navigates to types browser", async ({
    reviewPage,
  }) => {
    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    // The second button is the graph crumb
    await breadcrumb.getByRole("button").nth(1).click();
    await expect(reviewPage.getByText(/classes discovered/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("after navigating via graph crumb, back button takes you back to the set", async ({
    reviewPage,
  }) => {
    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    await breadcrumb.getByRole("button").nth(1).click();
    await expect(reviewPage.getByText(/classes discovered/i)).toBeVisible({
      timeout: 5_000,
    });
    // Navigate back — should return to the entity set
    await reviewPage.getByLabel("Go back").click();
    await expect(reviewPage.locator("aside[aria-label='Navigation facets']")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("endpoint crumb tooltip shows SPARQL URL", async ({ bsbmPage }) => {
    const breadcrumb = bsbmPage.locator("nav[aria-label='Navigation breadcrumb']");
    const endpointBtn = breadcrumb.getByRole("button", {
      name: /navigate to local sparql/i,
    });
    await endpointBtn.hover();
    await expect(
      bsbmPage.locator("[data-radix-popper-content-wrapper]"),
    ).toContainText("http://localhost", { timeout: 3_000 });
  });

  test("graph crumb tooltip shows named graph IRI", async ({ reviewPage }) => {
    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    const graphBtn = breadcrumb.getByRole("button").nth(1);
    await graphBtn.hover();
    await expect(
      reviewPage.locator("[data-radix-popper-content-wrapper]"),
    ).toContainText("Named graph:", { timeout: 3_000 });
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
