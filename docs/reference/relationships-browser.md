# Relationships Browser Reference

The Relationships Browser is a detailed table view of every relationship available on the current set. This page is a complete reference for its columns, sections, and buttons.

---

## How to open it

From any Set view, scroll past the entity cards to the bottom and click **Browse relationships →**. The Relationships Browser opens as a full-width overlay.

---

## Layout

The Relationships Browser is divided into three sections, displayed as separate tables:

1. **Outgoing relationships** — relationships *from* entities in the current set to other entities
2. **Incoming relationships** — relationships *from* other entities *to* entities in the current set
3. **Structural relationships** (shown only when relevant) — schema-level connections such as `rdfs:subClassOf`, `owl:sameAs`, or `rdf:type` counts that are informational rather than navigable

---

## Outgoing relationships table

Each row represents one outgoing relationship. The columns are:

| Column | Meaning |
|---|---|
| **Relationship** | The human-readable label of the predicate. Hover to see the full IRI. |
| **Subjects** | How many entities in the current set have this relationship (i.e., have at least one outgoing link via this predicate). Shows as a fraction of the set size: "6 / 6" means all entities have it; "2 / 6" means only two do. |
| **Targets** | How many distinct entities (IRIs) are reachable via this relationship from the current set. A high target count means traversal produces a large and diverse new set. |
| **Value type** | Either *Resource* (IRI-valued, navigable) or *Literal* (text/number/date, plain text only). Only Resource-type relationships can be traversed or followed as a set. |
| **Follow as set →** | Button (appears only for Resource-type relationships). Clicks trigger a set-to-set traversal: the current set is replaced by all entities reachable via this relationship. |
| **Add as facet** | Button (appears only for Resource-type relationships with moderate cardinality). Adds this relationship as a new filter dimension to the facet sidebar. You stay in the current set but can now filter by who connects to whom. |

---

## Incoming relationships table

Each row represents one incoming relationship — another predicate where entities outside the current set point to entities within it.

| Column | Meaning |
|---|---|
| **Relationship** | The predicate label (same as outgoing). |
| **Sources** | How many distinct entities *outside* the current set use this relationship to point into the current set. |
| **Targets in set** | How many entities in the current set are pointed to (i.e., are the target of this incoming relationship from at least one outside entity). |
| **Follow incoming →** | Navigates to the *sources* — the set of entities outside the current set that point to your current entities via this relationship. The current set is replaced by the source set. |

---

## Structural relationships table

Structural relationships are not data relationships in the usual sense — they are schema or ontology links. Examples include `rdfs:subClassOf` (type hierarchy), `rdfs:domain` / `rdfs:range` (schema constraints), and `owl:sameAs` (identity links).

This table is informational only. The columns are the same as outgoing relationships, but the *Follow as set* and *Add as facet* actions are not available. Structural relationships are shown to help you understand the shape of the schema, not to traverse it as data.

---

## Sorting

Both the Outgoing and Incoming tables are sorted by **subject/source coverage** by default — the most widely shared relationships appear first. This means the top rows are always the best candidates for traversal and facet use. You can click column headers to re-sort by Targets or alphabetically by Relationship name.

---

## What is not shown

- **Literal-only relationships** with many distinct values (e.g., free-text descriptions) are listed but *Add as facet* is not available for them because the high cardinality would make the facet sidebar unusable.
- **Relationships with zero coverage** in the current set are omitted entirely. If a relationship exists in the schema but none of the current entities use it, it does not appear.
- **The `rdf:type` predicate** is handled specially — Moire uses it to build the Types Browser and facet groups rather than listing it as a traversable relationship.

---

## Closing the browser

Click anywhere outside the table, press **Escape**, or click **← Back** to close the Relationships Browser and return to the Set view.
