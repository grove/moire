/**
 * v0.6.0 — Rich Entity Detail Annotations
 *
 * Tests that verify:
 * 1. Entity detail first paint is not blocked by the annotation query.
 * 2. Type hierarchy section appears for typed entities.
 * 3. "Also known as" section appears when entity has skos:altLabel values.
 * 4. Temporal section appears when entity has date predicates.
 * 5. Source/Provenance section appears when entity has provenance links.
 * 6. Media section appears when entity has image/page links.
 * 7. Annotation sections are absent when annotation query returns nothing.
 * 8. Predicate table groups predicates by semantic role.
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
const TEST_GRAPH = "http://v06-test.example/graph";
const TEST_CLASS = "http://v06-test.example/Person";
const TEST_ENTITY = "http://v06-test.example/alice";

// ── Mock server helpers ────────────────────────────────────────

function setupMockServer(server: SparqlMockServer, annotationBindings: SparqlBinding[] = []): void {
  // pg-ripple capability probe
  server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });

  // List named graphs
  server.addMatcher("DISTINCT ?graph", {
    mode: "ok",
    body: singleGraphResponse(TEST_GRAPH, 100),
  });

  // Sample-graph introspection
  server.addMatcher("?predicate ?valueKind", {
    mode: "ok",
    body: predicateBindingsResponse([
      { iri: RDFS_LABEL, valueKind: "literal", subjectCount: 100, objectCount: 100 },
      { iri: RDF_TYPE, valueKind: "iri", subjectCount: 100, objectCount: 100 },
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
            classLabel: { type: "literal", value: "Person" },
          },
        ],
      },
    },
  });

  // Predicate metadata (v0.4)
  server.addMatcher("owl:inverseOf", { mode: "ok", body: { results: { bindings: [] } } });

  // v0.6.0 — resource annotation query (unique: skos:altLabel + prov:hadPrimarySource)
  server.addMatcher("skos:altLabel", {
    mode: "ok",
    body: { results: { bindings: annotationBindings } },
  });

  // Entity predicate table query (unique: ?predLabel)
  server.addMatcher("?predLabel", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            predicate: { type: "uri", value: RDFS_LABEL },
            predLabel: { type: "literal", value: "label" },
            value: { type: "literal", value: "Alice" },
            valueLabel: { type: "literal", value: "" },
          },
          {
            predicate: { type: "uri", value: RDF_TYPE },
            predLabel: { type: "literal", value: "type" },
            value: { type: "uri", value: TEST_CLASS },
            valueLabel: { type: "literal", value: "Person" },
          },
        ],
      },
    },
  });

  // Class instances query (when browsing Person class)
  server.addMatcher("v06-test.example/Person", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            entity: { type: "uri", value: TEST_ENTITY },
            label: { type: "literal", value: "Alice" },
            type: { type: "uri", value: TEST_CLASS },
          },
        ],
      },
    },
  });

  // Layer 0 entity detail query (catch-all for alice-related queries)
  server.addMatcher("v06-test.example/alice", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            entity: { type: "uri", value: TEST_ENTITY },
            label: { type: "literal", value: "Alice" },
            type: { type: "uri", value: TEST_CLASS },
          },
        ],
      },
    },
  });
}

async function connectAndNavigateToEntityDetail(page: Page, serverUrl: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: /add your first endpoint/i }).click();
  await page.locator("#ep-label").fill("Mock SPARQL v0.6");
  await page.locator("#ep-url").fill(serverUrl);
  await page.getByRole("button", { name: "Connect" }).click();

  // Wait for graph cards — introspection complete
  await expect(
    page.getByRole("button", { name: /browse this graph/i }).first(),
  ).toBeVisible({ timeout: 20_000 });

  // Enter graph → types browser
  await page.getByRole("button", { name: /browse this graph/i }).first().click();
  await expect(page.getByText(/types in/i)).toBeVisible({ timeout: 10_000 });

  // Browse first class as set (hover to reveal button)
  const firstRow = page.locator(".group").first();
  await firstRow.hover();
  await firstRow.getByRole("button", { name: /browse as set/i }).first().click();
  await page.waitForSelector("aside[aria-label='Navigation facets']", { timeout: 15_000 });

  // Click first entity card
  await page.waitForSelector('[role="button"][aria-label^="Navigate to"]', { timeout: 30_000 });
  await page.locator('[role="button"][aria-label^="Navigate to"]').first().click();

  // Wait for entity detail (layer selector confirms context = "entity")
  await page.waitForSelector('[aria-label="Layer depth selector"]', { timeout: 10_000 });
}

// ── Mock-server tests ──────────────────────────────────────────

test.describe("v0.6.0 — Entity detail annotations (mock server)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let server: SparqlMockServer;

  test.beforeEach(async () => {
    server = new SparqlMockServer();
    await server.start();
  });

  test.afterEach(async () => {
    await server.stop();
  });

  test("entity label visible immediately (first paint not blocked)", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, []);
    await connectAndNavigateToEntityDetail(page, server.url);

    // Heading should be visible right away
    await expect(page.locator("h3, h2, h1").first()).toBeVisible({ timeout: 5_000 });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });

  test("type hierarchy section shown for typed entity", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, []);
    await connectAndNavigateToEntityDetail(page, server.url);

    await expect(
      page.locator('[data-testid="entity-type-hierarchy"]'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("aliases section shown when entity has skos:altLabel values", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, [
      { altLabel: { type: "literal", value: "Ali" } },
      { altLabel: { type: "literal", value: "Alicia" } },
    ]);
    await connectAndNavigateToEntityDetail(page, server.url);

    await expect(
      page.locator('[data-testid="entity-aliases"]'),
    ).toBeVisible({ timeout: 15_000 });
    const text = await page.locator('[data-testid="entity-aliases"]').textContent();
    expect(text).toContain("Ali");
  });

  test("temporal section shown when entity has date values", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, [
      {
        created: {
          type: "literal",
          value: "2023-05-12",
          datatype: "http://www.w3.org/2001/XMLSchema#date",
        },
      },
    ]);
    await connectAndNavigateToEntityDetail(page, server.url);

    await expect(
      page.locator('[data-testid="entity-temporal"]'),
    ).toBeVisible({ timeout: 15_000 });
    const text = await page.locator('[data-testid="entity-temporal"]').textContent();
    expect(text).toMatch(/created/i);
  });

  test("source section shown when entity has provenance link", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, [
      { source: { type: "uri", value: "https://datasource.example.org/alice" } },
    ]);
    await connectAndNavigateToEntityDetail(page, server.url);

    await expect(
      page.locator('[data-testid="entity-source"]'),
    ).toBeVisible({ timeout: 15_000 });
    const link = page.locator('[data-testid="entity-source"] a');
    await expect(link).toHaveAttribute("href", "https://datasource.example.org/alice");
  });

  test("media section shown when entity has image link", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, [
      { image: { type: "uri", value: "https://example.org/alice-photo.jpg" } },
    ]);
    await connectAndNavigateToEntityDetail(page, server.url);

    await expect(
      page.locator('[data-testid="entity-media"]'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("annotation sections absent when annotation query returns nothing", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, []); // no annotation data
    await connectAndNavigateToEntityDetail(page, server.url);

    // Wait for the page to settle (predicate table loaded)
    await page.waitForSelector("dl", { timeout: 20_000 });
    // Small extra wait for async SWR responses to arrive
    await page.waitForTimeout(1_000);

    expect(await page.locator('[data-testid="entity-aliases"]').count()).toBe(0);
    expect(await page.locator('[data-testid="entity-temporal"]').count()).toBe(0);
    expect(await page.locator('[data-testid="entity-source"]').count()).toBe(0);
    expect(await page.locator('[data-testid="entity-media"]').count()).toBe(0);
  });

  test("predicate table groups predicates by role", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, []);
    await connectAndNavigateToEntityDetail(page, server.url);

    // Wait for predicate table
    await page.waitForSelector("dl dt", { timeout: 20_000 });

    // At least one role group header should be present
    const groupHeaders = await page.locator('[data-testid^="predicate-group-"]').count();
    expect(groupHeaders).toBeGreaterThan(0);
  });
});

// ── Additional edge-case tests (mock server) ──────────────────

test.describe("v0.6.0 — Entity detail annotation edge cases (mock server)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let server: SparqlMockServer;

  test.beforeEach(async () => {
    server = new SparqlMockServer();
    await server.start();
  });

  test.afterEach(async () => {
    await server.stop();
  });

  test("multiple aliases all displayed", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, [
      { altLabel: { type: "literal", value: "Alicia" } },
      { altLabel: { type: "literal", value: "Ali" } },
      { altLabel: { type: "literal", value: "Ally" } },
    ]);
    await connectAndNavigateToEntityDetail(page, server.url);

    const aliasEl = page.locator('[data-testid="entity-aliases"]');
    await expect(aliasEl).toBeVisible({ timeout: 15_000 });
    const text = await aliasEl.textContent();
    expect(text).toContain("Alicia");
    expect(text).toContain("Ali");
    expect(text).toContain("Ally");
  });

  test("modified date shown in temporal section", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, [
      {
        modified: {
          type: "literal",
          value: "2024-11-01",
          datatype: "http://www.w3.org/2001/XMLSchema#date",
        },
      },
    ]);
    await connectAndNavigateToEntityDetail(page, server.url);

    const temporalEl = page.locator('[data-testid="entity-temporal"]');
    await expect(temporalEl).toBeVisible({ timeout: 15_000 });
    const text = await temporalEl.textContent();
    expect(text).toMatch(/modified/i);
  });

  test("both aliases and temporal sections visible simultaneously", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, [
      { altLabel: { type: "literal", value: "Alice B." } },
      {
        created: {
          type: "literal",
          value: "2020-01-15",
          datatype: "http://www.w3.org/2001/XMLSchema#date",
        },
      },
    ]);
    await connectAndNavigateToEntityDetail(page, server.url);

    await expect(page.locator('[data-testid="entity-aliases"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="entity-temporal"]')).toBeVisible({ timeout: 15_000 });
  });

  test("media section shown when entity has foaf:page link", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, [
      { page: { type: "uri", value: "https://example.org/alice-profile" } },
    ]);
    await connectAndNavigateToEntityDetail(page, server.url);

    await expect(
      page.locator('[data-testid="entity-media"]'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("no render error with all annotation types present", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, [
      { altLabel: { type: "literal", value: "Alicia" } },
      { source: { type: "uri", value: "https://datasource.example.org/alice" } },
      { image: { type: "uri", value: "https://example.org/alice.jpg" } },
      {
        created: {
          type: "literal",
          value: "2021-03-01",
          datatype: "http://www.w3.org/2001/XMLSchema#date",
        },
      },
    ]);
    await connectAndNavigateToEntityDetail(page, server.url);

    await page.waitForSelector("dl", { timeout: 20_000 });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });
});
