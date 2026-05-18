# Provenance

Provenance tells you *where* an entity or fact came from. Moire reads
provenance information from the graph and surfaces it in entity detail,
helping you evaluate the trustworthiness and origin of what you are looking at.

---

## What provenance information does Moire show?

When provenance data is available, Moire can display:

- **Source link** — the primary external document or dataset this entity came
  from (hoisted to the entity detail header for easy access).
- **Attribution** — who or what organisation produced or collected this record.
- **Derivation chain** — whether this entity was derived from, quoted from, or
  is a revision of another resource.
- **Generating activity** — the process or import job that created the record.

This information is collected from standard provenance vocabularies. The most
common sources are [PROV-O](https://www.w3.org/TR/prov-o/) and
[Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/).

---

## Where provenance appears in the interface

### Entity detail header

The most useful provenance link is shown directly below the entity title when
available. This is typically a `prov:hadPrimarySource` or `dcterms:source`
value pointing to an authoritative external page.

### Provenance section

Below the main attribute table in entity detail, a **Source / Provenance**
section lists the full provenance chain. Each entry is a link when the value is
an IRI, or plain text when it is a literal. The section is collapsible and
hidden when no provenance data is found.

---

## Provenance predicates Moire recognises

| Predicate | Meaning |
|---|---|
| `prov:hadPrimarySource` | The authoritative source this entity came from. |
| `prov:wasDerivedFrom` | Another resource this entity was derived or copied from. |
| `prov:wasAttributedTo` | The agent (person, organisation, or software) that created this entity. |
| `prov:wasGeneratedBy` | The activity (import, process, event) that generated this entity. |
| `prov:wasQuotedFrom` | A resource this entity was quoted from verbatim. |
| `prov:wasRevisionOf` | An earlier version of this entity. |
| `dcterms:source` | A related resource from which this entity is derived. |
| `dcterms:provenance` | A statement about the history or custody of this entity. |
| `dcterms:publisher` | The entity responsible for making this resource available. |
| `schema:creditText` | Credit text to display when reusing this entity. |
| `schema:sdPublisher` | Who published the dataset this entity belongs to. |

---

## Navigating provenance paths

Source documents, attributing agents, and generating activities are often
resources in their own right. When the provenance value is an IRI (shown as a
link rather than plain text), you can click it to open that entity in Moire —
provided it is in the same graph.

This makes provenance a useful navigation path. From a publication, you can
follow its publisher to see everything published by the same organisation. From
a dataset record, you can follow the import activity to find all records loaded
in the same batch.

---

## Sparse provenance

Most knowledge graphs contain partial or no provenance information. Moire does
not display the provenance section if it is empty, and makes no assumptions
about what is missing.

If you maintain a graph that lacks provenance and would like to supply basic
attribution without modifying the RDF data, you can add provenance descriptions
to an [annotation overlay](../how-to/configure-overlay.md). Overlay descriptions
are shown in tooltips and entity detail even when the graph itself is silent.
