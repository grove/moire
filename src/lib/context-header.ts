import type { LensFrame } from "./types";
import { shortIRI, pluralise } from "./utils";
import { getInverseLabel, lookupPredicate } from "./vocabulary-registry";

/** Maximum character length for a generated context header. */
const MAX_HEADER_LENGTH = 100;

function truncate(s: string): string {
  return s.length <= MAX_HEADER_LENGTH ? s : s.slice(0, MAX_HEADER_LENGTH - 1) + "…";
}

export interface LabelCache {
  graph: (iri: string | null) => string;
  entity: (iri: string) => string | undefined;
  class_: (iri: string) => string;
  /**
   * Returns the best available display label for a predicate IRI.
   * Label precedence: overlay > SHACL shape name > SKOS prefLabel > RDFS label >
   * vocabulary registry name > derived short IRI.
   */
  predicate: (iri: string) => string;
  value: (iri: string) => string | undefined;
  /**
   * Optional: returns an explicit inverse label for a predicate IRI (higher
   * priority than the vocabulary registry). Use this to supply overlay or
   * graph-sourced inverse labels.
   */
  predicateInverse?: (iri: string) => string | undefined;
}

export function buildContextHeader(
  stack: LensFrame[],
  pointer: number,
  labels: LabelCache,
): string {
  const frame = stack[pointer];

  if (frame.context === "graphs") return "";
  if (frame.context === "types") return `Types in ${labels.graph(frame.graphIRI)}`;
  if (frame.context === "entity") return labels.entity(frame.focusIRI) ?? shortIRI(frame.focusIRI);
  if (frame.context === "relationships") {
    const parent = pointer > 0 ? buildContextHeader(stack, pointer - 1, labels) : "Current set";
    return `Relationships on ${parent}`;
  }

  // Set context
  let base = frame.focusClass
    ? pluralise(labels.class_(frame.focusClass))
    : "Resources";

  const facetPhrases = Object.entries(frame.facets)
    .filter(([dim]) => dim !== "rdf:type")
    .flatMap(([, vals]) => vals.map((v) => labels.value(v) ?? shortIRI(v)));

  if (facetPhrases.length) {
    base = `${facetPhrases.join(", ")} ${base}`;
  }

  if (frame.navigationPredicate && pointer > 0) {
    const iri = frame.navigationPredicate;
    const parentHeader = buildContextHeader(stack, pointer - 1, labels);

    // 1. Explicit inverse label from caller (overlay / graph metadata)
    const explicitInverse = labels.predicateInverse?.(iri);
    // 2. Vocabulary registry inverse label
    const registryInverse = getInverseLabel(iri);
    // 3. Registry name (better than shortIRI for standard predicates)
    const registryName = lookupPredicate(iri).name;

    const inverseLabel = explicitInverse ?? registryInverse;

    if (inverseLabel) {
      // e.g. "Broader concepts for Climate Concepts"
      return truncate(`${inverseLabel} for ${parentHeader}`);
    }

    if (frame.focusClass) {
      // e.g. "Institutions for SE Researchers"
      const targetPlural = pluralise(labels.class_(frame.focusClass));
      return truncate(`${targetPlural} for ${parentHeader}`);
    }

    // Fallback: use registry name if better than shortIRI, else predicate label
    const predLabel = labels.predicate(iri) !== shortIRI(iri)
      ? labels.predicate(iri)
      : (registryName ?? labels.predicate(iri));
    return `${predLabel} of ${parentHeader}`;
  }

  return base;
}
