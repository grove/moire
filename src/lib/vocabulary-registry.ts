/**
 * Vocabulary Registry — maps well-known predicate IRIs to semantic roles.
 *
 * Roles drive grouping in the Relationships Browser, ordering in the Jump strip,
 * and sorting in the Facet panel.
 */

export type PredicateRole =
  | "labelling"    // rdfs:label, skos:prefLabel, dc:title …
  | "descriptive"  // rdfs:comment, skos:definition, dc:description …
  | "classifying"  // rdf:type, skos:broader, dcterms:subject …
  | "relational"   // foaf:knows, org:memberOf, schema:author …
  | "temporal"     // dcterms:created, schema:datePublished …
  | "numeric"      // geo:lat, schema:price …
  | "provenance"   // prov:wasDerivedFrom, dcterms:source …
  | "structural"   // owl:sameAs, owl:equivalentClass …
  | "media";       // schema:image, foaf:depiction …

export interface RegistryEntry {
  role: PredicateRole;
  /** Short namespace abbreviation shown as a badge in the UI. */
  badge?: string;
  /** Human-readable name override (takes precedence over shortIRI). */
  name?: string;
}

// ── Registry ──────────────────────────────────────────────────

const REGISTRY: Record<string, RegistryEntry> = {
  // ── RDF core ──────────────────────────────────────────────
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":              { role: "classifying", badge: "RDF",  name: "type" },
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#value":             { role: "descriptive",  badge: "RDF",  name: "value" },

  // ── RDFS ──────────────────────────────────────────────────
  "http://www.w3.org/2000/01/rdf-schema#label":                   { role: "labelling",    badge: "RDFS", name: "label" },
  "http://www.w3.org/2000/01/rdf-schema#comment":                 { role: "descriptive",  badge: "RDFS", name: "comment" },
  "http://www.w3.org/2000/01/rdf-schema#subClassOf":              { role: "classifying",  badge: "RDFS", name: "subClassOf" },
  "http://www.w3.org/2000/01/rdf-schema#subPropertyOf":           { role: "structural",   badge: "RDFS", name: "subPropertyOf" },
  "http://www.w3.org/2000/01/rdf-schema#domain":                  { role: "structural",   badge: "RDFS", name: "domain" },
  "http://www.w3.org/2000/01/rdf-schema#range":                   { role: "structural",   badge: "RDFS", name: "range" },
  "http://www.w3.org/2000/01/rdf-schema#isDefinedBy":             { role: "structural",   badge: "RDFS", name: "isDefinedBy" },
  "http://www.w3.org/2000/01/rdf-schema#seeAlso":                 { role: "structural",   badge: "RDFS", name: "seeAlso" },
  "http://www.w3.org/2000/01/rdf-schema#member":                  { role: "relational",   badge: "RDFS", name: "member" },

  // ── OWL ───────────────────────────────────────────────────
  "http://www.w3.org/2002/07/owl#sameAs":                         { role: "structural", badge: "OWL", name: "sameAs" },
  "http://www.w3.org/2002/07/owl#equivalentClass":                { role: "structural", badge: "OWL", name: "equivalentClass" },
  "http://www.w3.org/2002/07/owl#equivalentProperty":             { role: "structural", badge: "OWL", name: "equivalentProperty" },
  "http://www.w3.org/2002/07/owl#inverseOf":                      { role: "structural", badge: "OWL", name: "inverseOf" },
  "http://www.w3.org/2002/07/owl#differentFrom":                  { role: "structural", badge: "OWL", name: "differentFrom" },

  // ── SKOS ──────────────────────────────────────────────────
  "http://www.w3.org/2004/02/skos/core#prefLabel":                { role: "labelling",   badge: "SKOS", name: "prefLabel" },
  "http://www.w3.org/2004/02/skos/core#altLabel":                 { role: "labelling",   badge: "SKOS", name: "altLabel" },
  "http://www.w3.org/2004/02/skos/core#hiddenLabel":              { role: "labelling",   badge: "SKOS", name: "hiddenLabel" },
  "http://www.w3.org/2004/02/skos/core#definition":               { role: "descriptive", badge: "SKOS", name: "definition" },
  "http://www.w3.org/2004/02/skos/core#scopeNote":                { role: "descriptive", badge: "SKOS", name: "scopeNote" },
  "http://www.w3.org/2004/02/skos/core#example":                  { role: "descriptive", badge: "SKOS", name: "example" },
  "http://www.w3.org/2004/02/skos/core#note":                     { role: "descriptive", badge: "SKOS", name: "note" },
  "http://www.w3.org/2004/02/skos/core#notation":                 { role: "labelling",   badge: "SKOS", name: "notation" },
  "http://www.w3.org/2004/02/skos/core#broader":                  { role: "classifying", badge: "SKOS", name: "broader" },
  "http://www.w3.org/2004/02/skos/core#narrower":                 { role: "classifying", badge: "SKOS", name: "narrower" },
  "http://www.w3.org/2004/02/skos/core#related":                  { role: "relational",  badge: "SKOS", name: "related" },
  "http://www.w3.org/2004/02/skos/core#inScheme":                 { role: "classifying", badge: "SKOS", name: "inScheme" },
  "http://www.w3.org/2004/02/skos/core#hasTopConcept":            { role: "classifying", badge: "SKOS", name: "hasTopConcept" },
  "http://www.w3.org/2004/02/skos/core#topConceptOf":             { role: "classifying", badge: "SKOS", name: "topConceptOf" },
  "http://www.w3.org/2004/02/skos/core#exactMatch":               { role: "structural",  badge: "SKOS", name: "exactMatch" },
  "http://www.w3.org/2004/02/skos/core#closeMatch":               { role: "structural",  badge: "SKOS", name: "closeMatch" },
  "http://www.w3.org/2004/02/skos/core#broadMatch":               { role: "structural",  badge: "SKOS", name: "broadMatch" },
  "http://www.w3.org/2004/02/skos/core#narrowMatch":              { role: "structural",  badge: "SKOS", name: "narrowMatch" },
  "http://www.w3.org/2004/02/skos/core#relatedMatch":             { role: "structural",  badge: "SKOS", name: "relatedMatch" },

  // ── Dublin Core (elements) ─────────────────────────────────
  "http://purl.org/dc/elements/1.1/title":                        { role: "labelling",   badge: "DC", name: "title" },
  "http://purl.org/dc/elements/1.1/description":                  { role: "descriptive", badge: "DC", name: "description" },
  "http://purl.org/dc/elements/1.1/subject":                      { role: "classifying", badge: "DC", name: "subject" },
  "http://purl.org/dc/elements/1.1/creator":                      { role: "provenance",  badge: "DC", name: "creator" },
  "http://purl.org/dc/elements/1.1/contributor":                  { role: "provenance",  badge: "DC", name: "contributor" },
  "http://purl.org/dc/elements/1.1/publisher":                    { role: "provenance",  badge: "DC", name: "publisher" },
  "http://purl.org/dc/elements/1.1/date":                         { role: "temporal",    badge: "DC", name: "date" },
  "http://purl.org/dc/elements/1.1/type":                         { role: "classifying", badge: "DC", name: "type" },
  "http://purl.org/dc/elements/1.1/format":                       { role: "descriptive", badge: "DC", name: "format" },
  "http://purl.org/dc/elements/1.1/identifier":                   { role: "labelling",   badge: "DC", name: "identifier" },
  "http://purl.org/dc/elements/1.1/language":                     { role: "descriptive", badge: "DC", name: "language" },
  "http://purl.org/dc/elements/1.1/source":                       { role: "provenance",  badge: "DC", name: "source" },
  "http://purl.org/dc/elements/1.1/rights":                       { role: "provenance",  badge: "DC", name: "rights" },

  // ── Dublin Core Terms ──────────────────────────────────────
  "http://purl.org/dc/terms/title":                               { role: "labelling",   badge: "DCT", name: "title" },
  "http://purl.org/dc/terms/description":                         { role: "descriptive", badge: "DCT", name: "description" },
  "http://purl.org/dc/terms/abstract":                            { role: "descriptive", badge: "DCT", name: "abstract" },
  "http://purl.org/dc/terms/subject":                             { role: "classifying", badge: "DCT", name: "subject" },
  "http://purl.org/dc/terms/creator":                             { role: "provenance",  badge: "DCT", name: "creator" },
  "http://purl.org/dc/terms/contributor":                         { role: "provenance",  badge: "DCT", name: "contributor" },
  "http://purl.org/dc/terms/publisher":                           { role: "provenance",  badge: "DCT", name: "publisher" },
  "http://purl.org/dc/terms/created":                             { role: "temporal",    badge: "DCT", name: "created" },
  "http://purl.org/dc/terms/modified":                            { role: "temporal",    badge: "DCT", name: "modified" },
  "http://purl.org/dc/terms/issued":                              { role: "temporal",    badge: "DCT", name: "issued" },
  "http://purl.org/dc/terms/date":                                { role: "temporal",    badge: "DCT", name: "date" },
  "http://purl.org/dc/terms/type":                                { role: "classifying", badge: "DCT", name: "type" },
  "http://purl.org/dc/terms/format":                              { role: "descriptive", badge: "DCT", name: "format" },
  "http://purl.org/dc/terms/identifier":                          { role: "labelling",   badge: "DCT", name: "identifier" },
  "http://purl.org/dc/terms/language":                            { role: "descriptive", badge: "DCT", name: "language" },
  "http://purl.org/dc/terms/source":                              { role: "provenance",  badge: "DCT", name: "source" },
  "http://purl.org/dc/terms/rights":                              { role: "provenance",  badge: "DCT", name: "rights" },
  "http://purl.org/dc/terms/license":                             { role: "provenance",  badge: "DCT", name: "license" },
  "http://purl.org/dc/terms/isPartOf":                            { role: "relational",  badge: "DCT", name: "isPartOf" },
  "http://purl.org/dc/terms/hasPart":                             { role: "relational",  badge: "DCT", name: "hasPart" },
  "http://purl.org/dc/terms/isVersionOf":                         { role: "relational",  badge: "DCT", name: "isVersionOf" },
  "http://purl.org/dc/terms/relation":                            { role: "relational",  badge: "DCT", name: "relation" },
  "http://purl.org/dc/terms/references":                          { role: "relational",  badge: "DCT", name: "references" },

  // ── FOAF ──────────────────────────────────────────────────
  "http://xmlns.com/foaf/0.1/name":                               { role: "labelling",   badge: "FOAF", name: "name" },
  "http://xmlns.com/foaf/0.1/givenName":                          { role: "labelling",   badge: "FOAF", name: "givenName" },
  "http://xmlns.com/foaf/0.1/familyName":                         { role: "labelling",   badge: "FOAF", name: "familyName" },
  "http://xmlns.com/foaf/0.1/title":                              { role: "labelling",   badge: "FOAF", name: "title" },
  "http://xmlns.com/foaf/0.1/nick":                               { role: "labelling",   badge: "FOAF", name: "nick" },
  "http://xmlns.com/foaf/0.1/mbox":                               { role: "descriptive", badge: "FOAF", name: "mbox" },
  "http://xmlns.com/foaf/0.1/homepage":                           { role: "media",       badge: "FOAF", name: "homepage" },
  "http://xmlns.com/foaf/0.1/depiction":                          { role: "media",       badge: "FOAF", name: "depiction" },
  "http://xmlns.com/foaf/0.1/img":                                { role: "media",       badge: "FOAF", name: "img" },
  "http://xmlns.com/foaf/0.1/knows":                              { role: "relational",  badge: "FOAF", name: "knows" },
  "http://xmlns.com/foaf/0.1/member":                             { role: "relational",  badge: "FOAF", name: "member" },
  "http://xmlns.com/foaf/0.1/primaryTopic":                       { role: "relational",  badge: "FOAF", name: "primaryTopic" },
  "http://xmlns.com/foaf/0.1/based_near":                         { role: "relational",  badge: "FOAF", name: "based_near" },
  "http://xmlns.com/foaf/0.1/maker":                              { role: "provenance",  badge: "FOAF", name: "maker" },
  "http://xmlns.com/foaf/0.1/made":                               { role: "provenance",  badge: "FOAF", name: "made" },

  // ── PROV-O ────────────────────────────────────────────────
  "http://www.w3.org/ns/prov#wasGeneratedBy":                     { role: "provenance", badge: "PROV", name: "wasGeneratedBy" },
  "http://www.w3.org/ns/prov#wasDerivedFrom":                     { role: "provenance", badge: "PROV", name: "wasDerivedFrom" },
  "http://www.w3.org/ns/prov#wasAttributedTo":                    { role: "provenance", badge: "PROV", name: "wasAttributedTo" },
  "http://www.w3.org/ns/prov#used":                               { role: "provenance", badge: "PROV", name: "used" },
  "http://www.w3.org/ns/prov#hadPrimarySource":                   { role: "provenance", badge: "PROV", name: "hadPrimarySource" },
  "http://www.w3.org/ns/prov#wasRevisionOf":                      { role: "provenance", badge: "PROV", name: "wasRevisionOf" },
  "http://www.w3.org/ns/prov#wasQuotedFrom":                      { role: "provenance", badge: "PROV", name: "wasQuotedFrom" },
  "http://www.w3.org/ns/prov#actedOnBehalfOf":                    { role: "provenance", badge: "PROV", name: "actedOnBehalfOf" },
  "http://www.w3.org/ns/prov#startedAtTime":                      { role: "temporal",   badge: "PROV", name: "startedAtTime" },
  "http://www.w3.org/ns/prov#endedAtTime":                        { role: "temporal",   badge: "PROV", name: "endedAtTime" },
  "http://www.w3.org/ns/prov#generatedAtTime":                    { role: "temporal",   badge: "PROV", name: "generatedAtTime" },
  "http://www.w3.org/ns/prov#invalidatedAtTime":                  { role: "temporal",   badge: "PROV", name: "invalidatedAtTime" },

  // ── Schema.org (common subset) ────────────────────────────
  "http://schema.org/name":                                        { role: "labelling",   badge: "SDO", name: "name" },
  "http://schema.org/alternateName":                               { role: "labelling",   badge: "SDO", name: "alternateName" },
  "http://schema.org/identifier":                                  { role: "labelling",   badge: "SDO", name: "identifier" },
  "http://schema.org/description":                                 { role: "descriptive", badge: "SDO", name: "description" },
  "http://schema.org/abstract":                                    { role: "descriptive", badge: "SDO", name: "abstract" },
  "http://schema.org/keywords":                                    { role: "classifying", badge: "SDO", name: "keywords" },
  "http://schema.org/about":                                       { role: "classifying", badge: "SDO", name: "about" },
  "http://schema.org/genre":                                       { role: "classifying", badge: "SDO", name: "genre" },
  "http://schema.org/author":                                      { role: "provenance",  badge: "SDO", name: "author" },
  "http://schema.org/creator":                                     { role: "provenance",  badge: "SDO", name: "creator" },
  "http://schema.org/publisher":                                   { role: "provenance",  badge: "SDO", name: "publisher" },
  "http://schema.org/datePublished":                               { role: "temporal",    badge: "SDO", name: "datePublished" },
  "http://schema.org/dateCreated":                                 { role: "temporal",    badge: "SDO", name: "dateCreated" },
  "http://schema.org/dateModified":                                { role: "temporal",    badge: "SDO", name: "dateModified" },
  "http://schema.org/image":                                       { role: "media",       badge: "SDO", name: "image" },
  "http://schema.org/url":                                         { role: "media",       badge: "SDO", name: "url" },
  "http://schema.org/sameAs":                                      { role: "structural",  badge: "SDO", name: "sameAs" },
  "http://schema.org/isPartOf":                                    { role: "relational",  badge: "SDO", name: "isPartOf" },
  "http://schema.org/hasPart":                                     { role: "relational",  badge: "SDO", name: "hasPart" },
  "http://schema.org/memberOf":                                    { role: "relational",  badge: "SDO", name: "memberOf" },
  "http://schema.org/member":                                      { role: "relational",  badge: "SDO", name: "member" },
  "http://schema.org/price":                                       { role: "numeric",     badge: "SDO", name: "price" },
  "http://schema.org/ratingValue":                                 { role: "numeric",     badge: "SDO", name: "ratingValue" },
  "http://schema.org/reviewCount":                                 { role: "numeric",     badge: "SDO", name: "reviewCount" },

  // ── GeoSPARQL / WGS84 ─────────────────────────────────────
  "http://www.w3.org/2003/01/geo/wgs84_pos#lat":                  { role: "numeric", badge: "GEO", name: "lat" },
  "http://www.w3.org/2003/01/geo/wgs84_pos#long":                 { role: "numeric", badge: "GEO", name: "long" },
  "http://www.w3.org/2003/01/geo/wgs84_pos#alt":                  { role: "numeric", badge: "GEO", name: "alt" },
};

// ── Namespace → badge mapping ──────────────────────────────────

const NAMESPACE_BADGES: [string, string][] = [
  ["http://www.w3.org/1999/02/22-rdf-syntax-ns#", "RDF"],
  ["http://www.w3.org/2000/01/rdf-schema#", "RDFS"],
  ["http://www.w3.org/2002/07/owl#", "OWL"],
  ["http://www.w3.org/2004/02/skos/core#", "SKOS"],
  ["http://purl.org/dc/terms/", "DCT"],
  ["http://purl.org/dc/elements/1.1/", "DC"],
  ["http://xmlns.com/foaf/0.1/", "FOAF"],
  ["http://www.w3.org/ns/prov#", "PROV"],
  ["http://schema.org/", "SDO"],
  ["https://schema.org/", "SDO"],
  ["http://www.w3.org/2003/01/geo/wgs84_pos#", "GEO"],
  ["http://www.w3.org/ns/shacl#", "SH"],
  ["http://www.w3.org/2002/07/owl#", "OWL"],
];

// ── Heuristic role inference ────────────────────────────────────

function localName(iri: string): string {
  const hash = iri.lastIndexOf("#");
  const slash = iri.lastIndexOf("/");
  const pos = Math.max(hash, slash);
  return pos >= 0 ? iri.slice(pos + 1) : iri;
}

/**
 * Infer a role for predicates not in the explicit registry, based on
 * namespace and local-name patterns.
 */
export function inferRole(iri: string): PredicateRole {
  const local = localName(iri).toLowerCase();

  // Structural namespaces
  if (
    iri.startsWith("http://www.w3.org/2002/07/owl#") ||
    iri.startsWith("http://www.w3.org/2000/01/rdf-schema#subPropertyOf") ||
    iri.startsWith("http://www.w3.org/2000/01/rdf-schema#domain") ||
    iri.startsWith("http://www.w3.org/2000/01/rdf-schema#range")
  ) return "structural";

  // Media patterns
  if (/image|img|logo|photo|picture|thumbnail|video|audio|media|depiction/.test(local)) return "media";
  if (/homepage|webpage|page|url|link|website/.test(local)) return "media";

  // Temporal patterns
  if (/date|time|year|created|modified|issued|published|expires|valid/.test(local)) return "temporal";

  // Provenance patterns
  if (/source|origin|creator|author|made|publisher|attribution|license|rights|derived|generated/.test(local)) return "provenance";

  // Labelling patterns
  if (/label|name|title|caption|heading|alias|identifier|id$|notation/.test(local)) return "labelling";

  // Descriptive patterns
  if (/comment|description|abstract|note|definition|summary|content|text|body|remark/.test(local)) return "descriptive";

  // Classifying patterns
  if (/type|class|category|subject|topic|genre|theme|kind/.test(local)) return "classifying";

  // Numeric patterns
  if (/count|number|num|amount|size|length|width|height|weight|price|lat|lon|lng|alt|score|rank|rating/.test(local)) return "numeric";

  // PROV namespace
  if (iri.startsWith("http://www.w3.org/ns/prov#")) return "provenance";

  // Default: relational
  return "relational";
}

/**
 * Look up a predicate in the registry and return its entry.
 * Falls back to heuristic inference.
 */
export function lookupPredicate(iri: string): RegistryEntry {
  const direct = REGISTRY[iri];
  if (direct) return direct;

  // Heuristic role
  const role = inferRole(iri);

  // Badge from namespace
  let badge: string | undefined;
  for (const [ns, b] of NAMESPACE_BADGES) {
    if (iri.startsWith(ns)) { badge = b; break; }
  }

  return { role, badge };
}
