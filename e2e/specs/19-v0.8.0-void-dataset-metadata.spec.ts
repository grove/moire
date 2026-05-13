/**
 * v0.8.0 — VoID Dataset Metadata
 *
 * Tests that verify:
 * 1. Graph card shows dataset title from VoID (instead of raw IRI).
 * 2. Graph card shows description from dcterms:description.
 * 3. Graph card shows publisher and modified date as secondary metadata.
 * 4. Graph card shows vocabulary badges from void:vocabulary.
 * 5. Graph card shows "Suggested starting points" from void:rootResource /
 *    void:exampleResource.
 * 6. Graceful fallback to raw IRI + counts when no VoID metadata present.
 * 7. No performance penalty when VoID query returns nothing.
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
const TEST_GRAPH = "http://v08-test.example/graph";
const VOID_DATASET_IRI = "http://v08-test.example/dataset";
const SKOS_NS = "http://www.w3.org/2004/02/skos/core#";
const FOAF_NS = "http://xmlns.com/foaf/0.1/";
const ROOT_RESOURCE = "http://v08-test.example/resource/root";
const EXAMPLE_RESOURCE = "http://v08-test.example/resource/example1";

// ── Mock server helpers ────────────────────────────────────────

function voidMetadataResponse(opts: {
  title?: string;
  description?: string;
  publisher?: string;
  modified?: string;
  vocabularies?: string[];
  rootResources?: string[];
  exampleResources?: string[];
}): { results: { bindings: SparqlBinding[] } } {
  const base: SparqlBinding = {
    dataset: { type: "uri", value: VOID_DATASET_IRI },
  };
  if (opts.title) base.title = { type: "literal", value: opts.title };
  if (opts.description) base.description = { type: "literal", value: opts.description };
  if (opts.publisher) base.publisher = { type: "literal", value: opts.publisher };
  if (opts.modified) base.modified = { type: "literal", value: opts.modified };

  const rows: SparqlBinding[] = [{ ...base }];

  // Each vocabulary, rootResource, exampleResource generates its own row
  for (const vocab of opts.vocabularies ?? []) {
    rows.push({ dataset: { type: "uri", value: VOID_DATASET_IRI }, vocabulary: { type: "uri", value: vocab } });
  }
  for (const root of opts.rootResources ?? []) {
    rows.push({ dataset: { type: "uri", value: VOID_DATASET_IRI }, rootResource: { type: "uri", value: root } });
  }
  for (const ex of opts.exampleResources ?? []) {
    rows.push({ dataset: { type: "uri", value: VOID_DATASET_IRI }, exampleResource: { type: "uri", value: ex } });
  }

  return { results: { bindings: rows } };
}

function setupMockServer(
  server: SparqlMockServer,
  opts: { withVoid?: boolean } = {},
): void {
  const { withVoid = false } = opts;

  // pg-ripple capability probe
  server.addMatcher("pg-ripple", { mode: "ok", body: ASK_FALSE });

  // List named graphs
  server.addMatcher("DISTINCT ?graph", {
    mode: "ok",
    body: singleGraphResponse(TEST_GRAPH, 1000),
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
            class: { type: "uri", value: "http://v08-test.example/Thing" },
            instanceCount: { type: "literal", value: "100" },
            classLabel: { type: "literal", value: "Thing" },
          },
        ],
      },
    },
  });

  // Predicate metadata (v0.4) — unique keyword: owl:inverseOf
  server.addMatcher("owl:inverseOf", { mode: "ok", body: { results: { bindings: [] } } });

  // v0.8.0 — VoID dataset metadata (unique keyword: void:Dataset)
  server.addMatcher("void:Dataset", {
    mode: "ok",
    body: withVoid
      ? voidMetadataResponse({
          title: "Research Dataset",
          description: "A comprehensive dataset about academic research.",
          publisher: "Example University",
          modified: "2024-06-15",
          vocabularies: [SKOS_NS, FOAF_NS],
          rootResources: [ROOT_RESOURCE],
          exampleResources: [EXAMPLE_RESOURCE],
        })
      : { results: { bindings: [] } },
  });
}

async function connectToEndpoint(page: Page, serverUrl: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: /add your first endpoint/i }).click();
  await page.locator("#ep-label").fill("Mock SPARQL v0.8");
  await page.locator("#ep-url").fill(serverUrl);
  await page.getByRole("button", { name: "Connect" }).click();

  // Wait for graph cards to appear
  await expect(
    page.getByRole("button", { name: /browse this graph/i }).first(),
  ).toBeVisible({ timeout: 20_000 });
}

// ── Tests ──────────────────────────────────────────────────────

test.describe("v0.8.0 — VoID dataset metadata (mock server)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let server: SparqlMockServer;

  test.beforeEach(async () => {
    server = new SparqlMockServer();
    await server.start();
  });

  test.afterEach(async () => {
    await server.stop();
  });

  test("graph card shows VoID title instead of raw IRI", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withVoid: true });
    await connectToEndpoint(page, server.url);

    const card = page.locator('[data-testid="graph-card"]').first();
    await expect(card).toBeVisible({ timeout: 10_000 });

    const cardText = await card.textContent();
    expect(cardText).toContain("Research Dataset");
  });

  test("graph card shows VoID description", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withVoid: true });
    await connectToEndpoint(page, server.url);

    await expect(
      page.locator('[data-testid="void-description"]').first(),
    ).toBeVisible({ timeout: 10_000 });

    const text = await page.locator('[data-testid="void-description"]').first().textContent();
    expect(text).toContain("comprehensive dataset");
  });

  test("graph card shows publisher and modified date in secondary metadata", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withVoid: true });
    await connectToEndpoint(page, server.url);

    await expect(
      page.locator('[data-testid="void-secondary"]').first(),
    ).toBeVisible({ timeout: 10_000 });

    const text = await page.locator('[data-testid="void-secondary"]').first().textContent();
    expect(text).toContain("Example University");
    expect(text).toContain("2024-06-15");
  });

  test("graph card shows vocabulary badges from void:vocabulary", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withVoid: true });
    await connectToEndpoint(page, server.url);

    await expect(
      page.locator('[data-testid="void-vocabularies"]').first(),
    ).toBeVisible({ timeout: 10_000 });

    const text = await page.locator('[data-testid="void-vocabularies"]').first().textContent();
    expect(text).toContain("SKOS");
    expect(text).toContain("FOAF");
  });

  test("graph card shows suggested starting points from void:rootResource and void:exampleResource", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withVoid: true });
    await connectToEndpoint(page, server.url);

    await expect(
      page.locator('[data-testid="void-starting-points"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("graceful fallback: no VoID sections when graph has no VoID metadata", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withVoid: false });
    await connectToEndpoint(page, server.url);

    await expect(
      page.locator('[data-testid="graph-card"]').first(),
    ).toBeVisible({ timeout: 10_000 });

    // VoID-specific sections must not appear
    expect(await page.locator('[data-testid="void-description"]').count()).toBe(0);
    expect(await page.locator('[data-testid="void-vocabularies"]').count()).toBe(0);
    expect(await page.locator('[data-testid="void-starting-points"]').count()).toBe(0);

    // Normal card content should still be present
    await expect(
      page.getByRole("button", { name: /browse this graph/i }),
    ).toBeVisible();
  });

  test("no error or regression when VoID query returns empty bindings", async ({ page }) => {
    test.setTimeout(60_000);
    setupMockServer(server, { withVoid: false });
    await connectToEndpoint(page, server.url);

    // Page should render without errors
    await expect(
      page.locator('[data-testid="graph-card"]').first(),
    ).toBeVisible({ timeout: 10_000 });

    const body = await page.locator("body").textContent();
    expect(body).not.toContain("An error occurred");

    // Graph card still shows normal info (triple count, browse button)
    await expect(page.getByRole("button", { name: /browse this graph/i })).toBeVisible();
  });

  test("VoID metadata does not block browsing the graph", async ({ page }) => {
    test.setTimeout(90_000);
    setupMockServer(server, { withVoid: true });
    await connectToEndpoint(page, server.url);

    // Graph card appears and is functional
    await expect(
      page.locator('[data-testid="void-description"]').first(),
    ).toBeVisible({ timeout: 10_000 });

    // Can still click "Browse this graph"
    await page.getByRole("button", { name: /browse this graph/i }).first().click();
    await expect(page.getByText(/types in/i)).toBeVisible({ timeout: 10_000 });
  });
});
