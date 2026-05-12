/**
 * v0.4.0 — Predicate Metadata from the Graph
 *
 * Builds and parses a batched SPARQL query that enriches PredicateSummary
 * objects with graph-sourced metadata:
 *   - rdfs:label / skos:prefLabel → rdfsLabel
 *   - skos:definition / rdfs:comment → skosDefinition
 *   - rdfs:domain / rdfs:range + optional labels
 *   - owl:inverseOf (bidirectional) + optional inverse label
 *   - OWL property characteristics (Functional, Symmetric, Transitive, etc.)
 *
 * Design goals:
 *   - Single round-trip for all discovered predicates (VALUES clause).
 *   - Graceful: callers wrap in try/catch; original summaries are returned unchanged on error.
 *   - Batches limited to 500 IRIs to avoid unbounded VALUES clauses.
 */

import type { PredicateSummary } from "./types";

// ── IRI validation (mirrors sparql.ts, kept local to avoid circular deps) ──

function isValidIRI(iri: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+\-.]*:[^\s<>"{}|\\^`]+$/.test(iri);
}

// ── Query builder ────────────────────────────────────────────────────────────

const OWL_CHARACTERISTICS = [
  "http://www.w3.org/2002/07/owl#FunctionalProperty",
  "http://www.w3.org/2002/07/owl#InverseFunctionalProperty",
  "http://www.w3.org/2002/07/owl#SymmetricProperty",
  "http://www.w3.org/2002/07/owl#TransitiveProperty",
  "http://www.w3.org/2002/07/owl#ReflexiveProperty",
] as const;

/** Short display names for OWL characteristics, keyed by local name. */
export const OWL_CHARACTERISTIC_LABELS: Record<string, string> = {
  FunctionalProperty: "Functional",
  InverseFunctionalProperty: "InverseFunctional",
  SymmetricProperty: "Symmetric",
  TransitiveProperty: "Transitive",
  ReflexiveProperty: "Reflexive",
};

/** Maximum number of predicate IRIs per VALUES clause. */
const BATCH_SIZE = 500;

/**
 * Build a batched SPARQL SELECT query for predicate metadata.
 *
 * @param predicateIRIs - IRIs of predicates discovered during introspection.
 * @param graphIRI      - Named graph IRI, or null for the default graph.
 *                        The query always tries the data graph first; ontology
 *                        metadata often lives outside it so we use OPTIONAL
 *                        triples without a graph restriction.
 */
export function buildPredicateMetadataQuery(
  predicateIRIs: string[],
  _graphIRI: string | null,
): string {
  const validIRIs = predicateIRIs.filter(isValidIRI);
  if (validIRIs.length === 0) return "";

  const valuesList = validIRIs.map((iri) => `<${iri}>`).join(" ");
  const characteristicsIn = OWL_CHARACTERISTICS.map((c) => `<${c}>`).join(", ");

  return `
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX schema: <https://schema.org/>

SELECT ?predicate ?label ?prefLabel ?comment ?definition
       ?domain ?domainLabel ?range ?rangeLabel
       ?inverse ?inverseLabel ?characteristic
WHERE {
  VALUES ?predicate { ${valuesList} }

  OPTIONAL { ?predicate rdfs:label ?label }
  OPTIONAL { ?predicate skos:prefLabel ?prefLabel }
  OPTIONAL { ?predicate rdfs:comment ?comment }
  OPTIONAL {
    { ?predicate skos:definition ?definition }
    UNION
    { ?predicate dcterms:description ?definition }
  }

  OPTIONAL {
    ?predicate rdfs:domain ?domain .
    OPTIONAL { ?domain rdfs:label ?domainLabel }
    OPTIONAL { ?domain skos:prefLabel ?domainLabel }
  }

  OPTIONAL {
    ?predicate rdfs:range ?range .
    OPTIONAL { ?range rdfs:label ?rangeLabel }
    OPTIONAL { ?range skos:prefLabel ?rangeLabel }
  }

  OPTIONAL {
    { ?predicate owl:inverseOf ?inverse }
    UNION
    { ?inverse owl:inverseOf ?predicate }
    OPTIONAL { ?inverse rdfs:label ?inverseLabel }
    OPTIONAL { ?inverse skos:prefLabel ?inverseLabel }
  }

  OPTIONAL {
    ?predicate rdf:type ?characteristic .
    FILTER(?characteristic IN (${characteristicsIn}))
  }
}
`.trim();
}

// ── Response types ───────────────────────────────────────────────────────────

export interface SparqlTerm {
  type: string;
  value: string;
  "xml:lang"?: string;
  datatype?: string;
}

export type MetadataBinding = Record<string, SparqlTerm | undefined>;

// ── Result parser ────────────────────────────────────────────────────────────

/**
 * Merge SPARQL metadata bindings into an array of PredicateSummary objects.
 *
 * Multiple rows may exist for the same predicate (one per characteristic or
 * per language variant). We aggregate them and prefer the first non-empty
 * string for scalar fields.
 */
export function applyPredicateMetadata(
  predicates: PredicateSummary[],
  bindings: MetadataBinding[],
): PredicateSummary[] {
  if (bindings.length === 0) return predicates;

  // Aggregate by predicate IRI
  const meta = new Map<
    string,
    {
      label?: string;
      definition?: string;
      domain?: string;
      domainLabel?: string;
      range?: string;
      rangeLabel?: string;
      inverseIRI?: string;
      inverseLabel?: string;
      characteristics: Set<string>;
    }
  >();

  for (const row of bindings) {
    const iri = row.predicate?.value;
    if (!iri) continue;

    if (!meta.has(iri)) {
      meta.set(iri, { characteristics: new Set() });
    }
    const m = meta.get(iri)!;

    // Scalar fields — keep first non-empty value
    const label = row.prefLabel?.value || row.label?.value;
    if (label && !m.label) m.label = label;

    const def = row.definition?.value || row.comment?.value;
    if (def && !m.definition) m.definition = def;

    if (row.domain?.value && !m.domain) {
      m.domain = row.domain.value;
      m.domainLabel = row.domainLabel?.value;
    }
    if (row.range?.value && !m.range) {
      m.range = row.range.value;
      m.rangeLabel = row.rangeLabel?.value;
    }
    if (row.inverse?.value && !m.inverseIRI) {
      m.inverseIRI = row.inverse.value;
      m.inverseLabel = row.inverseLabel?.value;
    }

    // Characteristics — accumulate all
    if (row.characteristic?.value) {
      const localName = row.characteristic.value.split(/[#/]/).pop() ?? "";
      const display = OWL_CHARACTERISTIC_LABELS[localName];
      if (display) m.characteristics.add(display);
    }
  }

  return predicates.map((p) => {
    const m = meta.get(p.iri);
    if (!m) return p;
    return {
      ...p,
      rdfsLabel: m.label,
      skosDefinition: m.definition,
      domain: m.domain,
      domainLabel: m.domainLabel,
      range: m.range,
      rangeLabel: m.rangeLabel,
      inverseIRI: m.inverseIRI,
      inverseLabel: m.inverseLabel,
      owlCharacteristics: m.characteristics.size > 0
        ? Array.from(m.characteristics).sort()
        : undefined,
    };
  });
}

/**
 * Split an array into chunks of at most `size` items.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export { BATCH_SIZE };
