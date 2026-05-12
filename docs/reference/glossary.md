# Glossary

All terms used in Moire and its documentation, defined in plain language. Where a term has a technical equivalent in RDF or SPARQL, the technical name is noted in parentheses.

---

**Class**
See *Type*.

**Context**
The current rendering mode of Moire's main screen. There are four contexts: *Graphs*, *Types*, *Set*, and *Entity*. Each shows a different kind of information. The context changes automatically as you navigate. See also: [The four navigation views](../how-to/four-navigation-views.md).

**Context header**
The short prose sentence displayed just below the top bar that describes — in plain language — what you are currently looking at and how you arrived there. Examples: "SE Professors", "Locations of Researchers", "Erik Rogstad". See: [Read the context header](../how-to/read-context-header.md).

**Detail level**
The amount of information shown on an entity card, determined by the card's conceptual distance from the current focus. The four levels are: *full* (Layer 0 — the focus entity itself), *summary* (Layer ±1 — direct connections), *headline* (Layer ±2 — two hops), and *label* (further out — name only). See: [Entities](../concepts/entities.md).

**Endpoint**
The web address (URL) of a SPARQL-compatible knowledge graph database. You register an endpoint when you first connect Moire to a database. The endpoint is the address Moire uses to ask the database questions and receive answers. Example: `http://localhost:3030/ds/sparql`. See: [Connecting to a knowledge graph](../getting-started/connecting.md).

**Entity**
A single, named thing in the knowledge graph — a person, a city, a publication, a concept, an event, or any other discrete resource. Every entity has a unique identifier (IRI) and may have any number of relationships to other entities. In RDF, entities are called *resources*. See: [Entities](../concepts/entities.md).

**Entity context**
The view that opens when you click on a specific entity. Shows the entity in full detail at Layer 0, with the relationship table and layer selector. See: [Explore an individual entity](../how-to/explore-entity.md).

**Facet**
A single dimension of filtering in the facet sidebar — for example, *Type*, *Nationality*, or *Location*. Each facet corresponds to one relationship or attribute that many entities in the current set share. Facets are generated automatically from the data; you do not configure them. See: [The Lens](../concepts/the-lens.md).

**Facet group**
A labelled section in the facet sidebar containing all the values available for one facet dimension. Clicking values within a group uses OR logic; having multiple groups active uses AND logic across them.

**Facet sidebar**
The left-side panel in Set and Entity contexts that shows all available filters for the current set. See: [Filter with facets](../how-to/filter-with-facets.md).

**Filter**
An active selection in a facet group. When a filter is active, the entity set is restricted to only those entities matching that filter value (along with any other active filters). See: *Facet*.

**Focus entity**
The single entity that is the centre of attention in Entity context. The focus entity is shown at Layer 0 (full detail). All layer numbers (+1, +2, −1, −2) are defined relative to the focus entity.

**Graph** / **Named graph**
A named, self-contained collection of triples within a triplestore. Think of it as a dataset or subject area within a larger database. Moire's Graphs Browser shows all named graphs available on the connected endpoint. See: [Connecting to a knowledge graph](../getting-started/connecting.md).

**Graphs context**
The Graphs Browser — Moire's landing page. Shows all named graphs on the connected endpoint as summary cards.

**IRI** (Internationalized Resource Identifier)
The unique address of an entity in a knowledge graph, formatted like a URL. Example: `http://example.org/research/prof_erik`. Moire uses human-readable labels wherever possible and falls back to the IRI's last segment when no label is available.

**Incoming relationship**
A relationship where another entity points *to* the current entity, rather than the current entity pointing outward. Shown in a separate section at the bottom of the entity detail view. Example: if the University of Oslo is your focus, *affiliatedWith ← Erik Rogstad* is an incoming relationship. See: [Relationships](../concepts/relationships.md).

**Introspection**
The automatic process by which Moire reads the structure of a knowledge graph immediately after connecting. Moire asks the database a series of questions — what graphs exist, what types are present, what relationships are used, what are the label conventions — and uses the answers to build the Types Browser, facet sidebar, and Relationships Browser. Runs silently in the background; requires no user action. See: [Connecting to a knowledge graph](../getting-started/connecting.md).

**Jump via strip**
The row of clickable relationship buttons that appears at the bottom of the entity cards area in Set context. Each button represents a high-coverage IRI-valued relationship and triggers a set-to-set traversal when clicked. See: [Follow relationships across a set](../how-to/follow-relationships.md).

**Knowledge graph**
A database where information is stored as a web of named entities and named relationships between them. Everything has a unique identifier, and every connection has a name. Knowledge graphs are built on the RDF standard and queried with SPARQL.

**Layer**
A conceptual distance from the focus entity in Entity context. Layer 0 is the entity itself; Layer +1 is its direct connections; Layer +2 is connections-of-connections; Layer −1 is entities that point to the focus; Layer −2 is entities two hops away in the incoming direction. See: [Layers](../concepts/layers.md).

**Layer selector**
The control (visible only in Entity context) that lets you switch between layer levels. Displayed as `[−2] [−1] [● Focus] [+1] [+2]`.

**Lens**
The complete combination of all active facet filters at any given moment. Changing the lens changes what you see without changing the underlying data. See: [The Lens](../concepts/the-lens.md).

**Literal** / **Literal value**
A plain data value — a text string, a number, a date — as opposed to an IRI pointing to another entity. Literal values in the relationship table appear as plain text; they are not clickable. See: [Relationships](../concepts/relationships.md).

**Navigation history**
The ordered list of views you have visited in the current session. Moire preserves the full state (filters, layer, focus) of each history entry. The Back and Forward buttons move through this list.

**Outgoing relationship**
A relationship where the current entity points to another entity. Shown in the upper section of the entity detail view. See: [Relationships](../concepts/relationships.md).

**Predicate**
The technical RDF term for a named relationship between two entities (the *subject* and the *object*). In Moire's user interface, predicates are referred to as *relationships*. The IRI of a predicate can be seen by hovering over the relationship name in the detail view.

**Relationship**
A named connection between two entities in the knowledge graph. In the entity detail view, each row in the relationship table represents one relationship. See: [Relationships](../concepts/relationships.md).

**Relationships Browser**
A view (entered via *Browse relationships →*) that shows every relationship available on the current set, with subject and target counts, and buttons for traversal or adding as a facet. See: [Relationships Browser reference](relationships-browser.md).

**Resource-to-resource navigation**
Navigating from one entity to a single connected entity by clicking a link in the relationship table. The input is one IRI; the output is one entity in detail. Contrast with *set-to-set navigation*. See: [Resource-to-Resource Navigation](../tour/08-resource-to-resource.md).

**Set**
The group of entities currently displayed in the entity cards area — all entities satisfying the active type selection and facet filters. See: [Sets](../concepts/sets.md).

**Set context**
The main working view in Moire, showing a grid of entity cards and the facet sidebar. Active when you are browsing a group of entities.

**Set-to-set navigation** / **Traversal**
Moving the entire current set through a relationship to produce a new set of connected entities. Input: a set. Output: a new set. Triggered by clicking a Jump via button or *Follow as set →* in the Relationships Browser. Contrast with *resource-to-resource navigation*. See: [Follow relationships across a set](../how-to/follow-relationships.md).

**SPARQL**
The query language used to communicate with knowledge graph databases. Moire handles all SPARQL automatically — you never write queries directly. (Stands for SPARQL Protocol and RDF Query Language.)

**SPARQL endpoint**
See *Endpoint*.

**Triple**
The fundamental unit of a knowledge graph: a subject–predicate–object statement. Example: `prof_erik → affiliatedWith → uio`. Triples are the building blocks; Moire presents them as entity cards and relationship rows rather than as raw triples.

**Triplestore**
A database designed to store and query triples. Moire connects to any SPARQL 1.1-compatible triplestore.

**Type** / **Class**
A category that an entity belongs to, such as Professor, University, or Place. Types form a hierarchy: subtypes inherit the characteristics of their parent types. An entity can belong to multiple types simultaneously. See: [Types](../concepts/types.md).

**Types Browser**
The view (entered after selecting a graph) that shows all entity types in the graph as a hierarchical tree with instance counts. Starting point for type-based exploration. See: [Browse by type](../how-to/browse-by-type.md).

**Types context**
The rendering context showing the Types Browser.
