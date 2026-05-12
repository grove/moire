# Moire

> **Faceted navigation for knowledge graphs.** Explore vast, interconnected datasets the way you would explore a well-organised library — starting broad, narrowing down, following connections, and backtracking whenever something new catches your eye. No query language required.

---

## The problem with rich data

Imagine you have access to a knowledge graph containing thousands of researchers, their publications, the universities they belong to, the topics they study, the cities they live in, and the grants they have received. Every item is connected to others in meaningful ways. The data is rich. It is structured. It is *there*.

But how do you actually explore it?

A **search box** gives you one answer at a time. You type a name, you get a result. That is useful, but it does not help you discover patterns. It does not answer questions like: *Which cities host the most researchers working on climate policy? Which topics appear most often in highly-cited papers? Which institutions collaborate most closely?*

A **query language** like SPARQL can answer all of those questions with precision — but only if you already know the structure of the data and are comfortable writing formal queries. For most people, most of the time, that is not realistic.

**Moire sits in between.** It translates the structure of a knowledge graph into a navigable, visual interface that anyone can use. You filter, click, traverse, and explore — and Moire handles the queries invisibly in the background.

---

## What Moire feels like

Think of a good newspaper. You do not read it front to back. You scan the headlines to see what categories of stories exist. You pick the section that interests you and browse the full list. You read a story that grabs you. That story mentions a related piece, and you follow the link. At any point you can fold the paper back to the front page and start a different thread.

Moire works exactly the same way:

- The **Types Browser** is your front page — a high-level overview of what kinds of things exist in the graph.
- The **Set view** is a section of the paper — all the items of a chosen type, with counts and filters.
- The **Entity detail** is reading one story in full — every attribute and relationship for a single item.
- The **Relationships Browser** and the **Jump via strip** are the hyperlinks that let you follow a connection and arrive at a whole new set of related things.
- The **back and forward buttons** are your ability to fold the paper back and pick a different thread.

At every step, a plain-English sentence at the top of the screen tells you exactly where you are and how you got there: *"SE Professors"*, *"Locations of Researchers"*, *"Erik Rogstad"*. If you ever feel lost, read that sentence.

---

## Key features

### Automatic introspection — no configuration needed

Point Moire at any SPARQL-compatible knowledge graph and it figures out the rest. It reads the database's structure automatically: what graphs are there, what types of entities they contain, which relationships appear most frequently, and how labels are formed. There is nothing to configure. The navigation interface builds itself from whatever data it finds.

### Faceted filtering — narrowing down without losing context

The left sidebar shows groups of filters generated directly from the data. If you are looking at a set of researchers, you might see filters for *Type*, *Nationality*, *Location*, and *Research area* — each showing a count of how many researchers match. Click a value to filter. Click it again to remove the filter. Combine multiple filters freely. Every click is reversible.

### Set traversal — following connections across the whole graph

The real power of a knowledge graph lies in its connections. The **Jump via strip** at the bottom of any Set view shows every relationship available on the current set — for example, *affiliatedWith (6 →)* or *locatedIn (3 →)*. Click one, and Moire takes the entire current set and follows that relationship, instantly producing a new set of connected entities. You are not navigating from one item to another; you are navigating from a *group* to another *group*. The connections do the work.

For more control, the **Relationships Browser** shows all incoming and outgoing relationships across the full set, with counts and previews. You can navigate to any of them directly from there.

### Entity detail with neighbourhood layers

When you click on a single entity, you see its full detail — every attribute and relationship, laid out as readable cards. The **layer selector** lets you zoom out from there: Layer +1 shows everything that entity points *to*; Layer −1 shows everything that points *back at it*; Layer +2 goes one step further in each direction. You are exploring the neighbourhood of a single item without losing track of where you started.

### Global search — jump straight to anything

Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) at any time to open the search palette. Type any name, and Moire shows matching entities from across the entire graph. Click one to jump directly to it. Search works from anywhere in the interface without interrupting your navigation state.

### Full navigation history

Every view you visit — including the exact filters you had active — is recorded in a navigation history. The back and forward buttons work exactly like a browser's, so you can always retrace your steps. Nothing is lost when you go back.

---

## Who is Moire for?

Moire is designed for people who work *with* structured data but do not necessarily work *in* it:

- **Researchers** who want to understand the shape of a dataset before running an analysis
- **Librarians** and **archivists** who need to navigate large catalogues without writing queries
- **Journalists** exploring a public dataset for patterns and stories
- **Analysts** who need to ask "who is connected to whom, and through what?" quickly
- **Domain experts** who know the subject matter deeply but are not database engineers

If you have ever had access to a rich, structured dataset and no good way to explore it — Moire is for you.

---

## What data can Moire work with?

Moire connects to **knowledge graphs** — databases where information is stored as a web of named things and named relationships between them. The technical standard is called RDF (Resource Description Framework). Any database that supports a SPARQL query endpoint can be connected to Moire, including:

| Domain | Examples |
|---|---|
| Research | Researchers, papers, topics, institutions, grants |
| Cultural heritage | Artworks, artists, collections, places, periods |
| Organisations | People, teams, projects, products, processes |
| Linked open data | Government data, library catalogues, scientific datasets |
| Bibliographic data | Books, authors, publishers, subjects |

Moire has first-class support for **[pg-ripple](https://github.com/trickle-labs/pg-ripple)** — a PostgreSQL extension that turns your Postgres database into a full SPARQL-capable knowledge graph with Datalog reasoning, SHACL validation, and hybrid vector+graph search. pg-ripple endpoints unlock advanced features in Moire automatically on connection.

---

## Getting started

### Prerequisites

- Node.js 20 or later
- A running SPARQL endpoint (local or remote)
- npm

### Install and run

```bash
git clone https://github.com/trickle-labs/moire.git
cd moire
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Connect your first graph

1. Click **+ Add Endpoint** in the Graphs Browser.
2. Enter the SPARQL URL of your database (e.g. `http://localhost:3030/ds/sparql`).
3. Optionally give it a label and enter any authentication details.
4. Click **Save**.

Moire connects immediately and runs its introspection process — reading the structure of the graph in the background. Within a few seconds, your graphs appear and you can start exploring.

> **You do not need to understand RDF, SPARQL, or triples to use Moire.** The interface translates all of that structure into readable names, browsable cards, and clickable links. The only technical term worth knowing is *endpoint* — the web address of the database. Everything else is explained as you go.

---

## The interface at a glance

| Element | Where | What it does |
|---|---|---|
| **Graphs Browser** | Entry screen | Shows all named graphs in the connected database |
| **Types Browser** | After selecting a graph | Overview of all entity types with counts |
| **Set view** | After selecting a type | All entities of that type, filterable and sortable |
| **Facet sidebar** | Left panel | Auto-generated filters based on the current set's attributes |
| **Jump via strip** | Below the set | One-click traversal to related sets via a relationship |
| **Relationships Browser** | Slide-out panel | All incoming and outgoing relationships with full counts |
| **Entity detail** | After clicking an entity | Full attributes and connections for one item |
| **Layer selector** | Entity detail only | Explore the neighbourhood at ±1, ±2 steps |
| **Context header** | Top of every screen | Plain-English description of the current view |
| **Search palette** | `⌘K` / `Ctrl+K` | Jump to any entity by name from anywhere |
| **Back / Forward** | Top bar | Full navigation history, like a browser |

---

## The name

*Moiré* (the pattern) appears when two regular grids are overlaid at a slight offset — new structures emerge that were not present in either grid alone. Moire (the application) applies the same idea to data: by overlaying different facet combinations — different *lenses* — onto the same knowledge graph, you surface structural patterns that are invisible when you look at the data any other way. The same graph looks different depending on where you stand.

---

## Development

```bash
# Development server
npm run dev

# Type-check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build

# End-to-end tests (requires a running endpoint)
npm run test:e2e

# E2E tests with interactive UI
npm run test:e2e:ui
```

Moire is built with **Next.js 15** (App Router), **React 19**, **TypeScript** (strict mode), **Tailwind CSS**, and **Zustand** for state management. All SPARQL queries are executed server-side via Next.js Server Actions — credentials and endpoint details are never sent to the browser.

---

## Roadmap

- [ ] Write mode — edit and annotate entities directly in the interface
- [ ] Saved views — bookmark a particular lens combination for reuse
- [ ] Export — download a filtered set as CSV, JSON-LD, or Turtle
- [ ] Multi-endpoint federation — view a single entity's connections across multiple graphs
- [ ] Annotation layer — add notes and tags without modifying the underlying graph

---

## Contributing

Issues, feature requests, and pull requests are welcome. See [BLUEPRINT.md](BLUEPRINT.md) for a detailed technical specification of the navigation model, query logic, and design decisions.

---

## License

[Apache 2.0](LICENSE)
