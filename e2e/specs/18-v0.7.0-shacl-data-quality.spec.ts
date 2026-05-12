/**
 * v0.7.0 — SHACL Data Quality
 *
 * Tests that verify:
 * 1. SHACL violation badge appears on entity cards when violations exist.
 * 2. SHACL violations panel appears on entity detail when violations exist.
 * 3. Violations panel shows violation message and severity badge.
 * 4. Badge and panel are absent when no SHACL violations exist.
 * 5. Shape query degrades gracefully on graphs without SHACL (empty shapes).
 * 6. Panel is collapsible (expand/collapse toggle works).
 */
import { test, expect, type Page } from "@playwright/test";
import {
  SparqlMockServer,
  ASK_FALSE,
  singleGraphResponse,
  predicateBindingsResponse,
  type SparqlBinding,
} from "../sparql-mock-server";

// ── Constants ──────────────────────────────────────────────────

const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const EX_PUBLISH_DATE = "http://example.org/publishedDate";
const TEST_GRAPH = "http://v07-test.example/graph";
const TEST_CLASS = "http://v07-test.example/Article";
const TEST_ENTITY = "http://v07-test.example/article-1";

// ── Mock server helpers ────────────────────────────────────────

/**
 * Build a SHACL shapes response: the Article class requires publishedDate (minCount=1).
 */
function shaclShapesResponse(): { results: { bindings: SparqlBinding[] } } {
  return {
    results: {
      bindings: [
        {
          path: { type: "uri", value: EX_PUBLISH_DATE },
          name: { type: "literal", value: "Publication Date" },
          description: { type: "literal", value: "The date the article was published." },
          minCount: { type: "literal", value: "1" },
          maxCount: { type: "literal", value: "1" },
        },
      ],
    },
  };
}

/**
 * SHACL violation check response: article-1 is missing publishedDate.
 */
function shaclViolationResponse(): { results: { bindings: SparqlBinding[] } } {
  return {
    results: {
      bindings: [
        { entity: { type: "uri", value: TEST_ENTITY } },
      ],
    },
  };
}

function setupMockServer(
  server: SparqlMockServer,
  opts: { withShacl?: boolean; withViolations?: boolean } = {},
): void {
  const { withShacl = false, withViolations = false } = opts;

  // pg-ripple capability probe
  server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });

  // List named graphs
  server.addMatcher("DISTINCT ?graph", {
    mode: "ok",
    body: singleGraphResponse(TEST_GRAPH, 50),
  });

  // Sample-graph introspection
  server.addMatcher("?predicate ?valueKind", {
    mode: "ok",
    body: predicateBindingsResponse([
      { iri: RDFS_LABEL, valueKind: "literal", subjectCount: 50, objectCount: 50 },
      { iri: RDF_TYPE, valueKind: "iri", subjectCount: 50, objectCount: 50 },
    ]),
  });

  // Label heuristic
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

  // Class hierarchy
  server.addMatcher("instanceCount", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            class: { type: "uri", value: TEST_CLASS },
            instanceCount: { type: "literal", value: "1" },
            classLabel: { type: "literal", value: "Article" },
          },
        ],
      },
    },
  });

  // Predicate metadata (v0.4)
  server.addMatcher("owl:inverseOf", { mode: "ok", body: { results: { bindings: [] } } });

  // v0.6.0 — resource annotation query
  server.addMatcher("skos:altLabel", {
    mode: "ok",
    body: { results: { bindings: [] } },
  });

  // v0.7.0 — SHACL shape query (unique: sh:NodeShape + sh:targetClass)
  server.addMatcher("sh:NodeShape", {
    mode: "ok",
    body: withShacl ? shaclShapesResponse() : { results: { bindings: [] } },
  });

  // v0.7.0 — SHACL violation check query (unique: FILTER NOT EXISTS)
  server.addMatcher("FILTER NOT EXISTS", {
    mode: "ok",
    body: withViolations ? shaclViolationResponse() : { results: { bindings: [] } },
  });

  // Entity predicate table query (unique: ?predLabel)
  // When withViolations=false, include EX_PUBLISH_DATE so client-side check finds no violations
  const predicateTableBindings: SparqlBinding[] = [
    {
      predicate: { type: "uri", value: RDFS_LABEL },
      predLabel: { type: "literal", value: "label" },
      value: { type: "literal", value: "Article One" },
      valueLabel: { type: "literal", value: "" },
    },
    {
      predicate: { type: "uri", value: RDF_TYPE },
      predLabel: { type: "literal", value: "type" },
      value: { type: "uri", value: TEST_CLASS },
      valueLabel: { type: "literal", value: "Article" },
    },
  ];
  // When violations should be present: omit EX_PUBLISH_DATE → triggers client-side violation.
  // When no violations: include EX_PUBLISH_DATE → client-side check passes.
  if (!withViolations && withShacl) {
    predicateTableBindings.push({
      predicate: { type: "uri", value: EX_PUBLISH_DATE },
      predLabel: { type: "literal", value: "Published Date" },
      value: { type: "literal", value: "2024-01-01" },
      valueLabel: { type: "literal", value: "" },
    });
  }

  server.addMatcher("?predLabel", {
    mode: "ok",
    body: { results: { bindings: predicateTableBindings } },
  });

  // Class instances query
  server.addMatcher("v07-test.example/Article", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            entity: { type: "uri", value: TEST_ENTITY },
            label: { type: "literal", value: "Article One" },
            type: { type: "uri", value: TEST_CLASS },
          },
        ],
      },
    },
  });

  // Layer 0 / entity-related catch-all
  server.addMatcher("v07-test.example/article-1", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            entity: { type: "uri", value: TEST_ENTITY },
            label: { type: "literal", value: "Article One" },
            type: { type: "uri", value: TEST_CLASS },
          },
        ],
      },
    },
  });
}

async function connectAndBrowseEntitySet(page: Page, serverUrl: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: /add your first endpoint/i }).click();
  await page.locator("#ep-label").fill("Mock SPARQL v0.7");
  await page.locator("#ep-url").fill(serverUrl);
  await page.getByRole("button", { name: "Connect" }).click();

  // Wait for graph cards
  await expect(
    page.getByRole("button", { name: /browse this graph/i }).first(),
  ).toBeVisible({ timeout: 20_000 });

  // Enter graph → types browser
  await page.getByRole("button", { name: /browse this graph/i }).first().click();
  await expect(page.getByText(/types in/i)).toBeVisible({ timeout: 10_000 });

  // Browse first class as set
  const firstRow = page.locator(".group").first();
  await firstRow.hover();
  await firstRow.getByRole("button", { name: /browse as set/i }).first().click();
  await page.waitForSelector("aside[aria-label='Navigation facets']", { timeout: 15_000 });
  await page.waitForSelector('[data-testid="entity-card"]', { timeout: 15_000 });
}

async function navigateToEntityDetail(page: Page): Promise<void> {
  await page.locator('[role="button"][aria-label^="Navigate to"]').first().click();
  await page.waitForSelector('[aria-label="Layer depth selector"]', { timeout: 10_000 });
}

// ── Tests ──────────────────────────────────────────────────────

test.describe("v0.7.0 — SHACL data quality (mock server)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let server: SparqlMockServer;

  test.beforeEach(async () => {
    server = new SparqlMockServer();
    await server.start();
  });

  test.afterEach(async () => {
    await server.stop();
  });

  test("SHACL violation badge appears on entity card when violations exist", async ({ page }) => {
    test.setTimeout(90_000);
    setupMockServer(server, { withShacl: true, withViolations: true });
    await connectAndBrowseEntitySet(page, server.url);

    // Wait for possible async SWR updates (shapes + violation check)
    await page.waitForTimeout(2_000);

    // Badge should be visible on the entity card
    await expect(
      page.locator('[data-testid="shacl-violation-badge"]').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("SHACL violation badge absent when no violations", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withShacl: true, withViolations: false });
    await connectAndBrowseEntitySet(page, server.url);

    await page.waitForTimeout(2_000);

    expect(await page.locator('[data-testid="shacl-violation-badge"]').count()).toBe(0);
  });

  test("SHACL violation badge absent when graph has no SHACL shapes", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withShacl: false, withViolations: false });
    await connectAndBrowseEntitySet(page, server.url);

    await page.waitForTimeout(2_000);

    expect(await page.locator('[data-testid="shacl-violation-badge"]').count()).toBe(0);
  });

  test("SHACL violations panel appears on entity detail when violations exist", async ({ page }) => {
    test.setTimeout(90_000);
    setupMockServer(server, { withShacl: true, withViolations: true });
    await connectAndBrowseEntitySet(page, server.url);
    await navigateToEntityDetail(page);

    // Wait for async annotation + shapes queries to complete
    await expect(
      page.locator('[data-testid="shacl-violations"]'),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("SHACL violations panel shows violation message", async ({ page }) => {
    test.setTimeout(90_000);
    setupMockServer(server, { withShacl: true, withViolations: true });
    await connectAndBrowseEntitySet(page, server.url);
    await navigateToEntityDetail(page);

    // The panel header should appear and be expandable
    await expect(
      page.locator('[data-testid="shacl-violations"]'),
    ).toBeVisible({ timeout: 20_000 });

    // Expand the panel
    await page.locator('[data-testid="shacl-violations"] button').click();

    // Should show violation message referencing the missing predicate
    const panelText = await page.locator('[data-testid="shacl-violations"]').textContent();
    expect(panelText).toContain("Publication Date");
  });

  test("SHACL violations panel shows severity badge", async ({ page }) => {
    test.setTimeout(90_000);
    setupMockServer(server, { withShacl: true, withViolations: true });
    await connectAndBrowseEntitySet(page, server.url);
    await navigateToEntityDetail(page);

    await expect(
      page.locator('[data-testid="shacl-violations"]'),
    ).toBeVisible({ timeout: 20_000 });

    // Expand
    await page.locator('[data-testid="shacl-violations"] button').click();

    // Severity badge should be present
    const severityBadge = page.locator('[data-testid="shacl-violations"] [role="status"], [data-testid="shacl-violations"] .border-amber-300');
    await expect(severityBadge.first()).toBeVisible({ timeout: 5_000 });
  });

  test("SHACL violations panel absent when entity has no violations", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withShacl: true, withViolations: false });
    await connectAndBrowseEntitySet(page, server.url);
    await navigateToEntityDetail(page);

    // Wait for page to settle
    await page.waitForSelector("dl", { timeout: 20_000 });
    await page.waitForTimeout(2_000);

    expect(await page.locator('[data-testid="shacl-violations"]').count()).toBe(0);
  });

  test("SHACL panel absent when graph has no SHACL shapes (graceful degradation)", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withShacl: false });
    await connectAndBrowseEntitySet(page, server.url);
    await navigateToEntityDetail(page);

    await page.waitForSelector("dl", { timeout: 20_000 });
    await page.waitForTimeout(2_000);

    expect(await page.locator('[data-testid="shacl-violations"]').count()).toBe(0);

    // Entity detail should still render normally
    await expect(page.locator("h3, h2, h1").first()).toBeVisible();
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });

  test("SHACL panel is collapsible (expand and collapse)", async ({ page }) => {
    test.setTimeout(90_000);
    setupMockServer(server, { withShacl: true, withViolations: true });
    await connectAndBrowseEntitySet(page, server.url);
    await navigateToEntityDetail(page);

    await expect(
      page.locator('[data-testid="shacl-violations"]'),
    ).toBeVisible({ timeout: 20_000 });

    // Violations list should not be visible by default (collapsed)
    const violationList = page.locator('[data-testid="shacl-violations"] #shacl-violations-list');
    expect(await violationList.count()).toBe(0);

    // Expand
    await page.locator('[data-testid="shacl-violations"] button').click();
    await expect(violationList).toBeVisible({ timeout: 3_000 });

    // Collapse
    await page.locator('[data-testid="shacl-violations"] button').click();
    expect(await violationList.count()).toBe(0);
  });

  test("entity detail first paint is not blocked by SHACL query", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withShacl: true, withViolations: true });
    await connectAndBrowseEntitySet(page, server.url);
    await navigateToEntityDetail(page);

    // Heading should be visible immediately
    await expect(page.locator("h3, h2, h1").first()).toBeVisible({ timeout: 5_000 });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });
});
