# Text-Primary Faceted Parallax Navigation — Technical Blueprint

**Core concept clarification:**
"Parallax" here is a *navigational metaphor*, not a visual effect. Just as optical parallax means the same object looks different depending on your vantage point, *faceted parallax navigation* means the same knowledge graph looks structurally different depending on which combination of facets (the "lens") you are viewing it through. Different lens combinations surface different relational layers of the data. There is no scrolling animation, no CSS 3D, no visual depth effects — navigation is entirely set-based, driven by facet selection.

---

## Table of Contents

0. [Endpoint Configuration & Triplestore Introspection](#0-endpoint-configuration--triplestore-introspection)
   - [0.11 pg-ripple Capability Surface](#011-pg-ripple-capability-surface)
1. [Recommended Tech Stack](#1-recommended-tech-stack)
2. [Core Concepts: Sets, Lenses, and Layers](#2-core-concepts-sets-lenses-and-layers)
   - [2.4 The Four Navigation Contexts](#24-the-four-navigation-contexts)
   - [2.5 Layers in Entity vs Set Context](#25-layers-in-entity-vs-set-context)
3. [Faceted Navigation Model](#3-faceted-navigation-model)
   - [3.5 Set-to-Set Navigation (Predicate Traversal)](#35-set-to-set-navigation-predicate-traversal)
4. [The Text-Primary UI Layout](#4-the-text-primary-ui-layout)
   - [4.6 Types Browser UI](#46-types-browser-ui)
   - [4.7 Relationships Browser UI](#47-relationships-browser-ui)
   - [4.8 Global Search (⌘K)](#48-global-search-k)
   - [4.9 Narrative Context Header](#49-narrative-context-header)
   - [4.10 Empty States](#410-empty-states)
5. [Integration & Performance](#5-integration--performance)
6. [Code Prototype Outline](#6-code-prototype-outline)
7. [Sample Query Logic](#7-sample-query-logic)
   - [7.5 Set-Traversal Query](#75-set-traversal-query)
   - [7.6 pg-ripple Datalog Rules](#76-pg-ripple-datalog-rules-sql-level)
8. [Accessibility Strategy](#8-accessibility-strategy)

---

## 0. Endpoint Configuration & Triplestore Introspection

The application's primary use-case is navigating knowledge graphs hosted by **pg-ripple** — a PostgreSQL 18 extension that provides a full W3C SPARQL 1.1 endpoint (via the `pg_ripple_http` companion service), Datalog reasoning, SHACL validation, and hybrid vector+graph search. While the application can connect to any SPARQL 1.1-compliant triplestore, **pg-ripple endpoints are the first-class target** and unlock advanced features described in [§0.11](#011-pg-ripple-capability-surface).

All structural knowledge — named graphs, classes, predicates, and label conventions — is derived from the endpoint itself at runtime. There are no hardcoded ontology assumptions.

### 0.1 Endpoint Configuration

Endpoints are registered at runtime, not at build time. A user can add any endpoint URL (with optional authentication) and the application immediately introspects it.

```typescript
// lib/endpoint.ts

export interface EndpointConfig {
  id: string;              // user-supplied slug, e.g. "my-fuseki"
  label: string;           // display name
  sparqlUrl: string;       // SPARQL query endpoint URL
  updateUrl?: string;      // optional SPARQL update endpoint
  auth?: {
    type: "basic" | "bearer";
    credentials: string;   // stored in server-side session only, never in client state
  };
  defaultGraph?: string;   // IRI of default named graph, if any
  capabilities?: EndpointCapabilities;  // auto-detected on registration (see §0.11.1)
}
```

Endpoints are stored server-side (e.g. in an encrypted cookie or a local JSON file). The credentials are **never** sent to the browser. All SPARQL queries are proxied through Next.js Server Actions.

### 0.2 Introspection Pipeline

When a new endpoint is registered (or on first visit), the application runs a fixed sequence of meta-queries against it:

```
1. LIST GRAPHS      → what named graphs exist?
2. SAMPLE GRAPH     → what RDF types and predicates appear in each graph?
3. LABEL HEURISTIC  → which predicates serve as human-readable labels?
4. CLASS HIERARCHY  → what rdfs:subClassOf / owl:equivalentClass structure exists?
5. PREDICATE STATS  → for each predicate, cardinality + value type distribution
```

The results are cached server-side (in-memory or Redis) keyed by `(endpointId, graphIRI)` with a configurable TTL (default: 10 minutes). Introspection can be manually re-triggered from the UI.

### 0.3 Meta-Query: List Named Graphs

```sparql
# Enumerate all named graphs in the triplestore.
# Falls back to the SPARQL 1.1 default graph if none are named.

SELECT DISTINCT ?graph (COUNT(*) AS ?tripleCount) WHERE {
  GRAPH ?graph { ?s ?p ?o }
}
GROUP BY ?graph
ORDER BY DESC(?tripleCount)
```

If this returns zero rows the endpoint uses the default graph only — fall back to:

```sparql
SELECT (COUNT(*) AS ?tripleCount) WHERE { ?s ?p ?o }
```

### 0.4 Meta-Query: Sample a Graph for Types and Predicates

```sparql
# Run for each named graph IRI (or omit GRAPH clause for default graph).
# Produces the raw material for dynamic facet generation.

SELECT ?predicate ?valueKind
       (COUNT(DISTINCT ?subject) AS ?subjectCount)
       (COUNT(DISTINCT ?object)  AS ?objectCount)
WHERE {
  GRAPH <$GRAPH_IRI> {
    ?subject ?predicate ?object .
    BIND(
      IF(isIRI(?object),     "iri",
      IF(isLiteral(?object),
        IF(DATATYPE(?object) IN (xsd:date, xsd:dateTime, xsd:gYear), "date",
        IF(DATATYPE(?object) IN (xsd:integer, xsd:decimal, xsd:float, xsd:double), "numeric",
        "literal")), "bnode")) AS ?valueKind
    )
  }
}
GROUP BY ?predicate ?valueKind
ORDER BY DESC(?subjectCount)
LIMIT 200
```

### 0.5 Meta-Query: Label Predicate Heuristic

Different triplestores use different predicates for human-readable labels. The application detects which ones are present:

```sparql
# Check for common label predicates in order of preference
SELECT ?labelPredicate (COUNT(?s) AS ?coverage) WHERE {
  GRAPH <$GRAPH_IRI> {
    VALUES ?labelPredicate {
      rdfs:label
      skos:prefLabel
      skos:altLabel
      foaf:name
      schema:name
      dct:title
      <http://www.w3.org/2004/02/skos/core#prefLabel>
    }
    ?s ?labelPredicate ?o .
  }
}
GROUP BY ?labelPredicate
ORDER BY DESC(?coverage)
```

The predicate with the highest coverage is used as the primary label predicate for that graph. If multiple language tags exist, the user's `Accept-Language` preference (or a configurable default) is applied.

### 0.6 Meta-Query: Class Hierarchy

```sparql
# Discover the type hierarchy available in the graph
SELECT DISTINCT ?class ?superClass ?classLabel (COUNT(DISTINCT ?instance) AS ?instanceCount)
WHERE {
  GRAPH <$GRAPH_IRI> {
    ?instance rdf:type ?class .
    OPTIONAL { ?class rdfs:subClassOf ?superClass }
    OPTIONAL { ?class rdfs:label ?classLabel . FILTER(lang(?classLabel) = "en") }
  }
}
GROUP BY ?class ?superClass ?classLabel
ORDER BY DESC(?instanceCount)
LIMIT 500
```

### 0.7 Introspection Data Types

```typescript
// lib/introspection.ts

export interface GraphSummary {
  iri: string;                        // named graph IRI ("default" for default graph)
  label: string;                      // derived from IRI or dc:title
  tripleCount: number;
  subjectCount: number;
  predicates: PredicateSummary[];     // top predicates by coverage
  classes: ClassSummary[];            // top classes by instance count
  labelPredicate: string;             // best label predicate for this graph
  introspectedAt: Date;
}

export interface PredicateSummary {
  iri: string;
  label: string;                      // rdfs:label or short local name
  subjectCount: number;
  objectCount: number;
  valueKind: "iri" | "literal" | "date" | "numeric" | "bnode";
  isFacetCandidate: boolean;          // true if valueKind is iri/literal with low cardinality
  isNavigationCandidate: boolean;     // true if IRI-valued with ≥ 2 objects (good for traverseVia)
  isStructural: boolean;              // true if it's schema plumbing (owl:sameAs, rdf:type, etc.)
}

export interface ClassSummary {
  iri: string;
  label: string;
  instanceCount: number;
  superClass?: string;
}
```

### 0.8 Dynamic Facet Generation from Introspection

Facet definitions are **never hardcoded**. They are generated from the `PredicateSummary` data after introspection, using heuristics:

```typescript
// lib/facet-generator.ts

export function generateFacets(predicates: PredicateSummary[]): FacetDefinition[] {
  return predicates
    .filter(isFacetCandidate)
    .map(predicateToFacet);
}

// Predicates that serve schema infrastructure rather than meaningful domain relationships.
// Hidden from the Relationships Browser by default; excluded from facet and traversal candidates.
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
  // Good facets: IRI-valued with moderate cardinality (2–500 distinct values)
  if (p.valueKind === "iri" && p.objectCount >= 2 && p.objectCount <= 500) return true;
  // Good facets: literal-valued with low cardinality
  if (p.valueKind === "literal" && p.objectCount >= 2 && p.objectCount <= 100) return true;
  // Date predicates → date-range facet
  if (p.valueKind === "date") return true;
  // Numeric predicates with low distinct count → can be range facet
  if (p.valueKind === "numeric" && p.objectCount <= 200) return true;
  return false;
}

function predicateToFacet(p: PredicateSummary): FacetDefinition {
  return {
    id: p.iri,
    label: p.label || shortIRI(p.iri),
    sparqlPredicate: p.iri,
    valueType:
      p.valueKind === "date"    ? "date-range" :
      p.valueKind === "numeric" ? "numeric-range" :
      p.valueKind === "iri"     ? "uri" : "literal",
    multiSelect: p.valueKind !== "date" && p.valueKind !== "numeric",
  };
}

// Annotate each predicate with computed signal fields.
// Called during introspection, before predicates are stored in the GraphSummary cache.
export function annotatePredicates(predicates: PredicateSummary[]): PredicateSummary[] {
  return predicates.map((p) => ({
    ...p,
    isStructural: STRUCTURAL_PREDICATES.has(p.iri),
    isNavigationCandidate:
      p.valueKind === "iri" &&
      p.objectCount >= 2 &&
      !STRUCTURAL_PREDICATES.has(p.iri),
  }));
}
```

### 0.9 Graphs Browser: Entry Point UI

When no focus entity is selected, the application shows a **graphs browser** — a text-primary overview of all named graphs in the connected triplestore.

```
┌──────────────────────────────────────────────────────────┐
│  ⬡ moire                    [+ Add Endpoint]            │
├──────────────────────────────────────────────────────────┤
│  Endpoint: http://localhost:3030/ds/sparql   [↺ Refresh] │
│                                                          │
│  4 named graphs · 1.2M triples total                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ http://example.org/people                        │   │
│  │ 48,230 triples · 12 predicates · 3 classes       │   │
│  │ Top types: Person (3,200)  Org (890)  Place (44) │   │
│  │                             [Browse this graph →] │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ http://example.org/publications                  │   │
│  │ 120,004 triples · 8 predicates · 2 classes       │   │
│  │ Top types: Article (9,100)  Book (400)           │   │
│  │                             [Browse this graph →] │   │
│  └──────────────────────────────────────────────────┘   │
│  ...                                                     │
└──────────────────────────────────────────────────────────┘
```

Clicking **Browse this graph** sets the active graph context and transitions to the faceted navigation view with dynamically generated facets for that graph. The `rdf:type` facet is always first (if present), followed by the most-covered predicates.

### 0.10 Predicate Explorer (within a graph)

When a focus entity is active, a **predicate explorer** panel shows all predicates present on that entity, their values, and which predicates are navigable (IRI-valued, clickable to set a new focus):

```
┌──────────────────────────────────────────────────────────┐
│  Alan Turing  (layer 0)                                  │
│  http://dbpedia.org/resource/Alan_Turing                 │
├──────────────────────────────────────────────────────────┤
│  rdf:type          Person, Scientist, BritishPerson      │
│  rdfs:label        Alan Turing (en), Alan Turing (de)    │
│  dbo:birthDate     1912-06-23                            │
│  dbo:deathDate     1954-06-07                            │
│  dbo:birthPlace    → Maida Vale, London    [navigate]    │
│  dbo:influenced    → John von Neumann      [navigate]    │
│  dbo:influenced    → Alonzo Church         [navigate]    │
│  dbo:abstract      Alan Mathison Turing...  [expand]     │
│  owl:sameAs        → wikidata:Q7251        [navigate]    │
└──────────────────────────────────────────────────────────┘
```

IRI-valued predicates render as clickable links that call `pushFocus(objectIRI)`. This allows free-form graph traversal without needing to know the schema in advance.

### 0.11 pg-ripple Capability Surface

When connected to a pg-ripple endpoint (`pg_ripple_http`), the application gains access to capabilities beyond standard SPARQL 1.1. These are progressively enabled — the core navigation works against any endpoint, but pg-ripple unlocks additional power.

#### 0.11.1 Capability Detection

On endpoint registration, the application probes the endpoint's capabilities using two mechanisms:

1. **SPARQL Service Description** — `GET /sparql` with `Accept: application/rdf+xml` returns an `sd:Service` description including `sd:supportedLanguage`, `sd:resultFormat`, and `sd:feature`. pg-ripple reports SPARQL 1.1 Query and Update, JSON/XML/CSV/TSV result formats, and features like `sd:UnionDefaultGraph`.

2. **Content Negotiation Probe** — a lightweight `CONSTRUCT` query with varying `Accept` headers detects supported serialization formats: `application/sparql-results+json`, `text/turtle`, `application/n-triples`, `application/ld+json`, `application/sparql-results+xml`. pg-ripple supports all of these.

3. **pg-ripple Feature Detection** — a canary SPARQL query attempts to use pg-ripple extension functions. If the endpoint responds without error, the application knows advanced features are available:

```sparql
# Canary: detect pg-ripple by probing for the pg:similar custom function
ASK {
  BIND(<http://pg-ripple.io/fn/similar> AS ?fn)
  FILTER(isIRI(?fn))
}
```

Alternatively, the service description endpoint at the root URL (`GET /`) returns pg-ripple-specific metadata when `pg_ripple_http` is running.

```typescript
// lib/capability-detection.ts

export interface EndpointCapabilities {
  isPgRipple: boolean;              // true if pg-ripple canary succeeded
  sparql11Query: boolean;           // full SPARQL 1.1 Query support
  sparql11Update: boolean;          // SPARQL Update support
  sparqlProtocol: boolean;          // W3C SPARQL Protocol
  contentFormats: string[];         // supported Accept types
  fullTextSearch: boolean;          // text:query or pg:fts() available
  federation: boolean;              // SERVICE keyword supported
  vectorSearch: boolean;            // pg:similar() available
  datalogReasoning: boolean;        // inference engine available
  shaclValidation: boolean;         // SHACL validation available
  jsonldFraming: boolean;           // JSON-LD framed output
  graphStoreProtocol: boolean;      // GSP GET/PUT/POST/DELETE
  ragRetrieval: boolean;            // /rag endpoint available
}

export async function detectCapabilities(
  sparqlUrl: string
): Promise<EndpointCapabilities> {
  const caps: EndpointCapabilities = {
    isPgRipple: false,
    sparql11Query: true,            // assumed baseline
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

  // Probe service description
  const sdFormats = await probeServiceDescription(sparqlUrl);
  if (sdFormats) {
    caps.contentFormats = sdFormats.formats;
    caps.sparql11Update = sdFormats.supportsUpdate;
  }

  // Probe content negotiation
  caps.jsonldFraming = await probeAcceptHeader(sparqlUrl, "application/ld+json");

  // Probe pg-ripple specific features
  caps.isPgRipple = await probePgRippleCanary(sparqlUrl);
  if (caps.isPgRipple) {
    caps.sparql11Update = true;
    caps.federation = true;
    caps.fullTextSearch = true;
    caps.vectorSearch = true;
    caps.datalogReasoning = true;
    caps.shaclValidation = true;
    caps.jsonldFraming = true;
    caps.graphStoreProtocol = true;
    caps.ragRetrieval = await probeRagEndpoint(sparqlUrl);
  }

  return caps;
}
```

#### 0.11.2 SPARQL Capabilities (All Endpoints)

These features work against any SPARQL 1.1 endpoint and form the core navigation layer:

| Feature | SPARQL | Usage in moire |
|---|---|---|
| **Basic Graph Patterns** | `?s ?p ?o` triple patterns | Entity set queries, facet counts, predicate exploration |
| **OPTIONAL** | `OPTIONAL { ... }` | Label/type/abstract retrieval alongside main pattern |
| **FILTER** | Comparison, CONTAINS, IN, REGEX | Facet value filtering, search |
| **Aggregation** | GROUP BY, COUNT, ORDER BY | Facet value counts, class instance counts |
| **Property Paths** | `+`, `*`, `?`, `/`, `\|`, `^` | Layer traversal, transitive relationship following |
| **UNION / MINUS** | Set union and difference | Multi-type queries, exclusion filters |
| **Subqueries** | Nested SELECT | Large set-to-set traversals |
| **VALUES** | Inline data bindings | Materialised source sets for traversal |
| **CONSTRUCT** | Triple template output | JSON-LD export, entity neighbourhood extraction |
| **DESCRIBE** | Concise Bounded Description | Entity detail view — all predicates and values |
| **ASK** | Boolean existence test | Capability detection, facet availability |
| **Named Graphs** | `GRAPH <iri> { ... }` | Graph-scoped queries throughout |
| **SERVICE** | Federated queries | Cross-endpoint joins (pg-ripple, Wikidata, etc.) |

#### 0.11.3 pg-ripple SPARQL Extensions

When `capabilities.isPgRipple` is true, the application enables these additional features:

**Custom SPARQL Functions:**

| Function | Purpose | moire usage |
|---|---|---|
| `pg:similar(?entity, "text", k)` | Vector similarity within SPARQL FILTER | Semantic search: find entities conceptually similar to a query, ranked by cosine distance |
| `pg:fts(?entity, "query")` | Full-text search within SPARQL FILTER | Fast label search via PostgreSQL GIN indexes (replaces CONTAINS fallback) |
| `pg:embed("text")` | Inline embedding generation | On-the-fly embedding for similarity queries |

**Enhanced Search (pg-ripple):**

When pg-ripple is detected, the `⌘K` search upgrades from CONTAINS-based string matching to `pg:fts()`:

```sparql
# pg-ripple full-text search — replaces the CONTAINS fallback
SELECT DISTINCT ?entity ?label ?type WHERE {
  GRAPH <$GRAPH_IRI> {
    ?entity <$LABEL_PREDICATE> ?label .
    FILTER(pg:fts(?label, "$QUERY"))
    OPTIONAL { ?entity rdf:type ?type }
  }
}
LIMIT 20
```

For semantic search, pg-ripple's `pg:similar()` enables a "find similar" action on any entity:

```sparql
# Semantic similarity search within the current graph
SELECT ?entity ?label ?score WHERE {
  GRAPH <$GRAPH_IRI> {
    BIND(pg:similar(?entity, "$QUERY") AS ?score)
    FILTER(?score > 0.7)
    ?entity <$LABEL_PREDICATE> ?label .
  }
}
ORDER BY DESC(?score)
LIMIT 20
```

**JSON-LD Framed Output:**

pg-ripple's `sparql_construct_jsonld()` and JSON-LD framing produce API-ready nested JSON. The application uses this for entity export and structured data views:

```sparql
# CONSTRUCT query returning JSON-LD via Accept: application/ld+json
CONSTRUCT {
  ?entity rdf:type ?type ;
          rdfs:label ?label ;
          ?predicate ?value .
}
WHERE {
  GRAPH <$GRAPH_IRI> {
    ?entity rdf:type <$CLASS_IRI> ;
            rdfs:label ?label ;
            ?predicate ?value .
  }
}
```

**SPARQL Federation:**

pg-ripple's `SERVICE` keyword with connection pooling and result caching enables cross-endpoint queries. The application can join local pg-ripple data with remote SPARQL endpoints (Wikidata, DBpedia, other pg-ripple instances):

```sparql
# Federated query: enrich local entities with Wikidata labels
SELECT ?entity ?localLabel ?wikidataLabel WHERE {
  GRAPH <$GRAPH_IRI> {
    ?entity rdfs:label ?localLabel ;
            owl:sameAs ?wdEntity .
  }
  SERVICE <https://query.wikidata.org/sparql> {
    ?wdEntity rdfs:label ?wikidataLabel .
    FILTER(LANG(?wikidataLabel) = "en")
  }
}
```

#### 0.11.4 pg-ripple Datalog Capabilities

pg-ripple includes a full Datalog reasoning engine that derives new facts from rules. When connected to a pg-ripple endpoint, the application can surface **inferred knowledge** alongside explicit triples.

**Built-in Rule Sets:**

| Rule set | Rules | What it derives |
|---|---|---|
| `rdfs` | ~12 rules | `rdfs:subClassOf` transitivity, `rdfs:subPropertyOf` transitivity, `rdf:type` propagation via subclass/subproperty, `rdfs:domain`/`rdfs:range` inference |
| `owl-rl` | ~80 rules | OWL RL profile: symmetric/transitive/inverse properties, `owl:equivalentClass`, `owl:sameAs`, `owl:unionOf`, `owl:intersectionOf`, property chains |

**Impact on Navigation:**

When RDFS/OWL inference is active on a pg-ripple endpoint:

- **Type hierarchy is complete.** Querying for `?x rdf:type ex:Animal` returns instances typed as `ex:Dog` if `ex:Dog rdfs:subClassOf ex:Animal`. The Types Browser automatically shows the full inferred class hierarchy.
- **Property subsumption works.** If `ex:authored rdfs:subPropertyOf dct:creator`, querying via `dct:creator` also returns `ex:authored` triples.
- **`owl:sameAs` canonicalization** means equivalent entities are treated as one. Navigating to any alias resolves to the canonical entity.
- **Symmetric and transitive properties** (`owl:SymmetricProperty`, `owl:TransitiveProperty`) are fully expanded. `foaf:knows` as symmetric means traversing in either direction returns the same set.

**Custom Datalog Rules:**

pg-ripple supports custom inference rules in a Turtle-flavoured Datalog syntax, with advanced features:

| Feature | Description | Since |
|---|---|---|
| Stratified negation | `NOT` in rule bodies — "flag entities without an email" | v0.10.0 |
| Aggregation (Datalog^agg) | COUNT, SUM, MIN, MAX, AVG over grouped patterns | v0.30.0 |
| Magic sets / goal-directed | `infer_goal()` — derive only facts relevant to a specific query | v0.29.0 |
| Demand-filtered inference | `infer_demand()` — multi-goal demand sets, 50–90% reduction in inference work | v0.31.0 |
| `owl:sameAs` canonicalization | Entity resolution before inference — equivalent entities collapsed to one | v0.31.0 |
| Semi-naive evaluation | Only considers new facts each iteration — efficient fixpoint computation | v0.24.0 |
| Well-founded semantics | Three-valued logic (true/false/unknown) for programs with cyclic negation | v0.32.0 |
| Tabling / memoisation | Session-scoped cache for repeated sub-goals — 2–5× speedup | v0.32.0 |
| Parallel stratum evaluation | Background-worker parallelism for independent rules — 2–5× faster materialisation | v0.35.0 |
| Lattice-based aggregation (Datalog^L) | Monotone lattice joins (min, max, set, interval) — trust propagation, shortest paths | v0.36.0 |
| Incremental retraction (DRed) | Delete-Rederive for write-correct materialised predicates | v0.34.0 |

**Navigation Benefits of Datalog:**

Inferred triples are stored with `source = 1` alongside explicit triples (`source = 0`) and are queryable via standard SPARQL. This means the faceted navigation, set traversal, and entity detail views automatically surface derived knowledge without special handling. The application can optionally distinguish inferred from explicit facts in the entity detail view:

```sparql
# Query that distinguishes explicit from inferred triples (pg-ripple specific)
# Uses RDF-star annotation pattern where available
SELECT ?predicate ?value ?isInferred WHERE {
  GRAPH <$GRAPH_IRI> {
    <$ENTITY_IRI> ?predicate ?value .
  }
}
```

**Datalog Views:**

pg-ripple can materialise Datalog rules as live, auto-updating PostgreSQL views via `pg_trickle`. The application can query these pre-computed views for instant results on complex inference chains — useful for dashboard-style navigation panels that show derived relationship counts.

#### 0.11.5 pg-ripple SHACL Integration

When SHACL shapes are loaded in pg-ripple, the application can use them to enhance navigation:

- **Cardinality hints** — `sh:maxCount 1` tells the query optimizer to skip `DISTINCT`; `sh:minCount 1` downgrades `LEFT JOIN` to `INNER JOIN`. These improve query performance automatically.
- **Data quality indicators** — the entity detail view can show validation status per entity, highlighting constraint violations.
- **Schema-driven facets** — SHACL shapes describe the expected structure of each class. The application can use `sh:property` paths to generate more precise facet definitions than pure introspection heuristics.

#### 0.11.6 pg-ripple RAG / AI Retrieval

When `capabilities.ragRetrieval` is true, the application can offer AI-powered features via pg-ripple's `/rag` endpoint:

- **Hybrid search** — combine SPARQL graph patterns with vector similarity (Reciprocal Rank Fusion) in a single query.
- **"Find similar" action** — on any entity card, trigger `pg:similar()` to find semantically related entities across the graph.
- **Graph-contextualised RAG** — `rag_retrieve()` returns structured context ready for LLM prompts, combining graph topology with semantic similarity.

#### 0.11.7 Content Negotiation

pg-ripple's `pg_ripple_http` supports content negotiation via the `Accept` header. The application uses this throughout:

| Accept Header | Format | Usage |
|---|---|---|
| `application/sparql-results+json` | SPARQL Results JSON | Default for SELECT/ASK queries |
| `application/sparql-results+xml` | SPARQL Results XML | Fallback for SELECT/ASK |
| `text/turtle` | Turtle | CONSTRUCT/DESCRIBE output for entity export |
| `application/n-triples` | N-Triples | Bulk data exchange |
| `application/ld+json` | JSON-LD | CONSTRUCT output for structured/nested entity views |
| `text/csv` | CSV | Tabular export of query results |

The application defaults to JSON for SELECT queries and JSON-LD for CONSTRUCT queries when connected to pg-ripple, falling back to SPARQL Results JSON for generic endpoints.

#### 0.11.8 Progressive Feature Enablement

The UI adapts based on detected capabilities:

| Feature | Generic SPARQL 1.1 | pg-ripple |
|---|---|---|
| Faceted navigation | ✅ Standard SPARQL queries | ✅ Same + SHACL-optimised plans |
| Search (⌘K) | CONTAINS string filter | `pg:fts()` full-text + `pg:similar()` semantic |
| Type hierarchy | Explicit `rdfs:subClassOf` triples only | Full RDFS/OWL inferred hierarchy |
| Entity detail | SPARQL DESCRIBE or predicate query | DESCRIBE + inferred triples + validation status |
| Set traversal | Standard `VALUES`/subquery | Same + transitive/symmetric property expansion |
| Find similar | Not available | `pg:similar()` vector search |
| Federation | `SERVICE` if endpoint supports it | `SERVICE` with pooling, caching, adaptive timeouts |
| Export | Turtle via CONSTRUCT | JSON-LD framed, Turtle, N-Triples, RDF/XML |
| Data quality | Not available | SHACL validation status per entity |
| AI retrieval | Not available | `/rag` endpoint for hybrid search + LLM context |

---

## 1. Recommended Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 15+ (App Router) | Server Components, Server Actions, streaming SSR |
| **UI Kit** | shadcn/ui + Radix primitives | Accessible, composable — Command, Sheet, Badge, DataTable |
| **Styling** | Tailwind CSS v4 | Utility-first; typography-scale-focused |
| **Motion** | Framer Motion (`motion/react`) | Layout animations on set transitions; no scroll dependency |
| **Graph DB** | pg-ripple (primary) / any SPARQL 1.1 endpoint | pg-ripple via `pg_ripple_http`; also Fuseki, Oxigraph, Stardog, Virtuoso, Blazegraph — endpoint URL is user-supplied at runtime |
| **Graph Client** | Comunica (`@comunica/query-sparql`) | Runs in Node.js Server Actions; streaming bindings; supports auth headers |
| **State** | Zustand | Facet state, navigation stack, focus history |
| **Data Fetching** | SWR + Server Actions | Facet-keyed caching with `keepPreviousData` |

**Why Framer Motion:** Its `layoutId` prop enables shared-element transitions — an entity card animates from its position in one facet view to its new position in another, communicating "this entity persisted through the filter change." That semantic continuity is the visual expression of the parallax metaphor. GSAP ScrollTrigger is irrelevant here because there is no scroll-driven animation.

**Why not GSAP:** GSAP's strengths (scrub, pin, scroll-linked transforms) do not apply to set-based navigation.

### Graph Database Evaluation

| Database | Query Language | SPARQL 1.1 | Datalog | SHACL | Vector+Graph | JS Driver | License |
|---|---|---|---|---|---|---|---|
| **pg-ripple** | SPARQL 1.1 + Datalog | Full (100% W3C) | Full (RDFS, OWL RL, custom rules, magic sets, WFS, lattice) | Full (Core 100% W3C) | Yes (pgvector + SPARQL hybrid) | HTTP + Comunica | Apache 2.0 |
| **Apache Jena Fuseki** | SPARQL 1.1 | Full | No | No | No | HTTP + Comunica | Apache 2.0 |
| **Oxigraph** | SPARQL 1.1 | Full | No | No | No | WASM / HTTP | MIT/Apache |
| **Stardog** | SPARQL + Datalog | Full | Limited | Plugin | No | JS SDK | Commercial |
| **TerminusDB** | WOQL | No | No | No | No | `@terminusdb/client` | Apache 2.0 |

**Recommendation:** **pg-ripple** as the primary backend. It provides the richest feature surface — full W3C SPARQL 1.1 conformance, native Datalog reasoning (RDFS, OWL RL, custom rules with stratified negation, aggregation, magic sets, well-founded semantics, and lattice-based aggregation), SHACL data quality validation, hybrid vector+graph search, JSON-LD framing, SPARQL federation, and incremental views — all inside PostgreSQL with zero additional infrastructure. The `pg_ripple_http` companion service exposes a W3C SPARQL Protocol endpoint with content negotiation and a service description. Other SPARQL 1.1 endpoints (Fuseki, Oxigraph) work as fallback targets; the query layer is portable.

---

## 2. Core Concepts: Sets, Lenses, and Layers

### 2.1 Terminology

**Entity set** — the current result set: all graph nodes satisfying the active facet combination.

**Facet** — a single dimension of classification derived from the graph schema (e.g., `rdf:type`, a date predicate, a relationship predicate like `dbo:influenced`). Each facet has a set of discrete values.

**Lens** — the complete vector of active facet selections. Two different lenses applied to the same graph yield different entity sets, just as two physical vantage points yield different apparent positions of the same object. This is the "parallax."

**Layer** — a semantic stratum within the current lens: the focus node (layer 0), its direct neighbours (layer 1), their neighbours (layer 2), ancestors (layer −1), etc. Layers are navigated explicitly by user action, not by scroll position.

**Navigation step** — the user either:
1. **Refines** the lens (adds/removes a facet value → shrinks or expands the current entity set), or
2. **Traverses** the graph (selects an entity as the new focus → shifts the entire layer structure around that new centre).

### 2.2 The Parallax Effect in Practice

When you hold the focus node constant and change the lens:

```
Lens A (type: Person)                    →  Alan Turing, Ada Lovelace, ...
Lens B (type: Person + decade: 1940s)    →  Alan Turing, ...
Lens C (type: Person + influenced: Turing) →  different subset, same graph
```

The same graph node (Turing) appears in each view, but its relational context — which other entities are visible around it — shifts. That contextual shift is the "parallax." The data is static; the apparent structure changes with the lens.

### 2.3 Layer Depth as Conceptual Distance

Graph distance from the focus node is a first-class navigation concept:

| Layer | Meaning | UI detail level |
|---|---|---|
| 0 | Focus node | Full — title, abstract, all metadata |
| 1 | Direct neighbours | Summary — title + type + one-line description |
| 2 | Two hops out | Headline — title + type badge only |
| −1 | Direct ancestors (incoming edges) | Headline — nodes that point TO the focus |
| −2 | Two-hop ancestors | Label — compact list |

Users move between layers via explicit controls (breadcrumb, depth selector, clicking a neighbour card), not by scrolling.

### 2.4 The Four Navigation Contexts

The application has four first-class contexts, each representing a different level of granularity in the knowledge graph. Navigation moves between them in both directions.

| Context | What you see | Produced by | Navigation out |
|---|---|---|---|
| **Graphs** | All named graphs as summary cards | Landing page / endpoint selection | Click a graph → Types or Set context |
| **Types** | Class hierarchy with instance counts | Entering a graph | Click a class → Set context (instances of that class) |
| **Relationships** | All predicates with coverage stats | From Types or Set context | Click a predicate → Set-to-set traversal |
| **Set** | Entity set matching current facets | Any inbound navigation | Click entity → Entity context; click predicate → Relationships; change facet → refined Set |
| **Entity** | Single resource, all predicates + values | Clicking any entity card | Click IRI-valued predicate → Entity; click predicate label → Set-to-set traversal |

These are not separate routes — they are different rendering modes of the same navigation shell. The `context` field in `LensFrame` (see [§3.3](#33-lens-navigation-stack)) determines which view the shell renders.

**How the contexts connect:**

```
  ┌────────────┐
  │   Graphs   │ ──[select graph]──────────────────────────────────┐
  └────────────┘                                                   ↓
                                                         ┌──────────────────┐
  ┌────────────┐ ←─[back]────────────────────────────── │      Types       │
  │   Entity   │                                         │  (class browser) │
  └────────────┘ ──[click predicate label]──────────┐   └──────────────────┘
       ↑                                            ↓         ↓ [select class]
       │ [click IRI value]               ┌─────────────────────────────────┐
       │                                 │        Relationships             │
       └───────────────[pick relation]── │    (predicate browser)          │
                                         └─────────────────────────────────┘
                                                   ↓ [select predicate / traverseVia]
                                         ┌─────────────────────────────────┐
                                         │            Set                  │
                                         │    (faceted entity set)         │
                                         │ ←─[toggleFacet] mutates frame   │
                                         └─────────────────────────────────┘
                                                   ↓ [click entity card]
                                              ┌──────────┐
                                              │  Entity  │
                                              └──────────┘
```

The key distinction between the two navigation primitives:

- **Resource-to-resource** (`pushFocus`): select one entity → navigate to that entity's detail view. The new set is centred on one node.
- **Set-to-set** (`traverseVia` / `setClass` / facet changes): the entire current set shifts to a new set. No single entity is targeted — the set as a whole moves through a predicate or constraint.

### 2.5 Layers in Entity vs Set Context

The layer selector (`[−2] [−1] [Focus] [+1] [+2]`) is well-defined when there is a **single focus entity**: Layer 0 is the entity itself, Layer 1 is its direct neighbours, Layer −1 is everything pointing to it. Each layer is a precise ring of graph distance from one centre.

In **Set context** (no single focus — e.g. "all Scientists" or a `traverseVia` result), applying a layer number means "the union of layer N neighbours of *every* entity in the set simultaneously." This can produce an enormous, semantically ambiguous result — Layer 1 of 412 scientists may return tens of thousands of entities with no interpretive frame.

**Design rule:** The layer selector is **only shown in Entity context.** In Set context it is replaced by:

| Control | Behaviour |
|---|---|
| **Jump via** strip | Top 3–5 navigation-candidate predicates shown inline; click → `traverseVia(predicateIRI)` |
| **[Browse relationships →]** | Opens the full Relationships Browser scoped to the current set |
| **[Browse types →]** | Returns to the Types Browser to re-enter from a class |

This keeps set exploration focused on predicate-guided traversal and facet refinement, rather than exposing a layer mechanism designed around a single focal point.

---

## 3. Faceted Navigation Model

### 3.1 Facet Anatomy

Facet definitions are derived from the graph schema at runtime, not hardcoded:

```typescript
interface FacetDefinition {
  id: string;              // e.g., "rdf:type"
  label: string;           // display label, e.g., "Type"
  sparqlPredicate: string; // e.g., "rdf:type"
  valueType: "uri" | "literal" | "date-range" | "numeric-range";
  multiSelect: boolean;    // true for type; false for date pickers
}

interface FacetValue {
  value: string;           // IRI or literal
  label: string;           // human-readable
  count: number;           // entities in current result set matching this value
  available: boolean;      // false = selecting this would produce empty result
}
```

### 3.2 Set Operations

Facet selections map directly to SPARQL set operations:

| UI action | Set semantics | SPARQL equivalent |
|---|---|---|
| Toggle one value ON | Restrict to entities matching it | `FILTER(?type = ex:Person)` |
| Toggle another value in the same facet ON | OR within-facet | `FILTER(?type IN (ex:Person, ex:Org))` |
| Toggle a value in a different facet ON | AND across facets | Two separate filter clauses |
| Toggle a value OFF | Remove that restriction | Remove that filter clause |
| Clear all | No restriction | Remove all filter clauses |

### 3.3 Lens Navigation Stack

The lens stack enables forward/back navigation and inheriting facets across focus changes. Each frame is fully self-contained: it records not only the focus entity and active facets but also the endpoint and named graph it is scoped to, so navigating across graphs or endpoints is expressible in the same history model.

```typescript
// The five rendering contexts a LensFrame can represent
type NavigationContext =
  | "graphs"         // no graph selected — shows graphs browser
  | "types"          // class hierarchy for a graph
  | "relationships"  // predicate browser (for a graph or scoped to a set)
  | "set"            // faceted entity set (from class selection, traversal, or entry)
  | "entity";        // single entity focus at layer 0

interface LensFrame {
  endpointId: string;             // which registered endpoint
  graphIRI: string | null;        // null = default / all graphs
  context: NavigationContext;     // which of the four views is active
  focusIRI: string;               // non-empty only when context == "entity"
  focusClass?: string;            // IRI of class — set when context == "types" or entering via class
  navigationPredicate?: string;   // IRI of predicate used in traverseVia (context == "set")
  activeLayer: number;
  facets: Record<string, string[]>;
}

// Navigating to a new focus entity pushes a new LensFrame (endpointId, graphIRI, facets inherited).
// Switching to a different graph pushes a new LensFrame (endpointId inherited, facets cleared).
// traverseVia(pred) pushes a new frame (set context, navigationPredicate set, facets cleared).
// Changing a facet value mutates the current frame — refinements are not pushes.
```

### 3.4 Facet Availability and Counts

A secondary SPARQL aggregate query runs after each navigation step to compute live counts per facet value:

```sparql
SELECT ?typeValue (COUNT(DISTINCT ?entity) AS ?count) WHERE {
  # Current entity set (layer 1 neighbours of focus, unfiltered by type)
  <$FOCUS_IRI> ?p ?entity .
  FILTER(isIRI(?entity))

  # Other active facets applied here (cross-facet narrowing)

  ?entity rdf:type ?typeValue .
}
GROUP BY ?typeValue
ORDER BY DESC(?count)
```

This drives the disabled/available state and count badge of every facet chip.

### 3.5 Set-to-Set Navigation (Predicate Traversal)

Facet refinement (§3.2) narrows or widens the **current** set. Set-to-set traversal is a different operation: it **replaces** the current set with a new one by following a predicate across the whole current set simultaneously.

```
Current set S = { Alan Turing, Ada Lovelace, Alonzo Church }  (scientists)
   ↓  traverseVia(dbo:birthPlace)
New set S′ = { Maida Vale, London, Bletchley, Newbury }  (where those scientists were born)
```

This is set-to-set because the input is a *set of subjects* and the output is the *union of all their objects* for a chosen predicate. No individual entity is targeted; the traversal operates on the set as a whole.

**Contrast with resource-to-resource:**

| | Input | Output | Stack behaviour |
|---|---|---|---|
| `pushFocus(iri)` | one IRI | entity detail centred on that IRI | push new frame |
| `traverseVia(predicateIRI)` | current entity set (as SPARQL pattern) | set of all objects via that predicate | push new frame |
| `toggleFacet(dim, value)` | current frame | same set, narrowed or widened | mutate current frame |

The SPARQL equivalent of `traverseVia` uses a `VALUES` clause to materialize the source set:

```sparql
# Traverse from current set to a new set via a chosen predicate
SELECT DISTINCT ?entity ?label WHERE {
  GRAPH <$GRAPH_IRI> {
    VALUES ?subject { <iri1> <iri2> <iri3> }   # materialized current set
    ?subject <$PREDICATE_IRI> ?entity .
    OPTIONAL { ?entity <$LABEL_PREDICATE> ?label }
  }
}
LIMIT 200
```

For large sets (> 500 entities) the VALUES clause is replaced with a subquery:

```sparql
SELECT DISTINCT ?entity ?label WHERE {
  GRAPH <$GRAPH_IRI> {
    { # subquery: re-run the source set query inline
      SELECT DISTINCT ?subject WHERE {
        $SOURCE_SET_PATTERN
      }
    }
    ?subject <$PREDICATE_IRI> ?entity .
    OPTIONAL { ?entity <$LABEL_PREDICATE> ?label }
  }
}
LIMIT 200
```

The `LensFrame` for the resulting set stores `context: "set"`, `navigationPredicate: predicateIRI`, and the parent set's query parameters (`parentFocusIRI`, `parentFacets`) so the breadcrumb can reconstruct the path and the Back button can return exactly to the source set.

---

## 4. The Text-Primary UI Layout

### 4.1 Page Layout

The main layout has two variants depending on navigation context.

**Set context** (no single focus entity — arrived via class selection, `traverseVia`, or facet browsing):

```
┌─────────────────────────────────────────────────────────┐
│  [← Back] [→ Forward]      [🔍 Search...  ⌘K]          │
│  Birthplaces of UK 1940s Scientists                     │
│  34 places · via dbo:birthPlace                        │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Facet       │  Entity Set             34 entities      │
│  Sidebar     │                                          │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  Type        │  │ Card     │ │ Card     │ │ Card     │ │
│  ☑ Place  34 │  │ title    │ │ title    │ │ title    │ │
│  ☐ Region  8 │  │ type     │ │ type     │ │ type     │ │
│              │  │ excerpt  │ │ excerpt  │ │ excerpt  │ │
│  Country     │  └──────────┘ └──────────┘ └──────────┘ │
│  ☐ UK     24 │                                          │
│  ☐ USA     8 │  Jump via:                               │
│  ☐ Other   2 │  [country (14→)] [partOf (21→)] [more→] │
│              │                                          │
│  [Browse relationships →]                               │
└──────────────┴──────────────────────────────────────────┘
```

**Entity context** (a single entity selected as focus — showing its neighbourhood at a given layer):

```
┌─────────────────────────────────────────────────────────┐
│  [← Back] [→ Forward]      [🔍 Search...  ⌘K]          │
│  Alan Turing                                            │
│  Direct neighbours · Layer 1 · 3 filters active        │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Facet       │  Entity Set             34 entities      │
│  Sidebar     │                                          │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  Type        │  │ Card     │ │ Card     │ │ Card     │ │
│  ☑ Person 12 │  │ title    │ │ title    │ │ title    │ │
│  ☑ Org    8  │  │ type     │ │ type     │ │ type     │ │
│  ☐ Place  3  │  │ excerpt  │ │ excerpt  │ │ excerpt  │ │
│              │  └──────────┘ └──────────┘ └──────────┘ │
│  Decade      │                                          │
│  ☑ 1940s  5  │  Layer: [−2] [−1] [●Focus] [+1] [+2]   │
│  ☐ 1950s  7  │                                          │
│              │  Jump via: [influenced (12→)] [field (3→)] │
│  [Browse relationships →]                               │
└──────────────┴──────────────────────────────────────────┘
```

The **context header** (lines 2–3 below the nav bar) is prose generated from the navigation stack — see [§4.9](#49-narrative-context-header).

The **Jump via** strip surfaces the top `isNavigationCandidate` predicates inline, so common traversals require one click without opening the Relationships Browser.

The **layer selector** appears only in Entity context. In Set context it is replaced by the Jump via strip and the Browse relationships link — see [§2.5](#25-layers-in-entity-vs-set-context).

### 4.2 Detail Levels by Layer

Detail level is a pure data/rendering decision based on the layer the card belongs to — no visual sizing, no positional transforms:

```typescript
type DetailLevel = "label" | "headline" | "summary" | "full";

const LAYER_DETAIL: Record<number, DetailLevel> = {
  [-2]: "label",
  [-1]: "headline",
  0:   "full",
  1:   "summary",
  2:   "headline",
  3:   "label",
};
```

**Semantic zoom:** detail tracks conceptual proximity to the focus node, not visual position or size.

### 4.3 shadcn/ui Component Mapping

| shadcn Component | Role |
|---|---|
| `Card` / `CardHeader` / `CardContent` | Entity representation at each detail level |
| `Badge` | RDF type label, relationship predicate label |
| `Command` | Keyboard-driven facet palette (`⌘K`) |
| `Sheet` | Slide-in facet panel on narrow viewports |
| `Separator` | Visual boundary between layer groups |
| `Breadcrumb` | Lens navigation stack display |
| `Tabs` | Switch between ancestor view and descendant view |
| `ScrollArea` | Overflow within facet sidebar |
| `Skeleton` | Placeholder while SPARQL query resolves |
| `ToggleGroup` | Layer depth selector (Entity context only) |
| `Input` | Search box in top bar; feeds into the ⌘K Command palette |
| `Tooltip` | Predicate full IRI on hover in PredicateTable and Relationships Browser |
| `HoverCard` | Entity preview on hover for IRI-valued objects in PredicateTable |

### 4.4 Typography System

Text is the primary visual element. Typography conveys hierarchy, not spatial position:

```typescript
const DETAIL_TYPOGRAPHY = {
  full: {
    title: "text-2xl font-bold tracking-tight",
    meta:  "text-sm text-muted-foreground",
    body:  "text-base leading-relaxed",
    badge: "text-xs font-medium",
  },
  summary: {
    title: "text-base font-semibold",
    meta:  "text-xs text-muted-foreground",
    body:  "text-sm line-clamp-2",
    badge: "text-[10px]",
  },
  headline: {
    title: "text-sm font-medium",
    meta:  "hidden",
    body:  "hidden",
    badge: "text-[10px]",
  },
  label: {
    title: "text-xs text-muted-foreground font-normal",
    meta:  "hidden",
    body:  "hidden",
    badge: "hidden",
  },
};
```

### 4.5 Entity Set Transitions (Framer Motion)

When facets change and the entity set updates, `layoutId` animates entities that persist across the filter change to their new grid positions. Removed entities fade out; new entities fade in. This makes the set operation visually legible — the user sees which entities survived the filter.

```tsx
<AnimatePresence mode="popLayout">
  {entities.map((entity) => (
    <motion.div
      key={entity.iri}
      layoutId={entity.iri}   // shared-element: animates to new grid position
      layout                   // reflow animation for the grid
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <EntityCard entity={entity} detailLevel={detailLevel} />
    </motion.div>
  ))}
</AnimatePresence>
```

### 4.6 Types Browser UI

Entered from the graphs browser or via `browseTypes()`. Displays the class hierarchy discovered during introspection. Selecting a class calls `setClass(classIRI)` which transitions to a **Set** context pre-filtered to that type.

```
┌────────────────────────────────────────────────────────────┐
│  [← Back]  http://example.org/people  ›  Types            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  28 classes discovered · sorted by instance count         │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Person                            3,200 instances   │ │
│  │    ├─ Scientist                      412 instances   │ │
│  │    ├─ Politician                     890 instances   │ │
│  │    └─ Artist                         330 instances   │ │
│  │                            [Browse as set →]         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Organisation                        890 instances   │ │
│  │    ├─ University                     120 instances   │ │
│  │    └─ Company                        210 instances   │ │
│  │                            [Browse as set →]         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Place                               440 instances   │ │
│  │                            [Browse as set →]         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Browse Relationships →]                                  │
└────────────────────────────────────────────────────────────┘
```

Clicking **Browse as set** is a `setClass(classIRI)` call — it pushes a new `LensFrame` with `context: "set"`, `focusClass: classIRI`, and `facets: { "rdf:type": [classIRI] }` pre-applied.

### 4.7 Relationships Browser UI

Entered via `browseRelationships()` from either the Types context or the Set context. Shows all predicates in the current scope (graph, or scoped to the current entity set's types). Selecting a predicate calls `traverseVia(predicateIRI)` to produce a new entity set.

```
┌────────────────────────────────────────────────────────────┐
│  [← Back]  Scientists (412)  ›  Relationships             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Relationships on the current set  (412 scientists)       │
│                                                            │
│  Outgoing (subject → object)                              │
│  ────────────────────────────────────────────────────     │
│  dbo:birthPlace         412 subjects  →  302 places       │
│                         [Follow as set →]                  │
│                                                            │
│  dbo:influenced         189 subjects  →  241 entities     │
│                         [Follow as set →]                  │
│                                                            │
│  dbo:field              380 subjects  →  44 fields        │
│                         [Follow as set →]  [Add as facet] │
│                                                            │
│  schema:birthDate       412 subjects  (date literal)      │
│                         [Add as facet]                     │
│                                                            │
│  Incoming (object ← subject)                              │
│  ────────────────────────────────────────────────────     │
│  dbo:influenced         241 entities  → this set          │
│                         [Follow incoming as set →]         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**★ (star)** marks predicates where `isNavigationCandidate` is true — IRI-valued with meaningful cardinality. These are shown first and also appear in the **Jump via** strip in the main view.

**Follow as set →** calls `traverseVia(predicateIRI)` — the entire current set is used as the source, and the result is the union of all their objects via that predicate.

**Add as facet** adds the predicate to the dynamic facet sidebar for the current set (calls `toggleFacet` on a new dimension discovered at runtime).

**Schema predicates** (`owl:sameAs`, `rdf:type`, etc. — those with `isStructural: true`) are collapsed into a disclosure group at the bottom. They remain accessible but do not clutter the primary traversal view.

### 4.8 Global Search (⌘K)

The `⌘K` / `Ctrl+K` Command palette is the primary **text-based entry point** into the knowledge graph. Accessible from any context, it searches labels in the currently active graph and feeds both navigation primitives: jump directly to one entity (`pushFocus`) or open a pre-filtered set.

```
┌──────────────────────────────────────────────────────────────┐
│  Search in People graph                              ⌘K   │
├──────────────────────────────────────────────────────────────┤
│  🔍  Alan…                                                │
├──────────────────────────────────────────────────────────────┤
│  Entities                                                  │
│    Alan Turing          Person · Scientist    [Go →]       │
│    Alan Kay             Person · Scientist    [Go →]       │
│    Alan Mathison Turing Person                [Go →]       │
│                                                            │
│  Types containing "Alan"                                   │
│    (none)                                                  │
│                                                            │
│  Browse as set                                             │
│    All entities with label containing "Alan"  [Set →]      │
└──────────────────────────────────────────────────────────────┘
```

**Keyboard behaviour:**
- `↑` / `↓` — navigate results
- `Enter` on an entity result — `pushFocus(iri)` → Entity context
- `Enter` on "Browse as set" — Set context with label-contains facet applied
- `Escape` — close without navigating

**SPARQL behind the search** — three strategies, tried in order:

```sparql
-- Strategy 1: pg-ripple full-text search (pg:fts custom function)
SELECT DISTINCT ?entity ?label ?type WHERE {
  GRAPH <$GRAPH_IRI> {
    ?entity <$LABEL_PREDICATE> ?label .
    FILTER(<http://pg-ripple.io/fn/fts>(?label, "$QUERY"))
    OPTIONAL { ?entity rdf:type ?type }
  }
}
LIMIT 20

-- Strategy 2: full-text index (Fuseki + Jena text, Stardog, Virtuoso)
SELECT ?entity ?label ?type WHERE {
  (?entity ?score) text:query "$QUERY" .
  ?entity <$LABEL_PREDICATE> ?label .
  OPTIONAL { ?entity rdf:type ?type }
}
ORDER BY DESC(?score)
LIMIT 20

-- Strategy 3: CONTAINS fallback (all SPARQL 1.1 endpoints)
SELECT DISTINCT ?entity ?label ?type WHERE {
  GRAPH <$GRAPH_IRI> {
    ?entity <$LABEL_PREDICATE> ?label .
    FILTER(CONTAINS(LCASE(STR(?label)), LCASE("$QUERY")))
    OPTIONAL { ?entity rdf:type ?type }
  }
}
LIMIT 20
```

**Server Action:**

```typescript
// app/actions/graph.ts
export async function searchLabels(
  endpointId: string,
  graphIRI: string | null,
  query: string,
): Promise<SearchResult[]> {
  const endpoint = await resolveEndpoint(endpointId);
  // pg-ripple endpoints get fast full-text search via pg:fts()
  if (endpoint.capabilities?.isPgRipple) {
    return await runPgRippleFtsSearch(endpoint, graphIRI, query);
  }
  try {
    return await runTextIndexSearch(endpoint, graphIRI, query);  // fast path
  } catch {
    return await runContainsSearch(endpoint, graphIRI, query);   // fallback
  }
}

interface SearchResult {
  iri: string;
  label: string;
  type?: string;
  typeLabel?: string;
}
```

Search fires after a **200 ms debounce**. Results cached with `dedupingInterval: 1000` in a `useSearch` SWR hook. The top-bar search input and the `⌘K` shortcut both open the same Command palette component.

### 4.9 Narrative Context Header

Every view shows a **prose context header** — a human-readable description generated from the navigation stack. It replaces opaque trails like `Alan Turing › Layer 1 › 3 filters` with language that communicates the *meaning* of the current view. No extra SPARQL query is needed; labels come from the `LabelCache` populated during normal fetch operations.

**Generated examples:**

| Navigation path | Context header |
|---|---|
| Entered Scientists class | **"Scientists"** |
| + filtered Decade = 1940s | **"1940s Scientists"** |
| + filtered Country = UK | **"UK 1940s Scientists"** |
| → `traverseVia(birthPlace)` | **"Birthplaces of UK 1940s Scientists"** |
| → `traverseVia(country)` | **"Countries of birthplaces of UK 1940s Scientists"** |
| Clicked Alan Turing card | **"Alan Turing"** |
| Back to previous set | **"UK 1940s Scientists"** (exact state restored) |

**Generation logic:**

```typescript
// lib/context-header.ts
export function buildContextHeader(
  stack: LensFrame[],
  pointer: number,
  labels: LabelCache,
): string {
  const frame = stack[pointer];

  if (frame.context === "graphs")        return "";
  if (frame.context === "types")         return `Types in ${labels.graph(frame.graphIRI)}`;
  if (frame.context === "entity")        return labels.entity(frame.focusIRI) ?? shortIRI(frame.focusIRI);
  if (frame.context === "relationships") {
    const parent = pointer > 0 ? buildContextHeader(stack, pointer - 1, labels) : "Current set";
    return `Relationships on ${parent}`;
  }

  // Set context: compose phrase from class + facets + traversal
  let base = frame.focusClass
    ? pluralise(labels.class(frame.focusClass))   // "Scientists"
    : "Resources";

  const facetPhrases = Object.entries(frame.facets)
    .filter(([dim]) => dim !== "rdf:type")        // class already captured in base
    .flatMap(([, vals]) => vals.map((v) => labels.value(v) ?? shortIRI(v)));

  if (facetPhrases.length) {
    base = `${facetPhrases.join(", ")} ${base}`;  // "1940s UK Scientists"
  }

  if (frame.navigationPredicate && pointer > 0) {
    const predLabel = labels.predicate(frame.navigationPredicate);
    const parentHeader = buildContextHeader(stack, pointer - 1, labels);
    return `${predLabel} of ${parentHeader}`;     // "Birthplaces of UK 1940s Scientists"
  }

  return base;
}
```

### 4.10 Empty States

Three distinct empty states, each with its own cause and recovery actions.

**A. No entities via traversal** — the predicate exists but none of the current set's entities have it:

```
┌───────────────────────────────────────────────────────┐
│  [← Back]                                                │
│  Awards of 1940s Scientists                              │
│                                                          │
│  No results                                              │
│                                                          │
│  dbo:award connects to 0 entities within the current    │
│  set of "1940s Scientists" (18 entities).               │
│  The predicate exists in this graph but none of the     │
│  current entities have this relationship.               │
│                                                          │
│  [← Back to 1940s Scientists]                           │
│  [Browse all relationships →]                           │
└───────────────────────────────────────────────────────┘
```

**B. No entities after facet combination** — active filters produce an empty intersection:

```
┌───────────────────────────────────────────────────────┐
│  No results match all active filters                     │
│                                                          │
│  0 Scientists are both from the 1960s and from          │
│  New Zealand.                                            │
│                                                          │
│  Active filters:  Decade: 1960s [✕]  Country: NZ [✕]   │
│                                                          │
│  Removing one filter may restore results:               │
│  • Remove "1960s"        →  2 results (from NZ)         │
│  • Remove "New Zealand"  →  7 results (in 1960s)        │
│                                                          │
│  [Clear all filters]                                     │
└───────────────────────────────────────────────────────┘
```

The suggestions (up to 3) are computed by rerunning the query with each active filter removed in parallel:

```typescript
export async function suggestFilterRemovals(
  endpointId: string,
  focusIRI: string,
  graphIRI: string | null,
  layer: number,
  activeFacets: Record<string, string[]>,
): Promise<Array<{ removedDim: string; removedVal: string; resultCount: number }>>
```

**C. Empty graph or introspection failure:**

```
┌───────────────────────────────────────────────────────┐
│  [← Back to graphs]                                      │
│                                                          │
│  Nothing found in this graph                            │
│  http://example.org/my-graph                            │
│                                                          │
│  Either the graph is empty or introspection did not     │
│  complete successfully.                                  │
│                                                          │
│  [↺ Re-run introspection]   [← Back to graphs]          │
└───────────────────────────────────────────────────────┘
```

---

## 5. Integration & Performance

### 5.1 Data Fetching Architecture

```
User toggles facet value
  → Zustand mutates current LensFrame
    → SWR key changes (serialized lens)
      → Server Action fires SPARQL query
        → Fuseki returns binding stream
          → Transform to EntityData[]
            → SWR delivers to client
              → Framer Motion animates set diff
```

**Two concurrent queries per navigation step:**

| Query | Purpose | Cache TTL |
|---|---|---|
| `fetchEntitySet(focus, layer, facets)` | Entity cards for current view | 30 s |
| `fetchFacetCounts(focus, layer, facets)` | Facet value counts + availability | 30 s |

### 5.2 Server Action

```typescript
// app/actions/graph.ts
"use server";

import { QueryEngine } from "@comunica/query-sparql";

const engine = new QueryEngine();

export async function fetchEntitySet(
  endpointId: string,
  focusIRI: string,
  graphIRI: string | null,
  layer: number,
  facets: Record<string, string[]>
): Promise<EntityData[]> {
  const endpoint = await resolveEndpoint(endpointId);
  const query = buildLayerQuery({ focusIRI, graphIRI, layer, facets, labelPredicate: endpoint.labelPredicate });
  const stream = await engine.queryBindings(query, {
    sources: [{ type: "sparql", value: endpoint.sparqlUrl }],
    httpAuth: endpoint.auth ? buildAuthHeader(endpoint.auth) : undefined,
  });
  const bindings = await stream.toArray({ limit: 100 });
  return bindings.map(bindingToEntity);
}

// Introspection actions
export async function introspectEndpoint(
  config: EndpointConfig
): Promise<GraphSummary[]> {
  const graphs = await listGraphs(config);
  const summaries = await Promise.all(
    graphs.map((g) => introspectGraph(config, g.iri, g.tripleCount))
  );
  await cacheIntrospection(config.id, summaries);
  return summaries;
}

export async function fetchEntityPredicates(
  endpointId: string,
  entityIRI: string,
  graphIRI: string | null
): Promise<PredicateValue[]> {
  const endpoint = await resolveEndpoint(endpointId);
  const query = buildPredicateQuery(entityIRI, graphIRI);
  const stream = await engine.queryBindings(query, {
    sources: [{ type: "sparql", value: endpoint.sparqlUrl }],
  });
  const bindings = await stream.toArray({ limit: 500 });
  return bindings.map(bindingToPredicateValue);
}

export async function fetchFacetCounts(
  endpointId: string,
  focusIRI: string,
  graphIRI: string | null,
  layer: number,
  activeFacets: Record<string, string[]>,
  facetDefs: FacetDefinition[]          // derived from introspection, not hardcoded
): Promise<Record<string, FacetValue[]>> {
  const endpoint = await resolveEndpoint(endpointId); // fetches config server-side
  const results = await Promise.all(
    facetDefs.map((def) =>
      fetchSingleFacetCounts(endpoint, focusIRI, graphIRI, layer, activeFacets, def)
    )
  );
  return Object.fromEntries(facetDefs.map((def, i) => [def.id, results[i]]));
}
```

### 5.3 SWR Client Hook

```typescript
// hooks/useEntitySet.ts
"use client";

import useSWR from "swr";
import { fetchEntitySet } from "@/app/actions/graph";
import { useNavigationStore } from "@/stores/navigation-store";
import type { EntityNode } from "@/lib/types";

export function useEntitySet() {
  const frame = useNavigationStore((s) => s.current);

  // Only fire the query when we're in a context that shows an entity set
  const isSetContext = frame.context === "set" || frame.context === "entity";
  const key = (isSetContext && frame.endpointId)
    ? `entities:${frame.endpointId}:${frame.graphIRI}:${frame.context}:${frame.focusIRI}:${frame.navigationPredicate ?? ""}:${frame.activeLayer}:${JSON.stringify(frame.facets)}`
    : null;

  return useSWR<EntityNode[]>(
    key,
    () => fetchEntitySet(frame.endpointId, frame.focusIRI, frame.graphIRI, frame.activeLayer, frame.facets, frame.navigationPredicate),
    {
      keepPreviousData: true,   // old set stays visible while new query runs
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );
}
```

### 5.4 Performance Budget

| Concern | Strategy |
|---|---|
| SPARQL latency | `LIMIT 100` per layer; indexed predicates in TDB2 |
| Facet count queries | Parallel `Promise.all` server-side; lightweight aggregates |
| Re-render cost | `keepPreviousData` prevents unmount/remount; only changed cards re-render |
| Bundle size | Comunica stays server-side (never shipped to browser); Framer Motion ~34 KB |
| First paint | SSR the focus entity (layer 0) as a React Server Component — no loading state |

---

## 6. Code Prototype Outline

### 6.1 File Structure

```
app/
├── layout.tsx
├── page.tsx                         # Graphs browser (endpoint overview)
├── endpoint/
│   ├── new/page.tsx                 # Add endpoint form
│   └── [endpointId]/
│       ├── page.tsx                 # Named graphs list for this endpoint
│       ├── graph/[graphId]/
│       │   └── page.tsx             # Faceted entity browser for one named graph
│       └── entity/[iri]/page.tsx   # SSR: focus entity detail (layer 0)
├── actions/
│   ├── graph.ts                     # fetchEntitySet, fetchFacetCounts, fetchEntityPredicates
│   ├── introspect.ts                # introspectEndpoint, listGraphs, introspectGraph
│   └── endpoint.ts                  # CRUD for endpoint configs (server-side storage)
components/
├── endpoint/
│   ├── EndpointList.tsx             # Landing page: registered endpoints
│   ├── EndpointCard.tsx             # Single endpoint summary
│   ├── EndpointForm.tsx             # Add/edit endpoint URL + auth
│   └── GraphsBrowser.tsx            # Named graphs list with stats
├── graphs/
│   ├── GraphCard.tsx                # Single named graph: triple count, top types
│   └── GraphStats.tsx               # Predicate/class breakdown panel
├── navigation/
│   ├── LensBreadcrumb.tsx
│   ├── LayerSelector.tsx
│   └── BackForwardControls.tsx
├── facets/
│   ├── FacetSidebar.tsx
│   ├── FacetGroup.tsx
│   ├── FacetValueChip.tsx
│   └── FacetCommandPalette.tsx
├── entities/
│   ├── EntitySet.tsx
│   ├── EntityCard.tsx
│   ├── EntityDetail.tsx
│   ├── PredicateTable.tsx           # All predicates on the focus entity
│   └── EntitySetStatus.tsx
├── ui/
hooks/
├── useEntitySet.ts
├── useFacetCounts.ts
├── useIntrospection.ts              # SWR hook for graph summary cache
├── useEndpointStore.ts
└── useKeyboardShortcuts.ts
stores/
└── navigation-store.ts              # Extended: endpointId + graphIRI in LensFrame
lib/
├── sparql.ts                        # Query builders (graph-scoped)
├── introspection.ts                 # Meta-query runners + data types
├── facet-generator.ts               # PredicateSummary → FacetDefinition[]
├── endpoint.ts                      # EndpointConfig type + auth helpers
└── layer-config.ts
```

### 6.2 Navigation Store (Zustand)

```typescript
// stores/navigation-store.ts
import { create } from "zustand";

type NavigationContext =
  | "graphs" | "types" | "relationships" | "set" | "entity";

interface LensFrame {
  endpointId: string;           // which registered endpoint
  graphIRI: string | null;      // null = default graph
  context: NavigationContext;   // which view is active
  focusIRI: string;             // non-empty only when context == "entity"
  focusClass?: string;          // class IRI when context == "types" or class-filtered set
  navigationPredicate?: string; // predicate IRI when arrived via traverseVia
  activeLayer: number;
  facets: Record<string, string[]>;
}

interface NavigationStore {
  stack: LensFrame[];
  pointer: number;
  get current(): LensFrame;
  get canBack(): boolean;
  get canForward(): boolean;
  pushFocus: (iri: string) => void;                              // resource-to-resource
  traverseVia: (predicateIRI: string) => void;                  // set-to-set
  setClass: (classIRI: string) => void;                         // types context → set context
  setGraph: (endpointId: string, graphIRI: string | null) => void;
  browseTypes: () => void;                                      // enter Types context
  browseRelationships: () => void;                              // enter Relationships context
  setLayer: (layer: number) => void;
  toggleFacet: (dim: string, value: string) => void;
  clearFacet: (dim: string) => void;
  clearAllFacets: () => void;
  back: () => void;
  forward: () => void;
}

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  stack: [{ endpointId: "", graphIRI: null, context: "graphs", focusIRI: "", activeLayer: 1, facets: {} }],
  pointer: 0,

  get current() { return get().stack[get().pointer]; },
  get canBack()    { return get().pointer > 0; },
  get canForward() { return get().pointer < get().stack.length - 1; },

  // Navigate to a new entity — pushes new frame, inherits endpoint+graph+facets
  pushFocus: (iri) =>
    set((s) => {
      const prev = s.stack[s.pointer];
      const newFrame: LensFrame = {
        endpointId: prev.endpointId,
        graphIRI: prev.graphIRI,
        context: "entity",
        focusIRI: iri,
        activeLayer: 1,
        facets: prev.facets,
      };
      const newStack = [...s.stack.slice(0, s.pointer + 1), newFrame];
      return { stack: newStack, pointer: newStack.length - 1 };
    }),

  // Set-to-set traversal via a predicate — the current set becomes the source
  traverseVia: (predicateIRI) =>
    set((s) => {
      const prev = s.stack[s.pointer];
      const newFrame: LensFrame = {
        endpointId: prev.endpointId,
        graphIRI: prev.graphIRI,
        context: "set",
        focusIRI: "",
        navigationPredicate: predicateIRI,
        activeLayer: 1,
        facets: {},
      };
      const newStack = [...s.stack.slice(0, s.pointer + 1), newFrame];
      return { stack: newStack, pointer: newStack.length - 1 };
    }),

  // Enter a set pre-filtered to a specific class (from Types browser)
  setClass: (classIRI) =>
    set((s) => {
      const prev = s.stack[s.pointer];
      const newFrame: LensFrame = {
        endpointId: prev.endpointId,
        graphIRI: prev.graphIRI,
        context: "set",
        focusIRI: "",
        focusClass: classIRI,
        activeLayer: 1,
        facets: { "rdf:type": [classIRI] },
      };
      const newStack = [...s.stack.slice(0, s.pointer + 1), newFrame];
      return { stack: newStack, pointer: newStack.length - 1 };
    }),

  // Switch to a different named graph — pushes new frame, clears entity + facets
  setGraph: (endpointId, graphIRI) =>
    set((s) => {
      const newFrame: LensFrame = {
        endpointId,
        graphIRI,
        context: "types",
        focusIRI: "",
        activeLayer: 1,
        facets: {},
      };
      const newStack = [...s.stack.slice(0, s.pointer + 1), newFrame];
      return { stack: newStack, pointer: newStack.length - 1 };
    }),

  // Enter Types browser context for the current graph
  browseTypes: () =>
    set((s) => {
      const prev = s.stack[s.pointer];
      const newFrame: LensFrame = {
        endpointId: prev.endpointId,
        graphIRI: prev.graphIRI,
        context: "types",
        focusIRI: "",
        activeLayer: 1,
        facets: {},
      };
      const newStack = [...s.stack.slice(0, s.pointer + 1), newFrame];
      return { stack: newStack, pointer: newStack.length - 1 };
    }),

  // Enter Relationships browser context for the current graph/set
  browseRelationships: () =>
    set((s) => {
      const prev = s.stack[s.pointer];
      const newFrame: LensFrame = {
        endpointId: prev.endpointId,
        graphIRI: prev.graphIRI,
        context: "relationships",
        focusIRI: "",
        focusClass: prev.focusClass,
        activeLayer: 1,
        facets: prev.facets,
      };
      const newStack = [...s.stack.slice(0, s.pointer + 1), newFrame];
      return { stack: newStack, pointer: newStack.length - 1 };
    }),

  // Change layer depth — mutates current frame (not a push)
  setLayer: (layer) =>
    set((s) => {
      const updated = [...s.stack];
      updated[s.pointer] = { ...updated[s.pointer], activeLayer: layer };
      return { stack: updated };
    }),

  // Toggle facet value — mutates current frame (refinement, not navigation)
  toggleFacet: (dim, value) =>
    set((s) => {
      const current = s.stack[s.pointer].facets[dim] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const updated = [...s.stack];
      updated[s.pointer] = {
        ...updated[s.pointer],
        facets: { ...updated[s.pointer].facets, [dim]: next },
      };
      return { stack: updated };
    }),

  clearFacet: (dim) =>
    set((s) => {
      const { [dim]: _removed, ...rest } = s.stack[s.pointer].facets;
      const updated = [...s.stack];
      updated[s.pointer] = { ...updated[s.pointer], facets: rest };
      return { stack: updated };
    }),

  clearAllFacets: () =>
    set((s) => {
      const updated = [...s.stack];
      updated[s.pointer] = { ...updated[s.pointer], facets: {} };
      return { stack: updated };
    }),

  back:    () => set((s) => ({ pointer: Math.max(0, s.pointer - 1) })),
  forward: () => set((s) => ({ pointer: Math.min(s.stack.length - 1, s.pointer + 1) })),
}));
```

### 6.3 EntitySet Component

```tsx
// components/entities/EntitySet.tsx
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEntitySet } from "@/hooks/useEntitySet";
import { useNavigationStore } from "@/stores/navigation-store";
import { EntityCard } from "./EntityCard";
import { EntityDetail } from "./EntityDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { LAYER_DETAIL } from "@/lib/layer-config";

export function EntitySet() {
  const { data: entities, isLoading } = useEntitySet();
  const layer = useNavigationStore((s) => s.current.activeLayer);
  const detailLevel = LAYER_DETAIL[layer] ?? "headline";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (layer === 0 && entities?.[0]) {
    return <EntityDetail entity={entities[0]} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {entities?.map((entity) => (
          <motion.div
            key={entity.iri}
            layoutId={entity.iri}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <EntityCard entity={entity} detailLevel={detailLevel} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### 6.4 EntityCard (Semantic Zoom)

```tsx
// components/entities/EntityCard.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigationStore } from "@/stores/navigation-store";
import { cn } from "@/lib/utils";
import type { DetailLevel, EntityData } from "@/lib/layer-config";

interface Props {
  entity: EntityData;
  detailLevel: DetailLevel;
}

export function EntityCard({ entity, detailLevel }: Props) {
  const pushFocus = useNavigationStore((s) => s.pushFocus);

  return (
    <Card
      className="entity-card cursor-pointer transition-colors hover:bg-muted/40 border-border/60"
      data-entity-iri={entity.iri}
      onClick={() => pushFocus(entity.iri)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && pushFocus(entity.iri)}
      aria-label={`Navigate to ${entity.label}`}
    >
      <CardHeader className="p-3 pb-1">
        <CardTitle
          className={cn(
            detailLevel === "label"    && "text-xs text-muted-foreground font-normal",
            detailLevel === "headline" && "text-sm font-medium",
            detailLevel === "summary"  && "text-base font-semibold",
          )}
        >
          {entity.label}
        </CardTitle>

        {detailLevel !== "label" && entity.type && (
          <Badge variant="secondary" className="w-fit text-[10px] mt-1">
            {shortLabel(entity.type)}
          </Badge>
        )}
      </CardHeader>

      {detailLevel === "summary" && entity.abstract && (
        <CardContent className="px-3 pb-3 pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {entity.abstract}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function shortLabel(iri: string): string {
  return iri.split(/[#/]/).at(-1) ?? iri;
}
```

### 6.5 FacetGroup Component

```tsx
// components/facets/FacetGroup.tsx
"use client";

import { useFacetCounts } from "@/hooks/useFacetCounts";
import { useNavigationStore } from "@/stores/navigation-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FacetDefinition } from "@/lib/layer-config";

export function FacetGroup({ facet }: { facet: FacetDefinition }) {
  const { data: values } = useFacetCounts(facet.id);
  const { current: frame, toggleFacet } = useNavigationStore();
  const active = frame.facets[facet.id] ?? [];

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
        {facet.label}
      </h3>
      <div className="flex flex-col gap-0.5">
        {values?.map((v) => (
          <button
            key={v.value}
            onClick={() => toggleFacet(facet.id, v.value)}
            disabled={!v.available && !active.includes(v.value)}
            className={cn(
              "flex items-center justify-between px-2 py-1 rounded text-sm text-left transition-colors",
              active.includes(v.value)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground",
              !v.available && !active.includes(v.value) && "opacity-30 cursor-not-allowed"
            )}
          >
            <span className="truncate">{v.label}</span>
            <Badge
              variant={active.includes(v.value) ? "secondary" : "outline"}
              className="ml-2 text-[10px] tabular-nums shrink-0"
            >
              {v.count}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 6.6 PredicateTable Component (Entity Detail)

Shown at layer 0. Displays every predicate and value on the focus entity. IRI-valued objects render as clickable navigation links. Literal values render as plain text. This component requires no knowledge of the schema — it works generically against any endpoint.

```tsx
// components/entities/PredicateTable.tsx
"use client";

import useSWR from "swr";
import { fetchEntityPredicates } from "@/app/actions/graph";
import { useNavigationStore } from "@/stores/navigation-store";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface PredicateValue {
  predicate: string;
  predLabel: string;
  value: string;
  valueLabel: string;
  valueIsIRI: boolean;
}

interface Props {
  entityIRI: string;
}

export function PredicateTable({ entityIRI }: Props) {
  const { current: frame, pushFocus } = useNavigationStore();
  const key = `predicates:${frame.endpointId}:${frame.graphIRI}:${entityIRI}`;

  const { data: rows } = useSWR<PredicateValue[]>(
    key,
    () => fetchEntityPredicates(frame.endpointId, entityIRI, frame.graphIRI),
    { revalidateOnFocus: false }
  );

  if (!rows?.length) return null;

  // Group rows by predicate for display
  const grouped = rows.reduce<Record<string, PredicateValue[]>>((acc, row) => {
    const key = row.predicate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <dl className="mt-4 space-y-2 text-sm">
      {Object.entries(grouped).map(([predIRI, values]) => (
        <div key={predIRI} className="grid grid-cols-[200px_1fr] gap-2 items-start">
          <dt className="text-muted-foreground truncate font-mono text-xs pt-0.5" title={predIRI}>
            {values[0].predLabel || shortIRI(predIRI)}
          </dt>
          <dd className="space-y-0.5">
            {values.map((v, i) => (
              v.valueIsIRI ? (
                <Button
                  key={i}
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-sm font-normal"
                  onClick={() => pushFocus(v.value)}
                  title={v.value}
                >
                  {v.valueLabel || shortIRI(v.value)}
                </Button>
              ) : (
                <span key={i} className="block">{v.value}</span>
              )
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function shortIRI(iri: string): string {
  return iri.split(/[#/]/).at(-1) ?? iri;
}
```

### 6.7 GraphCard Component (Graphs Browser)

```tsx
// components/graphs/GraphCard.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigationStore } from "@/stores/navigation-store";
import type { GraphSummary } from "@/lib/introspection";

export function GraphCard({ graph, endpointId }: { graph: GraphSummary; endpointId: string }) {
  const setGraph = useNavigationStore((s) => s.setGraph);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono font-medium truncate" title={graph.iri}>
          {graph.label || graph.iri}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {graph.tripleCount.toLocaleString()} triples
          · {graph.predicates.length} predicates
          · {graph.classes.length} classes
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex flex-wrap gap-1">
          {graph.classes.slice(0, 5).map((cls) => (
            <Badge key={cls.iri} variant="secondary" className="text-[10px]">
              {cls.label} ({cls.instanceCount.toLocaleString()})
            </Badge>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setGraph(endpointId, graph.iri)}
        >
          Browse this graph →
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 7. Sample Query Logic

### 7.1 Layered Retrieval with Facet Filters (SPARQL)

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dbo:  <http://dbpedia.org/ontology/>

# Parameters: $FOCUS (IRI), $LAYER (-2 to 3)
# The layer pattern block is chosen at build time based on $LAYER.

SELECT DISTINCT ?entity ?label ?type ?abstract WHERE {

  # Layer pattern (one of the following, injected at build time):
  #
  # Layer  0: BIND(<$FOCUS> AS ?entity)
  # Layer  1: <$FOCUS> ?_p ?entity . FILTER(isIRI(?entity))
  # Layer  2: <$FOCUS> ?_p1 ?_mid . ?_mid ?_p2 ?entity .
  #           FILTER(isIRI(?entity) && ?entity != <$FOCUS>)
  # Layer -1: ?entity ?_p <$FOCUS> . FILTER(isIRI(?entity))
  # Layer -2: ?_mid ?_p1 <$FOCUS> . ?entity ?_p2 ?_mid .
  #           FILTER(isIRI(?entity) && ?entity != <$FOCUS>)

  OPTIONAL { ?entity rdfs:label   ?label    . FILTER(lang(?label)    = "en") }
  OPTIONAL { ?entity rdf:type     ?type                                      }
  OPTIONAL { ?entity dbo:abstract ?abstract . FILTER(lang(?abstract) = "en") }

  # Facet filters (appended dynamically):
  # type filter:   FILTER(?type IN (<ex:Person>, <ex:Organization>))
  # decade filter: ?entity dbo:birthYear ?yr . FILTER(?yr >= 1940 && ?yr < 1950)
}
LIMIT 100
```

### 7.2 TypeScript Query Builder

```typescript
// lib/sparql.ts

export interface QueryParams {
  focusIRI: string;
  graphIRI: string | null;       // null = query across default graph
  layer: number;
  facets: Record<string, string[]>;
  labelPredicate?: string;       // detected by introspection; defaults to rdfs:label
  limit?: number;
}

// Wrap a pattern in a GRAPH clause if a named graph is specified
function graphScope(graphIRI: string | null, pattern: string): string {
  return graphIRI ? `GRAPH <${graphIRI}> { ${pattern} }` : pattern;
}

const LAYER_PATTERNS: Record<number, (focus: string) => string> = {
  0:   (f) => `BIND(<${f}> AS ?entity)`,
  1:   (f) => `<${f}> ?_p ?entity . FILTER(isIRI(?entity))`,
  2:   (f) => `<${f}> ?_p1 ?_mid . ?_mid ?_p2 ?entity .
               FILTER(isIRI(?entity) && ?entity != <${f}>)`,
  [-1]: (f) => `?entity ?_p <${f}> . FILTER(isIRI(?entity))`,
  [-2]: (f) => `?_mid ?_p1 <${f}> . ?entity ?_p2 ?_mid .
                FILTER(isIRI(?entity) && ?entity != <${f}>)`,
};

export function buildLayerQuery({
  focusIRI, graphIRI, layer, facets,
  labelPredicate = "rdfs:label", limit = 100,
}: QueryParams): string {
  const patternFn = LAYER_PATTERNS[layer];
  if (!patternFn) throw new Error(`Unsupported layer: ${layer}`);

  const filters: string[] = [];

  const types = facets["rdf:type"];
  if (types?.length) {
    filters.push(`?entity rdf:type ?type .`);
    filters.push(`FILTER(?type IN (${types.map((t) => `<${t}>`).join(", ")}))`);
  }

  // Generic facet filters for dynamically-discovered predicates
  Object.entries(facets)
    .filter(([dim, vals]) => dim !== "rdf:type" && vals.length)
    .forEach(([dim, vals]) => {
      const varName = `?_fv_${dim.replace(/\W/g, "_")}`;
      filters.push(`?entity <${dim}> ${varName} .`);
      filters.push(`FILTER(${varName} IN (${vals.map((v) => `<${v}>`).join(", ")}))`);
    });

  const innerPattern = `
      ${patternFn(focusIRI)}
      OPTIONAL { ?entity <${labelPredicate}> ?label }
      ${filters.length ? "" : "OPTIONAL { ?entity rdf:type ?type }"}
      OPTIONAL { ?entity rdf:type ?type }
      OPTIONAL { ?entity rdfs:comment ?abstract }
      ${filters.join("\n      ")}
  `;

  return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT DISTINCT ?entity ?label ?type ?abstract WHERE {
      ${graphScope(graphIRI, innerPattern)}
    }
    LIMIT ${limit}
  `.trim();
}
```

### 7.3 Facet Count Query Builder

```typescript
export function buildFacetCountQuery(
  focusIRI: string,
  graphIRI: string | null,
  layer: number,
  activeFacets: Record<string, string[]>,
  facetDimension: string,
  sparqlPredicate: string
): string {
  const patternFn = LAYER_PATTERNS[layer];
  if (!patternFn) throw new Error(`Unsupported layer: ${layer}`);

  // Apply all OTHER active facets (cross-facet narrowing)
  const otherFilters = Object.entries(activeFacets)
    .filter(([dim]) => dim !== facetDimension && activeFacets[dim]?.length)
    .map(([_dim, values]) =>
      `FILTER(?entity IN (${values.map((v) => `<${v}>`).join(", ")}))`
    )
    .join("\n  ");

  const innerPattern = `
      ${patternFn(focusIRI)}
      ${otherFilters}
      ?entity <${sparqlPredicate}> ?facetValue .
  `;

  return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?facetValue (COUNT(DISTINCT ?entity) AS ?count) WHERE {
      ${graphScope(graphIRI, innerPattern)}
    }
    GROUP BY ?facetValue
    ORDER BY DESC(?count)
    LIMIT 50
  `.trim();
}
```

### 7.4 Predicate Query (Entity Detail View)

```typescript
// Fetches all predicates and their values for a single entity.
// Used to populate the PredicateTable in the layer-0 detail view.

export function buildPredicateQuery(
  entityIRI: string,
  graphIRI: string | null
): string {
  const innerPattern = `
    <${entityIRI}> ?predicate ?value .
    OPTIONAL { ?predicate rdfs:label ?predLabel . FILTER(lang(?predLabel) = "en") }
    OPTIONAL { ?value rdfs:label ?valueLabel . FILTER(lang(?valueLabel) = "en") }
  `;

  return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT ?predicate ?predLabel ?value ?valueLabel WHERE {
      ${graphScope(graphIRI, innerPattern)}
    }
    ORDER BY ?predicate
    LIMIT 500
  `.trim();
}
```


### 7.5 Set-Traversal Query Builder

Used when `frame.navigationPredicate` is set (context is `"set"` arrived via `traverseVia`). The source set is materialised as a `VALUES` clause for sets ≤ 500 entities; a subquery is used for larger sets to avoid large variable bindings.

```typescript
// lib/sparql.ts

export interface TraversalParams {
  sourceIRIs: string[];             // materialized current set
  predicateIRI: string;             // the predicate to traverse
  graphIRI: string | null;
  labelPredicate?: string;
  direction?: "outgoing" | "incoming";
  limit?: number;
}

export function buildSetTraversalQuery({
  sourceIRIs,
  predicateIRI,
  graphIRI,
  labelPredicate = "rdfs:label",
  direction = "outgoing",
  limit = 200,
}: TraversalParams): string {
  const valuesClause = `VALUES ?subject { ${sourceIRIs.map((i) => `<${i}>`).join(" ")} }`;
  const triplePattern = direction === "outgoing"
    ? `?subject <${predicateIRI}> ?entity .`
    : `?entity <${predicateIRI}> ?subject .`;

  const innerPattern = `
    ${valuesClause}
    ${triplePattern}
    OPTIONAL { ?entity <${labelPredicate}> ?label }
    OPTIONAL { ?entity rdf:type ?type }
  `;

  return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT DISTINCT ?entity ?label ?type WHERE {
      ${graphScope(graphIRI, innerPattern)}
      FILTER(?entity NOT IN (${sourceIRIs.slice(0, 50).map((i) => `<${i}>`).join(", ")}))
    }
    LIMIT ${limit}
  `.trim();
}

// For large source sets, replace VALUES with a subquery
export function buildSetTraversalSubquery({
  sourceQueryPattern,   // SPARQL pattern string that selects ?entity as the source
  predicateIRI,
  graphIRI,
  labelPredicate = "rdfs:label",
  direction = "outgoing",
  limit = 200,
}: Omit<TraversalParams, "sourceIRIs"> & { sourceQueryPattern: string }): string {
  const triplePattern = direction === "outgoing"
    ? `?source <${predicateIRI}> ?entity .`
    : `?entity <${predicateIRI}> ?source .`;

  const innerPattern = `
    { SELECT DISTINCT ?source WHERE { ${sourceQueryPattern} } }
    ${triplePattern}
    OPTIONAL { ?entity <${labelPredicate}> ?label }
    OPTIONAL { ?entity rdf:type ?type }
  `;

  return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT DISTINCT ?entity ?label ?type WHERE {
      ${graphScope(graphIRI, innerPattern)}
    }
    LIMIT ${limit}
  `.trim();
}
```

The `fetchEntitySet` Server Action dispatches to `buildSetTraversalQuery` when the frame has a `navigationPredicate`:

```typescript
// In app/actions/graph.ts — extended dispatch logic

export async function fetchEntitySet(
  endpointId: string,
  focusIRI: string,
  graphIRI: string | null,
  layer: number,
  facets: Record<string, string[]>,
  navigationPredicate?: string,       // set-to-set traversal
): Promise<EntityData[]> {
  const endpoint = await resolveEndpoint(endpointId);

  let query: string;
  if (navigationPredicate) {
    // The source set is passed as the previously-loaded entity IRIs.
    // The caller fetches them from the SWR cache before invoking this action.
    // For large sets the subquery variant is preferred — that logic lives in the hook.
    query = buildSetTraversalQuery({
      sourceIRIs: facets["__sourceSet__"] ?? [],  // special pseudo-facet carrying source IRIs
      predicateIRI: navigationPredicate,
      graphIRI,
      labelPredicate: endpoint.labelPredicate,
    });
  } else {
    query = buildLayerQuery({ focusIRI, graphIRI, layer, facets, labelPredicate: endpoint.labelPredicate });
  }

  const stream = await engine.queryBindings(query, {
    sources: [{ type: "sparql", value: endpoint.sparqlUrl }],
    httpAuth: endpoint.auth ? buildAuthHeader(endpoint.auth) : undefined,
  });
  const bindings = await stream.toArray({ limit: 200 });
  return bindings.map(bindingToEntity);
}
```

### 7.6 pg-ripple Datalog Rules (SQL-level)

When navigating a pg-ripple endpoint, the application benefits from Datalog-derived triples that are transparently available via standard SPARQL. The rules below are loaded via `pg_ripple.load_rules()` and materialised into the triple store with `pg_ripple.infer()`. They show how Datalog enriches the graph that moire navigates.

```sql
-- Transitive management chain — moire's layer traversal follows this automatically
SELECT pg_ripple.load_rules(
  '?x ex:indirectManager ?z :- ?x ex:manager ?z .
   ?x ex:indirectManager ?z :- ?x ex:manager ?y, ?y ex:indirectManager ?z .',
  'org_rules'
);
SELECT pg_ripple.infer('org_rules');

-- Co-authorship inference — surfaced in Relationships Browser as a navigable predicate
SELECT pg_ripple.load_rules(
  '?a ex:coAuthor ?b :- ?paper dct:creator ?a, ?paper dct:creator ?b .
   NOT ?a = ?b .',
  'biblio_rules'
);
SELECT pg_ripple.infer('biblio_rules');

-- RDFS entailment — makes the Types Browser show the full inferred class hierarchy
SELECT pg_ripple.load_rules_builtin('rdfs');
SELECT pg_ripple.infer('rdfs');

-- OWL RL reasoning — enables symmetric/transitive property expansion in set traversal
SELECT pg_ripple.load_rules_builtin('owl-rl');
SELECT pg_ripple.infer('owl-rl');
```

Once materialised, these derived triples (`source = 1`) appear alongside explicit triples in all SPARQL queries. Moire's faceted navigation, set traversal, and entity detail views automatically surface them — no special query modifications needed.

**Goal-directed inference** for on-demand navigation:

```sql
-- Only derive facts relevant to a specific entity (50–90% less work)
SELECT pg_ripple.infer_goal(
  '<https://example.org/alice>',
  '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>',
  NULL
);

-- Demand-filtered: derive only facts needed for multiple goals at once
SELECT pg_ripple.infer_demand('rdfs', '[
  {"p": "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>"},
  {"s": "<https://example.org/paper/42>"}
]'::jsonb);
```

### 7.7 Datomic / Stardog Datalog Equivalent

```clojure
;; Recursive depth rules for Datomic Datalog
[:find ?entity ?label ?hops
 :in $ ?focus %
 :where
 (reachable ?focus ?entity ?hops)
 [?entity :rdfs/label ?label]]

;; Rule set (hops = absolute graph distance; direction tracked separately)
[[(reachable ?focus ?entity 0)
  [(= ?entity ?focus)]]

 [(reachable ?focus ?entity 1)
  [?focus ?_rel ?entity]
  [(not= ?entity ?focus)]]

 [(reachable ?focus ?entity 2)
  [?focus ?_r1 ?mid]
  [?mid ?_r2 ?entity]
  [(not= ?entity ?focus)]
  [(not= ?entity ?mid)]]

 ;; Ancestors (incoming direction)
 [(ancestor ?focus ?entity 1)
  [?entity ?_rel ?focus]
  [(not= ?entity ?focus)]]]
```

---

## 8. Accessibility Strategy

### 8.1 Keyboard Navigation

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move through cards and facet chips |
| `Enter` on a card | Navigate to that entity (push to lens stack) |
| `Enter` on a facet chip | Toggle that facet value |
| `Alt+←` | Back in lens stack |
| `Alt+→` | Forward in lens stack |
| `⌘K` / `Ctrl+K` | Open facet command palette |
| `1`–`5` | Quick-select layer depth (−2 through +2) |
| `Escape` | Close command palette |

### 8.2 Screen Reader Semantics

```tsx
<nav aria-label="Entity set">
  {/* Live region announces result count changes */}
  <p aria-live="polite" aria-atomic="true" className="sr-only">
    {isValidating ? "Loading" : `${entities.length} entities, ${activeFacetCount} filters active`}
  </p>

  <ul role="list" aria-label={`Layer ${layer}: ${LAYER_DESCRIPTIONS[layer]}`}>
    {entities.map((e) => (
      <li key={e.iri}>
        <EntityCard entity={e} detailLevel={detailLevel} />
      </li>
    ))}
  </ul>
</nav>

<aside aria-label="Navigation facets">
  <h2 className="sr-only">Filter results by facet</h2>
  {facetGroups.map((f) => <FacetGroup key={f.id} facet={f} />)}
</aside>
```

### 8.3 No Motion Concerns

Because the UI has no scroll-driven animations or parallax effects, `prefers-reduced-motion` only needs to suppress the Framer Motion card transitions. A single global setting handles this:

```typescript
// hooks/useReducedMotion.ts
export function useReducedMotion(): boolean {
  return typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}
```

```tsx
// In EntitySet.tsx
const reduced = useReducedMotion();

<motion.div
  layoutId={reduced ? undefined : entity.iri}  // disable shared-element if reduced
  transition={reduced ? { duration: 0 } : { duration: 0.15 }}
>
```

---

## Key Design Decisions (Summary)

| Decision | Rationale |
|---|---|
| No scroll-driven animation | Navigation is set-based; layer changes are discrete user actions |
| No CSS 3D / no visual depth | UI is flat text and cards; depth is conceptual, not spatial |
| Framer Motion `layoutId` | Card continuity across facet changes is the visual expression of the parallax metaphor — same entity, different positional context |
| Lens stack as navigation primitive | Enables Back/Forward and facet inheritance across focus traversals |
| Facet counts on every query | Immediately shows which values are available; prevents dead-end filters |
| Two parallel queries per step | Entity set and facet counts fetched concurrently from server |
| `keepPreviousData` in SWR | Old set stays on screen while new query runs — no flash of empty content |
| SSR layer 0 | Focus entity renders as React Server Component on first load; no loading state |
| Any SPARQL 1.1 endpoint | Endpoint URL is user-supplied at runtime; no build-time schema assumptions |
| pg-ripple as primary target | Full W3C SPARQL 1.1 + Datalog reasoning + SHACL validation + vector search; richest feature surface for navigation |
| Progressive capability enablement | pg-ripple features (FTS, similarity search, inferred types, SHACL hints) are auto-detected and enabled; core navigation works against any endpoint |
| Content negotiation for pg-ripple | JSON-LD via `Accept: application/ld+json` for CONSTRUCT; SPARQL Results JSON for SELECT; Turtle for export |
| Runtime introspection | Facets, labels, and graph lists are discovered via meta-queries, not hardcoded |
| Named graph scope in every query | `GRAPH <iri> { ... }` wrapper applied when a graph is selected; defaults to querying all graphs otherwise |
| Credentials server-side only | Comunica runs in Server Actions only; auth headers never reach the browser |
| `LensFrame` carries `endpointId` + `graphIRI` | Context is self-contained; multiple endpoints or graphs can coexist in one session history |
| Layer selector hidden in Set context | Layers are well-defined only from a single focus entity; in Set context, `traverseVia` + facets are the correct navigation primitives |
| Narrative context header from stack | Replaces opaque breadcrumbs with generated prose ("Birthplaces of UK 1940s Scientists"); no extra SPARQL queries needed |
| `⌘K` search with text-index + CONTAINS fallback | Works against any SPARQL 1.1 endpoint; automatically upgrades to full-text index when one is available |
| Jump via strip in Set and Entity views | Top navigation-candidate predicates surfaced inline; reduces traversal to one click without requiring the Relationships Browser |
| Structural predicates hidden by default | `owl:sameAs`, `rdf:type`, etc. are schema plumbing; separating them reduces noise in traversal and facet views |
| Empty state B computes filter-removal suggestions | Parallel SPARQL reruns with each active filter removed; gives the user actionable recovery options instead of a dead end |

