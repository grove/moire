# Empty States Explained

Moire has three distinct empty states, each with a different cause and a different recovery path. Knowing which one you are looking at makes it much easier to get back on track.

---

## 1. No results from traversal

**When it appears:** You followed a relationship (via Jump via strip or Relationships Browser) and the resulting set is empty.

**What it means:** None of the entities in your source set have the relationship you traversed, or the relationship targets nothing that exists in the current graph. This is a data condition, not an error.

**What it looks like:** An empty card grid, no facet sidebar, a message such as "No entities found via [relationship name]."

**How to recover:**

- Press **Back** to return to the source set.
- Try a different relationship from the Jump via strip.
- Check the Relationships Browser — low coverage relationships (Subjects = 1 or 2) are more likely to produce sparse or empty results.

---

## 2. No results from filter combination

**When it appears:** You applied one or more facet filters and the combination produces zero matching entities.

**What it means:** No entity in the current set satisfies *all* of the active filters simultaneously. The filters are individually valid — each one has matching entities — but together they are too restrictive.

**What it looks like:** An empty card grid with the facet sidebar still visible, and a set of helpful suggestions: "Remove 'female' → 2 results. Remove 'SE' → 1 result." The active filters are shown as chips at the top of the sidebar.

**How to recover:**

- Click one of the suggestions to remove that specific filter.
- Click **Clear all filters** to remove all filters at once and return to the full unfiltered set.
- Reconsider the filter combination: the greyed-out values in the facet sidebar told you beforehand which combinations were impossible — this state appears when you have bypassed that signal by adding filters across groups where one group's options became greyed out after applying the other.

---

## 3. Empty graph or introspection failure

**When it appears:** You enter a graph from the Graphs Browser and the Types Browser shows no types, or the Set view is completely empty despite no filters.

**What it means:** Either the graph genuinely contains no data, or Moire's introspection queries found nothing it could work with. This can happen if:

- The graph uses non-standard label predicates not recognised by introspection.
- The graph contains only blank nodes with no typed resources.
- The endpoint returned an error during introspection.
- The named graph is empty in the database.

**What it looks like:** The Types Browser shows a single message such as "No types found in this graph" or "Introspection returned no results." There is no type list and no way to browse by type.

**How to recover:**

- Return to the Graphs Browser and try a different graph.
- Check that the endpoint URL is correct and the database is running.
- If you are the administrator of the database, verify that the graph contains typed, labelled resources.
- If you are using an unsupported database format, see [Database types and compatibility](../advanced/database-types.md).

---

## The difference between states 1 and 2

The clearest distinction: in state 1 (no results from traversal), there are **no filters active** and the facet sidebar is absent. In state 2 (no results from filter combination), the **facet sidebar is visible** with your active filters shown as chips at the top. If you see the sidebar, you are in state 2 and the fix is to remove a filter. If you do not see the sidebar, you are in state 1 and the fix is to go Back.
