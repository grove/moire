# Enhanced Features with pg-ripple

pg-ripple is a knowledge graph database developed by Trickle Labs. Moire is designed as the primary browser for pg-ripple graphs, and when connected to a pg-ripple endpoint, Moire automatically activates a set of enhanced features that go well beyond what standard SPARQL endpoints can offer. No configuration is required — the features activate silently based on what the endpoint supports.

---

## How detection works

When Moire connects to an endpoint, it sends a capability probe as part of introspection. If the endpoint is a pg-ripple instance, it identifies itself in the probe response. Moire then enables the enhanced feature set. If the endpoint is a standard SPARQL triplestore, Moire runs in standard mode. You do not need to set a flag or choose a mode — it happens automatically.

---

## Full-text search (`pg:fts()`)

On a standard SPARQL endpoint, the search palette (⌘K) searches only entity labels. On a pg-ripple endpoint, the search is upgraded to **full-text search** across all text fields — labels, descriptions, abstracts, notes, and any other string-valued property. The search is powered by pg-ripple's built-in FTS index (`pg:fts()`) and is substantially faster than label-only matching.

Practical effect: searching for "knowledge graph" will surface entities whose description contains that phrase, even if their label does not. This makes the search palette useful for conceptual discovery, not just name lookup.

---

## Inferred knowledge (RDFS/OWL inference)

pg-ripple can apply RDFS and OWL inference rules automatically. When inference is enabled on a dataset, Moire will display entities, types, and relationships that are implied by the data but not explicitly stated. For example: if the schema declares that `Professor rdfs:subClassOf Researcher`, then an entity of type `Professor` will appear in a query for `Researcher` instances even if it has no explicit `rdf:type Researcher` triple.

Moire does not control the inference level — it is set by the database administrator. What Moire does is display whatever the endpoint returns, including inferred triples. If you are seeing entities or relationships you did not expect, inference may be the explanation.

---

## Semantic similarity (`pg:similar()`)

pg-ripple supports semantic similarity queries through a vector index. When browsing a specific entity, Moire can show a "Semantically similar entities" section powered by `pg:similar()` — a ranked list of entities whose overall description in the graph is similar to the current entity's, even if they are not directly connected.

This feature is only available if the pg-ripple dataset has been indexed for similarity (an administrative step). When it is available, Moire adds the similar entities section to the bottom of the entity detail view automatically.

---

## Data quality (SHACL validation)

pg-ripple supports SHACL (Shapes Constraint Language) validation, which lets graph owners define rules about how data should be structured. If a SHACL shape is violated — for example, an entity is missing a required property — pg-ripple can report the violation.

When a dataset has SHACL shapes defined and violations exist, Moire displays a subtle warning indicator on the entity card and a full explanation in the entity detail view. This helps data curators identify quality issues without leaving the browsing interface.

---

## Summary table

| Feature | Standard SPARQL endpoint | pg-ripple endpoint |
|---|---|---|
| Label-based search | ✓ | ✓ |
| Full-text search (all text fields) | — | ✓ (pg:fts) |
| RDFS / OWL inference | depends on database | ✓ (configurable) |
| Semantic similarity section | — | ✓ (if index built) |
| SHACL data quality indicators | — | ✓ (if shapes defined) |
| Named graphs | ✓ | ✓ |
| Facets and traversal | ✓ | ✓ |
| Layer selector | ✓ | ✓ |

---

## Getting pg-ripple

pg-ripple is available from Trickle Labs. For installation, configuration, and data loading instructions, see the pg-ripple documentation. Moire is the recommended browser interface for all pg-ripple graphs.
