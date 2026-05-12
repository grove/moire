# Tour Summary

You have completed the full tour of Moire using the research knowledge graph. Here is a quick reference of every feature demonstrated, mapped to the step that introduced it.

## What each step covered

| Step | Feature | What you did |
|---|---|---|
| [1 — Graphs Browser](01-graphs-browser.md) | Endpoint connection, graph overview | Connected to the research endpoint, read the graph summary card |
| [2 — Types Browser](02-types-browser.md) | Class hierarchy, choosing a starting type | Read the Researcher hierarchy, clicked Browse as set |
| [3 — Set View](03-set-view.md) | Entity cards, auto-generated facets | Saw all 6 researchers as cards; Moire built the facets automatically |
| [4 — Filtering](04-facet-filtering.md) | Facet filtering, empty states, clearing | Filtered by nationality and type; triggered an empty state and recovered |
| [5 — Set Traversal](05-set-traversal.md) | Jump via strip, Relationships Browser | Moved all 6 researchers through locatedIn and affiliatedWith |
| [6 — Chaining](06-chaining-traversals.md) | Multi-hop traversal, context header | Chained two traversals; read the growing context header |
| [7 — Entity Detail](07-entity-detail.md) | Full entity view, relationship table | Opened Erik Rogstad; read his navigable and plain-text properties |
| [8 — Resource-to-resource](08-resource-to-resource.md) | Following a single IRI link | Clicked University of Oslo from Erik's table; saw incoming relationships |
| [9 — Layers](09-layers.md) | Layer selector, neighbourhood exploration | Switched between Layer 0 (full detail), +1 (direct connections), −1 (incoming) |
| [10 — Search](10-search.md) | ⌘K search palette | Typed "julia"; jumped directly to Julia Lindström's entity detail |

---

## The two navigation primitives

Everything in Moire's navigation reduces to two operations:

**Resource-to-resource** (`pushFocus`): Click on a single entity to navigate to its detail view. Input: one IRI. Output: one entity in detail. Stack effect: pushes a new history entry.

**Set-to-set** (`traverseVia`): Click Follow as set or a Jump via button to move the entire current group through a relationship. Input: a set of entities. Output: a new set of connected entities. Stack effect: pushes a new history entry.

Everything else — facet filtering, layer switching, the context header — is built around these two primitives.

---

## The six concepts behind the interface

| Concept | What it means | Where you saw it |
|---|---|---|
| Entity | A single named thing in the graph | All cards; Erik Rogstad, University of Oslo, Oslo |
| Relationship | A named connection between two entities | Erik's relationship table; affiliatedWith, locatedIn |
| Type / Class | A category that an entity belongs to | Types Browser; Professor, University, Place |
| Set | A group of entities matching current filters | The researcher cards; the city cards after traversal |
| Lens | The combination of all active filters | The facet sidebar; SE + Professor = 2 results |
| Layer | Conceptual distance from a focus entity | The layer selector; Layer 0 = full detail, +1 = neighbours |

---

## Where to go next

- **[Concepts](../concepts/index.md)** — deep dives into each of the six concepts above, with everyday analogies
- **[How-to guides](../how-to/index.md)** — task-focused instructions for every navigation mode
- **[Reference](../reference/index.md)** — keyboard shortcuts, the full glossary, and a detailed Relationships Browser reference
- **[Advanced](../advanced/index.md)** — connecting different database types and unlocking pg-ripple features
