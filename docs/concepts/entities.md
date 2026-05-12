# Entities

## Everything is a thing

In a knowledge graph, everything is represented as a *thing* — a discrete, identifiable resource with a unique address. A person is a thing. A city is a thing. A research paper, a university, a topic, a project — all things. The word "entity" is the general term for any of these things, regardless of what kind of thing it is.

This may sound abstract, but it is actually very practical. It means that everything in the graph is on equal footing: navigating to a person and navigating to a city use exactly the same mechanism. Both appear as cards. Both have a detail view. Both can be related to each other. There is no privileged class of "main" entities and "subsidiary" entities — it is all one flat space of things and connections.

---

## How entities are displayed

Moire shows entities as cards, and the amount of information on a card depends on how close that entity is to your current focus.

When you have no particular entity in focus and are browsing a set — all researchers, or the universities your researchers are affiliated with — cards show a *summary* level of detail: the entity's name, its type badge, and a one-line description. This is enough to identify each entity and understand roughly what it is without overwhelming you with detail for every item in the grid.

When you click on a single entity and make it your focus, the view switches to *full* detail: the complete name, all type badges stacked, the full description, and every relationship the entity has listed in the relationship table. Nothing is hidden at the full level.

When you use the layer selector and look at Layer +1 (direct connections of a focus entity), those neighbours appear at *summary* detail. Layer +2 neighbours appear at *headline* — just the name and type badge. Layer −1 (incoming connections) also shows headline detail.

This system of decreasing detail at increasing distance is called *semantic zoom*. Unlike visual zoom — where you move a slider and things get bigger or smaller — semantic zoom changes *how much information* is shown based on conceptual proximity. The further from your focus, the less detail; the closer, the more. You can read a PhD thesis about your focus entity (Layer 0) while scanning the names of its second-degree connections (Layer +2) at the same time.

---

## Every entity has a unique address

Behind every entity in a knowledge graph is a unique identifier called an IRI (Internationalized Resource Identifier). It looks like a URL: `http://example.org/research/prof_erik`. This identifier is what makes the graph work — it is how relationships can point precisely from one entity to another without ambiguity. Two entities with the same name can coexist without confusion because their IRIs are different.

You will rarely see raw IRIs in Moire. The application uses the entity's label — its human-readable name, like "Erik Rogstad" — everywhere it can. But if you hover over an entity's name in the relationship table, you can see the full IRI. And if a label is missing, Moire falls back to showing the last segment of the IRI (`prof_erik`) so you always see something meaningful rather than a blank.

---

## Multiple types

An entity can belong to more than one type simultaneously. Erik Rogstad is a Professor, a Researcher, a Person, and an Agent — all four are true at the same time, reflecting the type hierarchy. Moire shows all of an entity's types as stacked badges in the detail view. In the Types Browser, Erik would appear under Professor, under Researcher, under Person, and under Agent if you browsed any of those classes.

This is important for filtering: if you filter a set by the *Person* type, Erik will be included even if you think of him primarily as a Professor. The filter matches anything that is a Person at any level of the hierarchy, not just things explicitly labelled "Person" and nothing else.

!!! tip "Entities are the nouns; relationships are the verbs"
    A useful mental model: entities are the nouns of the knowledge graph (people, places, things) and relationships are the verbs (is affiliated with, is located in, works on). The entity detail view is the dictionary entry for one noun — it lists all the verbs that connect it to other nouns.
