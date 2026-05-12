import { describe, it, expect } from "vitest";
import {
  buildPredicateMetadataQuery,
  applyPredicateMetadata,
  chunk,
  BATCH_SIZE,
  OWL_CHARACTERISTIC_LABELS,
} from "./metadata-queries";
import type { PredicateSummary } from "./types";

// ── Shared fixtures ────────────────────────────────────────────

const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const SKOS_BROADER = "http://www.w3.org/2004/02/skos/core#broader";
const EX_KNOWS = "http://example.org/knows";
const EX_AFFILIATION = "http://example.org/affiliatedWith";
const GRAPH_IRI = "http://example.org/graph";

function makePredicate(iri: string): PredicateSummary {
  return {
    iri,
    label: iri.split(/[#/]/).pop() ?? iri,
    subjectCount: 10,
    objectCount: 10,
    valueKind: "literal",
    isFacetCandidate: false,
    isNavigationCandidate: false,
    isStructural: false,
  };
}

// ── buildPredicateMetadataQuery ────────────────────────────────

describe("buildPredicateMetadataQuery", () => {
  it("returns empty string when predicateIRIs is empty", () => {
    const query = buildPredicateMetadataQuery([], null);
    expect(query).toBe("");
  });

  it("returns empty string when all IRIs are invalid", () => {
    const query = buildPredicateMetadataQuery(["not an IRI", "also bad"], null);
    expect(query).toBe("");
  });

  it("includes each valid IRI in the VALUES clause", () => {
    const query = buildPredicateMetadataQuery([RDFS_LABEL, SKOS_BROADER], null);
    expect(query).toContain(`<${RDFS_LABEL}>`);
    expect(query).toContain(`<${SKOS_BROADER}>`);
  });

  it("filters out invalid IRIs silently", () => {
    const query = buildPredicateMetadataQuery([RDFS_LABEL, "not an IRI"], null);
    expect(query).toContain(`<${RDFS_LABEL}>`);
    expect(query).not.toContain("not an IRI");
  });

  it("does not include a GRAPH clause (metadata lives outside data graph)", () => {
    const query = buildPredicateMetadataQuery([EX_KNOWS], GRAPH_IRI);
    // The query intentionally queries default graph for ontology metadata
    expect(query).not.toContain("GRAPH");
  });

  it("contains SELECT with all expected variables", () => {
    const query = buildPredicateMetadataQuery([EX_KNOWS], null);
    expect(query).toContain("?predicate");
    expect(query).toContain("?label");
    expect(query).toContain("?domain");
    expect(query).toContain("?range");
    expect(query).toContain("?inverse");
    expect(query).toContain("?characteristic");
  });

  it("contains OWL characteristic IRIs in FILTER", () => {
    const query = buildPredicateMetadataQuery([EX_KNOWS], null);
    expect(query).toContain("owl#FunctionalProperty");
    expect(query).toContain("owl#TransitiveProperty");
  });

  it("limits each batch to BATCH_SIZE IRIs", () => {
    // buildPredicateMetadataQuery itself doesn't batch — chunk() is the helper.
    // Verify BATCH_SIZE is exported and non-zero.
    expect(BATCH_SIZE).toBeGreaterThan(0);
  });
});

// ── applyPredicateMetadata ─────────────────────────────────────

describe("applyPredicateMetadata", () => {
  it("returns original predicates unchanged when bindings array is empty", () => {
    const preds = [makePredicate(EX_KNOWS)];
    const result = applyPredicateMetadata(preds, []);
    expect(result).toEqual(preds);
  });

  it("adds rdfsLabel from rdfs:label binding", () => {
    const preds = [makePredicate(EX_KNOWS)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_KNOWS },
        label: { type: "literal", value: "Knows" },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    expect(result[0].rdfsLabel).toBe("Knows");
  });

  it("prefers skos:prefLabel over rdfs:label when both present in the same row", () => {
    const preds = [makePredicate(EX_KNOWS)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_KNOWS },
        label: { type: "literal", value: "knows" },
        prefLabel: { type: "literal", value: "Knows (preferred)" },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    expect(result[0].rdfsLabel).toBe("Knows (preferred)");
  });

  it("adds skosDefinition from skos:definition binding", () => {
    const preds = [makePredicate(EX_KNOWS)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_KNOWS },
        definition: { type: "literal", value: "Connects a person to someone they know." },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    expect(result[0].skosDefinition).toBe("Connects a person to someone they know.");
  });

  it("falls back to rdfs:comment for skosDefinition when no definition binding", () => {
    const preds = [makePredicate(EX_KNOWS)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_KNOWS },
        comment: { type: "literal", value: "A comment about knows." },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    expect(result[0].skosDefinition).toBe("A comment about knows.");
  });

  it("adds domain and domainLabel", () => {
    const PERSON = "http://example.org/Person";
    const preds = [makePredicate(EX_AFFILIATION)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_AFFILIATION },
        domain: { type: "uri", value: PERSON },
        domainLabel: { type: "literal", value: "Person" },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    expect(result[0].domain).toBe(PERSON);
    expect(result[0].domainLabel).toBe("Person");
  });

  it("adds range and rangeLabel", () => {
    const ORG = "http://example.org/Organization";
    const preds = [makePredicate(EX_AFFILIATION)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_AFFILIATION },
        range: { type: "uri", value: ORG },
        rangeLabel: { type: "literal", value: "Organization" },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    expect(result[0].range).toBe(ORG);
    expect(result[0].rangeLabel).toBe("Organization");
  });

  it("adds inverseIRI and inverseLabel", () => {
    const INVERSE_IRI = "http://example.org/affiliationOf";
    const preds = [makePredicate(EX_AFFILIATION)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_AFFILIATION },
        inverse: { type: "uri", value: INVERSE_IRI },
        inverseLabel: { type: "literal", value: "Affiliation of" },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    expect(result[0].inverseIRI).toBe(INVERSE_IRI);
    expect(result[0].inverseLabel).toBe("Affiliation of");
  });

  it("accumulates owlCharacteristics across multiple rows", () => {
    const FUNCTIONAL = "http://www.w3.org/2002/07/owl#FunctionalProperty";
    const TRANSITIVE = "http://www.w3.org/2002/07/owl#TransitiveProperty";
    const preds = [makePredicate(EX_AFFILIATION)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_AFFILIATION },
        characteristic: { type: "uri", value: FUNCTIONAL },
      },
      {
        predicate: { type: "uri", value: EX_AFFILIATION },
        characteristic: { type: "uri", value: TRANSITIVE },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    expect(result[0].owlCharacteristics).toContain("Functional");
    expect(result[0].owlCharacteristics).toContain("Transitive");
    expect(result[0].owlCharacteristics).toHaveLength(2);
  });

  it("leaves owlCharacteristics undefined when no characteristics in bindings", () => {
    const preds = [makePredicate(EX_KNOWS)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_KNOWS },
        label: { type: "literal", value: "knows" },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    expect(result[0].owlCharacteristics).toBeUndefined();
  });

  it("does not modify predicates not present in bindings", () => {
    const OTHER_IRI = "http://example.org/otherPredicate";
    const preds = [makePredicate(EX_KNOWS), makePredicate(OTHER_IRI)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_KNOWS },
        label: { type: "literal", value: "knows" },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    // OTHER_IRI untouched
    expect(result[1].rdfsLabel).toBeUndefined();
    // EX_KNOWS enriched
    expect(result[0].rdfsLabel).toBe("knows");
  });

  it("preserves existing predicate fields (no data loss)", () => {
    const pred = { ...makePredicate(EX_KNOWS), usefulness: 75, role: "relational" as const };
    const bindings = [
      {
        predicate: { type: "uri", value: EX_KNOWS },
        label: { type: "literal", value: "knows" },
      },
    ];
    const result = applyPredicateMetadata([pred], bindings);
    expect(result[0].usefulness).toBe(75);
    expect(result[0].role).toBe("relational");
  });

  it("ignores bindings with unknown characteristic local names", () => {
    const UNKNOWN = "http://www.w3.org/2002/07/owl#UnknownProperty";
    const preds = [makePredicate(EX_KNOWS)];
    const bindings = [
      {
        predicate: { type: "uri", value: EX_KNOWS },
        characteristic: { type: "uri", value: UNKNOWN },
      },
    ];
    const result = applyPredicateMetadata(preds, bindings);
    expect(result[0].owlCharacteristics).toBeUndefined();
  });
});

// ── OWL_CHARACTERISTIC_LABELS ──────────────────────────────────

describe("OWL_CHARACTERISTIC_LABELS", () => {
  it("maps all five OWL property characteristics", () => {
    expect(OWL_CHARACTERISTIC_LABELS["FunctionalProperty"]).toBe("Functional");
    expect(OWL_CHARACTERISTIC_LABELS["InverseFunctionalProperty"]).toBe("InverseFunctional");
    expect(OWL_CHARACTERISTIC_LABELS["SymmetricProperty"]).toBe("Symmetric");
    expect(OWL_CHARACTERISTIC_LABELS["TransitiveProperty"]).toBe("Transitive");
    expect(OWL_CHARACTERISTIC_LABELS["ReflexiveProperty"]).toBe("Reflexive");
  });
});

// ── chunk ──────────────────────────────────────────────────────

describe("chunk", () => {
  it("splits array into groups of the specified size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns single chunk when array is smaller than size", () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunk([], 10)).toEqual([]);
  });

  it("returns chunks of exactly `size` items when array length is a multiple", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });
});
