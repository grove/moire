# Step 7 — Opening an Entity

## Switching from group to individual

You are back at the six-researcher set. Everything we have done so far has been at the group level — filtering the set, traversing it as a whole, watching the context header describe the path. Now we will zoom in on a single person and see what full entity detail looks like.

Click the card for **Erik Rogstad**.

---

## The entity detail view

The screen changes significantly. Instead of a grid of cards, you see a single, full-width view dedicated entirely to Erik Rogstad. The context header updates to simply: **"Erik Rogstad"**. The layer selector appears at the bottom of the screen — you are now in Entity context.

The detail view is organised into two main sections:

### Identity

At the top: Erik's name, his types (Professor, Researcher, Person, Agent — all four levels of the hierarchy), and his description: *"Professor of Database Systems and Knowledge Graphs at University of Oslo."*

### The relationship table

Below the identity section, every relationship Erik has is listed in a table. Each row shows the relationship name on the left and the value on the right:

| Relationship | Value |
|---|---|
| affiliatedWith | → University of Oslo |
| locatedIn | → Oslo |
| worksOn | → Linked Graphs Initiative |
| leads | → Knowledge Graphs Group |
| knows | → Julia Lindström |
| nationality | NO |
| gender | male |

Look carefully at the values. Some have a **→** arrow and are shown as blue links: University of Oslo, Oslo, Linked Graphs Initiative, Knowledge Graphs Group, Julia Lindström. These are *navigable values* — they connect to other entities in the graph that you can visit. Other values — NO and male — are plain facts: a text string and nothing more. There is nowhere to navigate to from a nationality code.

This distinction is fundamental to how knowledge graphs work. Some facts are connections to other things; others are properties that describe the entity itself. Moire makes the distinction visually clear so you always know which values you can follow and which you cannot.

---

## What to notice

The relationship table is comprehensive — it shows every property Moire found on this entity, in the order of usefulness (navigable relationships first). You do not have to know in advance what properties Erik has. Moire discovered them automatically and presents them all here.

The types — Professor, Researcher, Person, Agent — are shown as a stack of badges, reflecting the full hierarchy. Erik is not *just* a Professor; he is simultaneously everything in his ancestry chain. This matters when you use type filters: filtering by Person will include Erik, even if you started with a class that seems more specific.

---

## What to do

Take a moment to read through Erik's relationship table. Notice which values are links and which are plain text. Then continue to [Step 8](08-resource-to-resource.md) to follow one of those links.
