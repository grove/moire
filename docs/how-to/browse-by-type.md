# Browse by Type

The Types Browser is the most natural starting point when you know *what kind of thing* you want to explore but do not have a specific entity in mind. This guide walks you through using it effectively.

---

## How to enter the Types Browser

When you click **Browse this graph →** from the Graphs Browser, Moire takes you straight to the Types Browser for that graph. You can also reach it from any Set or Entity context by clicking **Browse types →** in the lower area of the left panel.

---

## Reading the class hierarchy

The Types Browser displays the class hierarchy as an indented tree, sorted by instance count within each level. The indentation tells you the structure: a type indented under another is a subtype of it.

For the research graph:

```
Agent                         9 instances    [Browse as set →]
  ├─ Person                   6 instances    [Browse as set →]
  │    └─ Researcher          6 instances    [Browse as set →]
  │         ├─ Professor      3 instances    [Browse as set →]
  │         └─ PhDStudent     3 instances    [Browse as set →]
  └─ Organization             6 instances    [Browse as set →]
       ├─ University          3 instances    [Browse as set →]
       └─ ResearchGroup       3 instances    [Browse as set →]
Place                         3 instances    [Browse as set →]
Topic                         5 instances    [Browse as set →]
Paper                         4 instances    [Browse as set →]
Project                       2 instances    [Browse as set →]
```

When reading this tree, remember that instance counts include all subtypes. *Agent* has 9 instances because it includes both Persons (6) and Organizations (6) — but those overlap at the top level since both are subtypes of Agent. The count at each level reflects how many entities are of that type *or any of its subtypes*.

---

## Choosing the right level

The right level to enter at depends on what you are trying to explore:

- If you want a **homogeneous, well-defined group** to filter and traverse, choose a specific subtype like *Professor* or *University*. These groups are small and coherent — every entity in the set shares most of the same properties.
- If you want a **broad survey** of a domain, choose a higher-level type like *Researcher* or *Organization*. The set will be larger and more diverse, but the facet sidebar will surface dimensions you can use to drill down.
- If you want to **see everything**, choose the root type at the top of a tree (like *Agent*). The set will be maximally inclusive; use filters to narrow it.

---

## After clicking Browse as set →

Moire transitions to the Set view with the selected type pre-applied as a filter in the facet sidebar. The context header shows the type name — "Researchers" or "Universities". From here you can:

- **Add facet filters** to narrow the set further
- **Click Jump via buttons** to traverse the set via a relationship
- **Click a card** to enter Entity context for a specific item
- **Click Browse relationships →** to see what traversals are available on this set

The type filter persists in the facet sidebar as long as you are in this set. You can remove it to expand the set, or leave it in place and add other filters on top of it.

---

## Using Browse relationships from the Types Browser

The **Browse Relationships →** link at the bottom of the Types Browser opens the Relationships Browser for the entire graph — showing every predicate in the graph with coverage stats. This is useful when you want to understand the shape of the data's connections before committing to a starting type. Reading the relationship coverage can tell you which types are most richly connected and therefore likely to be productive starting points for exploration.
