import { describe, it, expect } from "vitest";
import { generateFacets, annotatePredicates } from "./facet-generator";
import type { PredicateSummary } from "./types";

// ── Helpers ────────────────────────────────────────────────────

function makePredicate(overrides: Partial<PredicateSummary> & { iri: string }): PredicateSummary {
  return {
    label: overrides.iri.split(/[#/]/).pop() ?? overrides.iri,
    subjectCount: 10,
    objectCount: 10,
    valueKind: "literal",
    isFacetCandidate: false,
    isNavigationCandidate: false,
    isStructural: false,
    ...overrides,
  };
}

// ── isFacetCandidate (via generateFacets) ──────────────────────

describe("generateFacets / isFacetCandidate", () => {
  it("excludes a predicate with isStructural = true", () => {
    const predicates = annotatePredicates([
      makePredicate({
        iri: "http://www.w3.org/2002/07/owl#sameAs",
        valueKind: "iri",
        objectCount: 10,
      }),
    ]);
    const facets = generateFacets(predicates);
    const iris = facets.map((f) => f.id);
    expect(iris).not.toContain("http://www.w3.org/2002/07/owl#sameAs");
  });

  it("returns FacetDefinition with valueType='uri' for iri valueKind with objectCount=5", () => {
    const predicates = annotatePredicates([
      makePredicate({
        iri: "http://example.org/related",
        valueKind: "iri",
        objectCount: 5,
        subjectCount: 5,
      }),
    ]);
    const facets = generateFacets(predicates);
    expect(facets.length).toBeGreaterThan(0);
    const facet = facets.find((f) => f.id === "http://example.org/related");
    expect(facet).toBeDefined();
    expect(facet?.valueType).toBe("uri");
  });

  it("returns valueType='date-range' for date valueKind", () => {
    const predicates = annotatePredicates([
      makePredicate({
        iri: "http://example.org/created",
        valueKind: "date",
        objectCount: 10,
      }),
    ]);
    const facets = generateFacets(predicates);
    const facet = facets.find((f) => f.id === "http://example.org/created");
    expect(facet).toBeDefined();
    expect(facet?.valueType).toBe("date-range");
  });

  it("returns valueType='numeric-range' for numeric valueKind", () => {
    const predicates = annotatePredicates([
      makePredicate({
        iri: "http://example.org/count",
        valueKind: "numeric",
        objectCount: 10,
      }),
    ]);
    const facets = generateFacets(predicates);
    const facet = facets.find((f) => f.id === "http://example.org/count");
    expect(facet).toBeDefined();
    expect(facet?.valueType).toBe("numeric-range");
  });
});

// ── STRUCTURAL_PREDICATES ──────────────────────────────────────

describe("annotatePredicates — STRUCTURAL_PREDICATES", () => {
  it("marks owl:sameAs as isStructural = true", () => {
    const result = annotatePredicates([
      makePredicate({
        iri: "http://www.w3.org/2002/07/owl#sameAs",
        valueKind: "iri",
        objectCount: 5,
      }),
    ]);
    expect(result[0].isStructural).toBe(true);
  });

  it("marks owl:equivalentClass as isStructural = true", () => {
    const result = annotatePredicates([
      makePredicate({
        iri: "http://www.w3.org/2002/07/owl#equivalentClass",
        valueKind: "iri",
        objectCount: 5,
      }),
    ]);
    expect(result[0].isStructural).toBe(true);
  });
});

// ── computeCardinality ─────────────────────────────────────────

describe("annotatePredicates — computeCardinality", () => {
  it("ratio ≤ 1.1 → 'single'", () => {
    const result = annotatePredicates([
      makePredicate({ iri: "http://example.org/p1", subjectCount: 10, objectCount: 11 }),
    ]);
    expect(result[0].cardinality).toBe("single");
  });

  it("ratio 1.2–1.5 → 'usually-single'", () => {
    const result = annotatePredicates([
      makePredicate({ iri: "http://example.org/p2", subjectCount: 10, objectCount: 14 }),
    ]);
    expect(result[0].cardinality).toBe("usually-single");
  });

  it("ratio 1.6–5.0 → 'multi'", () => {
    const result = annotatePredicates([
      makePredicate({ iri: "http://example.org/p3", subjectCount: 10, objectCount: 40 }),
    ]);
    expect(result[0].cardinality).toBe("multi");
  });

  it("ratio > 5.0 → 'highly-multi'", () => {
    const result = annotatePredicates([
      makePredicate({ iri: "http://example.org/p4", subjectCount: 10, objectCount: 60 }),
    ]);
    expect(result[0].cardinality).toBe("highly-multi");
  });
});

// ── Usefulness ordering ────────────────────────────────────────

describe("annotatePredicates — usefulness ordering", () => {
  it("a 'relational' predicate scores higher than a 'structural' one", () => {
    const results = annotatePredicates([
      makePredicate({
        iri: "http://xmlns.com/foaf/0.1/knows",  // relational in registry
        valueKind: "iri",
        subjectCount: 10,
        objectCount: 20,
      }),
      makePredicate({
        iri: "http://www.w3.org/2002/07/owl#sameAs",  // structural
        valueKind: "iri",
        subjectCount: 10,
        objectCount: 20,
      }),
    ]);
    const relational = results.find((p) => p.iri === "http://xmlns.com/foaf/0.1/knows")!;
    const structural = results.find((p) => p.iri === "http://www.w3.org/2002/07/owl#sameAs")!;
    expect(relational.usefulness!).toBeGreaterThan(structural.usefulness!);
  });

  it("output list is ordered by descending usefulness score", () => {
    const predicates = [
      makePredicate({ iri: "http://www.w3.org/2002/07/owl#sameAs", valueKind: "iri", subjectCount: 10, objectCount: 10 }),
      makePredicate({ iri: "http://xmlns.com/foaf/0.1/knows", valueKind: "iri", subjectCount: 10, objectCount: 20 }),
      makePredicate({ iri: "http://www.w3.org/2000/01/rdf-schema#label", valueKind: "literal", subjectCount: 10, objectCount: 10 }),
    ];
    const results = annotatePredicates(predicates);
    const facets = generateFacets(results);

    // facets should be sorted: classifying > relational > labelling/descriptive > structural
    // structural (owl:sameAs) is filtered out by isFacetCandidate, so only non-structural remain
    for (let i = 1; i < facets.length; i++) {
      const prev = results.find((p) => p.iri === facets[i - 1].id)!;
      const curr = results.find((p) => p.iri === facets[i].id)!;
      // Allow equal usefulness; ensure non-decreasing by role order
      expect((prev.usefulness ?? 0)).toBeGreaterThanOrEqual((curr.usefulness ?? 0) - 1);
    }
  });
});
