# Explore an Individual Entity

When you click any entity card in Moire, you enter Entity context and see that entity in full detail. This guide explains how to read the entity detail view and navigate from it.

---

## Entering entity detail

Click any card in a Set view. The view switches from the card grid to a single-entity detail page. The context header updates to the entity's name. The layer selector appears at the bottom of the screen.

You can also arrive at entity detail from:

- The search palette: click **Go →** next to any search result
- Another entity's relationship table: click any IRI-valued link

---

## Reading the detail view

The entity detail view has three sections:

### Identity block

At the top, you see the entity's label (its name), all of its types shown as stacked badges, and a description if one is present in the data. For Erik Rogstad: the name, the badges Professor · Researcher · Person · Agent, and the description "Professor of Database Systems and Knowledge Graphs at University of Oslo."

### Outgoing relationships

The outgoing section lists every relationship that starts at this entity and points to something else — both navigable relationships (IRI-valued, shown as blue links) and literal properties (plain text, shown as regular text). Each row has a relationship label on the left and the value on the right.

Navigable relationships have a small arrow (→) and can be clicked to navigate to the connected entity. Literal properties are informative but not clickable.

### Incoming relationships

Below the outgoing section, the incoming section lists every other entity in the graph that has a relationship pointing to this one. If the University of Oslo is your focus, the incoming section shows Erik Rogstad (affiliatedWith → this entity) and Maria González (also affiliatedWith → this entity).

Incoming relationships are equally navigable: click the source entity's name to jump there.

---

## Following a link

Click any blue link in the relationship table to navigate resource-to-resource. The view updates to show the target entity in full detail. The Back button will take you back to where you were.

You can chain these link-follows as long as there are links to follow: Erik → University of Oslo → Oslo → (Oslo's incoming relationships) → other entities located in Oslo. This is the "walking the graph" experience — moving from entity to entity through their connections, one step at a time.

---

## Using the layer selector

The layer selector is only visible in Entity context. It lets you zoom out from the focus entity to see its neighbourhood as a card grid:

- **+1**: the set of all entities directly connected to the focus (outgoing links)
- **+2**: entities two hops away
- **−1**: entities that point *to* the focus (incoming links)
- **−2**: entities two hops away in the incoming direction
- **● Focus**: return to the full detail view of the entity itself

When you switch to Layer +1 or +2, the view becomes a standard Set view with a facet sidebar — the same interface as browsing a type, but centred on this entity's neighbourhood. You can apply filters, use the Jump via strip, or click a card to focus on a neighbour.

---

## Checking all types

The type badges in the identity block show every type the entity belongs to, at every level of the hierarchy. An entity with four badges — Professor, Researcher, Person, Agent — belongs to all four simultaneously. This matters when you return to Set context: if you filter by *Agent*, this entity will be included; if you filter by *Professor*, it will also be included.

If the entity has many types, the badges may wrap to multiple lines. This is normal for knowledge graphs with deep type hierarchies.

---

## Navigating back to the set

Press the **Back button** (or `Alt+←`) to return to the Set view you came from, with all your filters exactly as you left them. If you followed several resource-to-resource links before pressing Back, each press takes you one step back through the chain.
