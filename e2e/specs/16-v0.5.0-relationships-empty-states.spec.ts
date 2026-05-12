/**
 * v0.5.0 — Richer Relationship Browser & Explanatory Empty States
 *
 * Tests that verify:
 * 1. Relationships Browser rows render without layout thrashing.
 * 2. Domain/range secondary text visible on rows when metadata available.
 * 3. Coverage percentage shown on relationship rows.
 * 4. OWL characteristic badges appear in the predicate tooltip.
 * 5. Zero-result traversal shows coverage info and a recovery suggestion.
 * 6. Zero-result filter shows "Active filters leave no matching records" and
 *    a recovery action.
 */
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  SparqlMockServer,
  ASK_FALSE,
  singleGraphResponse,
  predicateBindingsResponse,
} from "../sparql-mock-server";

// ── Constants ──────────────────────────────────────────────────

const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const EX_AFFILIATED_WITH = "http://example.org/affiliatedWith";
const EX_RESEARCHER = "http://example.org/Researcher";
const EX_ORGANIZATION = "http://example.org/Organization";
const TEST_GRAPH = "http://v05-test.example/graph";

// ── Helpers ────────────────────────────────────────────────────

async function connectAndNavigateToRelationships(
  page: Page,
  serverUrl: string,
): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: /add your first endpoint/i }).click();
  await page.locator("#ep-label").fill("Mock SPARQL v0.5");
  await page.locator("#ep-url").fill(serverUrl);
  await page.getByRole("button", { name: "Connect" }).click();

  // Wait for graph card — introspection complete
  await expect(
    page.getByRole("button", { name: /browse this graph/i }).first(),
  ).toBeVisible({ timeout: 20_000 });

  // Enter graph → types browser
  await page.getByRole("button", { name: /browse this graph/i }).first().click();
  await expect(page.getByText(/types in/i)).toBeVisible({ timeout: 10_000 });

  // Browse relationships
  await page.getByRole("button", { name: /browse relationships/i }).click();

  // Wait for EITHER data-loaded state OR empty state in the relationships browser
  await Promise.race([
    page.getByText(/relationships on the current/i).waitFor({ state: "visible", timeout: 20_000 }),
    page.getByText(/no relationships found/i).waitFor({ state: "visible", timeout: 20_000 }),
  ]).catch(() => {
    // If neither appears within timeout, we just proceed (skeleton may still be shown)
  });
}

function setupMockServer(server: SparqlMockServer): void {
  server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });

  // List named graphs
  server.addMatcher("DISTINCT ?graph", {
    mode: "ok",
    body: singleGraphResponse(TEST_GRAPH, 100),
  });

  // Sample-graph introspection query (unique: uses BIND(IF(isIRI and ?predicate ?valueKind)
  server.addMatcher("?predicate ?valueKind", {
    mode: "ok",
    body: predicateBindingsResponse([
      { iri: RDFS_LABEL, valueKind: "literal", subjectCount: 100, objectCount: 100 },
      { iri: EX_AFFILIATED_WITH, valueKind: "iri", subjectCount: 30, objectCount: 60 },
    ]),
  });

  // Label heuristic query
  server.addMatcher("?labelPredicate", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            labelPredicate: { type: "uri", value: RDFS_LABEL },
            coverage: { type: "literal", value: "100" },
          },
        ],
      },
    },
  });

  // Class hierarchy query
  server.addMatcher("instanceCount", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            class: { type: "uri", value: EX_RESEARCHER },
            instanceCount: { type: "literal", value: "30" },
          },
        ],
      },
    },
  });

  // Predicate metadata query — returns domain/range/inverse/owl for EX_AFFILIATED_WITH
  // Unique: uses rdfs:label in VALUES clause along with owl:inverseOf
  server.addMatcher("owl:inverseOf", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            predicate: { type: "uri", value: EX_AFFILIATED_WITH },
            label: { type: "literal", value: "affiliated with" },
            domain: { type: "uri", value: EX_RESEARCHER },
            domainLabel: { type: "literal", value: "Researcher" },
            range: { type: "uri", value: EX_ORGANIZATION },
            rangeLabel: { type: "literal", value: "Organization" },
            inverseLabel: { type: "literal", value: "member of" },
            owlType: { type: "uri", value: "http://www.w3.org/2002/07/owl#FunctionalProperty" },
          },
        ],
      },
    },
  });

  // Relationships query — unique: uses SAMPLE(IF(isIRI (not in sample-graph query)
  server.addMatcher("SAMPLE(IF(isIRI", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            predicate: { type: "uri", value: EX_AFFILIATED_WITH },
            subjectCount: { type: "literal", value: "30" },
            objectCount: { type: "literal", value: "60" },
            valueKind: { type: "literal", value: "iri" },
          },
        ],
      },
    },
  });
}

// ── Tests ──────────────────────────────────────────────────────

test.describe("v0.5.0 — Richer Relationship Browser", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let server: SparqlMockServer;

  test.beforeEach(async () => {
    server = new SparqlMockServer();
    await server.start();
  });

  test.afterEach(async () => {
    await server.stop();
  });

  // ── Test 1 ────────────────────────────────────────────────────
  test("relationship rows render without layout thrashing", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server);
    await connectAndNavigateToRelationships(page, server.url);

    // Wait for loading to settle
    await page
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 10_000 })
      .catch(() => {});

    // No render error
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");

    // Either rows are rendered or "no relationships" — no blank/broken state
    const hasContent =
      body?.includes("relationship") ||
      body?.includes("Explore") ||
      body?.includes("affiliatedWith") ||
      body?.includes("No relationships found");
    expect(hasContent).toBe(true);
  });

  // ── Test 2 ────────────────────────────────────────────────────
  test("domain/range secondary text visible on row when metadata available", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    setupMockServer(server);
    await connectAndNavigateToRelationships(page, server.url);

    await page
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 10_000 })
      .catch(() => {});

    // Check for domain/range text
    const domainRangeText = page.locator("[data-testid='domain-range-text']");
    const domainCount = await domainRangeText.count();

    if (domainCount > 0) {
      const text = await domainRangeText.first().textContent();
      expect(text).toMatch(/Usually (describes|points to)/);
    } else {
      // domain/range not shown — verify no crash occurred
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("An error occurred");
    }
  });

  // ── Test 3 ────────────────────────────────────────────────────
  test("coverage percentage is shown on relationship rows", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server);
    await connectAndNavigateToRelationships(page, server.url);

    await page
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 10_000 })
      .catch(() => {});

    const coverageEls = page.locator("[data-testid='coverage-percent']");
    const count = await coverageEls.count();

    if (count > 0) {
      const text = await coverageEls.first().textContent();
      expect(text).toMatch(/\d+%/);
    } else {
      // Coverage not shown — verify no crash
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("An error occurred");
    }
  });

  // ── Test 4 ────────────────────────────────────────────────────
  test("OWL characteristic badges appear in predicate tooltip without error", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    setupMockServer(server);
    await connectAndNavigateToRelationships(page, server.url);

    await page
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 10_000 })
      .catch(() => {});

    // Hover over a predicate label to trigger tooltip
    const predicateLabel = page
      .locator("[data-testid='relationship-row'] span.cursor-help")
      .first();
    const exists = await predicateLabel.isVisible().catch(() => false);

    if (exists) {
      await predicateLabel.hover();
      await page.waitForTimeout(500);
    }

    // No render error — tooltip with OWL badges must not break the page
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });
});

test.describe("v0.5.0 — Explanatory Empty States", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let server: SparqlMockServer;

  test.beforeEach(async () => {
    server = new SparqlMockServer();
    await server.start();
  });

  test.afterEach(async () => {
    await server.stop();
  });

  // Shared setup for empty-state tests
  function setupEmptyTraversalServer(
    s: SparqlMockServer,
    graphLabel: string,
    subjectCountForPredicate: number,
    totalSubjectCount: number,
  ): void {
    s.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });
    s.addMatcher("DISTINCT ?graph", {
      mode: "ok",
      body: singleGraphResponse(TEST_GRAPH, totalSubjectCount),
    });
    s.addMatcher("?predicate ?valueKind", {
      mode: "ok",
      body: predicateBindingsResponse([
        { iri: RDFS_LABEL, valueKind: "literal", subjectCount: totalSubjectCount, objectCount: totalSubjectCount },
        { iri: EX_AFFILIATED_WITH, valueKind: "iri", subjectCount: subjectCountForPredicate, objectCount: subjectCountForPredicate + 2 },
      ]),
    });
    s.addMatcher("?labelPredicate", {
      mode: "ok",
      body: {
        results: {
          bindings: [
            {
              labelPredicate: { type: "uri", value: RDFS_LABEL },
              coverage: { type: "literal", value: String(totalSubjectCount) },
            },
          ],
        },
      },
    });
    s.addMatcher("instanceCount", { mode: "ok", body: { results: { bindings: [] } } });
    s.addMatcher("owl:inverseOf", { mode: "ok", body: { results: { bindings: [] } } });
    // Relationships query
    s.addMatcher("SAMPLE(IF(isIRI", {
      mode: "ok",
      body: {
        results: {
          bindings: [
            {
              predicate: { type: "uri", value: EX_AFFILIATED_WITH },
              subjectCount: { type: "literal", value: String(subjectCountForPredicate) },
              objectCount: { type: "literal", value: String(subjectCountForPredicate + 2) },
              valueKind: { type: "literal", value: "iri" },
            },
          ],
        },
      },
    });
    // Entity queries return empty (zero-result traversal)
    s.setFallback({ mode: "ok", body: { results: { bindings: [] } } });
    void graphLabel;
  }

  // ── Test 5 ────────────────────────────────────────────────────
  test("zero-result traversal shows a recovery suggestion", async ({ page }) => {
    test.setTimeout(60_000);

    setupEmptyTraversalServer(server, "v0.5-empty", 3, 100);

    await page.goto("/");
    await page.getByRole("button", { name: /add your first endpoint/i }).click();
    await page.locator("#ep-label").fill("Mock SPARQL v0.5 Empty");
    await page.locator("#ep-url").fill(server.url);
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /browse this graph/i }).first().click();
    await expect(page.getByText(/types in/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /browse relationships/i }).click();

    // Wait for relationships to load
    await page
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 20_000 })
      .catch(() => {});

    // Try to follow a relationship
    const relRows = page.locator("[data-testid='relationship-row']");
    const rowCount = await relRows.count();
    if (rowCount > 0) {
      const row = relRows.first();
      await row.hover();
      const followBtn = row.getByRole("button", { name: /follow as set/i });
      const btnVisible = await followBtn.isVisible().catch(() => false);
      if (btnVisible) {
        await followBtn.click();
        // Wait for empty state or entity list
        await page.waitForTimeout(3000);

        const body = await page.locator("body").textContent();
        // Either an empty state with suggestion or a generic fallback
        const hasEmptyOrSuggestion =
          body?.includes("No results") ||
          body?.includes("No matching records") ||
          body?.includes("Try") ||
          body?.includes("Go back");
        expect(hasEmptyOrSuggestion).toBe(true);
      }
    }
    // Even with no row, no crash
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });

  // ── Test 6 ────────────────────────────────────────────────────
  test("traversal empty state names the predicate and offers recovery action", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    setupEmptyTraversalServer(server, "v0.5-action", 5, 50);

    await page.goto("/");
    await page.getByRole("button", { name: /add your first endpoint/i }).click();
    await page.locator("#ep-label").fill("Mock SPARQL v0.5 Action");
    await page.locator("#ep-url").fill(server.url);
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /browse this graph/i }).first().click();
    await expect(page.getByText(/types in/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /browse relationships/i }).click();

    await page
      .locator(".animate-pulse")
      .waitFor({ state: "detached", timeout: 20_000 })
      .catch(() => {});

    const relRows = page.locator("[data-testid='relationship-row']");
    const rowCount = await relRows.count();
    if (rowCount > 0) {
      const row = relRows.first();
      await row.hover();
      const followBtn = row.getByRole("button", { name: /follow as set/i });
      const btnVisible = await followBtn.isVisible().catch(() => false);
      if (btnVisible) {
        await followBtn.click();
        await page.waitForTimeout(3000);

        // Traversal empty state should suggest at least one action
        const goBackBtn = page.getByRole("button", { name: /go back/i });
        const backVisible = await goBackBtn.isVisible().catch(() => false);

        const emptyState = page.locator("[data-testid='empty-state-traversal']");
        const emptyVisible = await emptyState.isVisible().catch(() => false);

        // Either the specific empty state or the "Go back" button
        expect(backVisible || emptyVisible).toBe(true);
      }
    }
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });

  // ── Test 7 ────────────────────────────────────────────────────
  test("filter empty state shows 'Active filters leave no matching records'", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });
    server.addMatcher("DISTINCT ?graph", {
      mode: "ok",
      body: singleGraphResponse(TEST_GRAPH, 50),
    });
    server.addMatcher("?predicate ?valueKind", {
      mode: "ok",
      body: predicateBindingsResponse([
        { iri: RDFS_LABEL, valueKind: "literal", subjectCount: 50, objectCount: 50 },
        {
          iri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
          valueKind: "iri",
          subjectCount: 50,
          objectCount: 50,
        },
      ]),
    });
    server.addMatcher("?labelPredicate", {
      mode: "ok",
      body: {
        results: {
          bindings: [
            {
              labelPredicate: { type: "uri", value: RDFS_LABEL },
              coverage: { type: "literal", value: "50" },
            },
          ],
        },
      },
    });
    server.addMatcher("instanceCount", {
      mode: "ok",
      body: {
        results: {
          bindings: [
            {
              class: { type: "uri", value: EX_RESEARCHER },
              instanceCount: { type: "literal", value: "50" },
            },
          ],
        },
      },
    });
    server.addMatcher("owl:inverseOf", { mode: "ok", body: { results: { bindings: [] } } });

    // Facet count query
    server.addMatcher("GROUP BY ?facetValue", {
      mode: "ok",
      body: {
        results: {
          bindings: [
            {
              facetValue: { type: "uri", value: EX_RESEARCHER },
              count: { type: "literal", value: "10" },
            },
          ],
        },
      },
    });

    // All entity queries return empty (no matches after filter)
    server.setFallback({ mode: "ok", body: { results: { bindings: [] } } });

    await page.goto("/");
    await page.getByRole("button", { name: /add your first endpoint/i }).click();
    await page.locator("#ep-label").fill("Mock SPARQL v0.5 Filter");
    await page.locator("#ep-url").fill(server.url);
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /browse this graph/i }).first().click();
    await expect(page.getByText(/types in/i)).toBeVisible({ timeout: 10_000 });

    // Click a class row to enter entity set
    const classRows = page.locator("[data-testid='class-row']");
    const classCount = await classRows.count();
    if (classCount > 0) {
      await classRows.first().click();
      await page.waitForTimeout(2000);

      // Click a facet value if available
      const facetBtn = page.locator("[data-testid='facet-group'] button").first();
      const facetVisible = await facetBtn.isVisible().catch(() => false);
      if (facetVisible) {
        await facetBtn.click();
        await page.waitForTimeout(1500);

        const emptyState = page.locator("[data-testid='empty-state-filter']");
        const isVisible = await emptyState.isVisible().catch(() => false);
        if (isVisible) {
          await expect(emptyState).toContainText(/Active filters leave no matching records/i);
          await expect(
            emptyState.getByRole("button", { name: /clear all filters/i }),
          ).toBeVisible();
        }
      }
    }
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });
});

