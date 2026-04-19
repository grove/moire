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

export interface GraphSummary {
  iri: string;
  label: string;
  tripleCount: number;
  subjectCount: number;
  predicates: PredicateSummary[];
  classes: ClassSummary[];
  labelPredicate: string;
  introspectedAt: Date;
}

export interface PredicateSummary {
  iri: string;
  label: string;
  subjectCount: number;
  objectCount: number;
  valueKind: "iri" | "literal" | "date" | "numeric" | "bnode";
  isFacetCandidate: boolean;
  isNavigationCandidate: boolean;
  isStructural: boolean;
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

export interface SearchResult {
  iri: string;
  label: string;
  type?: string;
  typeLabel?: string;
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
