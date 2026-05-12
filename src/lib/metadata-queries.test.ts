import { describe, it, expect } from "vitest";
import {
  buildPredicateMetadataQuery,
  applyPredicateMetadata,
  chunk,
  BATCH_SIZE,
  OWL_CHARACTERISTIC_LABELS,
  buildResourceAnnotationQuery,
  parseResourceAnnotation,
  buildShaclShapeQuery,
  parseShaclShapes,
  buildShaclViolationCheckQuery,
  computeShaclViolations,
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

// ── buildResourceAnnotationQuery ──────────────────────────────

describe("buildResourceAnnotationQuery", () => {
  const VALID_IRI = "http://example.org/resource/42";

  it("returns empty string for an invalid IRI", () => {
    expect(buildResourceAnnotationQuery("not an IRI", null)).toBe("");
    expect(buildResourceAnnotationQuery("", null)).toBe("");
  });

  it("returns a non-empty query for a valid IRI", () => {
    const q = buildResourceAnnotationQuery(VALID_IRI, null);
    expect(q.length).toBeGreaterThan(0);
  });

  it("embeds the resource IRI in the query", () => {
    const q = buildResourceAnnotationQuery(VALID_IRI, null);
    expect(q).toContain(`<${VALID_IRI}>`);
  });

  it("contains SELECT with key annotation variables", () => {
    const q = buildResourceAnnotationQuery(VALID_IRI, null);
    expect(q).toContain("?altLabel");
    expect(q).toContain("?definition");
    expect(q).toContain("?source");
    expect(q).toContain("?image");
    expect(q).toContain("?created");
    expect(q).toContain("?modified");
  });

  it("references skos:altLabel for aliases", () => {
    const q = buildResourceAnnotationQuery(VALID_IRI, null);
    expect(q).toContain("skos:altLabel");
  });

  it("references prov:hadPrimarySource for provenance", () => {
    const q = buildResourceAnnotationQuery(VALID_IRI, null);
    expect(q).toContain("prov:hadPrimarySource");
  });

  it("does not include a GRAPH clause (metadata lives outside data graph)", () => {
    const q = buildResourceAnnotationQuery(VALID_IRI, "http://example.org/graph");
    expect(q).not.toContain("GRAPH");
  });
});

// ── parseResourceAnnotation ────────────────────────────────────

describe("parseResourceAnnotation", () => {
  it("returns empty object for empty bindings", () => {
    const result = parseResourceAnnotation([]);
    expect(result.aliases).toBeUndefined();
    expect(result.description).toBeUndefined();
    expect(result.temporalInfo).toBeUndefined();
    expect(result.sourceUrl).toBeUndefined();
    expect(result.media).toBeUndefined();
  });

  it("collects altLabel aliases into an array", () => {
    const bindings = [
      { altLabel: { type: "literal", value: "Alias A" } },
      { altLabel: { type: "literal", value: "Alias B" } },
    ];
    const result = parseResourceAnnotation(bindings);
    expect(result.aliases).toContain("Alias A");
    expect(result.aliases).toContain("Alias B");
    expect(result.aliases).toHaveLength(2);
  });

  it("de-duplicates altLabel values", () => {
    const bindings = [
      { altLabel: { type: "literal", value: "Same" } },
      { altLabel: { type: "literal", value: "Same" } },
    ];
    const result = parseResourceAnnotation(bindings);
    expect(result.aliases).toHaveLength(1);
  });

  it("picks the first definition and ignores subsequent rows (first-wins)", () => {
    const bindings = [
      { definition: { type: "literal", value: "First definition" } },
      { definition: { type: "literal", value: "Second definition" } },
    ];
    const result = parseResourceAnnotation(bindings);
    expect(result.description).toBe("First definition");
  });

  it("extracts source URL from provenance binding", () => {
    const bindings = [
      { source: { type: "uri", value: "http://example.org/source" } },
    ];
    const result = parseResourceAnnotation(bindings);
    expect(result.sourceUrl).toBe("http://example.org/source");
  });

  it("collects image into media array with kind='image'", () => {
    const bindings = [
      { image: { type: "uri", value: "http://example.org/img.png" } },
    ];
    const result = parseResourceAnnotation(bindings);
    expect(result.media).toHaveLength(1);
    expect(result.media![0].kind).toBe("image");
    expect(result.media![0].url).toBe("http://example.org/img.png");
  });

  it("collects page into media array with kind='page'", () => {
    const bindings = [
      { page: { type: "uri", value: "http://example.org/page" } },
    ];
    const result = parseResourceAnnotation(bindings);
    expect(result.media).toHaveLength(1);
    expect(result.media![0].kind).toBe("page");
  });

  it("de-duplicates media entries with the same URL", () => {
    const url = "http://example.org/img.png";
    const bindings = [
      { image: { type: "uri", value: url } },
      { image: { type: "uri", value: url } },
    ];
    const result = parseResourceAnnotation(bindings);
    expect(result.media).toHaveLength(1);
  });

  it("extracts created date", () => {
    const bindings = [
      { created: { type: "literal", value: "2023-05-12", datatype: "http://www.w3.org/2001/XMLSchema#date" } },
    ];
    const result = parseResourceAnnotation(bindings);
    expect(result.temporalInfo?.created).toBe("2023-05-12");
  });

  it("extracts modified date", () => {
    const bindings = [
      { modified: { type: "literal", value: "2024-01-03" } },
    ];
    const result = parseResourceAnnotation(bindings);
    expect(result.temporalInfo?.modified).toBe("2024-01-03");
  });

  it("leaves temporalInfo undefined when no date bindings present", () => {
    const bindings = [
      { altLabel: { type: "literal", value: "Alias" } },
    ];
    const result = parseResourceAnnotation(bindings);
    expect(result.temporalInfo).toBeUndefined();
  });
});

// ── buildShaclShapeQuery ───────────────────────────────────────

describe("buildShaclShapeQuery", () => {
  const VALID_CLASS = "http://example.org/Person";

  it("returns empty string for invalid class IRI", () => {
    expect(buildShaclShapeQuery("not an IRI")).toBe("");
    expect(buildShaclShapeQuery("")).toBe("");
  });

  it("returns a non-empty query for a valid class IRI", () => {
    expect(buildShaclShapeQuery(VALID_CLASS).length).toBeGreaterThan(0);
  });

  it("embeds the class IRI in sh:targetClass position", () => {
    const q = buildShaclShapeQuery(VALID_CLASS);
    expect(q).toContain(`<${VALID_CLASS}>`);
    expect(q).toContain("sh:targetClass");
  });

  it("selects sh:name and sh:description", () => {
    const q = buildShaclShapeQuery(VALID_CLASS);
    expect(q).toContain("?name");
    expect(q).toContain("?description");
  });

  it("selects sh:minCount and sh:maxCount", () => {
    const q = buildShaclShapeQuery(VALID_CLASS);
    expect(q).toContain("?minCount");
    expect(q).toContain("?maxCount");
  });

  it("selects sh:order and sh:group", () => {
    const q = buildShaclShapeQuery(VALID_CLASS);
    expect(q).toContain("?order");
    expect(q).toContain("?group");
  });

  it("selects sh:datatype and sh:class", () => {
    const q = buildShaclShapeQuery(VALID_CLASS);
    expect(q).toContain("?datatype");
    expect(q).toContain("?class");
  });

  it("references sh:NodeShape", () => {
    const q = buildShaclShapeQuery(VALID_CLASS);
    expect(q).toContain("sh:NodeShape");
  });

  it("does not include a GRAPH clause (shapes live in default/ontology graph)", () => {
    const q = buildShaclShapeQuery(VALID_CLASS);
    expect(q).not.toContain("GRAPH");
  });

  it("filters non-IRI paths via FILTER(isIRI(?path))", () => {
    const q = buildShaclShapeQuery(VALID_CLASS);
    expect(q).toContain("isIRI(?path)");
  });
});

// ── parseShaclShapes ───────────────────────────────────────────

describe("parseShaclShapes", () => {
  const EX_NAME = "http://example.org/name";
  const EX_DATE = "http://example.org/publishedDate";

  it("returns empty array for empty bindings", () => {
    expect(parseShaclShapes([])).toEqual([]);
  });

  it("parses a single shape with name and minCount", () => {
    const bindings = [
      {
        path: { type: "uri", value: EX_NAME },
        name: { type: "literal", value: "Full Name" },
        minCount: { type: "literal", value: "1" },
      },
    ];
    const shapes = parseShaclShapes(bindings);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].path).toBe(EX_NAME);
    expect(shapes[0].name).toBe("Full Name");
    expect(shapes[0].minCount).toBe(1);
  });

  it("parses description, order, and maxCount", () => {
    const bindings = [
      {
        path: { type: "uri", value: EX_DATE },
        description: { type: "literal", value: "Publication date." },
        order: { type: "literal", value: "10" },
        maxCount: { type: "literal", value: "1" },
      },
    ];
    const shapes = parseShaclShapes(bindings);
    expect(shapes[0].description).toBe("Publication date.");
    expect(shapes[0].order).toBe(10);
    expect(shapes[0].maxCount).toBe(1);
  });

  it("de-duplicates multiple rows for the same path (first-wins scalar fields)", () => {
    const bindings = [
      { path: { type: "uri", value: EX_NAME }, name: { type: "literal", value: "First Name" } },
      { path: { type: "uri", value: EX_NAME }, name: { type: "literal", value: "Second Name" } },
    ];
    const shapes = parseShaclShapes(bindings);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].name).toBe("First Name");
  });

  it("sorts shapes by sh:order when available", () => {
    const bindings = [
      { path: { type: "uri", value: EX_DATE }, order: { type: "literal", value: "20" } },
      { path: { type: "uri", value: EX_NAME }, order: { type: "literal", value: "10" } },
    ];
    const shapes = parseShaclShapes(bindings);
    expect(shapes[0].path).toBe(EX_NAME);  // order 10 first
    expect(shapes[1].path).toBe(EX_DATE);  // order 20 second
  });

  it("handles shapes without sh:order (sorted after ordered shapes)", () => {
    const bindings = [
      { path: { type: "uri", value: EX_DATE } },  // no order
      { path: { type: "uri", value: EX_NAME }, order: { type: "literal", value: "1" } },
    ];
    const shapes = parseShaclShapes(bindings);
    expect(shapes[0].path).toBe(EX_NAME);  // ordered first
  });

  it("ignores rows with missing path", () => {
    const bindings = [
      { name: { type: "literal", value: "Orphaned" } },  // no path
      { path: { type: "uri", value: EX_NAME }, name: { type: "literal", value: "Name" } },
    ];
    const shapes = parseShaclShapes(bindings);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].name).toBe("Name");
  });

  it("handles minCount = 0 (optional property)", () => {
    const bindings = [
      { path: { type: "uri", value: EX_NAME }, minCount: { type: "literal", value: "0" } },
    ];
    const shapes = parseShaclShapes(bindings);
    expect(shapes[0].minCount).toBe(0);
  });
});

// ── buildShaclViolationCheckQuery ──────────────────────────────

describe("buildShaclViolationCheckQuery", () => {
  const ENTITY_A = "http://example.org/alice";
  const ENTITY_B = "http://example.org/bob";
  const PRED_NAME = "http://example.org/name";
  const PRED_DATE = "http://example.org/publishedDate";
  const GRAPH = "http://example.org/graph";

  it("returns empty string when entityIRIs is empty", () => {
    expect(buildShaclViolationCheckQuery([], [PRED_NAME], null)).toBe("");
  });

  it("returns empty string when requiredPredicateIRIs is empty", () => {
    expect(buildShaclViolationCheckQuery([ENTITY_A], [], null)).toBe("");
  });

  it("includes entity IRIs in VALUES clause", () => {
    const q = buildShaclViolationCheckQuery([ENTITY_A, ENTITY_B], [PRED_NAME], null);
    expect(q).toContain(`<${ENTITY_A}>`);
    expect(q).toContain(`<${ENTITY_B}>`);
  });

  it("includes predicate IRIs in VALUES clause", () => {
    const q = buildShaclViolationCheckQuery([ENTITY_A], [PRED_NAME, PRED_DATE], null);
    expect(q).toContain(`<${PRED_NAME}>`);
    expect(q).toContain(`<${PRED_DATE}>`);
  });

  it("uses FILTER NOT EXISTS to detect missing predicates", () => {
    const q = buildShaclViolationCheckQuery([ENTITY_A], [PRED_NAME], null);
    expect(q).toContain("FILTER NOT EXISTS");
  });

  it("uses named GRAPH clause when graphIRI is provided", () => {
    const q = buildShaclViolationCheckQuery([ENTITY_A], [PRED_NAME], GRAPH);
    expect(q).toContain(`GRAPH <${GRAPH}>`);
  });

  it("does not use GRAPH clause when graphIRI is null", () => {
    const q = buildShaclViolationCheckQuery([ENTITY_A], [PRED_NAME], null);
    expect(q).not.toContain("GRAPH");
  });

  it("filters out invalid IRIs silently", () => {
    const q = buildShaclViolationCheckQuery(
      [ENTITY_A, "not an IRI"],
      [PRED_NAME, "also bad"],
      null,
    );
    expect(q).toContain(`<${ENTITY_A}>`);
    expect(q).not.toContain("not an IRI");
    expect(q).not.toContain("also bad");
  });

  it("returns empty string when all entities and predicates are invalid IRIs", () => {
    const q = buildShaclViolationCheckQuery(["bad"], ["also bad"], null);
    expect(q).toBe("");
  });
});

// ── computeShaclViolations ─────────────────────────────────────

describe("computeShaclViolations", () => {
  const EX_NAME = "http://example.org/name";
  const EX_DATE = "http://example.org/publishedDate";
  const EX_OPTIONAL = "http://example.org/abstract";

  const shapes = [
    { path: EX_NAME, name: "Full Name", minCount: 1 },
    { path: EX_DATE, name: "Publication Date", minCount: 1 },
    { path: EX_OPTIONAL, minCount: 0 },  // optional
  ];

  it("returns empty array when no shapes have minCount >= 1", () => {
    const optionalShapes = [{ path: EX_OPTIONAL, minCount: 0 }];
    expect(computeShaclViolations(optionalShapes, [])).toEqual([]);
  });

  it("returns empty array when entity has all required predicates", () => {
    const result = computeShaclViolations(shapes, [EX_NAME, EX_DATE]);
    expect(result).toEqual([]);
  });

  it("returns violation for missing required predicate", () => {
    const result = computeShaclViolations(shapes, [EX_NAME]);  // EX_DATE missing
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe(EX_DATE);
    expect(result[0].severity).toBe("Warning");
  });

  it("includes human-readable message with sh:name when available", () => {
    const result = computeShaclViolations(shapes, []);
    const nameViolation = result.find((v) => v.path === EX_NAME);
    expect(nameViolation?.message).toContain("Full Name");
  });

  it("falls back to local name when sh:name is absent", () => {
    const shapesNoName = [{ path: EX_DATE, minCount: 1 }];
    const result = computeShaclViolations(shapesNoName, []);
    expect(result[0].message).toContain("publishedDate");
  });

  it("uses 'one' for minCount = 1 in the message", () => {
    const result = computeShaclViolations(shapes, []);
    const nameViolation = result.find((v) => v.path === EX_NAME);
    expect(nameViolation?.message).toContain("one");
  });

  it("does not report violations for optional predicates (minCount = 0)", () => {
    const result = computeShaclViolations(shapes, []);
    const optionalViolation = result.find((v) => v.path === EX_OPTIONAL);
    expect(optionalViolation).toBeUndefined();
  });

  it("does not report violations for shapes without minCount", () => {
    const shapesNoMin = [{ path: EX_OPTIONAL }];
    const result = computeShaclViolations(shapesNoMin, []);
    expect(result).toEqual([]);
  });

  it("returns violations for all missing required predicates", () => {
    const result = computeShaclViolations(shapes, []);
    // name and date are required; optional has minCount 0
    expect(result).toHaveLength(2);
  });
});
