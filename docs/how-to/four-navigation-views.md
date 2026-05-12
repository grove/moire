# The Four Navigation Views

Moire has one main screen that changes its rendering depending on what you are doing. There are four distinct *contexts*, each suited to a different kind of exploration. Understanding them — and knowing how to move between them — makes the whole interface feel coherent rather than surprising.

---

## Graphs context

The Graphs Browser is Moire's landing page. It shows all named graphs available on the connected endpoint, each as a summary card with triple count, top entity types, and a **Browse this graph →** button. You arrive here when you first connect, and you can always return by clicking your way back through the navigation history.

**Enter from:** connecting a new endpoint; clicking Back past the Types Browser.
**Leave to:** Types context (by clicking Browse this graph →), or any other graph.

---

## Types context

The Types Browser shows the class hierarchy of a selected graph — all entity types discovered during introspection, with their instance counts and hierarchical relationships. It is the best overview of "what is in this graph?" and is typically the first thing you see after entering a graph.

**Enter from:** clicking Browse this graph → from Graphs context; clicking Browse types → from Set or Entity context; the Back button from a Set that was entered via a type.
**Leave to:** Set context (by clicking Browse as set → on any type); Relationships context (via Browse relationships →).

---

## Set context

The Set view is the main working space. It shows a grid of entity cards and the facet sidebar. You are in Set context whenever you are browsing a group of entities — whether you arrived by selecting a type, applying filters, or traversing via a relationship. Most of your time in Moire will be spent here.

**Enter from:** clicking Browse as set → from Types context; clicking Follow as set → or a Jump via button; selecting Browse as set from the search palette.
**Leave to:** Entity context (by clicking a card); Relationships context (via Browse relationships →); Types context (via Browse types →).

---

## Entity context

Entity context is the focused, single-entity view. When you click a card in Set context (or select a specific entity from search), the view switches to show one entity in full detail with the layer selector. You can navigate outward to the entity's neighbourhood (Layer +1, Layer +2) or inward from the entities that point to it (Layer −1).

**Enter from:** clicking any entity card from Set context; clicking Go → in the search palette; following a navigable link from another entity's relationship table.
**Leave to:** Set context (via Back or Browse types →); another Entity context (by clicking a link in the relationship table); Relationships context (via Browse relationships →).

---

## Relationships context

The Relationships Browser is a secondary view that shows every relationship available on the current set — both outgoing and incoming — with subject counts, target counts, and action buttons. It is a decision-making view: you come here to decide what to traverse, then leave to do the traversal.

**Enter from:** clicking Browse relationships → from any Set or Entity context.
**Leave to:** Set context (by clicking Follow as set → or Follow incoming as set →); previous context (via Back).

---

## Moving between contexts

The diagram below shows how the contexts connect:

```
  ┌─────────────┐
  │   Graphs    │ ── Browse this graph → ──────────────────┐
  └─────────────┘                                         ↓
                                                 ┌────────────────┐
  ┌─────────────┐ ←── Back ────────────────────  │     Types      │
  │   Entity    │                                └────────────────┘
  └─────────────┘ ── Browse relationships → ─┐         ↓ Browse as set →
        ↑                                    ↓   ┌─────────────────────┐
        │ (click link)             ┌──────────────│   Relationships     │
        │                         │              └─────────────────────┘
        └──── click card ─── ┌────────────┐             ↓ Follow as set →
                             │    Set     │ ────────────────────────────→
                             └────────────┘
```

The Back button always works: it takes you to the previous context in your navigation history, restoring the exact state (filters, focus entity, layer) you were in before.
