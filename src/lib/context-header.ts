import type { LensFrame } from "./types";
import { shortIRI, pluralise } from "./utils";

export interface LabelCache {
  graph: (iri: string | null) => string;
  entity: (iri: string) => string | undefined;
  class_: (iri: string) => string;
  predicate: (iri: string) => string;
  value: (iri: string) => string | undefined;
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
    const predLabel = labels.predicate(frame.navigationPredicate);
    const parentHeader = buildContextHeader(stack, pointer - 1, labels);
    return `${predLabel} of ${parentHeader}`;
  }

  return base;
}
