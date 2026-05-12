# Working with Large Graphs

Moire is designed to be used with knowledge graphs of any size — from a few hundred entities to millions. This page covers practical techniques for staying productive when the graph is large and every query touches a lot of data.

---

## What "large" means in Moire's context

Moire displays up to **100 entities** at a time in a Set view. This cap is a design decision: showing more would slow down the browser and make the cards unreadable. A graph with 10 million entities is perfectly valid, but Moire will always show you at most 100 at a time.

When a set has more than 100 matching entities, Moire shows a notice: "Displaying 100 of [N] entities. Add filters or traverse to a more specific set." This is not an error — it is a prompt to narrow your exploration.

---

## Start with type filters

In a large graph, browsing all entities of a broad type (Person, Document, Event) will almost always hit the 100-entity display cap. This is the entry point, not the destination. As soon as you enter a broad set, move to the facet sidebar and apply a filter.

**Good workflow for large graphs:**
1. Open the Types Browser and choose a relatively specific type — not the most general supertype
2. Browse as set
3. Immediately check the set size notice at the top of the cards area
4. If size > 100, apply a facet filter before exploring
5. Use the filter to bring the displayed count below 100, then proceed

Choosing a more specific type upfront (Professor rather than Person) naturally produces smaller sets without needing to filter.

---

## Trust the greyed-out values

In large graphs, the facet sidebar is especially valuable because greyed-out values tell you immediately which combinations are impossible — without having to make a query and wait for an empty result. Before applying a filter that might be too restrictive, scan the sidebar for how many values are greyed out. If most values become greyed out after your first filter, you may be narrowing too fast.

---

## Add filters before traversing

In a large graph, traversing from a 100-entity set (which might actually represent 10,000 entities in the database) can produce a very large result set that immediately hits the cap again. It is more productive to filter first, reduce the set to a meaningful subgroup, and then traverse.

**Example:** Browsing 100 of 50,000 researchers. Instead of following *affiliatedWith* immediately (which would traverse from an unrepresentative sample), filter by Country = SE first to get Swedish researchers specifically, then follow *affiliatedWith* to get Swedish academic institutions.

---

## Use the entity detail for deep dives

The entity detail view is not affected by the 100-entity cap — it always shows the complete relationship table for a single entity. If you want to understand a specific entity thoroughly without worrying about set size, navigate directly to it (via search or by clicking its card) and explore from the detail view using the Layer selector.

Layer +1 (direct connections) and Layer −1 (incoming connections) are still displayed as capped sets, but from the entity detail you can see the *complete* relationship table, which shows every connection regardless of the display cap.

---

## Interpret counts carefully

In a large graph, facet counts may show numbers like "1,247" or "42,000". These are counts of entities in the *current set*, but when the set is capped at 100, the counts reflect the full matching set — not just the 100 displayed. The displayed cards are a sample; the counts are accurate.

This means: a count of 42,000 for a facet value tells you that 42,000 entities in the full uncapped set have that value. Clicking it will narrow the displayed set to up to 100 of those 42,000 entities. The exploration experience is the same; the counts just remind you that the full set is larger than what you see.

---

## When to use keyword search

In a large graph, keyword search (⌘K) is often the fastest path to a known entity. If you know the name of the entity you want — a specific person, place, publication, or concept — searching is much faster than navigating via the Types Browser and filters.

For discovery (finding things you do not already know), the Types Browser + facets approach is better because it surfaces structure and connections you could not search for by name. Use search for verification and navigation; use browsing for discovery.

---

## Performance expectations

Query performance depends on your triplestore and server hardware. Introspection (the initial query on connect) takes 1–5 seconds for most graphs. Each navigation step (type browsing, traversal, facet update) triggers one to three SPARQL queries and typically takes 0.5–3 seconds on a well-resourced server.

If queries are very slow (>5 seconds per step), possible causes:
- The triplestore lacks appropriate indexes — check your database administrator
- The graph has no `rdfs:label` triples and Moire is falling back to IRI-based matching (expensive on large graphs)
- The server is under heavy load from other users

pg-ripple is optimised specifically for Moire's query patterns and will generally outperform general-purpose triplestores on large graphs.
