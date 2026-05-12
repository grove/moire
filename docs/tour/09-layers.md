# Step 9 — Exploring Layers

## The neighbourhood around a focus entity

From the researcher set, click the card for **Erik Rogstad** again to enter his entity detail view. You are now in Entity context: the context header says *"Erik Rogstad"*, and the layer selector appears at the bottom of the screen.

The layer selector looks like this:

```
[−2]  [−1]  [● Focus]  [+1]  [+2]
```

Right now you are at **● Focus** (Layer 0) — the full detail view of the entity itself. This is the most detailed level: full description, complete relationship table, all properties visible.

---

## Layer +1: direct connections as a card grid

Click **+1** in the layer selector.

The view transforms from the single-entity detail into a grid of cards — one for each entity that Erik is directly connected to. In the research dataset, you will see:

- University of Oslo
- Oslo
- Linked Graphs Initiative (the project he works on)
- Knowledge Graphs Group (the research group he leads)
- Julia Lindström (via the *knows* relationship)

These are all the entities that appear in Erik's relationship table, now shown as browsable cards. They are at *summary* detail level — name, type badge, and a short description — because they are Layer +1, one step away from the focus. The focus entity itself (Erik) is not shown here; you have moved one ring outward.

You can apply facets to this Layer +1 view. If Erik had dozens of connections, you could filter by type to see only the Places, or only the Projects. The facet sidebar updates automatically to reflect the properties of the entities in the Layer +1 set.

---

## Layer −1: what points to this entity

Click **−1** in the layer selector.

Layer −1 shows entities that have a relationship *pointing to* Erik — the incoming direction. In the research dataset, this will show a small number of entities (or possibly the empty state, since Erik is not the target of many relationships in this small graph). In a larger, richer graph, Layer −1 is extremely useful for questions like "who cites this paper?", "what projects reference this person?", or "what other entities are linked to this concept?"

Think of it as the view from the other side: instead of "what does Erik point to?" (Layer +1), it is "what points to Erik?" (Layer −1).

---

## Layer +2: two hops out

Click **+2** in the layer selector.

Layer +2 shows all entities that are two steps away from Erik — the connections of his connections. From the research dataset this would include the universities and cities that Erik's colleagues are affiliated with, the topics of the projects his connections work on, and so on. At this distance, cards are shown at *headline* detail — just the name and type badge — because there are typically more of them and you are exploring a larger neighbourhood.

---

## The ripple-in-a-pond model

The layer selector embodies a specific idea about graph exploration: distance from a focal point is a meaningful concept. Drop a stone into a pond. The first ring of ripples is the direct connections (Layer +1). The second ring is the connections-of-connections (Layer +2). The rings below zero are the incoming ripples — things that connect *to* the stone rather than outward from it.

When you have a specific entity in focus and want to explore its neighbourhood methodically — outward by hop count or inward via incoming connections — the layer selector is the right tool. When you are working with a group of entities and there is no single focal point, the Jump via strip replaces it.

---

## What to do

Click **● Focus** to return to Erik's full detail view. Then click **Back** to return to the six-researcher set. Continue to [Step 10](10-search.md) to see how to use the search palette.
