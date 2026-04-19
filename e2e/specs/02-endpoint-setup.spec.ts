/**
 * Endpoint setup — full connect flow against a real SPARQL endpoint.
 * Slow (introspection takes ~30s). Runs with empty storage state.
 */
import { test, expect } from "@playwright/test";

const SPARQL_URL = process.env.SPARQL_ENDPOINT ?? "http://localhost:7878/sparql";

// These tests connect fresh — no pre-loaded state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Endpoint setup — connect flow", () => {
  test("shows spinner while connecting", async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto("/");
    await page.getByRole("button", { name: /add your first endpoint/i }).click();
    await page.locator("#ep-label").fill("Local SPARQL");
    await page.locator("#ep-url").fill(SPARQL_URL);
    await page.getByRole("button", { name: "Connect" }).click();

    // Loading spinner should appear while the server action runs
    await expect(page.locator(".animate-spin")).toBeVisible({ timeout: 5_000 });
  });

  test("shows graph cards after successful connection", async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto("/");
    await page.getByRole("button", { name: /add your first endpoint/i }).click();
    await page.locator("#ep-label").fill("Local SPARQL");
    await page.locator("#ep-url").fill(SPARQL_URL);
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByText(/named graphs/)).toBeVisible({ timeout: 60_000 });
    // At least one graph card Browse button is present
    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible();
  });

  test("persists endpoint so it appears in list on reload", async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto("/");
    await page.getByRole("button", { name: /add your first endpoint/i }).click();
    await page.locator("#ep-label").fill("Local SPARQL");
    await page.locator("#ep-url").fill(SPARQL_URL);
    await page.getByRole("button", { name: "Connect" }).click();
    await expect(page.getByText(/named graphs/)).toBeVisible({ timeout: 60_000 });

    // Reload — endpoint should survive (Zustand persist in localStorage)
    await page.goto("/");
    await expect(page.getByText("Local SPARQL")).toBeVisible();
    await expect(page.getByRole("button", { name: /open →/i })).toBeVisible();
  });

  test("shows error for unreachable endpoint", async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto("/");
    await page.getByRole("button", { name: /add your first endpoint/i }).click();
    await page.locator("#ep-label").fill("bad");
    await page.locator("#ep-url").fill("http://localhost:19999/sparql");
    await page.getByRole("button", { name: "Connect" }).click();

    // An error message should appear (either "Failed to connect" or network error text)
    await expect(page.locator(".text-destructive")).toBeVisible({ timeout: 25_000 });
  });

  test("endpoint can be removed from the list", async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto("/");
    await page.getByRole("button", { name: /add your first endpoint/i }).click();
    await page.locator("#ep-label").fill("Temp");
    await page.locator("#ep-url").fill(SPARQL_URL);
    await page.getByRole("button", { name: "Connect" }).click();
    await expect(page.getByText(/named graphs/)).toBeVisible({ timeout: 60_000 });

    // Navigate back to endpoint list
    await page.goto("/");
    await expect(page.getByText("Temp")).toBeVisible();

    // Click the trash / remove button
    await page.getByRole("button", { name: /remove temp/i }).click();

    await expect(page.getByText("No endpoints configured")).toBeVisible();
  });
});
