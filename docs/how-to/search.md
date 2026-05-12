# Search with ⌘K

The search palette is Moire's direct-jump shortcut — the fastest way to get to a specific entity or open a pre-filtered set when you have a name or concept in mind.

---

## Opening the palette

Press **⌘K** on Mac or **Ctrl+K** on Windows and Linux. Alternatively, click the search icon in the top right of the top bar. The palette opens as an overlay on top of whatever you are currently viewing — Graphs Browser, Types Browser, Set view, Entity detail, anywhere.

---

## Searching

Start typing as soon as the palette opens. Search begins after the first character and results update as you continue typing. The search is case-insensitive and matches entity labels — the human-readable names Moire displays.

Results appear in two groups:

**Entities** — specific items whose name matches your query, sorted by relevance. Each result shows the entity name, its type(s), and a **Go →** button.

**Browse as set** — a single option at the bottom: "All entities with label containing `[your query]`" with a **Set →** button. This opens a Set view pre-filtered to all entities whose label contains your search term.

---

## Using the results

**To jump to a specific entity:** click **Go →** next to the matching result, or use the arrow keys to highlight it and press Enter. The palette closes and the entity opens in Entity context (full detail view).

**To open a filtered set:** click **Set →** (or highlight the Browse as set option and press Enter). The palette closes and the Set view opens showing all entities whose label contains your search text. From there you can apply facets, traverse relationships, and explore as usual.

**To cancel without navigating:** press **Escape**, or click anywhere outside the palette.

---

## Keyboard navigation

The palette is fully keyboard-driven:

| Key | Action |
|---|---|
| `↑` / `↓` | Move the highlighted result up or down |
| `Enter` | Select the currently highlighted result |
| `Escape` | Close the palette without navigating |

A fluent keyboard workflow: `⌘K` to open, type a few characters, `↓` to move to the right result, `Enter` to navigate — hands never leave the keyboard.

---

## What search is scoped to

Search always operates within the currently active graph. If you have entered a specific graph (by clicking *Browse this graph →*), search finds entities in that graph only. If you are at the Graphs Browser level (no graph selected), search may not return entity results.

Search finds entities by their primary label — the name Moire displays on cards. It does not search within descriptions, abstracts, or other text properties. If you are connected to a pg-ripple endpoint, this behaviour upgrades to full-text search across all text fields — see [Enhanced features with pg-ripple](../advanced/pg-ripple-features.md).

---

## When to use search

- You know the name (or part of the name) of a specific entity and want to jump there directly.
- You want to start a new thread of exploration from a named concept rather than browsing from the top.
- You want to see all entities related to a word or concept without filtering by type first — use *Browse as set* for this.

For everything else — exploring by category, filtering by attribute, following connections — the Types Browser and facet sidebar are the right tools. Search is the bypass, not the primary route.

!!! tip "⌘K from anywhere"
    The palette can be opened from any screen in Moire. If you are deep in a chain of traversals and suddenly remember a specific entity you want to check, open the palette, jump there, and Moire will add it to your navigation history. Pressing Back will take you right back to where you were.
