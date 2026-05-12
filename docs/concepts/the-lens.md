# The Lens

## Same data, different view

Hold one finger up in front of your face. Look at it with your left eye, then your right eye. Your finger has not moved, but its position against the background appears to shift. This is optical parallax: the same object looks different depending on your vantage point.

Moire's name comes from this idea. The data in a knowledge graph is fixed — nobody is editing it while you explore. But what you *see* of it, and how it appears to be structured, changes depending on which combination of filters you have active. Different filter combinations surface different relational layers of the same data, like different vantage points on the same scene. This contextual shift is the "moiré" — the interference pattern that emerges when you overlay two structured grids at slightly different angles.

The *lens* is the technical name for this combination of filters. Two people looking at the same knowledge graph but with different lenses active will see different sets of entities, different connections between them, and different patterns emerging from the data. Neither is wrong — they are seeing the same graph from different vantage points.

---

## What a lens consists of

A lens is the full vector of your current filter state: every active selection in every facet group. In the research graph, a lens might be:

- Type = Researcher *(entered via the Types Browser)*
- Nationality = SE *(ticked in the facet sidebar)*
- Type = Professor *(also ticked in the facet sidebar)*

This specific lens produces a set of two entities: Julia Lindström and Anders Bergström. A different lens:

- Type = Researcher
- Nationality = NO

Produces a different set: Erik Rogstad and Maria González (both at the University of Oslo, both located in Oslo). Same graph, different lens, different picture.

---

## Lenses and filters are the same thing

The words *lens* and *filters* are two ways of describing the same thing. *Filters* is the operational word — you add a filter, remove a filter, clear all filters. *Lens* is the conceptual word — it describes the state of all your filters together as a single viewing angle on the data.

In practice, you will mostly think in terms of individual filters: "I want to add a nationality filter, then remove it and add a different one." But occasionally — especially when reading the context header or thinking about what you have built up over several steps of navigation — it is useful to think of the whole filter state as a *lens* that you are applying to the graph.

---

## Changing the lens without losing your place

Every change to the lens — adding a filter, removing one, toggling a value — updates the current view *in place*. It does not push a new history entry. This means that if you add five filters one after another and then press Back, you go all the way back to before you started filtering — not just one filter back.

This is a deliberate design choice. Filter changes are *refinements* of the current view, not new destinations. Navigation — clicking an entity card, following a relationship, traversing the set — creates new history entries. Filtering modifies the current one.

The practical implication: feel free to experiment with filters. Add some, remove some, see what remains. None of it will create a tangle in your Back/Forward history. The Back button always takes you to the last *navigation* step, not the last *filter* step.

---

## The parallax experience in practice

Here is a concrete example of the lens metaphor in action, using the research graph:

| Lens | What you see |
|---|---|
| Type = Researcher | All 6 researchers |
| Type = Researcher + Nationality = SE | 2 Swedish researchers |
| Type = Researcher + Nationality = NO | 2 Norwegian researchers |
| Type = Researcher + Type = Professor | 3 professors (of any nationality) |

The graph has not changed between rows. The researchers, their nationalities, and their types are all still the same. What has changed is the lens — and with it, the apparent structure of the data. From the perspective of the lens showing Norwegian researchers, the graph looks like a small cluster of Oslo-based academics. From the perspective of the professors lens, it looks like a spread of three Scandinavian institutions. Same graph; different vantage points.
