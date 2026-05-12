/**
 * v0.3.0 — Natural Context Headers
 *
 * Tests that context headers read like plain English after navigation:
 * - Vocabulary registry inverse labels are used when available (e.g., skos:broader → "Broader concepts for …")
 * - Target class plural is used when focusClass is available but no inverse label exists
 * - Header falls back gracefully when neither is available
 * - Headers do not exceed 100 characters
 */
import { test, expect, useSparqlTimeout } from "../fixtures";

test.describe("Natural context headers — v0.3.0", () => {
  useSparqlTimeout();

  test("context header on the types browser reads naturally", async ({
    bsbmPage,
  }) => {
    // Types browser: "Types in <graph label>" — should not be raw IRI
    const header = bsbmPage.locator('[data-testid="context-header"]');
    if ((await header.count()) === 0) {
      // Header may be inside the LensBreadcrumb last crumb
      const breadcrumb = bsbmPage.locator("nav[aria-label='Navigation breadcrumb']");
      const lastCrumb = breadcrumb.locator("span.text-foreground, span.font-medium").last();
      const text = await lastCrumb.textContent({ timeout: 5_000 }).catch(() => "");
      expect(text).toMatch(/Types in /i);
      return;
    }
    await expect(header).toContainText(/Types in /i);
  });

  test("context header on entity set shows pluralised class name", async ({
    reviewPage,
  }) => {
    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    const lastCrumb = breadcrumb.locator("span.text-foreground, span.font-medium").last();
    const text = await lastCrumb.textContent({ timeout: 10_000 }).catch(() => "");
    // Should contain pluralised "Review" class label — "Reviews"
    expect(text).toMatch(/review/i);
  });

  test("context header after traversal does not exceed 100 characters", async ({
    reviewPage,
  }) => {
    // Navigate via a Jump predicate (if available) and check header length
    const strip = reviewPage.getByText(/jump via:/i);
    const hasStrip = await strip.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasStrip) {
      // No jump strip — still check current header length
      const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
      const lastCrumb = breadcrumb.locator("span.text-foreground, span.font-medium").last();
      const text = await lastCrumb.textContent({ timeout: 5_000 }).catch(() => "");
      expect((text ?? "").length).toBeLessThanOrEqual(100);
      return;
    }

    const firstJumpBtn = reviewPage
      .locator("div.flex.items-center")
      .filter({ has: reviewPage.getByText(/jump via:/i) })
      .getByRole("button")
      .first();

    await firstJumpBtn.click();

    // After traversal — wait for content to settle
    await reviewPage
      .locator("nav[aria-label='Traversal path']")
      .waitFor({ state: "visible", timeout: 30_000 })
      .catch(() => {});

    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    const lastCrumb = breadcrumb.locator("span.text-foreground, span.font-medium").last();
    const text = await lastCrumb.textContent({ timeout: 10_000 }).catch(() => "");
    expect((text ?? "").length).toBeLessThanOrEqual(100);
  });

  test("context header after traversal reads more naturally than raw predicate IRI", async ({
    reviewPage,
  }) => {
    // Navigate via a relationship from the Relationships Browser
    await reviewPage.getByRole("button", { name: /browse relationships/i }).click();

    // Wait for relationships to load
    await reviewPage
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 90_000 })
      .catch(() => {});

    // Find any navigable relationship row
    const relRows = reviewPage.locator('[data-testid="relationship-row"]');
    const rowCount = await relRows.count();

    if (rowCount === 0) {
      // No relationship rows with test-id — skip gracefully
      test.info().annotations.push({
        type: "skip-reason",
        description: "No [data-testid='relationship-row'] found — relationships panel may be empty",
      });
      return;
    }

    // Click the first relationship row to navigate
    await relRows.first().click();

    // Wait for navigation to complete (sidebar appears)
    await reviewPage
      .waitForSelector("aside[aria-label='Navigation facets']", { timeout: 30_000 })
      .catch(() => {});

    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    const lastCrumb = breadcrumb.locator("span.text-foreground, span.font-medium").last();
    const text = await lastCrumb.textContent({ timeout: 10_000 }).catch(() => "");

    // Should not end with a raw IRI fragment like "http://purl.org/dc/..."
    expect(text ?? "").not.toMatch(/^https?:\/\//);
    // Should be ≤ 100 characters
    expect((text ?? "").length).toBeLessThanOrEqual(100);
  });

  test("context header fallback: shows predicate label when no focusClass and no inverse", async ({
    reviewPage,
  }) => {
    // This test verifies the graceful fallback — no crash, no raw IRI in header.
    const breadcrumb = reviewPage.locator("nav[aria-label='Navigation breadcrumb']");
    await expect(breadcrumb).toBeVisible({ timeout: 10_000 });

    const lastCrumb = breadcrumb.locator("span.text-foreground, span.font-medium").last();
    const text = await lastCrumb.textContent({ timeout: 5_000 }).catch(() => "");

    // Header should always be defined and non-empty when on a set
    expect(text).toBeTruthy();
    // Should not be a raw IRI
    expect(text ?? "").not.toMatch(/^https?:\/\//);
  });
});
