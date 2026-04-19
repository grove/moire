/**
 * Seed state — builds e2e/.auth/state.json by querying the SPARQL endpoint
 * directly from Node.js, without spinning up a browser.
 *
 * Called by auth.setup.ts.  Can also be run standalone:
 *   node e2e/seed-state.mjs
 */
import { writeFile, mkdir } from "fs/promises";

const SPARQL_URL = process.env.SPARQL_ENDPOINT ?? "http://localhost:7878/sparql";
const STATE_FILE = "e2e/.auth/state.json";
const ENDPOINT_ID = "local-sparql";
const ENDPOINT_LABEL = "Local SPARQL";

// ── SPARQL helpers ────────────────────────────────────────────────────────────

function shortIRI(iri) {
  return iri.split(/[#/]/).at(-1) ?? iri;
}

function graphScope(graphIRI, pattern) {
  if (graphIRI) return `GRAPH <${graphIRI}> { ${pattern} }`;
  return pattern;
}

async function sparql(query) {
  const res = await fetch(SPARQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
    },
    body: `query=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`SPARQL error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.results?.bindings ?? [];
}

// Normalise the non-standard format from oxigraph-style endpoints:
// type="literal" with value "<http://...>" → type="uri"
// type="literal" with value '"text"' → type="literal" stripped value
function normalizeTerm(term) {
  if (!term) return term;
  if (term.type === "literal") {
    const v = term.value ?? "";
    if (v.startsWith("<") && v.endsWith(">")) {
      return { type: "uri", value: v.slice(1, -1) };
    }
    if (v.startsWith('"')) {
      const atIdx = v.lastIndexOf('"@');
      if (atIdx > 0) return { type: "literal", value: v.slice(1, atIdx), "xml:lang": v.slice(atIdx + 2) };
      if (v.endsWith('"')) return { type: "literal", value: v.slice(1, -1) };
    }
  }
  return term;
}

function normalizeBindings(bindings) {
  return bindings.map((b) => {
    const out = {};
    for (const [k, v] of Object.entries(b)) out[k] = normalizeTerm(v);
    return out;
  });
}

// ── Queries ───────────────────────────────────────────────────────────────────

async function listGraphs() {
  const bindings = normalizeBindings(await sparql(
    `SELECT DISTINCT ?graph (COUNT(*) AS ?tripleCount) WHERE { GRAPH ?graph { ?s ?p ?o } } GROUP BY ?graph ORDER BY DESC(?tripleCount)`
  ));
  return bindings.map((b) => ({
    iri: b.graph.value,
    tripleCount: parseInt(b.tripleCount.value, 10),
  }));
}

async function defaultGraphCount() {
  const b = normalizeBindings(await sparql(`SELECT (COUNT(*) AS ?tripleCount) WHERE { ?s ?p ?o }`));
  return parseInt(b[0]?.tripleCount?.value ?? "0", 10);
}

async function sampleGraph(graphIRI) {
  const inner = `?subject ?predicate ?object . BIND(IF(isIRI(?object),"iri",IF(isLiteral(?object),"literal","bnode")) AS ?valueKind)`;
  const q = `SELECT ?predicate ?valueKind (COUNT(DISTINCT ?subject) AS ?subjectCount) (COUNT(DISTINCT ?object) AS ?objectCount) WHERE { ${graphScope(graphIRI, inner)} } GROUP BY ?predicate ?valueKind ORDER BY DESC(?subjectCount) LIMIT 200`;
  return normalizeBindings(await sparql(q));
}

async function labelHeuristic(graphIRI) {
  const inner = `VALUES ?labelPredicate { <http://www.w3.org/2000/01/rdf-schema#label> <http://www.w3.org/2004/02/skos/core#prefLabel> <http://xmlns.com/foaf/0.1/name> <http://schema.org/name> <http://purl.org/dc/terms/title> } ?s ?labelPredicate ?o .`;
  const q = `SELECT ?labelPredicate (COUNT(?s) AS ?coverage) WHERE { ${graphScope(graphIRI, inner)} } GROUP BY ?labelPredicate ORDER BY DESC(?coverage)`;
  return normalizeBindings(await sparql(q));
}

async function classHierarchy(graphIRI) {
  const typePattern = graphScope(graphIRI, `?instance <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?class .`);
  const q = `SELECT ?class (COUNT(?instance) AS ?instanceCount) (SAMPLE(?superClass) AS ?superClass) WHERE { ${typePattern} OPTIONAL { ?class <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?superClass } } GROUP BY ?class ORDER BY DESC(?instanceCount) LIMIT 500`;
  return normalizeBindings(await sparql(q));
}

// ── Introspect one graph ──────────────────────────────────────────────────────

async function introspectGraph(graphIRI, tripleCount) {
  const giri = graphIRI === "default" ? null : graphIRI;

  const [predicateBindings, labelBindings, classBindings] = await Promise.all([
    sampleGraph(giri).catch(() => []),
    labelHeuristic(giri).catch(() => []),
    classHierarchy(giri).catch(() => []),
  ]);

  const predicates = predicateBindings.map((b) => ({
    iri: b.predicate.value,
    label: shortIRI(b.predicate.value),
    subjectCount: parseInt(b.subjectCount?.value ?? "0", 10),
    objectCount: parseInt(b.objectCount?.value ?? "0", 10),
    valueKind: b.valueKind?.value ?? "literal",
    isFacetCandidate: false,
    isNavigationCandidate: b.valueKind?.value === "iri",
    isStructural: false,
  }));

  const labelPredicate = labelBindings[0]?.labelPredicate?.value
    ?? "http://www.w3.org/2000/01/rdf-schema#label";

  const classes = classBindings.map((b) => ({
    iri: b.class.value,
    label: shortIRI(b.class.value),
    instanceCount: parseInt(b.instanceCount?.value ?? "0", 10),
    superClass: b.superClass?.value,
  }));

  return {
    iri: graphIRI,
    label: shortIRI(graphIRI),
    tripleCount,
    subjectCount: predicates.reduce((m, p) => Math.max(m, p.subjectCount), 0),
    predicates,
    classes,
    labelPredicate,
    introspectedAt: new Date().toISOString(),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Querying ${SPARQL_URL} ...`);

  // List named graphs
  let graphEntries;
  try {
    graphEntries = await listGraphs();
    if (!graphEntries.length) throw new Error("empty");
  } catch {
    const count = await defaultGraphCount();
    graphEntries = [{ iri: "default", tripleCount: count }];
  }
  console.log(`  ${graphEntries.length} graph(s): ${graphEntries.map((g) => g.iri).join(", ")}`);

  // Introspect all graphs in parallel
  const summaries = await Promise.all(
    graphEntries.map((g) => introspectGraph(g.iri, g.tripleCount)),
  );

  const totalClasses = summaries.reduce((n, g) => n + g.classes.length, 0);
  console.log(`  ${summaries.reduce((n, g) => n + g.tripleCount, 0).toLocaleString()} triples, ${totalClasses} classes total`);

  // Build the Zustand persist structure that the app stores in localStorage
  const zustandState = {
    state: {
      endpoints: [
        {
          id: ENDPOINT_ID,
          label: ENDPOINT_LABEL,
          sparqlUrl: SPARQL_URL,
          capabilities: {
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
          },
          labelPredicate: summaries[0]?.labelPredicate,
        },
      ],
      introspectionCache: Object.fromEntries(
        summaries.map ? [[ENDPOINT_ID, summaries]] : [],
      ),
    },
    version: 0,
  };

  // Wrap it in the Playwright storageState format
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: "http://localhost:3000",
        localStorage: [
          {
            name: "moire-endpoints",
            value: JSON.stringify(zustandState),
          },
        ],
      },
    ],
  };

  await mkdir("e2e/.auth", { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(storageState, null, 2));
  console.log(`  Saved → ${STATE_FILE}`);
}

main().catch((err) => {
  console.error("seed-state failed:", err.message);
  process.exit(1);
});
