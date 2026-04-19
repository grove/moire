import type { PredicateSummary, FacetDefinition } from "./types";
import { shortIRI } from "./utils";

const STRUCTURAL_PREDICATES = new Set([
  "http://www.w3.org/2002/07/owl#sameAs",
  "http://www.w3.org/2002/07/owl#equivalentClass",
  "http://www.w3.org/2002/07/owl#equivalentProperty",
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  "http://www.w3.org/2000/01/rdf-schema#isDefinedBy",
  "http://www.w3.org/2000/01/rdf-schema#seeAlso",
  "http://www.w3.org/2004/02/skos/core#exactMatch",
  "http://www.w3.org/2004/02/skos/core#closeMatch",
  "http://www.w3.org/ns/prov#wasDerivedFrom",
  "http://www.w3.org/ns/prov#wasGeneratedBy",
]);

function isFacetCandidate(p: PredicateSummary): boolean {
  if (p.isStructural) return false;
  if (p.valueKind === "iri" && p.objectCount >= 2 && p.objectCount <= 500) return true;
  if (p.valueKind === "literal" && p.objectCount >= 2 && p.objectCount <= 100) return true;
  if (p.valueKind === "date") return true;
  if (p.valueKind === "numeric" && p.objectCount <= 200) return true;
  return false;
}

function predicateToFacet(p: PredicateSummary): FacetDefinition {
  return {
    id: p.iri,
    label: p.label || shortIRI(p.iri),
    sparqlPredicate: p.iri,
    valueType:
      p.valueKind === "date" ? "date-range" :
      p.valueKind === "numeric" ? "numeric-range" :
      p.valueKind === "iri" ? "uri" : "literal",
    multiSelect: p.valueKind !== "date" && p.valueKind !== "numeric",
  };
}

export function generateFacets(predicates: PredicateSummary[]): FacetDefinition[] {
  return predicates
    .filter(isFacetCandidate)
    .map(predicateToFacet);
}

export function annotatePredicates(predicates: PredicateSummary[]): PredicateSummary[] {
  return predicates.map((p) => ({
    ...p,
    isStructural: STRUCTURAL_PREDICATES.has(p.iri),
    isFacetCandidate: false, // recalculated below
    isNavigationCandidate:
      p.valueKind === "iri" &&
      p.objectCount >= 2 &&
      !STRUCTURAL_PREDICATES.has(p.iri),
  })).map((p) => ({
    ...p,
    isFacetCandidate: isFacetCandidate(p),
  }));
}
