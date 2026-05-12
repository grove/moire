import type { PredicateSummary, FacetDefinition, PredicateCardinality } from "./types";
import type { PredicateRole } from "./vocabulary-registry";
import { lookupPredicate } from "./vocabulary-registry";
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
    role: p.role,
  };
}

// ── v0.1.0 annotation helpers ──────────────────────────────────

/**
 * Derive cardinality from the ratio of objectCount to subjectCount.
 * A ratio close to 1 means each subject typically has one value.
 */
function computeCardinality(p: PredicateSummary): PredicateCardinality {
  if (p.subjectCount === 0) return "single";
  const ratio = p.objectCount / p.subjectCount;
  if (ratio <= 1.1) return "single";
  if (ratio <= 1.5) return "usually-single";
  if (ratio <= 5.0) return "multi";
  return "highly-multi";
}

/**
 * Compute a 0–100 usefulness score that drives ordering in the Jump strip and
 * Facet panel.
 *
 * Design goals:
 *  - Relational/classifying predicates surface first (they enable navigation).
 *  - Labelling/descriptive predicates are less important for traversal.
 *  - Structural predicates are penalised heavily.
 *  - Sparse or uniform-value predicates get a penalty.
 *  - High coverage (many subjects) is a positive signal.
 */
function computeUsefulness(
  p: PredicateSummary,
  role: PredicateRole,
  cardinality: PredicateCardinality,
  maxSubjectCount: number,
): number {
  let score = 50;

  // Role bonus / penalty
  switch (role) {
    case "relational":   score += 20; break;
    case "classifying":  score += 15; break;
    case "descriptive":  score += 5;  break;
    case "labelling":    score += 3;  break;
    case "temporal":     score += 3;  break;
    case "numeric":      score += 2;  break;
    case "media":        score += 0;  break;
    case "provenance":   score -= 5;  break;
    case "structural":   score -= 35; break;
  }

  // Coverage bonus (how many subjects actually have this predicate)
  if (maxSubjectCount > 0) {
    const coverage = p.subjectCount / maxSubjectCount;
    if (coverage >= 0.5) score += 10;
    else if (coverage >= 0.2) score += 5;
  }

  // Cardinality modifiers for navigation-oriented roles
  if (role === "relational") {
    if (cardinality === "multi" || cardinality === "highly-multi") score += 8;
    else if (cardinality === "single") score -= 5; // likely not a good traversal
  }

  // Sparsity penalty
  if (p.objectCount < 3) score -= 15;

  // Uniform-value penalty (single object value used everywhere)
  if (p.objectCount === 1) score -= 10;

  return Math.max(0, Math.min(100, score));
}

export function generateFacets(predicates: PredicateSummary[]): FacetDefinition[] {
  const candidates = predicates.filter(isFacetCandidate);

  // Sort: classifying first, relational second, then rest by usefulness
  const roleOrder: Record<PredicateRole, number> = {
    classifying: 0,
    relational:  1,
    labelling:   2,
    descriptive: 3,
    temporal:    4,
    numeric:     5,
    media:       6,
    provenance:  7,
    structural:  8,
  };

  candidates.sort((a, b) => {
    const ra = roleOrder[a.role ?? "descriptive"] ?? 9;
    const rb = roleOrder[b.role ?? "descriptive"] ?? 9;
    if (ra !== rb) return ra - rb;
    return (b.usefulness ?? 0) - (a.usefulness ?? 0);
  });

  return candidates.map(predicateToFacet);
}

export function annotatePredicates(
  predicates: PredicateSummary[],
): PredicateSummary[] {
  // Compute the maximum subject count across all predicates (used for coverage)
  const maxSubjectCount = predicates.reduce(
    (max, p) => Math.max(max, p.subjectCount),
    0,
  );

  // First pass: determine structural + role
  const withRole: PredicateSummary[] = predicates.map((p) => {
    const isStructural = STRUCTURAL_PREDICATES.has(p.iri);
    const entry = lookupPredicate(p.iri);
    // If explicitly structural in the registry or in the hardcoded set, mark as structural
    const role: PredicateRole = isStructural ? "structural" : entry.role;
    const cardinality = computeCardinality(p);
    return {
      ...p,
      isStructural,
      role,
      cardinality,
      vocabularyBadge: entry.badge,
      isFacetCandidate: false,     // recalculated in second pass
      isNavigationCandidate:
        p.valueKind === "iri" &&
        p.objectCount >= 2 &&
        !isStructural,
    };
  });

  // Second pass: compute usefulness (needs role + cardinality already set)
  return withRole.map((p) => ({
    ...p,
    usefulness: computeUsefulness(p, p.role!, p.cardinality!, maxSubjectCount),
    isFacetCandidate: isFacetCandidate(p),
  }));
}
