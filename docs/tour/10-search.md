# Step 10 — Using Search

## The fastest way in

Everything you have done so far in this tour started from the Graphs Browser and moved through the Types Browser into a set. That path makes sense when you want to explore broadly and are not sure what you are looking for. But when you have something specific in mind, there is a faster route: the search palette.

Press **⌘K** on Mac, or **Ctrl+K** on Windows and Linux. The search palette opens as an overlay on top of whatever you are currently looking at.

---

## What the search palette looks like

The palette is a floating panel with a text input at the top and results below. Type **"julia"** (lowercase is fine — search is case-insensitive).

Results appear almost instantly, grouped into sections:

**Entities**
- Julia Lindström · Professor · Researcher — *[Go →]*

**Browse as set**
- All entities with label containing "julia" — *[Set →]*

The *Entities* section shows individual results — specific things whose name matches your search term. The *Browse as set* option opens a pre-filtered Set view showing all entities whose label contains the search text, which is useful when many things match and you want to browse rather than jump to one.

---

## Using the results

Click **Go →** next to Julia Lindström.

Moire closes the palette and opens Julia Lindström's entity detail view directly — jumping past the Graphs Browser, Types Browser, and Set view entirely. The context header reads: **"Julia Lindström"**. You can read her full details, follow her relationships, and navigate forward from there.

Click **Back** to return to wherever you were before opening the palette.

---

## Keyboard navigation in the palette

The search palette is fully keyboard-navigable:

- **↑ / ↓** — move the highlight up and down through the results
- **Enter** — select the highlighted result (opens the entity or the set, depending on which is highlighted)
- **Escape** — close the palette without navigating anywhere

This means a fluent user can open search with ⌘K, type a few characters, arrow down to the right result, and hit Enter — without touching the mouse.

---

## What search is scoped to

Search always operates within the currently active graph. If you have multiple graphs loaded and have entered a specific graph, the search results come from that graph only. If you want to search in a different graph, return to the Graphs Browser and enter that graph first.

Search finds entities by their label — the human-readable name that Moire uses to display them. It does not search through descriptions or other text properties, just the primary name. The exception is when you are connected to a pg-ripple endpoint, which unlocks a full-text search mode that searches across all text properties — see the [Advanced section](../advanced/pg-ripple-features.md) for details.

---

## When to use search vs. browsing

Neither approach is better than the other — they serve different situations:

- Use **search** when you have a name in mind and want to go there directly.
- Use **Browse as set** from search when you have a partial name or a concept and want to see everything that matches.
- Use the **Types Browser** and facets when you do not have a specific entity in mind and want to explore a category.
- Use **set traversal** when you want to discover what a group connects to, not find a specific thing.

!!! tip "⌘K is always available"
    The search palette can be opened from any view in Moire — the Set view, the Entity detail view, the Types Browser, the Relationships Browser, anywhere. It is a global shortcut. Keep it in muscle memory for the times when you want to jump straight to something specific.

---

## Tour complete

You have now seen every major feature of Moire. Continue to the [Tour Summary](summary.md) for a quick reference table of everything you have covered — or dive straight into the [Concepts](../concepts/index.md) section if you want to understand the ideas in more depth.
