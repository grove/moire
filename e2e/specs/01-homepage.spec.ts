/**
 * Homepage — empty state (no endpoint configured).
 * Overrides storageState so these tests always start fresh.
 */
import { test, expect } from "@playwright/test";

// Override the project-level storageState: run with a clean browser session
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Homepage — empty state", () => {
  test("has correct page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/moire/i);
  });

  test('shows "No endpoints configured" message', async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("No endpoints configured")).toBeVisible();
  });

  test('shows "Add your first endpoint" call-to-action', async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /add your first endpoint/i }),
    ).toBeVisible();
  });

  test('shows header "Add Endpoint" button', async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /add endpoint/i })).toBeVisible();
  });

  test("header button also opens the endpoint form", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /add endpoint/i }).click();
    await expect(page.locator("#ep-label")).toBeVisible();
  });

  test.describe("Endpoint form", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: /add your first endpoint/i }).click();
    });

    test("shows all form fields", async ({ page }) => {
      await expect(page.locator("#ep-label")).toBeVisible();
      await expect(page.locator("#ep-url")).toBeVisible();
      await expect(page.locator("#ep-auth")).toBeVisible();
      await expect(page.getByRole("button", { name: "Connect" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    });

    test("Cancel hides the form", async ({ page }) => {
      await expect(page.locator("#ep-url")).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.locator("#ep-url")).not.toBeVisible();
    });

    test("validates empty form on submit", async ({ page }) => {
      await page.getByRole("button", { name: "Connect" }).click();
      await expect(
        page.getByText("Label and SPARQL URL are required."),
      ).toBeVisible();
    });

    test("validates invalid URL", async ({ page }) => {
      await page.locator("#ep-label").fill("test");
      await page.locator("#ep-url").fill("not-a-url");
      await page.getByRole("button", { name: "Connect" }).click();
      await expect(page.getByText("Invalid URL.")).toBeVisible();
    });

    test("credentials field hidden by default (auth=none)", async ({ page }) => {
      await expect(page.locator("#ep-cred")).not.toBeVisible();
    });

    test("credentials field appears when basic auth selected", async ({ page }) => {
      await page.locator("#ep-auth").selectOption("basic");
      await expect(page.locator("#ep-cred")).toBeVisible();
    });

    test("credentials field appears when bearer token selected", async ({ page }) => {
      await page.locator("#ep-auth").selectOption("bearer");
      await expect(page.locator("#ep-cred")).toBeVisible();
    });
  });
});
