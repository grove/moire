/**
 * v0.4.0 — Predicate Metadata from the Graph
 *
 * Builds and parses a batched SPARQL query that enriches PredicateSummary
 * objects with graph-sourced metadata:
 *   - rdfs:label / skos:prefLabel → rdfsLabel
 *   - skos:definition / rdfs:comment → skosDefinition
 *   - rdfs:domain / rdfs:range + optional labels
 *   - owl:inverseOf (bidirectional) + optional inverse label
 *   - OWL property characteristics (Functional, Symmetric, Transitive, etc.)
 *
 * Design goals:
 *   - Single round-trip for all discovered predicates (VALUES clause).
 *   - Graceful: callers wrap in try/catch; original summaries are returned unchanged on error.
 *   - Batches limited to 500 IRIs to avoid unbounded VALUES clauses.
 */

import type { PredicateSummary } from "./types";

// ── IRI validation (mirrors sparql.ts, kept local to avoid circular deps) ──

function isValidIRI(iri: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+\-.]*:[^\s<>"{}|\\^`]+$/.test(iri);
}

// ── Query builder ────────────────────────────────────────────────────────────

const OWL_CHARACTERISTICS = [
  "http://www.w3.org/2002/07/owl#FunctionalProperty",
  "http://www.w3.org/2002/07/owl#InverseFunctionalProperty",
  "http://www.w3.org/2002/07/owl#SymmetricProperty",
  "http://www.w3.org/2002/07/owl#TransitiveProperty",
  "http://www.w3.org/2002/07/owl#ReflexiveProperty",
] as const;

/** Short display names for OWL characteristics, keyed by local name. */
export const OWL_CHARACTERISTIC_LABELS: Record<string, string> = {
  FunctionalProperty: "Functional",
  InverseFunctionalProperty: "InverseFunctional",
  SymmetricProperty: "Symmetric",
  TransitiveProperty: "Transitive",
  ReflexiveProperty: "Reflexive",
};

/** Maximum number of predicate IRIs per VALUES clause. */
const BATCH_SIZE = 500;

/**
 * Build a batched SPARQL SELECT query for predicate metadata.
 *
 * @param predicateIRIs - IRIs of predicates discovered during introspection.
 * @param graphIRI      - Named graph IRI, or null for the default graph.
 *                        The query always tries the data graph first; ontology
 *                        metadata often lives outside it so we use OPTIONAL
 *                        triples without a graph restriction.
 */
export function buildPredicateMetadataQuery(
  predicateIRIs: string[],
  _graphIRI: string | null,
): string {
  const validIRIs = predicateIRIs.filter(isValidIRI);
  if (validIRIs.length === 0) return "";

  const valuesList = validIRIs.map((iri) => `<${iri}>`).join(" ");
  const characteristicsIn = OWL_CHARACTERISTICS.map((c) => `<${c}>`).join(", ");

  return `
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX schema: <https://schema.org/>

SELECT ?predicate ?label ?prefLabel ?comment ?definition
       ?domain ?domainLabel ?range ?rangeLabel
       ?inverse ?inverseLabel ?characteristic
WHERE {
  VALUES ?predicate { ${valuesList} }

  OPTIONAL { ?predicate rdfs:label ?label }
  OPTIONAL { ?predicate skos:prefLabel ?prefLabel }
  OPTIONAL { ?predicate rdfs:comment ?comment }
  OPTIONAL {
    { ?predicate skos:definition ?definition }
    UNION
    { ?predicate dcterms:description ?definition }
  }

  OPTIONAL {
    ?predicate rdfs:domain ?domain .
    OPTIONAL { ?domain rdfs:label ?domainLabel }
    OPTIONAL { ?domain skos:prefLabel ?domainLabel }
  }

  OPTIONAL {
    ?predicate rdfs:range ?range .
    OPTIONAL { ?range rdfs:label ?rangeLabel }
    OPTIONAL { ?range skos:prefLabel ?rangeLabel }
  }

  OPTIONAL {
    { ?predicate owl:inverseOf ?inverse }
    UNION
    { ?inverse owl:inverseOf ?predicate }
    OPTIONAL { ?inverse rdfs:label ?inverseLabel }
    OPTIONAL { ?inverse skos:prefLabel ?inverseLabel }
  }

  OPTIONAL {
    ?predicate rdf:type ?characteristic .
    FILTER(?characteristic IN (${characteristicsIn}))
  }
}
`.trim();
}

// ── Response types ───────────────────────────────────────────────────────────

export interface SparqlTerm {
  type: string;
  value: string;
  "xml:lang"?: string;
  datatype?: string;
}

export type MetadataBinding = Record<string, SparqlTerm | undefined>;

// ── Result parser ────────────────────────────────────────────────────────────

/**
 * Merge SPARQL metadata bindings into an array of PredicateSummary objects.
 *
 * Multiple rows may exist for the same predicate (one per characteristic or
 * per language variant). We aggregate them and prefer the first non-empty
 * string for scalar fields.
 */
export function applyPredicateMetadata(
  predicates: PredicateSummary[],
  bindings: MetadataBinding[],
): PredicateSummary[] {
  if (bindings.length === 0) return predicates;

  // Aggregate by predicate IRI
  const meta = new Map<
    string,
    {
      label?: string;
      definition?: string;
      domain?: string;
      domainLabel?: string;
      range?: string;
      rangeLabel?: string;
      inverseIRI?: string;
      inverseLabel?: string;
      characteristics: Set<string>;
    }
  >();

  for (const row of bindings) {
    const iri = row.predicate?.value;
    if (!iri) continue;

    if (!meta.has(iri)) {
      meta.set(iri, { characteristics: new Set() });
    }
    const m = meta.get(iri)!;

    // Scalar fields — keep first non-empty value
    const label = row.prefLabel?.value || row.label?.value;
    if (label && !m.label) m.label = label;

    const def = row.definition?.value || row.comment?.value;
    if (def && !m.definition) m.definition = def;

    if (row.domain?.value && !m.domain) {
      m.domain = row.domain.value;
      m.domainLabel = row.domainLabel?.value;
    }
    if (row.range?.value && !m.range) {
      m.range = row.range.value;
      m.rangeLabel = row.rangeLabel?.value;
    }
    if (row.inverse?.value && !m.inverseIRI) {
      m.inverseIRI = row.inverse.value;
      m.inverseLabel = row.inverseLabel?.value;
    }

    // Characteristics — accumulate all
    if (row.characteristic?.value) {
      const localName = row.characteristic.value.split(/[#/]/).pop() ?? "";
      const display = OWL_CHARACTERISTIC_LABELS[localName];
      if (display) m.characteristics.add(display);
    }
  }

  return predicates.map((p) => {
    const m = meta.get(p.iri);
    if (!m) return p;
    return {
      ...p,
      rdfsLabel: m.label,
      skosDefinition: m.definition,
      domain: m.domain,
      domainLabel: m.domainLabel,
      range: m.range,
      rangeLabel: m.rangeLabel,
      inverseIRI: m.inverseIRI,
      inverseLabel: m.inverseLabel,
      owlCharacteristics: m.characteristics.size > 0
        ? Array.from(m.characteristics).sort()
        : undefined,
    };
  });
}

/**
 * Split an array into chunks of at most `size` items.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export { BATCH_SIZE };

// ── v0.6.0 — Resource annotation query ───────────────────────────────────────

import type { ResourceAnnotation } from "./types";

/**
 * Build a SPARQL SELECT query that fetches on-demand annotations for a single
 * resource IRI:
 *  - skos:altLabel  (aliases)
 *  - descriptions   (definition / comment / abstract / schema:description)
 *  - provenance     (dcterms:source / prov:hadPrimarySource / prov:wasDerivedFrom)
 *  - pages          (foaf:page / schema:url)
 *  - images         (schema:image / foaf:depiction)
 *  - dates          (dcterms:created / dcterms:modified / prov:generatedAtTime)
 *
 * Intentionally queries the default graph (no GRAPH clause) because schema/ontology
 * metadata often lives outside the named data graph.
 *
 * Returns "" for invalid IRIs.
 */
export function buildResourceAnnotationQuery(
  resourceIRI: string,
  _graphIRI: string | null,
): string {
  if (!isValidIRI(resourceIRI)) return "";

  return `
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos:   <http://www.w3.org/2004/02/skos/core#>
PREFIX dcterms:<http://purl.org/dc/terms/>
PREFIX schema: <https://schema.org/>
PREFIX foaf:   <http://xmlns.com/foaf/0.1/>
PREFIX prov:   <http://www.w3.org/ns/prov#>

SELECT DISTINCT ?altLabel ?definition ?source ?page ?image
                ?created ?modified ?generatedAt
WHERE {
  OPTIONAL { <${resourceIRI}> skos:altLabel ?altLabel }
  OPTIONAL {
    { <${resourceIRI}> skos:definition ?definition }
    UNION { <${resourceIRI}> rdfs:comment ?definition }
    UNION { <${resourceIRI}> dcterms:abstract ?definition }
    UNION { <${resourceIRI}> schema:description ?definition }
  }
  OPTIONAL {
    { <${resourceIRI}> dcterms:source ?source }
    UNION { <${resourceIRI}> prov:hadPrimarySource ?source }
    UNION { <${resourceIRI}> prov:wasDerivedFrom ?source }
  }
  OPTIONAL {
    { <${resourceIRI}> foaf:page ?page }
    UNION { <${resourceIRI}> schema:url ?page }
  }
  OPTIONAL {
    { <${resourceIRI}> schema:image ?image }
    UNION { <${resourceIRI}> foaf:depiction ?image }
  }
  OPTIONAL { <${resourceIRI}> dcterms:created ?created }
  OPTIONAL { <${resourceIRI}> dcterms:modified ?modified }
  OPTIONAL { <${resourceIRI}> prov:generatedAtTime ?generatedAt }
}
`.trim();
}

/**
 * Parse SPARQL bindings from a resource annotation query into a
 * {@link ResourceAnnotation} object.
 *
 * Multiple rows are expected when the resource has several altLabels or media
 * items — all scalar fields use "first wins" semantics.
 */
export function parseResourceAnnotation(bindings: MetadataBinding[]): ResourceAnnotation {
  const aliases = new Set<string>();
  let description: string | undefined;
  let sourceUrl: string | undefined;
  const media: NonNullable<ResourceAnnotation["media"]> = [];
  const temporalInfo: NonNullable<ResourceAnnotation["temporalInfo"]> = {};

  for (const row of bindings) {
    if (row.altLabel?.value) aliases.add(row.altLabel.value);
    if (row.definition?.value && !description) description = row.definition.value;
    if (row.source?.value && !sourceUrl) sourceUrl = row.source.value;

    if (row.page?.value) {
      const url = row.page.value;
      if (!media.some((m) => m.url === url)) media.push({ url, kind: "page" });
    }
    if (row.image?.value) {
      const url = row.image.value;
      if (!media.some((m) => m.url === url)) media.push({ url, kind: "image" });
    }

    if (row.created?.value && !temporalInfo.created) temporalInfo.created = row.created.value;
    if (row.modified?.value && !temporalInfo.modified) temporalInfo.modified = row.modified.value;
    if (row.generatedAt?.value && !temporalInfo.generatedAt)
      temporalInfo.generatedAt = row.generatedAt.value;
  }

  const hasTemporalInfo = Object.keys(temporalInfo).length > 0;

  return {
    aliases: aliases.size > 0 ? Array.from(aliases) : undefined,
    description,
    sourceUrl,
    media: media.length > 0 ? media : undefined,
    temporalInfo: hasTemporalInfo ? temporalInfo : undefined,
  };
}

// ── v0.7.0 — SHACL shape query ────────────────────────────────────────────────

import type { ShaclPropertyShape, ShaclViolation } from "./types";

/**
 * Build a SPARQL SELECT query that fetches all SHACL property shapes for a
 * given target class.
 *
 * Run on-demand when an entity detail or type view opens for a known class.
 * Queries the default graph — SHACL shapes are typically published in the
 * ontology / schema graph, not inside named data graphs.
 *
 * Returns "" for invalid class IRIs.
 */
export function buildShaclShapeQuery(classIRI: string): string {
  if (!isValidIRI(classIRI)) return "";

  return `
PREFIX sh:   <http://www.w3.org/ns/shacl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?path ?name ?description ?order ?group ?datatype ?class ?nodeKind ?minCount ?maxCount
WHERE {
  ?shape a sh:NodeShape ;
         sh:targetClass <${classIRI}> ;
         sh:property ?propertyShape .

  ?propertyShape sh:path ?path .
  OPTIONAL { ?propertyShape sh:name ?name }
  OPTIONAL { ?propertyShape sh:description ?description }
  OPTIONAL { ?propertyShape sh:order ?order }
  OPTIONAL { ?propertyShape sh:group ?group }
  OPTIONAL { ?propertyShape sh:datatype ?datatype }
  OPTIONAL { ?propertyShape sh:class ?class }
  OPTIONAL { ?propertyShape sh:nodeKind ?nodeKind }
  OPTIONAL { ?propertyShape sh:minCount ?minCount }
  OPTIONAL { ?propertyShape sh:maxCount ?maxCount }

  FILTER(isIRI(?path))
}
`.trim();
}

/**
 * Parse SPARQL bindings from a SHACL shape query into an array of
 * {@link ShaclPropertyShape} objects.
 *
 * Multiple rows may exist for the same path (one per language variant of sh:name).
 * Scalar fields use "first wins" semantics.
 */
export function parseShaclShapes(bindings: MetadataBinding[]): ShaclPropertyShape[] {
  const shapes = new Map<string, ShaclPropertyShape>();

  for (const row of bindings) {
    const path = row.path?.value;
    if (!path) continue;

    if (!shapes.has(path)) {
      shapes.set(path, { path });
    }
    const shape = shapes.get(path)!;

    if (row.name?.value && !shape.name) shape.name = row.name.value;
    if (row.description?.value && !shape.description) shape.description = row.description.value;
    if (row.order?.value && shape.order === undefined) {
      const parsed = parseFloat(row.order.value);
      if (!isNaN(parsed)) shape.order = parsed;
    }
    if (row.group?.value && !shape.group) shape.group = row.group.value;
    if (row.datatype?.value && !shape.datatype) shape.datatype = row.datatype.value;
    if (row.class?.value && !shape.class) shape.class = row.class.value;
    if (row.minCount?.value && shape.minCount === undefined) {
      const parsed = parseInt(row.minCount.value, 10);
      if (!isNaN(parsed)) shape.minCount = parsed;
    }
    if (row.maxCount?.value && shape.maxCount === undefined) {
      const parsed = parseInt(row.maxCount.value, 10);
      if (!isNaN(parsed)) shape.maxCount = parsed;
    }
  }

  // Sort by sh:order when available
  return Array.from(shapes.values()).sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });
}

/**
 * Build a SPARQL SELECT query that checks which entities from a given set are
 * missing required predicates (sh:minCount >= 1) for their class.
 *
 * Returns bindings of `?entity` IRIs that have at least one required predicate
 * absent. Queries the named graph when `graphIRI` is provided, otherwise the
 * default graph.
 *
 * Returns "" when `entityIRIs` or `requiredPredicateIRIs` is empty.
 */
export function buildShaclViolationCheckQuery(
  entityIRIs: string[],
  requiredPredicateIRIs: string[],
  graphIRI: string | null,
): string {
  const validEntities = entityIRIs.filter(isValidIRI);
  const validPaths = requiredPredicateIRIs.filter(isValidIRI);
  if (validEntities.length === 0 || validPaths.length === 0) return "";

  const entitiesValues = validEntities.map((iri) => `<${iri}>`).join(" ");
  const pathsValues = validPaths.map((iri) => `<${iri}>`).join(" ");

  const pattern = graphIRI
    ? `GRAPH <${graphIRI}> { ?entity ?path ?value }`
    : `?entity ?path ?value`;

  return `
SELECT DISTINCT ?entity
WHERE {
  VALUES ?entity { ${entitiesValues} }
  VALUES ?path { ${pathsValues} }
  FILTER NOT EXISTS { ${pattern} }
}
`.trim();
}

/**
 * Derive SHACL violations by comparing shapes' required predicates against the
 * predicate IRIs that an entity actually has.
 *
 * Intended for client-side use in entity detail — no extra SPARQL required when
 * `entityPredicateIRIs` is already available.
 */
export function computeShaclViolations(
  shapes: ShaclPropertyShape[],
  entityPredicateIRIs: string[],
): ShaclViolation[] {
  const known = new Set(entityPredicateIRIs);
  const violations: ShaclViolation[] = [];

  for (const shape of shapes) {
    if ((shape.minCount ?? 0) >= 1 && !known.has(shape.path)) {
      const predicateLabel = shape.name ?? shape.path.split(/[#/]/).pop() ?? shape.path;
      const count = shape.minCount === 1 ? "one" : String(shape.minCount);
      violations.push({
        path: shape.path,
        message: `Expected at least ${count} ${predicateLabel}.`,
        severity: "Warning",
      });
    }
  }

  return violations;
}

// ── v0.8.0 — VoID dataset metadata query ─────────────────────────────────────

import type { VoidDataset } from "./types";

/**
 * Build a SPARQL SELECT query that collects VoID dataset metadata.
 *
 * Runs opportunistically during graph introspection — does not block if the
 * endpoint has no VoID metadata (returns empty bindings which parseVoidDataset
 * maps to undefined).
 *
 * Queries the default graph (VoID metadata is typically not stored inside named
 * data graphs).
 *
 * Query spec: plans/annotations.md § 10.4
 */
export function buildVoidDatasetQuery(_graphIRI: string | null): string {
  return `
PREFIX void:    <http://rdfs.org/ns/void#>
PREFIX dcterms: <http://purl.org/dc/terms/>

SELECT DISTINCT ?dataset ?title ?description ?creator ?publisher ?license
       ?created ?modified ?rootResource ?exampleResource ?vocabulary
       ?triples ?entities ?classes ?properties
WHERE {
  ?dataset a void:Dataset .
  OPTIONAL { ?dataset dcterms:title ?title }
  OPTIONAL { ?dataset dcterms:description ?description }
  OPTIONAL { ?dataset dcterms:creator ?creator }
  OPTIONAL { ?dataset dcterms:publisher ?publisher }
  OPTIONAL { ?dataset dcterms:license ?license }
  OPTIONAL { ?dataset dcterms:created ?created }
  OPTIONAL { ?dataset dcterms:modified ?modified }
  OPTIONAL { ?dataset void:rootResource ?rootResource }
  OPTIONAL { ?dataset void:exampleResource ?exampleResource }
  OPTIONAL { ?dataset void:vocabulary ?vocabulary }
  OPTIONAL { ?dataset void:triples ?triples }
  OPTIONAL { ?dataset void:entities ?entities }
  OPTIONAL { ?dataset void:classes ?classes }
  OPTIONAL { ?dataset void:properties ?properties }
}
`.trim();
}

/**
 * Parse SPARQL bindings from a VoID dataset query into a {@link VoidDataset} object.
 *
 * Multiple rows may exist for the same dataset (one per vocabulary, rootResource,
 * or exampleResource). Scalar fields use "first wins" semantics; set fields
 * accumulate all values.
 *
 * Returns `undefined` when no bindings are present (graceful fallback for graphs
 * without VoID metadata).
 */
export function parseVoidDataset(bindings: MetadataBinding[]): VoidDataset | undefined {
  if (bindings.length === 0) return undefined;

  let iri: string | undefined;
  let title: string | undefined;
  let description: string | undefined;
  let creator: string | undefined;
  let publisher: string | undefined;
  let license: string | undefined;
  let created: string | undefined;
  let modified: string | undefined;
  let triples: number | undefined;
  let entities: number | undefined;
  let classes: number | undefined;
  let properties: number | undefined;
  const vocabularies = new Set<string>();
  const rootResources = new Set<string>();
  const exampleResources = new Set<string>();

  for (const row of bindings) {
    if (row.dataset?.value && !iri) iri = row.dataset.value;
    if (row.title?.value && !title) title = row.title.value;
    if (row.description?.value && !description) description = row.description.value;
    if (row.creator?.value && !creator) creator = row.creator.value;
    if (row.publisher?.value && !publisher) publisher = row.publisher.value;
    if (row.license?.value && !license) license = row.license.value;
    if (row.created?.value && !created) created = row.created.value;
    if (row.modified?.value && !modified) modified = row.modified.value;

    if (row.triples?.value && triples === undefined) {
      const n = parseInt(row.triples.value, 10);
      if (!isNaN(n)) triples = n;
    }
    if (row.entities?.value && entities === undefined) {
      const n = parseInt(row.entities.value, 10);
      if (!isNaN(n)) entities = n;
    }
    if (row.classes?.value && classes === undefined) {
      const n = parseInt(row.classes.value, 10);
      if (!isNaN(n)) classes = n;
    }
    if (row.properties?.value && properties === undefined) {
      const n = parseInt(row.properties.value, 10);
      if (!isNaN(n)) properties = n;
    }

    if (row.vocabulary?.value) vocabularies.add(row.vocabulary.value);
    if (row.rootResource?.value) rootResources.add(row.rootResource.value);
    if (row.exampleResource?.value) exampleResources.add(row.exampleResource.value);
  }

  return {
    iri,
    title,
    description,
    creator,
    publisher,
    license,
    created,
    modified,
    triples,
    entities,
    classes,
    properties,
    vocabularies: vocabularies.size > 0 ? Array.from(vocabularies) : undefined,
    rootResources: rootResources.size > 0 ? Array.from(rootResources) : undefined,
    exampleResources: exampleResources.size > 0 ? Array.from(exampleResources) : undefined,
  };
}
