"use server";

import type {
  EndpointConfig,
  GraphSummary,
  ClassSummary,
  PredicateSummary,
  EntityNode,
  PredicateValue,
  SearchResult,
  FacetDefinition,
  FacetValue,
} from "@/lib/types";
import {
  buildListGraphsQuery,
  buildDefaultGraphCountQuery,
  buildSampleGraphQuery,
  buildLabelHeuristicQuery,
  buildClassHierarchyQuery,
  buildLayerQuery,
  buildPredicateQuery,
  buildSearchQuery,
  buildFacetCountQuery,
  buildClassInstancesQuery,
  buildSetTraversalQuery,
  buildPredicateObjectsQuery,
  buildRelationshipsQuery,
} from "@/lib/sparql";
import { annotatePredicates } from "@/lib/facet-generator";
import { shortIRI } from "@/lib/utils";
import type { EndpointCapabilities } from "@/lib/types";

// ── Endpoint setup (capability detection + introspection) ──────

export interface SetupEndpointResult {
  capabilities: EndpointCapabilities;
  summaries: GraphSummary[];
  labelPredicate: string;
}

export async function setupEndpoint(
  sparqlUrl: string,
  auth?: EndpointConfig["auth"],
): Promise<SetupEndpointResult> {
  // Fast reachability probe — fail early before the 30s introspection timeout
  const headers: Record<string, string> = { Accept: "application/sparql-results+json" };
  if (auth?.type === "basic") {
    headers["Authorization"] = `Basic ${Buffer.from(auth.credentials).toString("base64")}`;
  } else if (auth?.type === "bearer") {
    headers["Authorization"] = `Bearer ${auth.credentials}`;
  }
  try {
    const probeUrl = `${sparqlUrl}?query=${encodeURIComponent("ASK {}")}`;
    const res = await fetch(probeUrl, { headers, signal: AbortSignal.timeout(5000) });
    // Any HTTP response (even 4xx) means the server is reachable
    if (!res.ok && res.status >= 500) {
      throw new Error(`Endpoint returned HTTP ${res.status}`);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error("Cannot reach endpoint: connection timed out.");
    }
    if (err instanceof TypeError) {
      throw new Error("Cannot reach endpoint: connection refused.");
    }
    throw err;
  }

  // Detect pg-ripple capability server-side (avoids CORS + Buffer issues on client)
  const capabilities = await detectCapabilitiesServerSide(sparqlUrl, auth);

  const config: EndpointConfig = { id: "", label: "", sparqlUrl, auth, capabilities };
  const summaries = await introspectEndpoint(config);
  const labelPredicate =
    summaries[0]?.labelPredicate ?? "http://www.w3.org/2000/01/rdf-schema#label";

  return { capabilities, summaries, labelPredicate };
}

async function detectCapabilitiesServerSide(
  sparqlUrl: string,
  auth?: EndpointConfig["auth"],
): Promise<EndpointCapabilities> {
  const caps: EndpointCapabilities = {
    isPgRipple: false,
    sparql11Query: true,
    sparql11Update: false,
    sparqlProtocol: true,
    contentFormats: ["application/sparql-results+json"],
    fullTextSearch: false,
    federation: false,
    vectorSearch: false,
    datalogReasoning: false,
    shaclValidation: false,
    jsonldFraming: false,
    graphStoreProtocol: false,
    ragRetrieval: false,
  };

  try {
    const bindings = await executeSparql(
      sparqlUrl,
      `ASK { BIND(<http://pg-ripple.io/fn/similar> AS ?fn) FILTER(isIRI(?fn)) }`,
      auth,
    );
    // ASK returns boolean in results
    caps.isPgRipple = Array.isArray(bindings) ? false : false; // handled below
  } catch {
    // not pg-ripple
  }

  // Try ASK directly via raw fetch
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/sparql-query",
      Accept: "application/sparql-results+json",
    };
    if (auth?.type === "basic") {
      headers["Authorization"] = `Basic ${Buffer.from(auth.credentials).toString("base64")}`;
    } else if (auth?.type === "bearer") {
      headers["Authorization"] = `Bearer ${auth.credentials}`;
    }
    const res = await fetch(sparqlUrl, {
      method: "POST",
      headers,
      body: `ASK { BIND(<http://pg-ripple.io/fn/similar> AS ?fn) FILTER(isIRI(?fn)) }`,
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      caps.isPgRipple = json?.boolean === true;
    }
  } catch {
    // not pg-ripple
  }

  if (caps.isPgRipple) {
    caps.sparql11Update = true;
    caps.federation = true;
    caps.fullTextSearch = true;
    caps.vectorSearch = true;
    caps.datalogReasoning = true;
    caps.shaclValidation = true;
    caps.jsonldFraming = true;
    caps.graphStoreProtocol = true;
  }

  return caps;
}

// ── SPARQL execution helper ────────────────────────────────────

interface SparqlBinding {
  [key: string]: { type: string; value: string; datatype?: string };
}

// Some non-standard endpoints serialize SPARQL result terms using N-Triples-style syntax
// instead of proper SPARQL Results JSON:
//   - IRIs come as type:"literal" with value "<http://...>"
//   - Plain literals come as type:"literal" with value '"text"' (quoted) or '"text"@lang'
// Normalize these to standard SPARQL binding objects.
function normalizeTerm(
  term: { type: string; value: string; datatype?: string },
): { type: string; value: string; datatype?: string; "xml:lang"?: string } {
  const v = term.value;
  if (term.type === "literal") {
    // IRI wrapped in angle brackets: <http://...>
    if (/^<https?:\/\/[^\s<>"{}|\\^`]+>$/.test(v)) {
      return { type: "uri", value: v.slice(1, -1) };
    }
    // Quoted plain literal: "text" (no lang or datatype)
    if (v.startsWith('"') && v.endsWith('"') && v.length >= 2) {
      // Make sure it's not a lang-tagged or datatyped variant
      const inner = v.slice(1, -1);
      if (!inner.includes('"')) {
        return { ...term, value: inner };
      }
    }
    // Quoted lang-tagged literal: "text"@lang
    const langMatch = /^"(.*)"@([a-zA-Z][-a-zA-Z0-9]*)$/.exec(v);
    if (langMatch) {
      return { type: "literal", value: langMatch[1], "xml:lang": langMatch[2] };
    }
  }
  return term;
}

function normalizeBindings(bindings: SparqlBinding[]): SparqlBinding[] {
  return bindings.map((binding) => {
    const normalized: SparqlBinding = {};
    for (const [key, term] of Object.entries(binding)) {
      normalized[key] = normalizeTerm(term);
    }
    return normalized;
  });
}

async function executeSparql(
  sparqlUrl: string,
  query: string,
  auth?: EndpointConfig["auth"],
): Promise<SparqlBinding[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/sparql-query",
    Accept: "application/sparql-results+json",
  };

  if (auth) {
    if (auth.type === "basic") {
      headers["Authorization"] = `Basic ${Buffer.from(auth.credentials).toString("base64")}`;
    } else {
      headers["Authorization"] = `Bearer ${auth.credentials}`;
    }
  }

  const response = await fetch(sparqlUrl, {
    method: "POST",
    headers,
    body: query,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`SPARQL query failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const json = await response.json();
  const bindings: SparqlBinding[] = json.results?.bindings ?? [];
  return normalizeBindings(bindings);
}

// ── Introspection ──────────────────────────────────────────────

export async function introspectEndpoint(
  config: EndpointConfig,
): Promise<GraphSummary[]> {
  // 1. List named graphs
  let graphEntries: Array<{ iri: string; tripleCount: number }> = [];

  try {
    const bindings = await executeSparql(
      config.sparqlUrl,
      buildListGraphsQuery(),
      config.auth,
    );
    graphEntries = bindings.map((b) => ({
      iri: b.graph.value,
      tripleCount: parseInt(b.tripleCount.value, 10),
    }));
  } catch {
    // fallback: default graph only
  }

  if (graphEntries.length === 0) {
    try {
      const bindings = await executeSparql(
        config.sparqlUrl,
        buildDefaultGraphCountQuery(),
        config.auth,
      );
      const count = parseInt(bindings[0]?.tripleCount?.value ?? "0", 10);
      graphEntries = [{ iri: "default", tripleCount: count }];
    } catch {
      graphEntries = [{ iri: "default", tripleCount: 0 }];
    }
  }

  // 2. Introspect each graph
  const summaries = await Promise.all(
    graphEntries.map((g) => introspectGraph(config, g.iri, g.tripleCount)),
  );

  return summaries;
}

async function introspectGraph(
  config: EndpointConfig,
  graphIRI: string,
  tripleCount: number,
): Promise<GraphSummary> {
  const giri = graphIRI === "default" ? null : graphIRI;

  // Run introspection queries in parallel
  const [predicateBindings, labelBindings, classBindings] = await Promise.all([
    executeSparql(config.sparqlUrl, buildSampleGraphQuery(giri), config.auth).catch(() => []),
    executeSparql(config.sparqlUrl, buildLabelHeuristicQuery(giri), config.auth).catch(() => []),
    executeSparql(config.sparqlUrl, buildClassHierarchyQuery(giri), config.auth).catch(() => []),
  ]);

  // Parse predicates
  const rawPredicates: PredicateSummary[] = predicateBindings.map((b) => ({
    iri: b.predicate.value,
    label: shortIRI(b.predicate.value),
    subjectCount: parseInt(b.subjectCount?.value ?? "0", 10),
    objectCount: parseInt(b.objectCount?.value ?? "0", 10),
    valueKind: (b.valueKind?.value ?? "literal") as PredicateSummary["valueKind"],
    isFacetCandidate: false,
    isNavigationCandidate: false,
    isStructural: false,
  }));
  const predicates = annotatePredicates(rawPredicates);

  // Parse label heuristic
  const labelPredicate = labelBindings[0]?.labelPredicate?.value
    ?? "http://www.w3.org/2000/01/rdf-schema#label";

  // Parse class hierarchy
  const classes: ClassSummary[] = classBindings.map((b) => ({
    iri: b.class.value,
    label: b.classLabel?.value ?? shortIRI(b.class.value),
    instanceCount: parseInt(b.instanceCount?.value ?? "0", 10),
    superClass: b.superClass?.value,
  }));

  // Compute subject count
  const subjectCount = predicates.reduce((max, p) => Math.max(max, p.subjectCount), 0);

  return {
    iri: graphIRI,
    label: shortIRI(graphIRI),
    tripleCount,
    subjectCount,
    predicates,
    classes,
    labelPredicate,
    introspectedAt: new Date(),
  };
}

// ── Entity fetching ────────────────────────────────────────────

export async function fetchEntitySet(
  endpointUrl: string,
  focusIRI: string,
  graphIRI: string | null,
  layer: number,
  facets: Record<string, string[]>,
  labelPredicate: string = "http://www.w3.org/2000/01/rdf-schema#label",
  navigationPredicate?: string,
  sourceIRIs?: string[],
  auth?: EndpointConfig["auth"],
): Promise<EntityNode[]> {
  let query: string;

  if (navigationPredicate && sourceIRIs?.length) {
    query = buildSetTraversalQuery({
      sourceIRIs,
      predicateIRI: navigationPredicate,
      graphIRI,
      labelPredicate,
    });
  } else if (navigationPredicate) {
    // Graph-wide traversal: all IRI objects of this predicate (from RelationshipsBrowser)
    query = buildPredicateObjectsQuery({ predicateIRI: navigationPredicate, graphIRI, labelPredicate });
  } else if (facets["rdf:type"]?.length && !focusIRI) {
    query = buildClassInstancesQuery(
      facets["rdf:type"][0],
      graphIRI,
      labelPredicate,
      facets,
    );
  } else if (focusIRI) {
    query = buildLayerQuery({ focusIRI, graphIRI, layer, facets, labelPredicate });
  } else {
    return [];
  }

  try {
    const bindings = await executeSparql(endpointUrl, query, auth);
    return bindingsToEntities(bindings);
  } catch (error) {
    console.error("fetchEntitySet error:", error, "Query was:", query);
    throw error;
  }
}

function bindingsToEntities(bindings: SparqlBinding[]): EntityNode[] {
  const seen = new Map<string, EntityNode>();

  for (const b of bindings) {
    const iri = b.entity?.value;
    if (!iri) continue;

    if (!seen.has(iri)) {
      seen.set(iri, {
        iri,
        label: b.label?.value ?? shortIRI(iri),
        type: b.type?.value,
        abstract: b.abstract?.value,
      });
    }
  }

  return Array.from(seen.values());
}

// ── Entity predicates ──────────────────────────────────────────

export async function fetchEntityPredicates(
  endpointUrl: string,
  entityIRI: string,
  graphIRI: string | null,
  auth?: EndpointConfig["auth"],
): Promise<PredicateValue[]> {
  const query = buildPredicateQuery(entityIRI, graphIRI);
  const bindings = await executeSparql(endpointUrl, query, auth);

  return bindings.map((b) => ({
    predicate: b.predicate.value,
    predLabel: b.predLabel?.value ?? shortIRI(b.predicate.value),
    value: b.value.value,
    valueLabel: b.valueLabel?.value ?? "",
    valueIsIRI: b.value.type === "uri",
  }));
}

// ── Facet counts ───────────────────────────────────────────────

export async function fetchFacetCounts(
  endpointUrl: string,
  focusIRI: string,
  graphIRI: string | null,
  layer: number,
  activeFacets: Record<string, string[]>,
  facetDefs: FacetDefinition[],
  auth?: EndpointConfig["auth"],
): Promise<Record<string, FacetValue[]>> {
  const results = await Promise.all(
    facetDefs.map(async (def) => {
      try {
        const query = buildFacetCountQuery(
          focusIRI,
          graphIRI,
          layer,
          activeFacets,
          def.id,
          def.sparqlPredicate,
        );
        // Output curl command for debugging
        const encodedQuery = Buffer.from(query).toString('base64');
        const curlCmd = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/sparql-query" \\
  -H "Accept: application/sparql-results+json" \\
  --data-raw '${query.replace(/'/g, "'\\''")}'`;
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Facet: ${def.id}`);
        console.log(`Predicate: ${def.sparqlPredicate}`);
        console.log(`${'='.repeat(60)}`);
        console.log(`\nQuery:\n${query}`);
        console.log(`\nCurl command:\n${curlCmd}\n`);
        const bindings = await executeSparql(endpointUrl, query, auth);
        const values: FacetValue[] = bindings.map((b) => ({
          value: b.facetValue.value,
          label: shortIRI(b.facetValue.value),
          count: parseInt(b.count.value, 10),
          available: parseInt(b.count.value, 10) > 0,
        }));
        return [def.id, values] as const;
      } catch (error) {
        console.error(`Facet count query failed for ${def.id}:`, error);
        return [def.id, []] as const;
      }
    }),
  );

  return Object.fromEntries(results);
}

// ── Search ─────────────────────────────────────────────────────

export async function searchLabels(
  endpointUrl: string,
  graphIRI: string | null,
  queryText: string,
  labelPredicate: string = "http://www.w3.org/2000/01/rdf-schema#label",
  isPgRipple: boolean = false,
  auth?: EndpointConfig["auth"],
): Promise<SearchResult[]> {
  if (!queryText.trim()) return [];

  const query = buildSearchQuery(graphIRI, queryText, labelPredicate, isPgRipple);
  const bindings = await executeSparql(endpointUrl, query, auth);

  const seen = new Map<string, SearchResult>();
  for (const b of bindings) {
    const iri = b.entity?.value;
    if (!iri || seen.has(iri)) continue;
    seen.set(iri, {
      iri,
      label: b.label?.value ?? shortIRI(iri),
      type: b.type?.value,
      typeLabel: b.type?.value ? shortIRI(b.type.value) : undefined,
    });
  }

  return Array.from(seen.values());
}

// ── Relationships ──────────────────────────────────────────────

export interface RelationshipInfo {
  predicate: string;
  label: string;
  subjectCount: number;
  objectCount: number;
  valueKind: string;
  isNavigationCandidate: boolean;
}

export async function fetchRelationships(
  endpointUrl: string,
  graphIRI: string | null,
  classIRI?: string,
  auth?: EndpointConfig["auth"],
): Promise<RelationshipInfo[]> {
  const query = buildRelationshipsQuery(graphIRI, classIRI);
  const bindings = await executeSparql(endpointUrl, query, auth);

  return bindings.map((b) => ({
    predicate: b.predicate.value,
    label: shortIRI(b.predicate.value),
    subjectCount: parseInt(b.subjectCount?.value ?? "0", 10),
    objectCount: parseInt(b.objectCount?.value ?? "0", 10),
    valueKind: b.valueKind?.value ?? "literal",
    isNavigationCandidate: b.valueKind?.value === "iri" && parseInt(b.objectCount?.value ?? "0", 10) >= 2,
  }));
}
