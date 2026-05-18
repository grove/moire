# Predicate Roles

Every relationship in the Relationships Browser is assigned a *role* — a
short classification that describes what kind of information the relationship
carries. Roles are used to group and order predicates so the most useful paths
for navigation appear first.

---

## What is a predicate role?

A predicate role summarises the purpose of a relationship in plain terms.
For example, a relationship called `rdfs:label` is clearly a labelling predicate
— it supplies a human-readable name. A relationship called `affiliatedWith`
links one entity to another and is navigable — it is *relational*. A
relationship like `owl:sameAs` is a schema-level link — it is *structural* and
is moved to a separate section where it stays out of the way.

Moire assigns roles automatically from a built-in vocabulary registry, from
namespace and name heuristics, and from any metadata the graph itself publishes.
Endpoint owners can override roles in an [annotation overlay](../how-to/configure-overlay.md).

---

## The nine roles

### Relational

Navigable links to other entities. These are the relationships you follow when
you want to move from one set of things to another.

Examples: `affiliatedWith`, `locatedIn`, `hasMember`, `authorOf`,
`owl:sameAs` (when used as a navigable identity link).

Relational predicates appear in the **Explore** section of the Relationships
Browser and receive the highest usefulness scores.

---

### Classifying

Type or category assignments. These predicates group entities into classes and
are excellent candidates for facet filtering.

Examples: `rdf:type`, `skos:broader`, `schema:genre`, `dcterms:type`.

Classifying predicates appear in the **Filter** section and produce facet
dimensions on the left side panel.

---

### Labelling

Names, titles, and primary identifiers. These predicates supply the human-
readable text that represents an entity in card views, headings, and search
results.

Examples: `rdfs:label`, `skos:prefLabel`, `foaf:name`, `schema:name`,
`dcterms:title`.

---

### Descriptive

Descriptions, definitions, and notes. These predicates expand on the meaning of
an entity or predicate and appear in tooltips and entity detail.

Examples: `rdfs:comment`, `skos:definition`, `skos:scopeNote`,
`dcterms:description`, `schema:description`.

---

### Temporal

Dates and times. These predicates record when something happened, was created,
or expires.

Examples: `dcterms:created`, `dcterms:modified`, `prov:generatedAtTime`,
`schema:datePublished`, `schema:validFrom`.

---

### Numeric

Numeric measures and counts. These predicates carry quantitative data such as
scores, prices, or counts.

Examples: `schema:numberOfPages`, `void:triples`, `schema:price`.

---

### Provenance

Source links and attribution. These predicates say where an entity or fact came
from.

Examples: `prov:wasDerivedFrom`, `prov:wasAttributedTo`, `dcterms:source`,
`prov:hadPrimarySource`.

---

### Media

Images, documents, and external web pages. These predicates link to files and
online resources associated with an entity.

Examples: `foaf:depiction`, `schema:image`, `foaf:page`, `schema:contentUrl`.

---

### Structural

Schema-level or ontology links not intended for data navigation. These
predicates are informational rather than traversable and are moved to a
separate section at the bottom of the Relationships Browser.

Examples: `rdfs:subClassOf`, `rdfs:domain`, `rdfs:range`, `owl:sameAs` (when
used as an identity link), `owl:inverseOf`.

---

## How roles affect the interface

| Role | Relationships Browser section | Facet sidebar | Jump strip |
|---|---|---|---|
| Relational | Explore | Candidate (IRI-valued, medium cardinality) | Yes |
| Classifying | Filter | High priority | Yes |
| Labelling | Describe | No | No |
| Descriptive | Describe | No | No |
| Temporal | Describe | Date-range facet | Rarely |
| Numeric | Describe | Numeric-range facet | Rarely |
| Provenance | Source | Candidate | Rarely |
| Media | Describe | No | No |
| Structural | Technical (collapsed by default) | No | No |

---

## Overriding a role

If a predicate is automatically assigned the wrong role, you can correct it in
an [annotation overlay](../how-to/configure-overlay.md). For example, to
reclassify an internal system link as structural (and hide it by default):

```json
{
  "version": 1,
  "predicates": {
    "http://example.org/internal/legacyId": {
      "role": "structural",
      "hidden": true
    }
  }
}
```

See [Overlay schema reference](../advanced/overlay-schema.md) for a full list of
overlay fields.
