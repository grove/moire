// ── Endpoint configuration ──────────────────────────────────────

export interface EndpointConfig {
  id: string;
  label: string;
  sparqlUrl: string;
  updateUrl?: string;
  auth?: {
    type: "basic" | "bearer";
    credentials: string;
  };
  defaultGraph?: string;
  capabilities?: EndpointCapabilities;
  labelPredicate?: string;
}

export interface EndpointCapabilities {
  isPgRipple: boolean;
  sparql11Query: boolean;
  sparql11Update: boolean;
  sparqlProtocol: boolean;
  contentFormats: string[];
  fullTextSearch: boolean;
  federation: boolean;
  vectorSearch: boolean;
  datalogReasoning: boolean;
  shaclValidation: boolean;
  jsonldFraming: boolean;
  graphStoreProtocol: boolean;
  ragRetrieval: boolean;
}

// ── Introspection types ────────────────────────────────────────

// ── VoID dataset metadata (v0.8.0) ────────────────────────────

/** Dataset-level metadata collected from VoID vocabulary annotations. */
export interface VoidDataset {
  /** Dataset IRI (the subject of void:Dataset triples). */
  iri?: string;
  /** dcterms:title */
  title?: string;
  /** dcterms:description */
  description?: string;
  /** dcterms:creator */
  creator?: string;
  /** dcterms:publisher */
  publisher?: string;
  /** dcterms:license */
  license?: string;
  /** dcterms:created */
  created?: string;
  /** dcterms:modified */
  modified?: string;
  /** void:triples (total triple count declared in VoID) */
  triples?: number;
  /** void:entities */
  entities?: number;
  /** void:classes */
  classes?: number;
  /** void:properties */
  properties?: number;
  /** void:vocabulary IRIs (vocabularies used by the dataset) */
  vocabularies?: string[];
  /** void:rootResource IRIs */
  rootResources?: string[];
  /** void:exampleResource IRIs */
  exampleResources?: string[];
}

export interface GraphSummary {
  iri: string;
  label: string;
  tripleCount: number;
  subjectCount: number;
  predicates: PredicateSummary[];
  classes: ClassSummary[];
  labelPredicate: string;
  introspectedAt: Date;
  /** v0.8.0 — VoID dataset metadata (present when the graph publishes VoID). */
  voidMetadata?: VoidDataset;
}

export type PredicateCardinality =
  | "single"
  | "usually-single"
  | "multi"
  | "highly-multi";

export interface PredicateSummary {
  iri: string;
  label: string;
  subjectCount: number;
  objectCount: number;
  valueKind: "iri" | "literal" | "date" | "numeric" | "bnode";
  isFacetCandidate: boolean;
  isNavigationCandidate: boolean;
  isStructural: boolean;
  // v0.1.0 annotations
  role?: import("./vocabulary-registry").PredicateRole;
  cardinality?: PredicateCardinality;
  vocabularyBadge?: string;
  usefulness?: number;
  // v0.4.0 — graph-sourced metadata
  rdfsLabel?: string;
  skosDefinition?: string;
  inverseIRI?: string;
  inverseLabel?: string;
  domain?: string;
  domainLabel?: string;
  range?: string;
  rangeLabel?: string;
  owlCharacteristics?: string[];
  // v0.7.0 — SHACL-sourced label and description (class-context-specific)
  shaclName?: string;
  shaclDescription?: string;
}

export interface ClassSummary {
  iri: string;
  label: string;
  instanceCount: number;
  superClass?: string;
}

// ── Navigation types ───────────────────────────────────────────

export type NavigationContext =
  | "graphs"
  | "types"
  | "relationships"
  | "set"
  | "entity";

export interface LensFrame {
  endpointId: string;
  graphIRI: string | null;
  context: NavigationContext;
  focusIRI: string;
  focusClass?: string;
  navigationPredicate?: string;
  activeLayer: number;
  facets: Record<string, string[]>;
}

// ── Facet types ────────────────────────────────────────────────

export interface FacetDefinition {
  id: string;
  label: string;
  sparqlPredicate: string;
  valueType: "uri" | "literal" | "date-range" | "numeric-range";
  multiSelect: boolean;
  role?: import("./vocabulary-registry").PredicateRole;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  available: boolean;
}

// ── Entity types ───────────────────────────────────────────────

export interface EntityNode {
  iri: string;
  label: string;
  type?: string;
  typeLabel?: string;
  abstract?: string;
}

export interface PredicateValue {
  predicate: string;
  predLabel: string;
  value: string;
  valueLabel: string;
  valueIsIRI: boolean;
}

// ── Resource annotations (v0.6.0) ─────────────────────────────

export interface ResourceAnnotation {
  /** Alternative labels / aliases (skos:altLabel). */
  aliases?: string[];
  /** Best description: skos:definition → rdfs:comment → dcterms:abstract → schema:description. */
  description?: string;
  /** Type hierarchy from direct type up through rdfs:subClassOf. */
  typeHierarchy?: Array<{ iri: string; label: string }>;
  /** Detected date values. */
  temporalInfo?: {
    created?: string;
    modified?: string;
    generatedAt?: string;
  };
  /** Best source / provenance URL. */
  sourceUrl?: string;
  /** Media links (image, page, document). */
  media?: Array<{ url: string; kind: "image" | "page" | "document" }>;
}

export interface SearchResult {
  iri: string;
  label: string;
  type?: string;
  typeLabel?: string;
}

// ── SHACL types (v0.7.0) ──────────────────────────────────────

/**
 * One property shape from a SHACL NodeShape targeting a class.
 * Collected by `buildShaclShapeQuery` / `parseShaclShapes`.
 */
export interface ShaclPropertyShape {
  /** sh:path — the predicate IRI this shape constrains. */
  path: string;
  /** sh:name — human-readable label for this property in this class context. */
  name?: string;
  /** sh:description — description for this property in this class context. */
  description?: string;
  /** sh:order — display sort order. */
  order?: number;
  /** sh:group — property group IRI. */
  group?: string;
  /** sh:datatype — expected XSD datatype IRI. */
  datatype?: string;
  /** sh:class — expected class IRI for IRI-valued properties. */
  class?: string;
  /** sh:minCount — minimum required values (0 = optional). */
  minCount?: number;
  /** sh:maxCount — maximum allowed values. */
  maxCount?: number;
}

/**
 * A SHACL data quality violation derived from shapes and entity predicates.
 */
export interface ShaclViolation {
  /** The predicate IRI that has the violation. */
  path: string;
  /** Human-readable violation description. */
  message: string;
  /** Violation severity level. */
  severity: "Info" | "Warning" | "Violation";
}

// ── Detail levels ──────────────────────────────────────────────

export type DetailLevel = "label" | "headline" | "summary" | "full";

export const LAYER_DETAIL: Record<number, DetailLevel> = {
  [-2]: "label",
  [-1]: "headline",
  0: "full",
  1: "summary",
  2: "headline",
  3: "label",
};

export const LAYER_DESCRIPTIONS: Record<number, string> = {
  [-2]: "Two-hop ancestors",
  [-1]: "Direct ancestors",
  0: "Focus entity",
  1: "Direct neighbours",
  2: "Two hops out",
  3: "Three hops out",
};

// ── Typography system ──────────────────────────────────────────

export const DETAIL_TYPOGRAPHY = {
  full: {
    title: "text-2xl font-bold tracking-tight",
    meta: "text-sm text-muted-foreground",
    body: "text-base leading-relaxed",
    badge: "text-xs font-medium",
  },
  summary: {
    title: "text-base font-semibold",
    meta: "text-xs text-muted-foreground",
    body: "text-sm line-clamp-2",
    badge: "text-[10px]",
  },
  headline: {
    title: "text-sm font-medium",
    meta: "hidden",
    body: "hidden",
    badge: "text-[10px]",
  },
  label: {
    title: "text-xs text-muted-foreground font-normal",
    meta: "hidden",
    body: "hidden",
    badge: "hidden",
  },
};
