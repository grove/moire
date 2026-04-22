/**
 * Graphs browser — shown after activating an endpoint.
 * Uses connectedPage fixture (storageState with introspection cache → no SPARQL needed).
 */
import { test, expect } from "../fixtures";

test.describe("Graphs browser", () => {
  test("shows endpoint SPARQL URL in the header area", async ({ connectedPage }) => {
    await expect(connectedPage.getByText(/localhost:7878/)).toBeVisible();
  });

  test("shows named graph count", async ({ connectedPage }) => {
    // "1 graph" (singular) or "N named graphs" (plural)
    await expect(connectedPage.getByText(/\d+\s+(named\s+)?graph/)).toBeVisible();
  });

  test("shows total triple count", async ({ connectedPage }) => {
    await expect(connectedPage.getByText(/triples/).first()).toBeVisible();
  });

  test("shows at least one graph card", async ({ connectedPage }) => {
    await expect(
      connectedPage.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible();
  });

  test("graph card shows class badges", async ({ connectedPage }) => {
    // The BSBM graph should surface at least one known class as a badge
    const knownClasses = ["Review", "Product", "Person", "Vendor"];
    const body = await connectedPage.locator("body").textContent();
    const found = knownClasses.filter((c) => body?.includes(c));
    expect(found.length).toBeGreaterThan(0);
  });

  test("graph card shows predicate count", async ({ connectedPage }) => {
    await expect(connectedPage.getByText(/predicates/).first()).toBeVisible();
  });

  test("Refresh button is present", async ({ connectedPage }) => {
    await expect(
      connectedPage.getByRole("button", { name: /refresh/i }),
    ).toBeVisible();
  });

  test("no Server Components render error on page", async ({ connectedPage }) => {
    const body = await connectedPage.locator("body").textContent();
    expect(body).not.toContain("An error occurred in the Server Components");
  });

  test("navigating into a graph shows types browser", async ({ connectedPage }) => {
    await connectedPage
      .getByRole("button", { name: /browse this graph/i })
      .first()
      .click();
    await expect(connectedPage.getByText(/classes discovered/)).toBeVisible({
      timeout: 10_000,
    });
  });
});
