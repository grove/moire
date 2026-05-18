import { describe, it, expect } from "vitest";
import {
  buildLayerQuery,
  buildSetTraversalQuery,
  buildFacetCountQuery,
  buildSearchQuery,
  buildPredicateObjectsQuery,
  buildClassInstancesQuery,
  buildPredicateQuery,
  buildListGraphsQuery,
  buildDefaultGraphCountQuery,
  buildSampleGraphQuery,
} from "./sparql";

// ── buildLayerQuery ────────────────────────────────────────────

describe("buildLayerQuery", () => {
  const VALID_IRI = "http://example.org/resource/1";
  const GRAPH_IRI = "http://example.org/graph";

  it("throws for unsupported layer values", () => {
    expect(() =>
      buildLayerQuery({ focusIRI: VALID_IRI, graphIRI: null, layer: 99, facets: {} })
    ).toThrow("Unsupported layer: 99");
  });

  it("throws when focusIRI is not a valid IRI", () => {
    expect(() =>
      buildLayerQuery({ focusIRI: "not a valid IRI", graphIRI: null, layer: 0, facets: {} })
    ).toThrow();
  });

  it("omits GRAPH clause when graphIRI is null", () => {
    const query = buildLayerQuery({
      focusIRI: VALID_IRI,
      graphIRI: null,
      layer: 0,
      facets: {},
    });
    expect(query).not.toContain("GRAPH");
  });

  it("wraps in GRAPH clause when graphIRI is provided", () => {
    const query = buildLayerQuery({
      focusIRI: VALID_IRI,
      graphIRI: GRAPH_IRI,
      layer: 0,
      facets: {},
    });
    expect(query).toContain("GRAPH");
    expect(query).toContain(GRAPH_IRI);
  });

  it("inserts rdf:type filter when facet dimension is rdf:type", () => {
    const query = buildLayerQuery({
      focusIRI: VALID_IRI,
      graphIRI: null,
      layer: 0,
      facets: { "rdf:type": ["http://example.org/Type"] },
    });
    expect(query).toContain("rdf-syntax-ns#type");
    expect(query).toContain("?type IN");
  });

  it("skips non-IRI facet dimensions without throwing — regression test for IRI validation bug", () => {
    // "Docker image" is not a valid IRI and must be silently skipped
    expect(() =>
      buildLayerQuery({
        focusIRI: VALID_IRI,
        graphIRI: null,
        layer: 0,
        facets: { "Docker image": ["some value"] },
      })
    ).not.toThrow();

    const query = buildLayerQuery({
      focusIRI: VALID_IRI,
      graphIRI: null,
      layer: 0,
      facets: { "Docker image": ["some value"] },
    });
    // The invalid IRI dimension must not appear in the query
    expect(query).not.toContain("Docker image");
  });

  it("uses STR() comparison for literal facet values", () => {
    const query = buildLayerQuery({
      focusIRI: VALID_IRI,
      graphIRI: null,
      layer: 0,
      facets: {
        "http://example.org/status": ["active", "pending"],
      },
    });
    expect(query).toContain("STR(");
  });
});

// ── buildSetTraversalQuery ─────────────────────────────────────

describe("buildSetTraversalQuery", () => {
  const SOURCE = ["http://example.org/a", "http://example.org/b"];
  const PREDICATE = "http://example.org/rel";

  it("with direction='incoming' reverses the triple pattern", () => {
    const query = buildSetTraversalQuery({
      sourceIRIs: SOURCE,
      predicateIRI: PREDICATE,
      graphIRI: null,
      direction: "incoming",
    });
    // In incoming direction: ?entity <pred> ?subject (entity is on the left)
    expect(query).toContain(`?entity <${PREDICATE}> ?subject`);
  });

  it("with direction='outgoing' uses the standard triple pattern", () => {
    const query = buildSetTraversalQuery({
      sourceIRIs: SOURCE,
      predicateIRI: PREDICATE,
      graphIRI: null,
      direction: "outgoing",
    });
    // In outgoing direction: ?subject <pred> ?entity
    expect(query).toContain(`?subject <${PREDICATE}> ?entity`);
  });
});

// ── buildFacetCountQuery ───────────────────────────────────────

describe("buildFacetCountQuery", () => {
  it("produces a GROUP BY over ?value (named ?facetValue)", () => {
    const query = buildFacetCountQuery(
      "http://example.org/focus",
      null,
      0,
      {},
      "http://example.org/dim",
      "http://example.org/dim",
    );
    expect(query).toContain("GROUP BY");
    expect(query).toContain("?facetValue");
  });

  it("throws when sparqlPredicate is not a valid IRI — regression for non-IRI facet dimensions", () => {
    // Non-IRI facet dimensions must be rejected before the query is sent to the endpoint
    expect(() =>
      buildFacetCountQuery(
        "http://example.org/focus",
        null,
        0,
        {},
        "Docker image",
        "Docker image",
      )
    ).toThrow("Invalid IRI");
  });
});

// ── buildSearchQuery ───────────────────────────────────────────

describe("buildSearchQuery", () => {
  it("escapes double-quotes in the search term", () => {
    const query = buildSearchQuery(null, 'say "hello"');
    expect(query).toContain('\\"hello\\"');
  });

  it("escapes backslashes in the search term", () => {
    const query = buildSearchQuery(null, "back\\slash");
    expect(query).toContain("back\\\\slash");
  });

  it("escapes newlines in the search term", () => {
    const query = buildSearchQuery(null, "line1\nline2");
    expect(query).toContain("line1\\nline2");
  });

  it("includes GRAPH clause when graphIRI is provided", () => {
    const query = buildSearchQuery("http://example.org/g", "test");
    expect(query).toContain("GRAPH");
    expect(query).toContain("http://example.org/g");
  });

  it("uses CONTAINS filter for standard SPARQL endpoints", () => {
    const query = buildSearchQuery(null, "knowledge graph", undefined, false);
    expect(query).toContain("CONTAINS");
    expect(query).not.toContain("pg-ripple.io/fn/fts");
  });

  it("uses pg:fts() across all text fields for pg-ripple endpoints", () => {
    const query = buildSearchQuery(null, "knowledge graph", undefined, true);
    expect(query).toContain("pg-ripple.io/fn/fts");
    // Should search any predicate, not just the label predicate
    expect(query).toContain("?_anyPred");
    expect(query).not.toContain("CONTAINS");
  });

  it("pg-ripple FTS includes GRAPH clause when graphIRI is provided", () => {
    const query = buildSearchQuery("http://example.org/g", "knowledge graph", undefined, true);
    expect(query).toContain("GRAPH");
    expect(query).toContain("pg-ripple.io/fn/fts");
  });

  it("pg-ripple FTS escapes quotes in the search term", () => {
    const query = buildSearchQuery(null, 'say "hello"', undefined, true);
    expect(query).toContain('\\"hello\\"');
    expect(query).toContain("pg-ripple.io/fn/fts");
  });
});

// ── buildPredicateObjectsQuery ─────────────────────────────────

describe("buildPredicateObjectsQuery", () => {
  it("returns a SELECT query without GRAPH for null graphIRI", () => {
    const query = buildPredicateObjectsQuery({
      predicateIRI: "http://example.org/rel",
      graphIRI: null,
    });
    expect(query).toContain("SELECT");
    expect(query).not.toContain("GRAPH");
  });

  it("includes GRAPH clause for named graphIRI", () => {
    const query = buildPredicateObjectsQuery({
      predicateIRI: "http://example.org/rel",
      graphIRI: "http://example.org/g",
    });
    expect(query).toContain("GRAPH");
    expect(query).toContain("http://example.org/g");
  });
});

// ── buildClassInstancesQuery ───────────────────────────────────

describe("buildClassInstancesQuery", () => {
  it("returns a SELECT with rdf:type filter for the class", () => {
    const query = buildClassInstancesQuery(
      "http://example.org/Person",
      null,
    );
    expect(query).toContain("SELECT");
    expect(query).toContain("http://example.org/Person");
  });

  it("wraps in GRAPH when graphIRI is provided", () => {
    const query = buildClassInstancesQuery(
      "http://example.org/Person",
      "http://example.org/g",
    );
    expect(query).toContain("GRAPH");
    expect(query).toContain("http://example.org/g");
  });

  it("skips non-IRI facet dimensions without throwing", () => {
    expect(() =>
      buildClassInstancesQuery(
        "http://example.org/Person",
        null,
        undefined,
        { "Docker image": ["some value"] },
      )
    ).not.toThrow();
  });
});

// ── buildPredicateQuery ────────────────────────────────────────

describe("buildPredicateQuery", () => {
  it("returns a SELECT without GRAPH for null graphIRI", () => {
    const query = buildPredicateQuery("http://example.org/e1", null);
    expect(query).toContain("SELECT");
    expect(query).not.toContain("GRAPH");
  });

  it("wraps in GRAPH for named graphIRI", () => {
    const query = buildPredicateQuery("http://example.org/e1", "http://example.org/g");
    expect(query).toContain("GRAPH");
  });
});

// ── buildLayerQuery with graphIRI ──────────────────────────────

describe("buildLayerQuery with graphIRI", () => {
  it("handles layer 1 with named graph", () => {
    const query = buildLayerQuery({
      focusIRI: "http://example.org/focus",
      graphIRI: "http://example.org/g",
      layer: 1,
      facets: {},
    });
    expect(query).toContain("GRAPH");
    expect(query).toContain("http://example.org/g");
  });

  it("handles negative layer -1", () => {
    const query = buildLayerQuery({
      focusIRI: "http://example.org/focus",
      graphIRI: null,
      layer: -1,
      facets: {},
    });
    expect(query).toContain("SELECT");
  });

  it("handles IRI facet values with FILTER IN", () => {
    const query = buildLayerQuery({
      focusIRI: "http://example.org/focus",
      graphIRI: null,
      layer: 0,
      facets: {
        "http://example.org/type": ["http://example.org/TypeA", "http://example.org/TypeB"],
      },
    });
    expect(query).toContain("FILTER(");
    expect(query).toContain("IN (");
  });
});

// ── buildFacetCountQuery with graphIRI ─────────────────────────

describe("buildFacetCountQuery with graphIRI", () => {
  it("wraps in GRAPH for named graphIRI", () => {
    const query = buildFacetCountQuery(
      "http://example.org/focus",
      "http://example.org/g",
      0,
      {},
      "http://example.org/dim",
      "http://example.org/dim",
    );
    expect(query).toContain("GRAPH");
  });

  it("returns empty results query when focusIRI is empty", () => {
    const query = buildFacetCountQuery(
      "",
      null,
      0,
      {},
      "http://example.org/dim",
      "http://example.org/dim",
    );
    expect(query).toContain("SELECT");
  });
});

// ── buildListGraphsQuery ───────────────────────────────────────

describe("buildListGraphsQuery", () => {
  it("returns a query with GRAPH and GROUP BY", () => {
    const query = buildListGraphsQuery();
    expect(query).toContain("GRAPH");
    expect(query).toContain("GROUP BY");
  });
});

// ── buildDefaultGraphCountQuery ────────────────────────────────

describe("buildDefaultGraphCountQuery", () => {
  it("returns a COUNT query", () => {
    const query = buildDefaultGraphCountQuery();
    expect(query).toContain("COUNT");
  });
});

// ── buildSampleGraphQuery ──────────────────────────────────────

describe("buildSampleGraphQuery", () => {
  it("returns a query with BIND for null graphIRI", () => {
    const query = buildSampleGraphQuery(null);
    expect(query).toContain("SELECT");
    expect(query).toContain("GROUP BY");
  });

  it("returns a GRAPH-scoped query for named graphIRI", () => {
    const query = buildSampleGraphQuery("http://example.org/g");
    expect(query).toContain("GRAPH");
  });
});
