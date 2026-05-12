# Sets

## The most important idea in Moire

If you only understand one concept from this section, make it this one: Moire is built around groups, not just individuals. A *set* is the collection of entities currently visible in the main cards area — all the entities that satisfy your active type selection and filters. When you browse, filter, or traverse in Moire, you are nearly always working with an entire set at once.

This sounds like a small difference from ordinary search — but it changes what kinds of questions you can answer. Ordinary search tells you about one thing at a time. Set-based navigation tells you about *patterns across a group*.

---

## The table analogy

Imagine you have a spreadsheet with 412 rows, one for each researcher in a database. Each row has columns: name, university, city, research field, publication count. To find out which cities those researchers are mostly from, you could scroll through all 412 rows — but it would take forever. Or you could sort the spreadsheet by city and count the groups.

Moire does the equivalent automatically. When you are looking at a set of 412 researchers and click *locatedIn* in the Jump via strip, Moire asks: "for every researcher in this set, follow the *locatedIn* relationship, collect all the results, remove duplicates, and show me the unique set of cities." The result is not 412 city cards (one per researcher) — it is however many *distinct* cities those 412 researchers are located in. The set collapses duplicates and gives you the unique results.

This is the power of set-to-set traversal: answering aggregate questions by navigating, not by querying.

---

## How sets are created

Sets come into being four different ways in Moire:

1. **Selecting a type** in the Types Browser — all instances of that class.
2. **Applying facet filters** — the set updates to match all active filter conditions simultaneously.
3. **Traversing via a relationship** — following a predicate from the current set to a new set of connected entities.
4. **Using the search palette with "Browse as set"** — all entities whose label contains the search term.

In all four cases, the result is the same kind of thing: a set of entity cards in the central area, with a facet sidebar that reflects the properties of whatever is currently in the set.

---

## Sets move; individual entities come and go

One of the most important things to understand about sets is that they are fluid. Add a filter and some entities leave the set; remove it and they come back. Traverse via a relationship and the entire set is replaced by a new group. The entities themselves have not changed — the underlying graph is static. What changes is which subset of the graph you are currently looking at.

This fluidity is intentional and useful. It means you can narrow a set with a filter, look at what remains, then remove the filter and widen the set again — all without losing your place. Moire always shows you a count of how many entities are in the current set (visible in the context header — "412 Researchers" or "23 UK Researchers"), so you always know the scale of what you are looking at.

---

## Set-to-set vs resource-to-resource

Moire has two navigation primitives, and understanding the difference is essential:

| | Input | Output | Use when |
|---|---|---|---|
| **Set-to-set** (Jump via, Follow as set) | The entire current set | A new set of connected entities | Discovering patterns across a group |
| **Resource-to-resource** (clicking a card or a link) | One specific entity | One entity in detail | Reading about a specific thing |

You will use both constantly. Resource-to-resource is for depth; set-to-set is for breadth. The best explorations alternate between the two: traverse to a new set, scan the patterns, click into one item for detail, come back to the set and continue.

!!! note "Sets are bounded"
    Moire caps the number of entities shown in a set view at 100 per page for performance reasons. For very large sets (thousands of entities), you will see the first 100 cards and a total count. The facet counts and traversal operations still work correctly against the full set — only the display is capped. Adding filters is the best way to work with a large set: narrow it to a manageable size before exploring further.
