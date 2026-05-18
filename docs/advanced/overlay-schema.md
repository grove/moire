# Overlay Schema Reference

An annotation overlay is a JSON file that lets you customise how predicates and
resources appear in Moire, without modifying the underlying RDF data. Overlays
are registered per endpoint in the Endpoint Manager and fetched automatically on
connection.

This page is a complete reference for every field in the overlay format. For a
step-by-step guide to writing and registering your first overlay, see
[Configure an annotation overlay](../how-to/configure-overlay.md).

---

## Root object

```json
{
  "version": 1,
  "name": "My endpoint overlay",
  "predicates": { ... },
  "resources":  { ... }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | integer | **Yes** | Schema version. Must be `1`. |
| `name` | string | No | Human-readable name for this overlay. Shown in logs and error messages. |
| `predicates` | object | No | Map of predicate IRI → predicate entry. See [Predicate entries](#predicate-entries). |
| `resources` | object | No | Map of resource IRI → resource entry. See [Resource entries](#resource-entries). |

---

## Predicate entries

Each key in `predicates` is the full IRI of a predicate.
Each value is a predicate entry object.

```json
"predicates": {
  "http://example.org/research/legacyId": {
    "label": "Legacy Record ID",
    "description": "Internal identifier from the pre-migration system.",
    "role": "structural",
    "hidden": true
  },
  "http://example.org/research/affiliatedWith": {
    "label": "Affiliated with",
    "inverseLabel": "Affiliations",
    "group": "Researcher relations",
    "priority": 1
  }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `label` | string | — | Override the display label. Shown in the Relationships Browser, Jump strip, and tooltips. Takes the highest precedence over vocabulary registry, RDFS/SKOS graph metadata, and heuristic labels. |
| `inverseLabel` | string | — | Label used when this predicate is traversed in the *incoming* direction. Example: `affiliatedWith` → incoming → `"Affiliations"`. |
| `description` | string | — | Plain-text explanation shown in hover tooltips. |
| `role` | string | — | Semantic role. Overrides the role computed from the vocabulary registry and heuristics. See [Roles](#roles) for allowed values. |
| `group` | string | — | Named display group shown in the Relationships Browser. Predicates with the same group appear under the same heading. |
| `hidden` | boolean | `false` | When `true`, the predicate is hidden from the Relationships Browser and Jump strip by default. It becomes visible when the user activates Technical view. |
| `icon` | string | — | Icon identifier (reserved for future use). |
| `priority` | number | — | Display priority. Lower values appear first. `0` is highest priority. Predicates without a priority follow the default usefulness ordering. |

### Roles

The `role` field must be one of the following values:

| Value | Meaning |
|---|---|
| `labelling` | A label, name, or title predicate. Examples: `rdfs:label`, `skos:prefLabel`, `foaf:name`. |
| `descriptive` | A description, definition, or comment. Examples: `rdfs:comment`, `skos:definition`, `dcterms:description`. |
| `classifying` | A type or category assignment. Examples: `rdf:type`, `skos:broader`. |
| `relational` | A navigable link to another entity. Examples: `affiliatedWith`, `locatedIn`, `hasMember`. |
| `temporal` | A date or time value. Examples: `dcterms:created`, `prov:generatedAtTime`, `schema:datePublished`. |
| `numeric` | A numeric measure or count. Examples: `schema:numberOfPages`, `void:triples`. |
| `provenance` | A source, attribution, or derivation link. Examples: `prov:wasDerivedFrom`, `dcterms:source`. |
| `structural` | An ontology or schema link not intended for data navigation. Examples: `rdfs:subClassOf`, `owl:sameAs`. |
| `media` | An image, document, or external page link. Examples: `foaf:depiction`, `schema:image`, `foaf:page`. |

---

## Resource entries

Each key in `resources` is the full IRI of a resource (entity).
Each value is a resource entry object.

```json
"resources": {
  "http://example.org/org/research-institute": {
    "label": "Research Institute",
    "description": "The main coordinating body for research activities.",
    "aliases": ["RI", "The Institute"]
  }
}
```

| Field | Type | Description |
|---|---|---|
| `label` | string | Override the display label for this specific resource. |
| `description` | string | Plain-text description. |
| `icon` | string | Icon identifier (reserved for future use). |
| `aliases` | string[] | Alternate names used for search and matching. |

> **Note:** Resource overlay entries are stored and available for future use by
> entity detail components. They are not yet rendered in the current UI.

---

## Validation

The overlay is validated when the endpoint is connected. Invalid overlays
produce a clear error message and a warning is shown in the Endpoint Manager.
An invalid overlay does not prevent the endpoint from being added; the endpoint
is connected without an overlay.

Common validation errors:

- `"version"` is missing or is not `1`.
- `"predicates"` or `"resources"` is not an object.
- A predicate entry's `"role"` is not one of the nine recognised values.
- A `"hidden"` field is a string `"true"` instead of a boolean `true`.
- An `"aliases"` field is a string instead of an array.

---

## Precedence

Overlay annotations win over all other sources. The full precedence order from
highest to lowest is:

1. **Overlay** — fields in this file.
2. **SHACL** — `sh:name` and `sh:description` from shapes in the graph.
3. **SKOS** — `skos:prefLabel` and `skos:definition` from the graph.
4. **RDFS** — `rdfs:label` and `rdfs:comment` from the graph.
5. **Vocabulary registry** — built-in labels for well-known predicates.
6. **Heuristic** — label derived from the predicate IRI's local name.

---

## Complete example

```json
{
  "version": 1,
  "name": "Internal research graph — production overlay",
  "predicates": {
    "http://example.org/research/legacyId": {
      "label": "Legacy Record ID",
      "description": "Internal identifier from the pre-migration system. Not meaningful to end users.",
      "role": "structural",
      "hidden": true
    },
    "http://example.org/research/affiliatedWith": {
      "label": "Affiliated with",
      "inverseLabel": "Affiliations",
      "description": "Links a researcher to the institution where they hold a position.",
      "role": "relational",
      "group": "Researcher relations",
      "priority": 1
    },
    "http://example.org/research/fundedBy": {
      "label": "Funded by",
      "inverseLabel": "Funded projects",
      "description": "Links a project to its funding body.",
      "role": "provenance",
      "group": "Project relations"
    },
    "http://internal.example.org/sys/ingestTimestamp": {
      "label": "Ingested",
      "description": "Timestamp of when this record was imported into the system.",
      "role": "temporal",
      "hidden": true
    }
  },
  "resources": {
    "http://example.org/org/research-institute": {
      "label": "Research Institute",
      "description": "The main coordinating body for national research activities.",
      "aliases": ["RI", "The Institute"]
    }
  }
}
```
