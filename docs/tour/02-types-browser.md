# Step 2 — The Types Browser

## What you will see

After clicking **Browse this graph →**, Moire shows you the **Types Browser** — a structured overview of all the *types* (categories) of entities present in the graph, arranged in a hierarchy and sorted by how many instances of each type exist.

For the research graph, the hierarchy looks like this:

```
Agent                         9 instances
  ├─ Person                   6 instances
  │    └─ Researcher          6 instances
  │         ├─ Professor      3 instances
  │         └─ PhDStudent     3 instances
  └─ Organization             6 instances
       ├─ University          3 instances
       └─ ResearchGroup       3 instances
Place                         3 instances
Topic                         5 instances
Paper                         4 instances
Project                       2 instances
```

Each entry has a **Browse as set →** button that takes you into a browsable, filterable set of all entities of that type.

---

## Understanding the hierarchy

The indentation here is not cosmetic — it reflects a real relationship in the data. *Researcher* is a subtype of *Person*, which is a subtype of *Agent*. A Professor is simultaneously a Researcher, a Person, and an Agent — the types accumulate up the hierarchy. This means that if you browse all Agents, you will see all six researchers and all six organisations. If you browse Researchers, you will see just the six researchers (not the organisations). If you browse Professors, you will see only the three professors.

This kind of type hierarchy is common in knowledge graphs. Moire displays it visually here so you can choose the level of specificity that makes sense for what you are exploring. You might want to start broad and filter down, or you might already know you are interested in a specific subtype and want to jump straight in.

---

## What to notice

The instance counts help you make a quick decision about where to start. Types with very few instances (like *Project* with 2, or *Place* with 3) may not give you much to filter; types with more instances (like *Researcher* with 6 or *Topic* with 5) offer more room to explore. For a larger real-world graph, these counts could be in the thousands, and the hierarchy helps you choose a meaningful starting point rather than being overwhelmed by everything at once.

The **Browse Relationships →** link at the bottom of the screen opens the full Relationships Browser for the graph — useful if you want to understand the connections in the data before committing to a type.

---

## What to do

Click **Browse as set →** next to **Researcher (6)**.

Moire transitions to the [Set View](03-set-view.md), pre-filtered to show all six researchers.

!!! note "Why start with Researchers?"
    Researchers are the most interconnected entities in this graph. They are affiliated with universities, located in cities, working on projects, leading research groups, and co-authoring papers. Starting here lets us demonstrate every navigation feature — faceting, set traversal, entity detail, and resource-to-resource navigation — before moving to the other types.
