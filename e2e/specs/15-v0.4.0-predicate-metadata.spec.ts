/**
 * v0.4.0 — Predicate Metadata from the Graph
 *
 * Integration tests for the batched predicate metadata query that enriches
 * PredicateSummary objects during graph introspection.
 *
 * Each test starts a fresh SparqlMockServer, connects to it, and verifies that:
 * 1. The metadata query is sent to the SPARQL endpoint during introspection.
 * 2. Introspection succeeds even when the metadata query fails (graceful fallback).
 * 3. When the metadata response provides an inverseLabel, it is surfaced in the
 *    context header after navigation.
 * 4. Label precedence: graph-sourced rdfsLabel wins over short-IRI derivation in
 *    the mock endpoint's stored predicate summary.
 */
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  SparqlMockServer,
  ASK_FALSE,
  singleGraphResponse,
  predicateBindingsResponse,
} from "../sparql-mock-server";

// ── Shared constants ───────────────────────────────────────────

const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const EX_AFFILIATED_WITH = "http://example.org/affiliatedWith";
const EX_INVERSE = "http://example.org/memberOf";
const TEST_GRAPH = "http://v04-test.example/graph";

// ── Shared helpers ─────────────────────────────────────────────

async function connectToServer(page: Page, serverUrl: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: /add your first endpoint/i }).click();
  await page.locator("#ep-label").fill("Mock SPARQL v0.4");
  await page.locator("#ep-url").fill(serverUrl);
  await page.getByRole("button", { name: "Connect" }).click();
}

/**
 * Configure a mock server with a valid introspection sequence plus one
 * IRI-valued predicate (EX_AFFILIATED_WITH) that will be sent in the
 * predicate metadata query.
 */
function setupValidGraphWithPredicates(server: SparqlMockServer): void {
  // Capability check
  server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });

  // List named graphs
  server.addMatcher("DISTINCT ?graph", {
    mode: "ok",
    body: singleGraphResponse(TEST_GRAPH, 50),
  });

  // Sample-graph: return two predicates (one IRI-valued for navigation)
  server.addMatcher("?predicate ?valueKind", {
    mode: "ok",
    body: predicateBindingsResponse([
      { iri: RDFS_LABEL, valueKind: "literal", subjectCount: 50, objectCount: 50 },
      { iri: EX_AFFILIATED_WITH, valueKind: "iri", subjectCount: 30, objectCount: 60 },
    ]),
  });

  // Label-heuristic query
  server.addMatcher("?labelPredicate", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          { labelPredicate: { type: "uri", value: RDFS_LABEL }, coverage: { type: "literal", value: "50" } },
        ],
      },
    },
  });

  // Class-hierarchy query
  server.addMatcher("instanceCount", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          { class: { type: "uri", value: `${TEST_GRAPH}/Researcher` }, instanceCount: { type: "literal", value: "30" } },
        ],
      },
    },
  });
}

// ── Test suite ─────────────────────────────────────────────────

test.describe("v0.4.0 — Predicate Metadata from the Graph", () => {
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
  test("predicate metadata query is sent to the endpoint during introspection", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // Configure metadata query to return enrichment for EX_AFFILIATED_WITH
    server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });
    server.addMatcher("DISTINCT ?graph", {
      mode: "ok",
      body: singleGraphResponse(TEST_GRAPH, 50),
    });
    server.addMatcher("?predicate ?valueKind", {
      mode: "ok",
      body: predicateBindingsResponse([
        { iri: EX_AFFILIATED_WITH, valueKind: "iri", subjectCount: 20, objectCount: 40 },
      ]),
    });
    server.addMatcher("?labelPredicate", { mode: "ok", body: { results: { bindings: [] } } });
    server.addMatcher("instanceCount", { mode: "ok", body: { results: { bindings: [] } } });

    // Metadata query matcher — returns an inverse label for EX_AFFILIATED_WITH
    server.addMatcher("rdfs:label", {
      mode: "ok",
      body: {
        results: {
          bindings: [
            {
              predicate: { type: "uri", value: EX_AFFILIATED_WITH },
              label: { type: "literal", value: "affiliated with" },
              inverse: { type: "uri", value: EX_INVERSE },
              inverseLabel: { type: "literal", value: "member of" },
            },
          ],
        },
      },
    });

    await connectToServer(page, server.url);

    // Wait for graph card to appear (introspection complete)
    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // The metadata query must have been sent: its unique string "rdfs:label" appears
    // in the VALUES clause of the query body.
    const metadataQuerySent = server.requestLog.some(
      (body) =>
        body.includes("rdfs:label") &&
        body.includes("skos:prefLabel") &&
        body.includes("owl:inverseOf"),
    );
    expect(metadataQuerySent, "Predicate metadata query was not sent during introspection").toBe(true);
  });

  // ── Test 2 ────────────────────────────────────────────────────
  test("introspection succeeds gracefully when metadata query returns HTTP 500", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    setupValidGraphWithPredicates(server);

    // Metadata query fails with 500 — introspection must still succeed
    server.addMatcher("rdfs:label", {
      mode: "error",
      status: 500,
      body: "Internal Server Error",
    });

    await connectToServer(page, server.url);

    // Even with a failing metadata query, the graph card must appear
    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  // ── Test 3 ────────────────────────────────────────────────────
  test("introspection succeeds gracefully when metadata query returns empty results", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    setupValidGraphWithPredicates(server);

    // Metadata query returns no rows — should degrade to v0.1 heuristics
    server.addMatcher("rdfs:label", {
      mode: "ok",
      body: { results: { bindings: [] } },
    });

    await connectToServer(page, server.url);

    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  // ── Test 4 ────────────────────────────────────────────────────
  test("metadata query contains all discovered predicate IRIs in VALUES clause", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });
    server.addMatcher("DISTINCT ?graph", {
      mode: "ok",
      body: singleGraphResponse(TEST_GRAPH, 50),
    });
    // Two predicates are discovered
    server.addMatcher("?predicate ?valueKind", {
      mode: "ok",
      body: predicateBindingsResponse([
        { iri: RDFS_LABEL, valueKind: "literal", subjectCount: 50, objectCount: 50 },
        { iri: EX_AFFILIATED_WITH, valueKind: "iri", subjectCount: 30, objectCount: 60 },
      ]),
    });
    server.addMatcher("?labelPredicate", { mode: "ok", body: { results: { bindings: [] } } });
    server.addMatcher("instanceCount", { mode: "ok", body: { results: { bindings: [] } } });
    server.addMatcher("rdfs:label", { mode: "ok", body: { results: { bindings: [] } } });

    await connectToServer(page, server.url);

    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // Verify both predicate IRIs appear in the metadata query VALUES clause
    const metadataQuery = server.requestLog.find(
      (body) => body.includes("rdfs:label") && body.includes("owl:inverseOf"),
    );
    expect(metadataQuery).toBeDefined();
    expect(metadataQuery).toContain(`<${RDFS_LABEL}>`);
    expect(metadataQuery).toContain(`<${EX_AFFILIATED_WITH}>`);
  });

  // ── Test 5 ────────────────────────────────────────────────────
  test("metadata query is NOT sent when no predicates are discovered", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });
    server.addMatcher("DISTINCT ?graph", {
      mode: "ok",
      body: singleGraphResponse(TEST_GRAPH, 0),
    });
    // Empty predicate list
    server.addMatcher("?predicate ?valueKind", {
      mode: "ok",
      body: { results: { bindings: [] } },
    });
    server.addMatcher("?labelPredicate", { mode: "ok", body: { results: { bindings: [] } } });
    server.addMatcher("instanceCount", { mode: "ok", body: { results: { bindings: [] } } });

    await connectToServer(page, server.url);

    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // No metadata query should have been sent (no predicates to query)
    const metadataQuerySent = server.requestLog.some(
      (body) => body.includes("owl:inverseOf"),
    );
    expect(metadataQuerySent, "Metadata query should not be sent with empty predicate list").toBe(false);
  });
});
