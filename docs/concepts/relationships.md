# Relationships

## The connections that make a graph a graph

A knowledge graph without relationships would just be a list of names. It is the relationships — *Erik Rogstad is affiliated with the University of Oslo*, *the University of Oslo is located in Oslo*, *Oslo is in Norway* — that give the data its structure and make navigation possible. Every relationship has a name (its *predicate*), a starting entity (the *subject*), and a target (the *object*). Together, these three form the fundamental unit of a knowledge graph: a subject-predicate-object triple.

In Moire, you never see triples directly. You see relationships as rows in the entity detail view, as buttons in the Relationships Browser, and as traversal options in the Jump via strip. The triple structure is the machinery; relationships-as-navigation is the experience.

---

## Navigable vs plain-text relationships

Not all relationships are equal from a navigation perspective. Some connect an entity to *another entity* — and those connections are clickable, leading you somewhere new. Others connect an entity to a *plain value* — a text string, a date, a number — and those are informative but not navigable.

In Erik Rogstad's relationship table:

- **affiliatedWith → University of Oslo** is navigable. Click it and you go to the University of Oslo entity.
- **nationality: NO** is plain text. "NO" is a string; there is no separate "Norway" entity to navigate to (in this dataset).

Moire distinguishes these visually: navigable values appear as blue links; plain-text values appear as regular text. You can always tell at a glance which relationships will take you somewhere and which ones are just facts.

The technical distinction is simple: navigable relationships point to IRIs (entity addresses); plain-text relationships point to literal values (text, numbers, dates). Moire reads this distinction from the data automatically — you do not configure it.

---

## Outgoing and incoming

Every relationship has a direction. An *outgoing* relationship goes from the current entity to something else — Erik is affiliated with Oslo. An *incoming* relationship goes from something else to the current entity — the University of Oslo is the affiliation target of Erik and Maria.

In the entity detail view, outgoing relationships appear first, labelled with the relationship name and the target entity. Incoming relationships appear in a separate section below, labelled with the relationship name and the source entity — shown with a ← arrow to indicate direction.

Both are equally navigable. Clicking an incoming relationship link takes you to the entity that points to the current one, just as clicking an outgoing link takes you to the entity that the current one points to. This makes it easy to answer both "what does this entity connect to?" and "what connects to this entity?"

---

## Relationships in set navigation

In Set context, relationships take on a collective character. The Jump via strip and the Relationships Browser show you the relationships available across the *whole current set*, with a count of how many entities in the set have each relationship and how many distinct targets they connect to.

*affiliatedWith* on the researcher set shows "6 subjects → 3 universities" because all six researchers have an affiliation, and they connect to three universities between them. *worksOn* shows "2 subjects → 2 projects" because only two of the six researchers have a *worksOn* relationship.

These counts help you decide what to traverse. A relationship with high subject coverage (many entities in the set have it) and moderate target diversity (a reasonable number of distinct targets) is often the most interesting traversal. *affiliatedWith* with 6/3 coverage is more revealing than *coAuthorOf* with 1/1.

---

## Structural relationships

Some relationships are technical plumbing rather than domain knowledge: `rdf:type` (what class an entity belongs to), `owl:sameAs` (two identifiers for the same thing), `rdfs:isDefinedBy` (which ontology defines a concept). Moire hides these in the Relationships Browser by default, collapsing them into a disclosure group at the bottom. They remain accessible if you need them, but they do not clutter the primary navigation view. The entity detail table, however, shows all relationships including structural ones, because the full picture is sometimes what you need.

!!! note "The word 'predicate'"
    In RDF and SPARQL, what we call a 'relationship' in this documentation is technically called a *predicate*. You will see this word in the Glossary and in advanced sections. For all practical purposes in Moire's interface, relationship and predicate mean the same thing.
