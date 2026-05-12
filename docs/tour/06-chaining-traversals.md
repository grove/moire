# Step 6 — Chaining Traversals

## Building a chain

You are currently looking at the three universities — University of Oslo, Uppsala University, and KTH — arrived at by following *affiliatedWith* from all six researchers. You did this without writing a query. You just clicked.

Now notice the Jump via strip at the bottom of the universities set. It shows **locatedIn (→ 3)** — the three universities are each located in a city, and there are three distinct cities. Click **locatedIn (→ 3)**.

The set transforms again: you now see the three city cards — Oslo, Uppsala, Stockholm. But look at the context header. It now reads:

> **"Locations of affiliations of Researchers"**

---

## The context header as a navigation trail

This sentence is Moire's running record of how you arrived where you are. Read it backwards from the end:

- *Researchers* — where you started (the Researcher type)
- *affiliations of Researchers* — after following affiliatedWith from the researcher set
- *Locations of affiliations of Researchers* — after following locatedIn from the university set

Every traversal you make adds another phrase to the chain. The header grows from right to left, building up a natural-language description of the path you have taken through the graph. You can navigate to arbitrarily long chains — "Topics of projects worked on by researchers affiliated with universities located in Oslo" is achievable through five clicks — and the header will faithfully record the whole journey.

If you ever read the header and think "how did I get here?", the answer is literally in the sentence.

---

## Traversal without losing context

One important thing to notice: at no point did you have to remember where you came from. You are currently looking at three cities, but Moire knows you arrived here via two traversal steps from researchers. The Back button will take you back through those steps one at a time, restoring the exact set you were looking at — with all your filters intact — at each step.

This is what makes Moire different from a standard search interface, where going back usually means losing everything you had built up. In Moire, the entire navigation path is preserved. You can explore freely, follow any chain of traversals as far as you like, and then retrace your steps exactly.

---

## What to do

Click **Back** twice to return to all six researchers. Then continue to [Step 7](07-entity-detail.md) to explore what happens when you click on a single entity rather than traversing the whole set.

!!! note "How long can a chain get?"
    As long as the data supports it. On large, richly connected knowledge graphs, you can follow relationships across many hops — each step producing a new set, the context header growing into a full sentence of provenance. The only limit is the depth of connection in the underlying data.
