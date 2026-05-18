/**
 * v0.9.0 — pg-ripple Enhanced Features
 *
 * Tests that verify:
 * 1. Full-text search uses pg:fts() across all text fields on pg-ripple endpoints.
 * 2. Standard SPARQL endpoints are unaffected (label-only search unchanged).
 * 3. "Semantically similar entities" section appears in entity detail when
 *    the pg-ripple vector index returns results.
 * 4. "Semantically similar entities" section is absent when the similarity
 *    query returns no results (index not built).
 * 5. pg-ripple pre-computed SHACL violations are shown in entity detail.
 * 6. No SHACL panel when pg-ripple returns no violations.
 * 7. All features are absent on standard SPARQL endpoints.
 * 8. No increase in query latency observable path: standard endpoint still works.
 */
import { test, expect, type Page } from "@playwright/test";
import {
  SparqlMockServer,
  ASK_FALSE,
  singleGraphResponse,
  predicateBindingsResponse,
} from "../sparql-mock-server";

// ── Constants ──────────────────────────────────────────────────

const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const TEST_GRAPH = "http://v09-test.example/graph";
const ENTITY_IRI = "http://v09-test.example/entity/1";
const SIMILAR_IRI = "http://v09-test.example/entity/2";
const ENTITY_CLASS = "http://v09-test.example/type/Thing";
const ENTITY_LABEL = "Test Entity";
const SIMILAR_LABEL = "Similar Entity";
const SHACL_NS = "http://www.w3.org/ns/shacl#";

/** ASK response simulating a pg-ripple endpoint (boolean: true). */
const ASK_TRUE = { boolean: true };

// ── Mock server helpers ────────────────────────────────────────

function setupBaseIntrospection(
  server: SparqlMockServer,
  opts: { isPgRipple?: boolean } = {},
): void {
  const { isPgRipple = false } = opts;

  // pg-ripple capability probe (contains "pg-ripple.io/fn/similar")
  server.addMatcher("pg-ripple.io/fn/similar", {
    mode: "ok",
    body: isPgRipple ? ASK_TRUE : ASK_FALSE,
  });

  // List named graphs
  server.addMatcher("DISTINCT ?graph", {
    mode: "ok",
    body: singleGraphResponse(TEST_GRAPH, 500),
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
            coverage: { type: "literal", value: "50" },
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
            class: { type: "uri", value: ENTITY_CLASS },
            instanceCount: { type: "literal", value: "50" },
            classLabel: { type: "literal", value: "Thing" },
          },
        ],
      },
    },
  });

  // Predicate metadata (v0.4) — unique keyword: owl:inverseOf
  server.addMatcher("owl:inverseOf", { mode: "ok", body: { results: { bindings: [] } } });

  // VoID dataset metadata (v0.8) — no VoID for these tests
  server.addMatcher("void:Dataset", { mode: "ok", body: { results: { bindings: [] } } });
}

function setupEntityResponses(
  server: SparqlMockServer,
  opts: { withSimilar?: boolean; withViolations?: boolean } = {},
): void {
  const { withSimilar = false, withViolations = false } = opts;

  // Class instances / entity set
  server.addMatcher("rdf:type", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            entity: { type: "uri", value: ENTITY_IRI },
            label: { type: "literal", value: ENTITY_LABEL },
            type: { type: "uri", value: ENTITY_CLASS },
          },
        ],
      },
    },
  });

  // Entity predicates (unique: ORDER BY ?predicate LIMIT 500)
  server.addMatcher("ORDER BY ?predicate", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          {
            predicate: { type: "uri", value: RDFS_LABEL },
            predLabel: { type: "literal", value: "label" },
            value: { type: "literal", value: ENTITY_LABEL },
            valueLabel: { type: "literal", value: "" },
          },
        ],
      },
    },
  });

  // Resource annotation query (v0.6 — unique: skos:altLabel)
  server.addMatcher("skos:altLabel", { mode: "ok", body: { results: { bindings: [] } } });

  // v0.9.0 — Semantically similar entities query (pg:similar())
  server.addMatcher("pg-ripple.io/fn/similar>", {
    mode: "ok",
    body: withSimilar
      ? {
          results: {
            bindings: [
              {
                similar: { type: "uri", value: SIMILAR_IRI },
                label: { type: "literal", value: SIMILAR_LABEL },
                type: { type: "uri", value: ENTITY_CLASS },
                score: { type: "literal", value: "0.92" },
              },
            ],
          },
        }
      : { results: { bindings: [] } },
  });

  // v0.9.0 — pg-ripple pre-computed SHACL violations (sh:ValidationResult)
  server.addMatcher("sh:ValidationResult", {
    mode: "ok",
    body: withViolations
      ? {
          results: {
            bindings: [
              {
                message: { type: "literal", value: "Missing required description." },
                severity: {
                  type: "uri",
                  value: `${SHACL_NS}Violation`,
                },
                path: { type: "uri", value: "http://www.w3.org/2000/01/rdf-schema#comment" },
              },
            ],
          },
        }
      : { results: { bindings: [] } },
  });
}

async function connectToEndpoint(page: Page, serverUrl: string, label = "Mock pg-ripple v0.9"): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: /add your first endpoint/i }).click();
  await page.locator("#ep-label").fill(label);
  await page.locator("#ep-url").fill(serverUrl);
  await page.getByRole("button", { name: "Connect" }).click();

  await expect(
    page.getByRole("button", { name: /browse this graph/i }).first(),
  ).toBeVisible({ timeout: 20_000 });
}

async function navigateToEntity(page: Page): Promise<void> {
  // Browse the graph → navigate to the types browser → entity set → entity
  await page.getByRole("button", { name: /browse this graph/i }).first().click();
  await expect(page.getByText(/types in/i)).toBeVisible({ timeout: 10_000 });

  // Click the "Thing" type row to open the entity set
  await page.getByRole("button", { name: /thing/i }).first().click();
  await expect(page.locator('[data-testid="entity-card"]').first()).toBeVisible({ timeout: 20_000 });

  // Click the entity card to open entity detail
  await page.locator('[data-testid="entity-card"]').first().click();
  await expect(page.locator("dl dt").first()).toBeVisible({ timeout: 30_000 });
}

// ── Tests ──────────────────────────────────────────────────────

test.describe("v0.9.0 — pg-ripple enhanced features (mock server)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let server: SparqlMockServer;

  test.beforeEach(async () => {
    server = new SparqlMockServer();
    await server.start();
  });

  test.afterEach(async () => {
    await server.stop();
  });

  // ── Full-text search ───────────────────────────────────────

  test("pg-ripple search uses pg:fts() function across all text fields", async ({ page }) => {
    test.setTimeout(60_000);
    setupBaseIntrospection(server, { isPgRipple: true });

    // Search results: mock the FTS query response
    server.addMatcher("pg-ripple.io/fn/fts", {
      mode: "ok",
      body: {
        results: {
          bindings: [
            {
              entity: { type: "uri", value: ENTITY_IRI },
              label: { type: "literal", value: ENTITY_LABEL },
              type: { type: "uri", value: ENTITY_CLASS },
            },
          ],
        },
      },
    });

    await connectToEndpoint(page, server.url, "Mock pg-ripple search");

    // Open search palette
    await page.keyboard.press("Meta+k");
    const input = page.locator("input[placeholder*='Search']");
    await expect(input).toBeVisible({ timeout: 5_000 });

    await input.fill("knowledge graph");

    // Should get a result
    const firstResult = page.getByRole("dialog").locator("button:has(span.font-medium)").first();
    await expect(firstResult).toBeVisible({ timeout: 15_000 });

    // Verify the FTS query was sent (not CONTAINS)
    const ftsRequests = server.requestLog.filter((r) => r.includes("pg-ripple.io/fn/fts"));
    expect(ftsRequests.length).toBeGreaterThan(0);

    // Standard CONTAINS should NOT appear in search requests when pg-ripple
    const containsSearchRequests = server.requestLog.filter(
      (r) => r.includes("CONTAINS") && r.includes("knowledge graph"),
    );
    expect(containsSearchRequests.length).toBe(0);
  });

  test("standard SPARQL endpoint uses CONTAINS label search (not FTS)", async ({ page }) => {
    test.setTimeout(60_000);
    setupBaseIntrospection(server, { isPgRipple: false });

    server.addMatcher("CONTAINS", {
      mode: "ok",
      body: {
        results: {
          bindings: [
            {
              entity: { type: "uri", value: ENTITY_IRI },
              label: { type: "literal", value: ENTITY_LABEL },
            },
          ],
        },
      },
    });

    await connectToEndpoint(page, server.url, "Mock standard endpoint");

    await page.keyboard.press("Meta+k");
    const input = page.locator("input[placeholder*='Search']");
    await expect(input).toBeVisible({ timeout: 5_000 });

    await input.fill("Test");

    const firstResult = page.getByRole("dialog").locator("button:has(span.font-medium)").first();
    await expect(firstResult).toBeVisible({ timeout: 15_000 });

    // No FTS queries should have been sent
    const ftsRequests = server.requestLog.filter((r) => r.includes("pg-ripple.io/fn/fts"));
    expect(ftsRequests.length).toBe(0);
  });

  // ── Semantic similarity ────────────────────────────────────

  test("similar entities section appears in entity detail on pg-ripple with results", async ({ page }) => {
    test.setTimeout(90_000);
    setupBaseIntrospection(server, { isPgRipple: true });
    setupEntityResponses(server, { withSimilar: true });

    await connectToEndpoint(page, server.url, "Mock pg-ripple similar");
    await navigateToEntity(page);

    await expect(page.locator('[data-testid="similar-entities"]')).toBeVisible({ timeout: 20_000 });
    const text = await page.locator('[data-testid="similar-entities"]').textContent();
    expect(text).toContain(SIMILAR_LABEL);
  });

  test("similar entities section is absent when similarity index returns no results", async ({ page }) => {
    test.setTimeout(90_000);
    setupBaseIntrospection(server, { isPgRipple: true });
    setupEntityResponses(server, { withSimilar: false });

    await connectToEndpoint(page, server.url, "Mock pg-ripple no-similar");
    await navigateToEntity(page);

    // Wait for entity detail to fully render
    await expect(page.locator("dl dt").first()).toBeVisible({ timeout: 30_000 });

    expect(await page.locator('[data-testid="similar-entities"]').count()).toBe(0);
  });

  test("similar entities section is absent on standard SPARQL endpoints", async ({ page }) => {
    test.setTimeout(90_000);
    setupBaseIntrospection(server, { isPgRipple: false });
    setupEntityResponses(server);

    await connectToEndpoint(page, server.url, "Mock standard no-similar");
    await navigateToEntity(page);

    await expect(page.locator("dl dt").first()).toBeVisible({ timeout: 30_000 });
    expect(await page.locator('[data-testid="similar-entities"]').count()).toBe(0);
  });

  test("clicking a similar entity navigates to that entity's detail", async ({ page }) => {
    test.setTimeout(90_000);
    setupBaseIntrospection(server, { isPgRipple: true });
    setupEntityResponses(server, { withSimilar: true });

    // Stub the second entity's predicate response
    server.setFallback({ mode: "ok", body: { results: { bindings: [] } } });

    await connectToEndpoint(page, server.url, "Mock pg-ripple nav-similar");
    await navigateToEntity(page);

    await expect(page.locator('[data-testid="similar-entities"]')).toBeVisible({ timeout: 20_000 });

    // Click the similar entity button
    const similarBtn = page.locator('[data-testid="similar-entities"] button').first();
    await similarBtn.click();

    // Navigation should have moved to a new entity focus
    await expect(page.locator('[aria-label="Layer depth selector"]')).toBeVisible({ timeout: 5_000 });
  });

  // ── pg-ripple SHACL violations ─────────────────────────────

  test("pg-ripple pre-computed SHACL violations appear in entity detail", async ({ page }) => {
    test.setTimeout(90_000);
    setupBaseIntrospection(server, { isPgRipple: true });
    setupEntityResponses(server, { withViolations: true });

    await connectToEndpoint(page, server.url, "Mock pg-ripple shacl");
    await navigateToEntity(page);

    await expect(page.locator('[data-testid="shacl-violations"]')).toBeVisible({ timeout: 20_000 });
    const text = await page.locator('[data-testid="shacl-violations"]').textContent();
    expect(text).toContain("Data Quality");
  });

  test("no SHACL panel when pg-ripple returns no violations", async ({ page }) => {
    test.setTimeout(90_000);
    setupBaseIntrospection(server, { isPgRipple: true });
    setupEntityResponses(server, { withViolations: false });

    await connectToEndpoint(page, server.url, "Mock pg-ripple no-shacl");
    await navigateToEntity(page);

    await expect(page.locator("dl dt").first()).toBeVisible({ timeout: 30_000 });
    expect(await page.locator('[data-testid="shacl-violations"]').count()).toBe(0);
  });

  test("standard endpoint uses shape-derived SHACL violations, not pre-computed", async ({ page }) => {
    test.setTimeout(90_000);
    setupBaseIntrospection(server, { isPgRipple: false });
    setupEntityResponses(server, { withViolations: false });

    await connectToEndpoint(page, server.url, "Mock standard shacl");
    await navigateToEntity(page);

    await expect(page.locator("dl dt").first()).toBeVisible({ timeout: 30_000 });

    // Standard endpoint: sh:ValidationResult query should NOT have been sent
    const pgShaclRequests = server.requestLog.filter(
      (r) => r.includes("sh:ValidationResult") && r.includes("sh:focusNode"),
    );
    expect(pgShaclRequests.length).toBe(0);
  });

  // ── Non-regression ─────────────────────────────────────────

  test("page renders without errors on pg-ripple endpoint", async ({ page }) => {
    test.setTimeout(90_000);
    setupBaseIntrospection(server, { isPgRipple: true });
    setupEntityResponses(server);
    server.setFallback({ mode: "ok", body: { results: { bindings: [] } } });

    await connectToEndpoint(page, server.url, "Mock pg-ripple full");
    await page.getByRole("button", { name: /browse this graph/i }).first().click();
    await expect(page.getByText(/types in/i)).toBeVisible({ timeout: 10_000 });

    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");
  });
});
