# Step 8 — Resource-to-Resource Navigation

## Following a single connection

You are looking at Erik Rogstad's entity detail view. In his relationship table, *affiliatedWith* points to **University of Oslo** as a clickable link. Click it.

---

## Arriving at the University of Oslo

You are now looking at the entity detail view for the University of Oslo. The context header reads: **"University of Oslo"**. The navigation history has grown by one step — the Back button will take you back to Erik.

The University of Oslo's relationship table shows:

| Relationship | Value |
|---|---|
| type | University, Organization, Agent |
| locatedIn | → Oslo |
| *Incoming: affiliatedWith* | ← Erik Rogstad |
| *Incoming: affiliatedWith* | ← Maria González |

Notice the **Incoming** section. This is where entities that point *to* the university appear — in this case, two of the researchers who list the University of Oslo as their affiliation. These incoming relationships are shown separately from the outgoing ones because they have a different meaning: they answer the question "who or what connects to this entity?" rather than "what does this entity connect to?"

You can follow any of these links — outgoing or incoming — to continue navigating. Click **← Erik Rogstad** in the incoming section and you jump back to Erik. Click **← Maria González** and you navigate to the PhD student who is also affiliated with Oslo.

---

## Resource-to-resource vs set-to-set

This is the simplest form of navigation in Moire: one entity → one connected entity. You click a link in the relationship table and you arrive at the thing that link points to. It is linear, direct, and exactly what you would expect from a hyperlink.

Compare this to what you did in [Step 5](05-set-traversal.md), when you clicked *locatedIn* in the Jump via strip from the researcher set. That was set-to-set traversal: the entire group of six researchers, moving together through a relationship to a new group of cities. Resource-to-resource navigation is personal; set-to-set traversal is collective.

Both modes are available throughout Moire, and you use them for different purposes:

- **Resource-to-resource**: when you want to read about a specific connected entity, follow a chain of individual connections, or understand one relationship in depth.
- **Set-to-set**: when you want to discover patterns across a group, find what a whole set has in common, or move the entire current context to a related domain.

---

## Going deeper

From the University of Oslo, click **→ Oslo** in the locatedIn row. You arrive at the Oslo entity — a city. Oslo's relationship table will show its own properties, and in the incoming section you will see all the researchers and organisations located there. You can keep following links, building a path through the graph one connection at a time, for as long as there are connections to follow.

---

## What to do

Click **Back** twice to return to the six-researcher set. Then continue to [Step 9](09-layers.md) to explore the layer selector — a different way of seeing an entity's neighbourhood.
