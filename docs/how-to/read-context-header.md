# Read the Context Header

The context header is the short phrase or sentence that appears just below the top bar. It is automatically generated from your navigation history and tells you — in plain, human-readable language — exactly what you are currently looking at and how you arrived there.

---

## What it looks like

The context header is always visible while you are in a graph. It updates every time you navigate. Some examples, with the navigation path that produced each one:

| Navigation path | Context header |
|---|---|
| Entered the Types Browser for the research graph | *(empty — you are at the overview level)* |
| Clicked Browse as set → on Researcher | **"Researchers"** |
| Added Nationality = SE filter | **"SE Researchers"** |
| Also added Type = Professor filter | **"SE Professors"** |
| Followed affiliatedWith as set → | **"Affiliations of SE Professors"** |
| Followed locatedIn as set → from the universities | **"Locations of affiliations of SE Professors"** |
| Clicked Erik Rogstad card | **"Erik Rogstad"** |
| Pressed Back to the set | **"SE Professors"** *(exact state restored)* |

---

## How the header is built

The header is composed from three sources:

1. **The type or starting point** — the class you entered from the Types Browser, or the entity you have focused on. "Researchers", "SE Professors", "Erik Rogstad".
2. **Active facet filters** — values from the facet sidebar are prepended as adjectives. *Nationality = SE* and *Type = Professor* become "SE Professors". Filters are listed in the order they were applied, with the type always last.
3. **Traversal steps** — each *Follow as set* action adds a prepositional phrase. "Affiliations of..." wraps around the source set description; "Locations of affiliations of..." wraps around that in turn.

The header grows from right to left with each traversal. This means you can read it backwards — the rightmost word is always the entry point, and each prefix adds a traversal hop.

---

## Using the header as a navigation aid

The context header is not just decoration — it is a practical tool for staying oriented during complex explorations.

**If the header is long and complex**, you may have traversed deep into a specific corner of the graph. "Topics of projects worked on by researchers affiliated with universities located in Oslo" is legitimate but narrow. If the results feel confusing, consider pressing Back a few steps to a more familiar vantage point and trying a different path.

**If the header is short and clear**, you are in a well-defined, meaningful part of the graph. "SE Professors" or "University of Oslo" are stable orientations — good places to explore from.

**If the header changes unexpectedly**, you probably navigated somewhere by accident. The Back button will restore the previous header and the previous view.

---

## The header in Relationships context

When you open the Relationships Browser via *Browse relationships →*, the context header reads: **"Relationships on [previous set description]"**. For example: "Relationships on SE Professors". This tells you that the relationships shown are scoped to the SE Professors set — you are seeing which relationships are available on *those specific entities*, not on all researchers or all entities in the graph.

---

## The header in Types context

In the Types Browser, the header reads: **"Types in [graph label]"** — for example, "Types in research". This distinguishes the Types Browser from the Set and Entity views, where the header always reflects the current set or entity.

---

## When the header is absent

On the Graphs Browser (the landing page), there is no context header — you are not yet inside any graph. The header only appears once you have entered a graph and started navigating.
