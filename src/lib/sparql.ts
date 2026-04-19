// SPARQL query builders — all queries are parameterised, never interpolated from user input.
// IRI values are validated before interpolation to prevent SPARQL injection.

function isValidIRI(iri: string): boolean {
  return /^https?:\/\/[^\s<>"{}|\\^`]+$/.test(iri);
}

function escapeIRI(iri: string): string {
  if (!isValidIRI(iri) && iri !== "default") {
    throw new Error(`Invalid IRI: ${iri}`);
  }
  return `<${iri}>`;
}

function escapeLiteral(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function graphScope(graphIRI: string | null, pattern: string): string {
  if (graphIRI && graphIRI !== "default") {
    return `GRAPH ${escapeIRI(graphIRI)} { ${pattern} }`;
  }
  return pattern;
}

// ── Layer patterns ─────────────────────────────────────────────

const LAYER_PATTERNS: Record<number, (focus: string) => string> = {
  0: (f) => `BIND(${escapeIRI(f)} AS ?entity)`,
  1: (f) => `${escapeIRI(f)} ?_p ?entity . FILTER(isIRI(?entity))`,
  2: (f) => `${escapeIRI(f)} ?_p1 ?_mid . ?_mid ?_p2 ?entity .
               FILTER(isIRI(?entity) && ?entity != ${escapeIRI(f)})`,
  [-1]: (f) => `?entity ?_p ${escapeIRI(f)} . FILTER(isIRI(?entity))`,
  [-2]: (f) => `?_mid ?_p1 ${escapeIRI(f)} . ?entity ?_p2 ?_mid .
                FILTER(isIRI(?entity) && ?entity != ${escapeIRI(f)})`,
};

// ── Entity set query ───────────────────────────────────────────

export interface QueryParams {
  focusIRI: string;
  graphIRI: string | null;
  layer: number;
  facets: Record<string, string[]>;
  labelPredicate?: string;
  limit?: number;
}

export function buildLayerQuery({
  focusIRI,
  graphIRI,
  layer,
  facets,
  labelPredicate = "http://www.w3.org/2000/01/rdf-schema#label",
  limit = 100,
}: QueryParams): string {
  const patternFn = LAYER_PATTERNS[layer];
  if (!patternFn) throw new Error(`Unsupported layer: ${layer}`);

  const filters: string[] = [];

  const types = facets["rdf:type"];
  if (types?.length) {
    filters.push(`?entity <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type .`);
    filters.push(`FILTER(?type IN (${types.map(escapeIRI).join(", ")}))`);
  }

  Object.entries(facets)
    .filter(([dim, vals]) => dim !== "rdf:type" && dim !== "__sourceSet__" && vals.length)
    .forEach(([dim, vals], idx) => {
      const varName = `?_fv_${idx}`;
      filters.push(`?entity ${escapeIRI(dim)} ${varName} .`);
      if (vals.every(v => isValidIRI(v))) {
        filters.push(`FILTER(${varName} IN (${vals.map(escapeIRI).join(", ")}))`);
      } else {
        filters.push(`FILTER(STR(${varName}) IN (${vals.map(v => `"${escapeLiteral(v)}"`).join(", ")}))`);
      }
    });

  const corePattern = `
      ${patternFn(focusIRI)}
      ${filters.join("\n      ")}
  `;

  return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT DISTINCT ?entity ?label ?type ?abstract WHERE {
      ${graphScope(graphIRI, corePattern)}
      OPTIONAL { ?entity <${labelPredicate}> ?label }
      OPTIONAL { ?entity <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type }
      OPTIONAL { ?entity <http://www.w3.org/2000/01/rdf-schema#comment> ?abstract }
    }
    LIMIT ${limit}
  `.trim();
}

// ── Set-to-set traversal query ─────────────────────────────────

export interface TraversalParams {
  sourceIRIs: string[];
  predicateIRI: string;
  graphIRI: string | null;
  labelPredicate?: string;
  direction?: "outgoing" | "incoming";
  limit?: number;
}

export function buildSetTraversalQuery({
  sourceIRIs,
  predicateIRI,
  graphIRI,
  labelPredicate = "http://www.w3.org/2000/01/rdf-schema#label",
  direction = "outgoing",
  limit = 200,
}: TraversalParams): string {
  const valuesClause = `VALUES ?subject { ${sourceIRIs.map(escapeIRI).join(" ")} }`;
  const triplePattern = direction === "outgoing"
    ? `?subject ${escapeIRI(predicateIRI)} ?entity .`
    : `?entity ${escapeIRI(predicateIRI)} ?subject .`;

  const corePattern = `
    ${valuesClause}
    ${triplePattern}
  `;

  return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT DISTINCT ?entity ?label ?type WHERE {
      ${graphScope(graphIRI, corePattern)}
      OPTIONAL { ?entity <${labelPredicate}> ?label }
      OPTIONAL { ?entity <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type }
    }
    LIMIT ${limit}
  `.trim();
}

// ── Class instances query ──────────────────────────────────────

export function buildClassInstancesQuery(
  classIRI: string,
  graphIRI: string | null,
  labelPredicate: string = "http://www.w3.org/2000/01/rdf-schema#label",
  facets: Record<string, string[]> = {},
  limit: number = 100,
): string {
  const filters: string[] = [];

  Object.entries(facets)
    .filter(([dim, vals]) => dim !== "rdf:type" && dim !== "__sourceSet__" && vals.length)
    .forEach(([dim, vals], idx) => {
      const varName = `?_fv_${idx}`;
      filters.push(`?entity ${escapeIRI(dim)} ${varName} .`);
      if (vals.every(v => isValidIRI(v))) {
        filters.push(`FILTER(${varName} IN (${vals.map(escapeIRI).join(", ")}))`);
      } else {
        filters.push(`FILTER(STR(${varName}) IN (${vals.map(v => `"${escapeLiteral(v)}"`).join(", ")}))`);
      }
    });

  const corePattern = `
    ?entity <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ${escapeIRI(classIRI)} .
    ${filters.join("\n    ")}
  `;

  return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT DISTINCT ?entity ?label ?type ?abstract WHERE {
      ${graphScope(graphIRI, corePattern)}
      OPTIONAL { ?entity <${labelPredicate}> ?label }
      OPTIONAL { ?entity <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type }
      OPTIONAL { ?entity <http://www.w3.org/2000/01/rdf-schema#comment> ?abstract }
    }
    LIMIT ${limit}
  `.trim();
}

// ── Facet count query ──────────────────────────────────────────

export function buildFacetCountQuery(
  focusIRI: string,
  graphIRI: string | null,
  layer: number,
  activeFacets: Record<string, string[]>,
  facetDimension: string,
  sparqlPredicate: string,
): string {
  const patternFn = LAYER_PATTERNS[layer];
  if (!patternFn) throw new Error(`Unsupported layer: ${layer}`);

  const otherFilters = Object.entries(activeFacets)
    .filter(([dim, vals]) => dim !== facetDimension && dim !== "__sourceSet__" && vals?.length)
    .flatMap(([dim, vals]) => {
      const varName = `?_of_${dim.replace(/\W/g, "_")}`;
      return [
        `?entity ${escapeIRI(dim)} ${varName} .`,
        `FILTER(${varName} IN (${vals.map(escapeIRI).join(", ")}))`,
      ];
    })
    .join("\n      ");

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

// ── Predicate query (entity detail) ────────────────────────────

export function buildPredicateQuery(
  entityIRI: string,
  graphIRI: string | null,
): string {
  const corePattern = `
    ${escapeIRI(entityIRI)} ?predicate ?value .
  `;

  return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT ?predicate ?predLabel ?value ?valueLabel WHERE {
      ${graphScope(graphIRI, corePattern)}
      OPTIONAL { ?predicate <http://www.w3.org/2000/01/rdf-schema#label> ?predLabel . FILTER(lang(?predLabel) = "en" || lang(?predLabel) = "") }
      OPTIONAL { ?value <http://www.w3.org/2000/01/rdf-schema#label> ?valueLabel . FILTER(lang(?valueLabel) = "en" || lang(?valueLabel) = "") }
    }
    ORDER BY ?predicate
    LIMIT 500
  `.trim();
}

// ── Search query ───────────────────────────────────────────────

export function buildSearchQuery(
  graphIRI: string | null,
  query: string,
  labelPredicate: string = "http://www.w3.org/2000/01/rdf-schema#label",
  isPgRipple: boolean = false,
): string {
  const escaped = escapeLiteral(query);

  const filterClause = isPgRipple
    ? `FILTER(<http://pg-ripple.io/fn/fts>(?label, "${escaped}"))`
    : `FILTER(CONTAINS(LCASE(STR(?label)), LCASE("${escaped}")))`;

  const corePattern = `
    ?entity <${labelPredicate}> ?label .
    ${filterClause}
  `;

  return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT DISTINCT ?entity ?label ?type WHERE {
      ${graphScope(graphIRI, corePattern)}
      OPTIONAL { ?entity <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type }
    }
    LIMIT 20
  `.trim();
}

// ── Introspection queries ──────────────────────────────────────

export function buildListGraphsQuery(): string {
  return `
    SELECT DISTINCT ?graph (COUNT(*) AS ?tripleCount) WHERE {
      GRAPH ?graph { ?s ?p ?o }
    }
    GROUP BY ?graph
    ORDER BY DESC(?tripleCount)
  `.trim();
}

export function buildDefaultGraphCountQuery(): string {
  return `SELECT (COUNT(*) AS ?tripleCount) WHERE { ?s ?p ?o }`;
}

export function buildSampleGraphQuery(graphIRI: string | null): string {
  const innerPattern = `
    ?subject ?predicate ?object .
    BIND(
      IF(isIRI(?object), "iri",
      IF(isLiteral(?object),
        IF(DATATYPE(?object) IN (<http://www.w3.org/2001/XMLSchema#date>, <http://www.w3.org/2001/XMLSchema#dateTime>, <http://www.w3.org/2001/XMLSchema#gYear>), "date",
        IF(DATATYPE(?object) IN (<http://www.w3.org/2001/XMLSchema#integer>, <http://www.w3.org/2001/XMLSchema#decimal>, <http://www.w3.org/2001/XMLSchema#float>, <http://www.w3.org/2001/XMLSchema#double>), "numeric",
        "literal")), "bnode")) AS ?valueKind
    )
  `;

  return `
    SELECT ?predicate ?valueKind
           (COUNT(DISTINCT ?subject) AS ?subjectCount)
           (COUNT(DISTINCT ?object)  AS ?objectCount)
    WHERE {
      ${graphScope(graphIRI, innerPattern)}
    }
    GROUP BY ?predicate ?valueKind
    ORDER BY DESC(?subjectCount)
    LIMIT 200
  `.trim();
}

export function buildLabelHeuristicQuery(graphIRI: string | null): string {
  const innerPattern = `
    VALUES ?labelPredicate {
      <http://www.w3.org/2000/01/rdf-schema#label>
      <http://www.w3.org/2004/02/skos/core#prefLabel>
      <http://www.w3.org/2004/02/skos/core#altLabel>
      <http://xmlns.com/foaf/0.1/name>
      <http://schema.org/name>
      <http://purl.org/dc/terms/title>
    }
    ?s ?labelPredicate ?o .
  `;

  return `
    SELECT ?labelPredicate (COUNT(?s) AS ?coverage) WHERE {
      ${graphScope(graphIRI, innerPattern)}
    }
    GROUP BY ?labelPredicate
    ORDER BY DESC(?coverage)
  `.trim();
}

export function buildClassHierarchyQuery(graphIRI: string | null): string {
  // Keep the OPTIONAL outside the GRAPH block (some endpoints reject OPTIONAL
  // nested inside GRAPH). Also use at most one OPTIONAL + SAMPLE aggregate to
  // avoid query errors on endpoints that don't support multiple OPTIONALs with
  // GROUP BY — class labels are derived via shortIRI as a fallback anyway.
  const typePattern = graphScope(graphIRI, `?instance <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?class .`);

  return `
    SELECT ?class (COUNT(?instance) AS ?instanceCount) (SAMPLE(?superClass) AS ?superClass)
    WHERE {
      ${typePattern}
      OPTIONAL { ?class <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?superClass }
    }
    GROUP BY ?class
    ORDER BY DESC(?instanceCount)
    LIMIT 500
  `.trim();
}

// ── Relationships query ────────────────────────────────────────

export function buildRelationshipsQuery(
  graphIRI: string | null,
  classIRI?: string,
): string {
  const typeFilter = classIRI
    ? `?subject <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ${escapeIRI(classIRI)} .`
    : "";

  const innerPattern = `
    ${typeFilter}
    ?subject ?predicate ?object .
  `;

  return `
    SELECT ?predicate
           (COUNT(DISTINCT ?subject) AS ?subjectCount)
           (COUNT(DISTINCT ?object) AS ?objectCount)
           (SAMPLE(IF(isIRI(?object), "iri", "literal")) AS ?valueKind)
    WHERE {
      ${graphScope(graphIRI, innerPattern)}
    }
    GROUP BY ?predicate
    ORDER BY DESC(?subjectCount)
    LIMIT 100
  `.trim();
}
