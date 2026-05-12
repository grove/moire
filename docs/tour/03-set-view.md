# Step 3 — The Set View: All Researchers

## What you will see

After clicking **Browse as set →** on Researcher, Moire opens the **Set View** — the main working space where you browse, filter, and navigate entity sets. The screen divides into two areas: the facet sidebar on the left, and the entity cards in the centre.

### The entity cards

Six cards appear in the central area, one for each researcher:

- **Erik Rogstad** · Professor · "Professor of Database Systems and Knowledge Graphs at University of Oslo"
- **Julia Lindström** · Professor · "Professor of Semantic Web and SPARQL Query Optimization"
- **Anders Bergström** · Professor · "Professor of RDF Storage and Indexing Structures"
- **Maria González** · PhDStudent · "PhD student researching federated SPARQL query optimization"
- **Olivier Dupont** · PhDStudent · "PhD student working on RDF graph compression techniques"
- **Anna Kowalski** · PhDStudent · "PhD student studying linked data quality assessment"

Each card shows the person's name, their most specific type (Professor or PhDStudent), and a short description. The cards are showing *summary* detail — just enough to identify each person and understand what they do. When you click on one, you will see the full detail.

### The facet sidebar

On the left, three groups of filters have appeared automatically:

- **Type**: Professor (3), PhDStudent (3)
- **Nationality**: NO (1), SE (2), ES (1), FR (1), PL (1)
- **Gender**: female (3), male (3)

Moire built these facets entirely from the data. It noticed that all six researchers have a nationality and a gender property, and that these have a small number of distinct values — exactly the kind of attribute that works well as a filter. You did not configure anything.

### The context header

Just below the top bar, the context header reads: **"Researchers"**. This one word tells you the full story of where you are: you selected the Researcher type from the Types Browser, and this is what Moire found. As you add filters and traverse relationships, this header will grow into a longer description, always telling you exactly what you are looking at.

### The Jump via strip

At the bottom of the cards area, three buttons appear: *affiliatedWith (→)*, *locatedIn (→)*, *worksOn (→)*. These are shortcuts for set traversal — clicking one moves the entire current set through that relationship to a new set of connected entities. You will use these in [Step 5](05-set-traversal.md).

---

## What to notice

Everything on this screen was built from the data automatically. Moire introspected the graph, found the Researcher class, discovered which properties its instances share, identified which of those properties have manageable numbers of distinct values (making them good filters), and built the interface around what it found. If you were to connect Moire to a completely different knowledge graph — say, a museum collection — the Types Browser would show different types, the facets would reflect different properties, and the cards would show different content. The navigation structure adapts to the data.

---

## What to do

Read the six researcher cards. Notice the detail level — name, type badge, one-line description. Then continue to [Step 4](04-facet-filtering.md) to learn how to narrow this set using the filters on the left.
