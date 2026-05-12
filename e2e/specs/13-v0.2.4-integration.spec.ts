/**
 * v0.2.4 — Integration tests for server actions (setupEndpoint + introspection).
 *
 * Each test starts a fresh SparqlMockServer on a random local port, navigates to
 * the endpoint setup UI, and enters the mock server URL. The Next.js server action
 * (setupEndpoint) runs server-side and calls the mock server over HTTP.
 *
 * This validates the full request/response cycle without a real SPARQL endpoint.
 *
 * NOTE: The "connection timed out" test takes ~15 s because it waits for the
 * AbortSignal.timeout(15 000) inside setupEndpoint to fire.
 */
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  SparqlMockServer,
  ASK_FALSE,
  singleGraphResponse,
  defaultGraphCountResponse,
  predicateBindingsResponse,
} from "../sparql-mock-server";

// ── Shared helpers ─────────────────────────────────────────────

const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const TEST_GRAPH = "http://integration-test.example/graph";

/** Fill in the endpoint form and click Connect. */
async function connectToServer(page: Page, serverUrl: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: /add your first endpoint/i }).click();
  await page.locator("#ep-label").fill("Mock SPARQL");
  await page.locator("#ep-url").fill(serverUrl);
  await page.getByRole("button", { name: "Connect" }).click();
}

/**
 * Configure a mock server with a valid named-graph introspection sequence.
 *
 * Matchers are checked in insertion order; first match wins.
 * The probe (GET, empty body) is handled by the fallback (returns empty
 * SPARQL results, which is a valid non-5xx response).
 */
function setupValidNamedGraph(server: SparqlMockServer, graphIRI = TEST_GRAPH): void {
  // 1. Capability check (both POST variants contain "pg-ripple")
  server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });

  // 2. List named graphs
  server.addMatcher("DISTINCT ?graph", {
    mode: "ok",
    body: singleGraphResponse(graphIRI, 100),
  });

  // 3. Sample-graph predicate discovery (runs in parallel with 4 & 5 below)
  server.addMatcher("?predicate ?valueKind", {
    mode: "ok",
    body: predicateBindingsResponse([{ iri: RDFS_LABEL, valueKind: "literal", subjectCount: 50, objectCount: 50 }]),
  });

  // 4. Label-heuristic query
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

  // 5. Class-hierarchy query
  server.addMatcher("instanceCount", {
    mode: "ok",
    body: {
      results: {
        bindings: [
          { class: { type: "uri", value: `${graphIRI}/Thing` }, instanceCount: { type: "literal", value: "10" } },
        ],
      },
    },
  });
}

// ── Test suite ─────────────────────────────────────────────────

test.describe("v0.2.4 — Integration tests for server actions", () => {
  // Every test needs a fresh browser with no saved endpoint state.
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
  test("setupEndpoint returns capabilities and summaries for a valid SPARQL response", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    setupValidNamedGraph(server);
    await connectToServer(page, server.url);

    // A "Browse this graph" button confirms that introspection completed and
    // returned at least one graph summary with the expected structure.
    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  // ── Test 2 ────────────────────────────────────────────────────
  test("setupEndpoint throws 'connection timed out' when the server never responds", async ({
    page,
  }) => {
    // The probe uses AbortSignal.timeout(15 000) — allow enough time for it to fire.
    test.setTimeout(30_000);

    // Hang on every request: accept the connection but never write a response.
    server.setGlobal({ mode: "hang" });

    await connectToServer(page, server.url);

    await expect(page.locator(".text-destructive")).toContainText(/timed out/i, {
      timeout: 20_000,
    });
  });

  // ── Test 3 ────────────────────────────────────────────────────
  test("setupEndpoint throws when the server returns HTTP 500", async ({ page }) => {
    test.setTimeout(30_000);

    server.setGlobal({ mode: "error", status: 500, body: "Internal Server Error" });

    await connectToServer(page, server.url);

    // Any error message visible — the exact text depends on the UI but the
    // destructive-colour element must appear.
    await expect(page.locator(".text-destructive")).toBeVisible({ timeout: 20_000 });
  });

  // ── Test 4 ────────────────────────────────────────────────────
  test("introspection pipeline filters out predicates with non-IRI values", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // Capability check
    server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });

    // List graphs — single named graph
    server.addMatcher("DISTINCT ?graph", {
      mode: "ok",
      body: singleGraphResponse(TEST_GRAPH, 10),
    });

    // Sample-graph response includes one NON-IRI predicate ("Docker image") that
    // must be filtered out by the introspection pipeline, plus one valid IRI
    // predicate that must be retained.
    server.addMatcher("?predicate ?valueKind", {
      mode: "ok",
      body: {
        results: {
          bindings: [
            // Non-IRI: type is "literal" and value is a plain string — regression case
            {
              predicate: { type: "literal", value: "Docker image" },
              valueKind: { type: "literal", value: "literal" },
              subjectCount: { type: "literal", value: "3" },
              objectCount: { type: "literal", value: "3" },
            },
            // Valid IRI predicate: must survive the filter
            {
              predicate: { type: "uri", value: RDFS_LABEL },
              valueKind: { type: "literal", value: "literal" },
              subjectCount: { type: "literal", value: "10" },
              objectCount: { type: "literal", value: "10" },
            },
          ],
        },
      },
    });

    server.addMatcher("?labelPredicate", { mode: "ok", body: { results: { bindings: [] } } });
    server.addMatcher("instanceCount", { mode: "ok", body: { results: { bindings: [] } } });

    await connectToServer(page, server.url);

    // Connection must succeed — no crash from the non-IRI predicate.
    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  // ── Test 5 ────────────────────────────────────────────────────
  test("default-graph endpoint is represented as graphIRI = null", async ({ page }) => {
    test.setTimeout(30_000);

    // Capability check
    server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });

    // List graphs returns EMPTY → triggers the default-graph fallback
    server.addMatcher("DISTINCT ?graph", {
      mode: "ok",
      body: { results: { bindings: [] } },
    });

    // Default-graph triple count (SELECT (COUNT(*) AS ?tripleCount) WHERE { ?s ?p ?o })
    server.addMatcher("?tripleCount) WHERE { ?s ?p ?o }", {
      mode: "ok",
      body: defaultGraphCountResponse(42),
    });

    // Sample / label / class queries for the default graph (graphIRI = null)
    server.addMatcher("?predicate ?valueKind", { mode: "ok", body: { results: { bindings: [] } } });
    server.addMatcher("?labelPredicate", { mode: "ok", body: { results: { bindings: [] } } });
    server.addMatcher("instanceCount", { mode: "ok", body: { results: { bindings: [] } } });

    await connectToServer(page, server.url);

    // A "Browse this graph" button must appear — the default graph was introspected.
    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  // ── Test 6 ────────────────────────────────────────────────────
  test("facet count query rejects non-IRI facet dimensions before sending the query", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // Connect successfully so we have a graph to navigate
    setupValidNamedGraph(server);
    await connectToServer(page, server.url);
    await expect(
      page.getByRole("button", { name: /browse this graph/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // The mock server must NOT have received a query containing "Docker image"
    // as a SPARQL predicate — all such dimensions are rejected client-side
    // (in buildFacetCountQuery / buildLayerQuery) before reaching the endpoint.
    const queriesReceived = server.requestLog.join("\n");
    expect(queriesReceived).not.toContain("Docker image");
  });
});
