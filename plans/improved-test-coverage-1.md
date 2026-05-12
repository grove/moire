# Improved Test Coverage — Plan 1

## Summary

The current test suite is Playwright E2E only. It has good structural design but no unit or integration
testing layer, a hard dependency on a live SPARQL endpoint, several silent-failure patterns, and brittle
text matchers. This plan adds a unit test layer for the pure library code, improves the reliability of
existing E2E tests, and adds targeted integration tests for server actions using a fake SPARQL server.

Improvements are grouped into four tracks that can be worked on independently:

1. [Unit tests for `src/lib/`](#track-1-unit-tests-for-srclib)
2. [Unit tests for `src/stores/`](#track-2-unit-tests-for-srcstores)
3. [E2E reliability fixes](#track-3-e2e-reliability-fixes)
4. [Integration tests for server actions](#track-4-integration-tests-for-server-actions)

---

## Track 1 — Unit tests for `src/lib/`

### Motivation

`src/lib/sparql.ts`, `src/lib/facet-generator.ts`, `src/lib/context-header.ts`, and
`src/lib/vocabulary-registry.ts` are pure or near-pure TypeScript. They contain the most critical
business logic in the codebase (query building, IRI validation, facet scoring, context headers) and
are currently tested only incidentally through E2E flows. A unit test regression on `buildLayerQuery`
or `isValidIRI` would only be caught after a full browser run against a live endpoint.

### Setup

Install Vitest (compatible with the existing TypeScript/Next.js setup, no Babel config needed):

```bash
npm install --save-dev vitest @vitest/coverage-v8
```

Add a `vitest.config.ts` at the project root:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/stores/**"],
      reporter: ["text", "lcov"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Add scripts to `package.json`:

```json
"test:unit": "vitest run",
"test:unit:watch": "vitest",
"test:unit:coverage": "vitest run --coverage"
```

---

### 1.1 `src/lib/sparql.test.ts`

This is the highest-value test file. `sparql.ts` has no dependencies beyond the TypeScript standard
library and is fully deterministic given the same inputs.

#### `isValidIRI` / `escapeIRI`

These functions are not exported, but they are the security boundary for SPARQL injection.
Export them from `sparql.ts` with an `@internal` JSDoc marker, or test them indirectly through
the query builders.

Tests to write:

- `buildLayerQuery` throws for an unsupported layer value (e.g., layer 99)
- `buildLayerQuery` throws when `focusIRI` is not a valid IRI
- `buildLayerQuery` with `graphIRI = null` produces a query without a `GRAPH` clause
- `buildLayerQuery` with a named `graphIRI` wraps the pattern in `GRAPH <...> { … }`
- `buildLayerQuery` with `facets["rdf:type"]` set inserts a `rdf:type` filter
- `buildLayerQuery` with a non-IRI facet dimension (e.g., `"Docker image"`) skips that dimension
  without throwing — this is the regression test for the bug documented in `moire-project.md`
- `buildLayerQuery` with facet values that are literals uses `STR()` comparison, not `IN (<iri>)`
- `buildSetTraversalQuery` with `direction = "incoming"` reverses the triple pattern
- `buildFacetCountQuery` produces a `GROUP BY` over `?value`
- `buildSearchQuery` escapes double-quotes, backslashes, and newlines in the search term
- All exported functions produce syntactically valid SPARQL (parse with a regex check for balanced
  `{}` braces as a cheap sanity check, or import a minimal SPARQL parser)

Example structure:

```typescript
import { describe, it, expect } from "vitest";
import { buildLayerQuery, buildSetTraversalQuery } from "./sparql";

describe("buildLayerQuery", () => {
  const base = {
    focusIRI: "http://example.org/Thing",
    graphIRI: null,
    layer: 0,
    facets: {},
  };

  it("throws for an unsupported layer", () => {
    expect(() => buildLayerQuery({ ...base, layer: 99 })).toThrow("Unsupported layer");
  });

  it("omits GRAPH clause when graphIRI is null", () => {
    const q = buildLayerQuery(base);
    expect(q).not.toContain("GRAPH");
  });

  it("wraps in GRAPH clause when graphIRI is provided", () => {
    const q = buildLayerQuery({ ...base, graphIRI: "http://example.org/g" });
    expect(q).toContain("GRAPH <http://example.org/g>");
  });

  it("skips non-IRI facet dimensions without throwing", () => {
    const q = buildLayerQuery({
      ...base,
      facets: { "Docker image": ["http://example.org/v"] },
    });
    expect(q).not.toContain("Docker image");
  });
});
```

---

### 1.2 `src/lib/facet-generator.test.ts`

`annotatePredicates` converts raw `PredicateSummary[]` into annotated forms with roles,
cardinalities, usefulness scores, and facet definitions. It has a substantial conditional surface
that is invisible from E2E tests.

Tests to write:

- A predicate with `isStructural = true` is not returned as a facet candidate
- A predicate with `valueKind = "iri"` and `objectCount = 5` becomes a facet with `valueType = "uri"`
- A predicate with `valueKind = "date"` becomes a facet with `valueType = "date-range"`
- A predicate with `valueKind = "numeric"` becomes a facet with `valueType = "numeric-range"`
- A predicate whose IRI is in `STRUCTURAL_PREDICATES` (e.g., `owl:sameAs`) gets `isStructural = true`
- `computeCardinality`: ratio ≤ 1.1 → `"single"`, ratio 1.2–1.5 → `"usually-single"`,
  ratio 1.6–5.0 → `"multi"`, ratio > 5 → `"highly-multi"`
- `computeUsefulness`: a `"relational"` predicate scores higher than a `"structural"` one
- `predicateToFacet` uses `p.label` when present; falls back to `shortIRI(p.iri)` when absent
- The output list is ordered by descending usefulness score

---

### 1.3 `src/lib/context-header.test.ts`

`buildContextHeader` is a pure function of a `LensFrame[]` stack and a `LabelCache`. It is
responsible for every context header string the user reads, and its logic is tested nowhere.

Tests to write:

- `context = "graphs"` returns `""`
- `context = "types"` returns `"Types in <graph label>"`
- `context = "entity"` returns the entity label; falls back to `shortIRI` if label is undefined
- `context = "set"` with no facets returns the pluralised class label
- `context = "set"` with facet phrases prepends them: `"Fiction Books"` not `"Books Fiction"`
- `context = "set"` with `navigationPredicate` produces `"<pred> of <parent header>"`
- `context = "relationships"` produces `"Relationships on <parent header>"`
- Recursive case: two-deep traversal produces the correct composed string
- Stack pointer at 0 with `context = "relationships"` uses `"Current set"` as parent

---

### 1.4 `src/lib/vocabulary-registry.test.ts`

`lookupPredicate` is simple but worth testing to catch accidental registry mutations.

Tests to write:

- `lookupPredicate("http://www.w3.org/2000/01/rdf-schema#label")` returns `{ role: "labelling", badge: "RDFS", name: "label" }`
- `lookupPredicate("http://unknown.example/pred")` returns `undefined` or a default
- No IRI appears twice in the registry (dedup guard)

---

## Track 2 — Unit tests for `src/stores/`

### Motivation

The Zustand stores (`navigation-store.ts`, `endpoint-store.ts`) hold the entire navigation state.
Bugs in `push`, `back`, `forward`, or endpoint persistence are hard to reproduce in E2E but
trivial to cover with store-level unit tests.

### Setup

Same Vitest config as Track 1. Zustand stores can be tested directly in Node without a DOM.

Create `src/stores/navigation-store.test.ts`:

Tests to write:

- Initial state: `stack` has one frame, `pointer = 0`
- `push(frame)` appends to the stack and increments the pointer
- `push(frame)` when pointer is in the middle truncates the forward history
- `back()` decrements the pointer; does nothing when pointer is 0
- `forward()` increments the pointer; does nothing when at the end of the stack
- After `back(); push(newFrame)`, `forward()` does nothing (forward history gone)
- `reset()` returns to the initial single-frame state

Create `src/stores/endpoint-store.test.ts`:

Tests to write:

- `setEndpoint(config)` stores the config and marks `isConnected = true`
- `clearEndpoint()` resets to the initial disconnected state
- `setLabelPredicate(iri)` updates the label predicate without changing other fields

---

## Track 3 — E2E reliability fixes

These are targeted fixes to existing spec files. None require new test infrastructure.

### 3.1 Tighten text matchers

**Files affected:** `05-entity-set.spec.ts`, `10-facets.spec.ts`, `07-navigation.spec.ts`

Replace permissive regex with exact plural forms:

```typescript
// Before
await expect(reviewPage.getByText(/\d+\s+entit/)).toBeVisible();

// After
await expect(reviewPage.getByText(/^\d+\s+(entity|entities)$/)).toBeVisible();
```

### 3.2 Replace silent animation waits with content-ready assertions

**Files affected:** `06-relationships.spec.ts`, `03-graphs-browser.spec.ts`, `04-types-browser.spec.ts`

The pattern `.waitFor({ state: "detached" }).catch(() => {})` on `.animate-pulse` is unreliable:
if the skeleton never appears (because the cache served the data immediately), `.catch(() => {})` hides
whether content actually loaded.

Replace with a positive assertion on actual content:

```typescript
// Before
await bsbmPage
  .locator(".animate-pulse")
  .waitFor({ state: "detached", timeout: 30_000 })
  .catch(() => {});

// After — wait for real content to appear (not loading indicator to disappear)
await expect(bsbmPage.locator('[data-testid="graph-card"]').first())
  .toBeVisible({ timeout: 30_000 });
```

This requires adding `data-testid` attributes to key containers. Suggested additions:

| Component | `data-testid` |
|---|---|
| Graph card in GraphsBrowser | `graph-card` |
| Class row in TypesBrowser | `class-row` |
| Entity card in EntitySet | `entity-card` |
| Relationship row in RelationshipsBrowser | `relationship-row` |
| Facet group in FacetPanel | `facet-group` |

### 3.3 Distinguish timeout failures from intentional skips

**Files affected:** `09-search-palette.spec.ts`

The graceful-degradation pattern (skip if endpoint is too slow) is useful, but it should emit a
warning so CI can distinguish "skipped because slow" from "passed":

```typescript
const hasResults = await firstResult
  .waitFor({ state: "visible", timeout: 90_000 })
  .then(() => true)
  .catch(() => false);

if (!hasResults) {
  test.info().annotations.push({
    type: "warning",
    description: "Search results did not appear within 90s — test skipped.",
  });
  return;
}
```

### 3.4 Add explicit error-state assertions

**Files affected:** `02-endpoint-setup.spec.ts`

There is one test for an unreachable endpoint but it only checks for an error string. Add:

- A test for HTTP 500 from the endpoint (use a server that always returns 500)
- A test for a malformed SPARQL response (server returns `200 OK` with HTML)

These require the fake SPARQL server introduced in Track 4.

### 3.5 Deduplicate fixture timeout declarations

Multiple specs declare `test.setTimeout(180_000)` individually. Extract this to a shared fixture
in `fixtures.ts` as a `use({ actionTimeout: 180_000 })` override so the value is maintained in
one place.

---

## Track 4 — Integration tests for server actions

### Motivation

`src/app/actions/graph.ts` calls a real SPARQL endpoint over HTTP. No test currently verifies
the data transformation layer between the raw SPARQL JSON response and the typed objects the UI
consumes. The IRI validation bug (see `moire-project.md`) lived exactly here.

### Setup

Add a minimal fake HTTP server fixture to Playwright (not a new test runner — Playwright supports
`page.route()` and custom fixtures that spin up Node `http` servers).

Create `e2e/sparql-mock-server.ts`:

```typescript
import http from "http";

export interface MockResponse {
  status: number;
  body: string;
  contentType?: string;
}

export function createMockSparqlServer(
  handler: (query: string) => MockResponse,
): { url: string; close: () => void } {
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const params = new URLSearchParams(body);
      const query = params.get("query") ?? new URLSearchParams(req.url?.split("?")[1]).get("query") ?? "";
      const response = handler(query);
      res.writeHead(response.status, {
        "Content-Type": response.contentType ?? "application/sparql-results+json",
      });
      res.end(response.body);
    });
  });
  server.listen(0);
  const port = (server.address() as { port: number }).port;
  return { url: `http://localhost:${port}/sparql`, close: () => server.close() };
}
```

### Test file: `e2e/specs/13-server-actions.spec.ts`

These tests call `setupEndpoint` and `fetchEntitySet` directly as Node functions, not through a
browser, using Playwright's `--project=node` configuration (or a separate Vitest test if preferred).

Alternatively, and more simply, write these as Vitest integration tests in
`src/app/actions/graph.test.ts` using the mock server above. This is the recommended approach
because it does not require Playwright's browser overhead.

Tests to write:

**`setupEndpoint`:**

- Returns `capabilities` and `summaries` when the endpoint responds with valid SPARQL JSON
- Throws `"Cannot reach endpoint: connection timed out."` when the server does not respond
- Throws `"Endpoint returned HTTP 500"` when the server returns 500
- Handles a response where `results.bindings` is empty (no graphs found)
- Correctly detects the label predicate from `skos:prefLabel` when that heuristic wins

**`fetchGraphSummaries` / introspection pipeline:**

- Predicates with non-IRI values (e.g., `"Docker image"`) are filtered out — regression test for
  the documented bug
- A graph with no named graphs is represented as `graphIRI = null` (default graph)
- Class summaries include the count from the introspection response

**`buildFacetCountQuery` roundtrip:**

- A facet dimension that is a valid IRI produces a `GROUP BY` query with `FILTER` on that IRI
- A facet dimension that is not a valid IRI is rejected before the query is sent

---

## Execution Order

The tracks are independent and can be parallelised across developers. The recommended solo sequence is:

1. **Track 1** first — pure library tests, no infrastructure, highest defect-finding value
2. **Track 2** — store tests, also infrastructure-free
3. **Track 3** — fixes regressions without adding new infrastructure, unblocks cleaner E2E
4. **Track 4** — requires the mock server; do last since it builds on the understanding gained
   from writing the unit tests

---

## Acceptance Criteria

- `npm run test:unit` passes with no failures
- Unit test coverage for `src/lib/` is ≥ 80% line coverage (measured with `--coverage`)
- All 12 existing E2E specs continue to pass after the reliability fixes
- The regex matchers in Track 3.1 are tightened in all affected files
- `data-testid` attributes added and used in at least the five components listed in Track 3.2
- The mock SPARQL server fixture exists and is used in at least the IRI-validation regression test
  (the bug from `moire-project.md`)
