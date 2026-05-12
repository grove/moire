# Documentation Plan: Moire End-User Guide

**Goal:** Produce world-class end-user documentation that makes Moire approachable and
genuinely useful for non-technical readers — analysts, researchers, data journalists,
librarians, and curious professionals who work with knowledge graphs but do not write code.

**Publishing target:** GitHub Pages via MkDocs Material, following the same pattern as
the `riverbank` project. The documentation site lives at
`https://trickle-labs.github.io/moire/` and is automatically rebuilt and deployed on
every push to `main`.

**Demo dataset:** `examples/sample-moire1.sql` — a research graph of Scandinavian
academics (Erik Rogstad, Julia Lindström, Anders Bergström, and three PhD students),
their universities (University of Oslo, Uppsala University, KTH Royal Institute of
Technology), cities (Oslo, Uppsala, Stockholm), research topics, projects, and papers.
This dataset is used in every screenshot, walkthrough, and UI tour step so that readers
can follow along with a live instance.

---

## Guiding Principles

Before describing the structure, these principles govern every word written:

**1. Lead with outcomes, not mechanisms.**
Never say "the `traverseVia` function is called with a predicateIRI." Instead say: "Click
*Follow as set* to move through the graph — Moire will collect everyone the current group
is connected to via that relationship."

**2. Analogies first, terminology second.**
Introduce every concept with a real-world analogy before naming it. The "parallax"
metaphor, the "lens" idea, the notion of "sets moving through relationships" — all of these
become intuitive with the right story, then the label sticks.

**3. Show the path, not the map.**
Users learn by doing a concrete task. Every conceptual section should immediately follow
with a walkthrough. Avoid disembodied reference lists.

**4. Short sentences. Active voice. Direct address.**
Write the way a thoughtful colleague explains something across a desk — not like a manual.

**5. Progressive disclosure.**
Layer complexity. Start with "here's what you'll see on the screen." Advanced features
(pg-ripple search upgrades, Datalog inference, federation) appear only in later sections
clearly marked optional.

**6. Honest about limitations.**
Document empty states, what to do when nothing comes back, and how to recover. Users trust
documentation that acknowledges the real world.

---

## Medium and Format

- **Primary format:** Markdown rendered by **MkDocs Material**, hosted on **GitHub Pages**
  at `https://trickle-labs.github.io/moire/`. Same toolchain as the riverbank project.
  Pages are individually linkable, fully searchable, and readable in dark or light mode.
- **Navigation structure:** MkDocs `SUMMARY.md`-based literate navigation, matching the
  riverbank pattern. Tab-level sections (Getting Started, Tour, Concepts, How-to, Reference).
- **Visuals:** Annotated screenshots for every key interaction. Each screenshot shows the
  real application (not a wireframe), taken with the `sample-moire1.sql` demo graph loaded.
  All screenshots at 1440 px wide, light mode, in a standard browser window.
- **Callouts:** MkDocs Material `admonition` blocks (`!!! tip`, `!!! note`, `!!! warning`)
  used for tips, sidebar explanations, and warnings.
- **Short videos (optional enhancement):** A 60–90 second screencast for each major
  navigation mode, embedded at the top of the relevant page. Captioned. No voiceover
  required initially — on-screen motion tells the story.
- **Demo dataset:** `examples/sample-moire1.sql` — already exists in the repository.
  The graph contains researchers (Professors and PhD students), universities (University of
  Oslo, Uppsala University, KTH), cities (Oslo, Uppsala, Stockholm), research topics,
  projects, and papers. Small enough to understand immediately, rich enough to demonstrate
  every navigation feature.

---

## Document Structure

The documentation is organised into **six parts** plus the publishing infrastructure:

---

### Part 1: Getting Started

**Purpose:** Orient new users. Get them from zero to exploring a real graph in under five
minutes.

---

#### 1.1 What Is Moire?

*Tone: welcoming, conceptual, no jargon.*

Open with the core problem Moire solves: knowledge graphs are rich, but traditional tools
for exploring them are either too technical (SPARQL query editors) or too shallow (a list
of search results). Moire sits in between — a structured, visual, navigable space that lets
you move through a graph the way you would move through a city: starting broad, zooming in,
backtracking, following unexpected connections.

**Content:**

- The newspaper analogy: a good newspaper lets you scan headlines (broad), jump to a
  section (types), read a full article (entity detail), and follow a link to a related
  story (traverse via relationship). Moire works the same way.
- What kinds of information Moire works with: scientific datasets, cultural heritage
  records, organisational knowledge bases, linked open data, bibliographic databases.
- What Moire does *not* do: it does not edit data, it does not write queries, it does not
  require any technical knowledge to use.
- One-paragraph description of a "knowledge graph" suitable for a non-technical audience.
  Use the analogy of an address book that knows relationships: not just who people are,
  but who they know, where they work, where they were born.

---

#### 1.2 Connecting to a Knowledge Graph

*Tone: task-oriented, reassuring.*

The first thing a user must do is point Moire at a triplestore endpoint. This page walks
through that one-time setup.

**Content:**

- What an "endpoint" is: the address of a knowledge graph database. Compare to entering a
  website URL in a browser.
- Step-by-step: the Add Endpoint form, filling in the URL, optional label and
  authentication. Annotated screenshot of the form.
- What happens automatically after connecting: Moire reads the structure of the graph
  (called *introspection*) — briefly explain this as Moire "learning the shape of the
  data" so it can build the right navigation for it. The user doesn't control this; it just
  happens.
- What the Graphs Browser looks like when connection succeeds: screenshot of the graphs
  overview showing named graphs, triple counts, top types.
- Troubleshooting: what to do if the endpoint doesn't respond, if authentication fails, if
  no graphs appear. Keep this practical and calm.

**Sidebar box:** "What is introspection?" — a short, friendly explanation that Moire asks
the database a set of questions when you first connect, to understand what types of things
are in the graph and how they're related. It runs automatically and takes a few seconds. No
action required.

---

#### 1.3 The Screen at a Glance

*Tone: orientation, visual-first.*

A full annotated screenshot of the main Moire interface, with numbered callouts:

1. The top bar (Back/Forward, search button)
2. The context header (the prose description of what you're currently looking at)
3. The facet sidebar (filters on the left)
4. The entity cards (the main content area)
5. The Jump via strip (quick relationship traversal)
6. The Browse relationships / Browse types links

Brief one-sentence description of each element. No deep dives yet — those come in Part 3.

---

### Part 2: UI Tour — The Research Graph

**Purpose:** A screen-by-screen guided tour of Moire using the `sample-moire1.sql`
research graph. This is a self-contained section — a reader can skim the tour to get a
feel for the application before reading any conceptual material. It is also the foundation
for all subsequent screenshots.

The research graph contains:

- **6 researchers** — three Professors (Erik Rogstad at UiO, Julia Lindström at Uppsala,
  Anders Bergström at KTH) and three PhD students (Maria González, Olivier Dupont,
  Anna Kowalski)
- **3 universities** — University of Oslo, Uppsala University, KTH Royal Institute of
  Technology
- **3 research groups** — Knowledge Graphs Group, SPARQL Optimization Group, RDF Storage
  Group
- **3 cities** — Oslo, Uppsala, Stockholm
- **5 topics** — Knowledge Graphs, SPARQL, RDF, Graph Compression, Data Quality
- **2 projects** — Linked Graphs Initiative, SPARQL Federation
- **Papers** with citation counts, publication years, and author relationships

The tour is structured as a linear journey through all of Moire's views in the order a
new user would encounter them. Each step has a full annotated screenshot and a "What just
happened?" explanation.

---

#### 2.1 Step 1 — The Graphs Browser

*Screenshot: the landing page after connecting to a pg-ripple endpoint loaded with
`sample-moire1.sql`. One graph card is visible: `http://example.org/research`.*

What you see:
- The endpoint URL in the top area
- One graph card: "research" with triple count and a summary of top types
  (Researcher: 6, University: 3, Paper: 4 …)
- A *Browse this graph* button

What to do: Click **Browse this graph →**

!!! tip "What is a graph?"
    Think of a graph as a self-contained dataset within the database. Moire can connect to
    databases that contain many graphs at once. Here we have one.

---

#### 2.2 Step 2 — The Types Browser

*Screenshot: the Types Browser showing the class hierarchy of the research graph.*

What you see:
```
Agent                    9 instances
  ├─ Person              6 instances
  │    └─ Researcher     6 instances
  │         ├─ Professor 3 instances
  │         └─ PhDStudent 3 instances
  └─ Organization        6 instances
       ├─ University     3 instances
       └─ ResearchGroup  3 instances
Place                    3 instances
Topic                    5 instances
Paper                    4 instances
Project                  2 instances
```

Explain the hierarchy: Person is a subtype of Agent; Researcher is a subtype of Person. A
Professor is both a Researcher and a Person and an Agent — the types are cumulative.

What to do: Click **Browse as set →** next to **Researcher (6)**

!!! note "Why start with Researchers?"
    Researchers are the most connected entities in this graph. Starting here lets us
    demonstrate every navigation feature — faceting, set traversal, and resource-to-resource
    navigation — before moving to other entity types.

---

#### 2.3 Step 3 — The Set View: All Researchers

*Screenshot: the Set view showing 6 researcher cards and the facet sidebar.*

What you see:
- **6 entity cards** — Erik Rogstad, Julia Lindström, Anders Bergström (Professors) and
  Maria González, Olivier Dupont, Anna Kowalski (PhD students). Each card shows name, type
  badge, and a one-line description.
- **Facet sidebar** — automatically generated from the data:
  - *Type*: Professor (3), PhDStudent (3)
  - *Nationality*: NO (1), SE (2), ES (1), FR (1), PL (1)
  - *Gender*: female (3), male (3)
- **Context header**: "Researchers"
- **Jump via** strip: affiliatedWith (→ universities), locatedIn (→ cities), worksOn (→
  projects)

Explain that Moire built these facets automatically — it read the graph structure and found
which relationships are useful as filters. No configuration was needed.

---

#### 2.4 Step 4 — Filtering with Facets

*Screenshot: the Set view after selecting Nationality = SE.*

Action: Click **SE** in the Nationality facet.

What changes:
- The set narrows to **2 researchers**: Julia Lindström and Anders Bergström.
- The count next to **Professor** updates to 2; **PhDStudent** becomes greyed out (selecting
  it would give zero results with the current nationality filter active).
- The context header updates to "SE Researchers."

Action: Now also click **Professor** in the Type facet.

What changes:
- The set narrows to **2 Swedish Professors**: Julia Lindström and Anders Bergström.
- Context header: "SE Professors" (type is promoted over the more generic "Researcher").

!!! tip "Filters remember your intent"
    Moire always shows you the count of what *would* be in the set if you selected each
    value. Greyed-out values are honest warnings: selecting them right now would leave you
    with nothing. Remove an active filter to make them available again.

*Screenshot: the empty-state page after adding a third filter that produces zero results.*

Action: Click **female** in the Gender facet while Swedish Professors is active.

What changes: Moire shows the empty state — "0 Swedish female Professors." It suggests:
"Remove 'female' → 2 results" and "Remove 'SE' → 1 result (Julia Lindström)."

Action: Click **Clear all filters** to return to all 6 researchers.

---

#### 2.5 Step 5 — Following a Relationship Across the Set

*Screenshot: Set view of all 6 Researchers with the Jump via strip visible.*

Action: Click **locatedIn** in the Jump via strip.

What changes:
- The set transforms entirely. You now see **3 city cards**: Oslo, Uppsala, Stockholm.
- Context header: "Locations of Researchers"
- The facet sidebar now reflects city properties, not researcher properties.

Explain: Moire followed the *locatedIn* relationship from every researcher simultaneously
and collected all the unique cities they connect to. This is set-to-set traversal — the
input was 6 researchers, the output is 3 cities.

*Screenshot: the Relationships Browser showing all outgoing relationships for the
researcher set.*

Action: Click **Back** to return to the 6 researchers. Then click **Browse relationships →**

What you see: A table of all relationships available on the current set:

| Relationship | Subjects → Targets | |
|---|---|---|
| affiliatedWith | 6 researchers → 3 universities | Follow as set → |
| locatedIn | 6 researchers → 3 cities | Follow as set → |
| worksOn | 2 researchers → 2 projects | Follow as set → |
| leads | 3 researchers → 3 groups | Follow as set → |
| coAuthorOf | 1 researcher → 1 researcher | Follow as set → |
| *Nationality* | 6 researchers → 5 values | Add as facet |
| *Gender* | 6 researchers → 2 values | Add as facet |

Explain the distinction between "Follow as set" (IRI-valued, takes you to new entities)
and "Add as facet" (literal/low-cardinality, better used as a filter).

Action: Click **Follow as set →** next to **affiliatedWith**.

What changes: The set becomes **3 university cards** — University of Oslo, Uppsala
University, KTH. Context header: "Affiliations of Researchers."

---

#### 2.6 Step 6 — Chaining Traversals

*Screenshot: the 3-university set with the Jump via strip showing locatedIn.*

Action: Click **locatedIn** in the Jump via strip from the universities set.

What changes: The set becomes **3 city cards** again. But the context header now reads:
"Locations of affiliations of Researchers." This is a two-hop chain built by clicking,
not by writing a query.

!!! note "The context header is your trail of breadcrumbs"
    Every traversal you make adds a phrase to the context header. If you ever wonder how
    you arrived somewhere, read the header — it traces the full path.

Action: Click **Back** twice to return to all 6 researchers.

---

#### 2.7 Step 7 — Opening an Entity

*Screenshot: Set view of all 6 researchers with Erik Rogstad's card highlighted.*

Action: Click the card for **Erik Rogstad**.

What changes: The Entity detail view opens. You see:
- **Name**: Erik Rogstad
- **Type**: Professor · Researcher · Person · Agent
- **Description**: "Professor of Database Systems and Knowledge Graphs at University of
  Oslo"
- **Relationships table**:

  | Relationship | Value |
  |---|---|
  | affiliatedWith | → University of Oslo |
  | locatedIn | → Oslo |
  | worksOn | → Linked Graphs Initiative |
  | leads | → Knowledge Graphs Group |
  | knows | → Julia Lindström |
  | nationality | NO |
  | gender | male |

IRI-valued relationships (marked with →) are clickable links. Plain values (nationality,
gender) are not.

---

#### 2.8 Step 8 — Resource-to-Resource Navigation

*Screenshot: Erik Rogstad's detail view with "University of Oslo" highlighted.*

Action: Click **University of Oslo** in the affiliatedWith row.

What changes: You navigate directly to the University of Oslo entity detail.
- **Name**: University of Oslo
- **Type**: University · Organization · Agent
- **Relationships table**:

  | Relationship | Value |
  |---|---|
  | locatedIn | → Oslo |
  | *incoming* affiliatedWith | ← Erik Rogstad, ← Maria González |
  | owl:sameAs | → uio_canonical |

!!! tip "Incoming relationships"
    Scroll down to the Incoming section of the relationship table to see which entities
    point *to* this one. University of Oslo is the affiliation of two researchers — you
    can follow those links back to the people.

Action: Click **Back** → Back to Erik Rogstad. Click **Back** again → Back to the
researcher set.

---

#### 2.9 Step 9 — Exploring Layers

*Screenshot: Erik Rogstad's detail view with the layer selector showing [−1] [0] [+1] [+2].*

Action: Click **+1** in the layer selector.

What changes: Instead of the full entity detail, you see a card grid of Erik Rogstad's
**direct connections**: University of Oslo, Oslo, the Linked Graphs Initiative project,
the Knowledge Graphs Group, and Julia Lindström (via `knows`).

Explain: Layer +1 means "everything directly connected to this entity." The cards show a
summary level of detail — name, type, one-line description. You can apply facets here
to filter Erik's neighbourhood.

Action: Click **−1** in the layer selector.

What changes: The grid shows entities that point *to* Erik Rogstad — in this case,
nothing (no other entity has a relationship pointing to Erik). The empty state is shown.

Action: Return to **Layer 0** (the full detail view).

---

#### 2.10 Step 10 — Using Search

*Screenshot: the search palette open with "Julia" typed.*

Action: Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux).

What you see: The search palette opens. Type **julia**.

Results appear:
- **Entities**: Julia Lindström (Professor · Researcher)  →  [Go]
- **Browse as set**: All entities with label containing "julia"  →  [Set]

Action: Click **Go** next to Julia Lindström.

What changes: The Entity detail view opens for Julia Lindström directly, jumping past
the Types Browser and Set view entirely.

!!! tip "Search is the fastest entry point"
    If you know roughly what you're looking for, `⌘K` is faster than browsing. The result
    takes you straight to the entity or opens a pre-filtered set — your choice.

---

#### 2.11 Tour Summary

The tour has now demonstrated every primary feature of Moire:

| Step | Feature demonstrated |
|---|---|
| 1 | Graphs Browser — connecting and choosing a graph |
| 2 | Types Browser — class hierarchy, selecting a starting type |
| 3 | Set view — entity cards and auto-generated facets |
| 4 | Facet filtering — narrowing, empty states, and clearing filters |
| 5 | Set-to-set traversal via Jump via strip |
| 5 (cont.) | Relationships Browser — full list of traversable relationships |
| 6 | Chaining traversals — multi-hop exploration via the context header |
| 7 | Entity detail view — the relationship table |
| 8 | Resource-to-resource navigation — clicking an IRI value |
| 9 | Layer selector — neighbourhood exploration at different depths |
| 10 | Search palette — direct entity lookup via ⌘K |

---

### Part 3: Core Concepts

**Purpose:** Build the conceptual model. A user who understands these ideas will be
able to navigate confidently anywhere in Moire.

---

#### 3.1 Entities: The Things in the Graph

*Tone: concrete, anchored in examples.*

Everything in a knowledge graph is a *thing* (technically a "resource" or "entity"). A
person, a city, a book, a research field — all of these are entities. Moire shows entities
as cards.

**Content:**

- What an entity card shows: the name (label), the type (e.g. "Person", "City"), a short
  description, and type badge.
- How cards show more or less detail depending on context (semantic zoom). Use the analogy
  of zooming in on a map: far away you see city names only; closer you see street names and
  landmarks. In Moire, "distance" is conceptual — how close to your current focus, not
  spatial.
- The four detail levels (label, headline, summary, full) explained with example cards,
  side by side. Not as a table — as annotated screenshots.
- Clicking a card opens its full detail view.

---

#### 3.2 Relationships: The Connections Between Entities

*Tone: intuitive, use lots of examples.*

Every entity has relationships to other entities — "was born in", "influenced", "works at",
"is located in". These are *predicates* (in technical terms), but for the documentation
call them simply *relationships*.

**Content:**

- How relationships appear in the entity detail view (the predicate table): each row is one
  relationship — what kind it is on the left, what it connects to on the right.
- Navigable vs. non-navigable relationships: some values are clickable (they connect to
  another entity — shown as a link); some are plain facts (a date, a number, a text string).
  Distinguish these clearly with a screenshot.
- The direction of relationships: "outgoing" (this entity relates to something else) and
  "incoming" (something else relates to this entity). Use the analogy of arrows pointing
  out from vs. pointing into a node.
- How clicking a relationship value takes you directly to that connected entity
  (resource-to-resource navigation). This is the simplest navigation in Moire: find
  something, click a connection, arrive at the next thing.

---

#### 3.3 Types: Organising Entities into Categories

*Tone: straightforward, familiar.*

Every entity belongs to one or more *types* (classes) — like folders, but an entity can be
in many folders at once.

**Content:**

- What types look like in Moire: the Types Browser, showing class names and counts.
- Hierarchy: types can have subtypes (Scientist is a kind of Person). Explain with an
  indented tree screenshot.
- Selecting a type to browse all entities of that kind.
- Why this is useful: it's the most natural starting point. "I want to see all the
  scientists" — click the Scientist type and you're there.

---

#### 3.4 Sets: Working with Groups, Not Just Individuals

*Tone: this is the heart of Moire's distinctiveness — make it memorable.*

Most navigation tools are built around one thing at a time: you search for something,
you find it, you look at it. Moire adds a second mode: navigating with *groups*. A set is
a collection of entities that all share something in common. You can narrow it, widen it,
or move it through a relationship — as a group.

**Content:**

- The central analogy: imagine you have a table of 412 scientists. Normally, to find where
  they were all born, you'd have to look at them one by one. In Moire, you can say "take
  this whole group and follow the *birthplace* relationship" — and instantly see all the
  places they were born. That's set navigation.
- The difference between set navigation and resource-to-resource navigation: a clear,
  side-by-side comparison.
  - Resource-to-resource: *one thing → one connected thing*. You click Alan Turing's
    birthplace and arrive at Maida Vale, London.
  - Set-to-set: *a group of things → the union of what they're all connected to*. You
    click "Follow as set" on birthplace for all 412 scientists and arrive at a set of
    302 distinct places.
- Why set navigation matters: it reveals patterns invisible when looking at individuals.
  Where are most UK 1940s scientists from? Follow birthplace. What fields dominate?
  Follow field.

**Sidebar box:** "Sets move; sets change shape. Individual entities come and go as you
refine or expand the group — but you're always working with the group as a whole, not
picking through items one by one."

---

#### 3.5 The Lens: Filtering and Refining Your View

*Tone: the "parallax" metaphor introduced carefully.*

A *lens* is the combination of filters currently active on your view. Change the lens,
change what you see — but the underlying data stays the same.

**Content:**

- The parallax analogy: hold one finger up in front of your face and look at it with one
  eye, then the other. The finger hasn't moved, but its position appears to shift against
  the background. In Moire, the knowledge graph is fixed — but what you see of it, and how
  it appears to be structured, shifts as you change your lens. Different lenses surface
  different relational layers of the same data.
- How the facet sidebar works: each group of checkboxes is one dimension of the lens
  (e.g. Type, Decade, Country). Ticking a value narrows the set; ticking another value
  in the same group expands it to include both; ticking a value in a different group
  narrows further.
- The live count next to each value: this tells you how many entities would be in the set
  if you selected that value. Greyed-out values mean "selecting this would give you nothing
  — the combination is empty." This is Moire's way of preventing frustration: it never
  lets you navigate into a dead end without warning.
- Clearing filters: click the × on any active filter chip, clear one dimension, or clear
  all.
- Filters as conversation: treat the facet sidebar as a dialogue with the data. Add a
  filter, see what survives. Remove it if it goes too narrow. This is exploration, not a
  precise query.

---

#### 3.6 Layers: How Close Are You to Your Focus?

*Tone: spatial metaphor, keep it light.*

When you have a single entity selected as your focus, Moire lets you look outward in rings:
its direct connections (Layer 1), connections-of-connections (Layer 2), and things that
point *to* it (Layer −1, Layer −2).

**Content:**

- The ripple-in-a-pond analogy: drop a stone (your focus entity) into a pond. The first
  ring of ripples is Layer 1 — direct connections. The second ring is Layer 2.
  Layers below zero (Layer −1) are the "incoming ripples" — things that connect *to* your
  focus.
- Screenshot of the layer selector control (only visible in entity context).
- What changes when you switch layers: the cards shown change, and their detail level
  adjusts automatically. The focus entity (Layer 0) shows full detail. Layer 1 shows
  summaries. Layer 2 shows headlines. Layer −1 shows headlines.
- When layers are *not* shown: in set context (no single focus entity), the layer selector
  is replaced by the Jump via strip. Explain this briefly and link forward to §3.2.

---

### Part 4: Navigating Moire

**Purpose:** Practical, task-based walkthroughs of every navigation mode. This is the
"how-to" heart of the documentation.

---

#### 4.1 The Four Navigation Views

*Tone: brief overview, then each gets its own page.*

Moire has four main views, not separate pages — they are different windows onto the same
graph, switching based on what you're doing:

| View | What you see | When you're here |
|---|---|---|
| **Graphs** | All knowledge graphs on the connected endpoint | First landing; choosing where to explore |
| **Types** | Categories of entities and how many of each exist | Deciding what kind of thing to look for |
| **Relationships** | All the connections available in the current context | Deciding how to traverse to a new set |
| **Set** | A group of entities matching your current filters | Browsing, filtering, exploring patterns |
| **Entity** | One entity in full detail | Reading about a specific thing; following connections |

Briefly explain that clicking Back always returns you to where you came from, and that the
context header (the prose sentence at the top) always tells you what you're currently
looking at and how you got here.

---

#### 4.2 Walkthrough: Exploring from Scratch

*Tone: tutorial, step-by-step, with screenshots.*

A narrative walkthrough using the demo dataset. Takes the reader from the Graphs Browser
to an entity detail view, using every navigation mode along the way.

**Steps:**

1. Open Moire and see the Graphs Browser. Identify the demo graph and click
   *Browse this graph*.
2. The Types Browser appears. Read the class hierarchy. Click *Scientists (412)* →
   *Browse as set*.
3. The Set view opens: 412 scientists. Notice the facet sidebar on the left. Click
   *1940s* in the Decade facet. Set narrows to 89 scientists.
4. Add *United Kingdom* in the Country facet. Set narrows to 23.
5. Read the context header: "UK 1940s Scientists." This is your current lens.
6. Find a card — e.g. *Alan Turing*. Click it. Entity detail opens.
7. In the predicate table, notice *born in → Maida Vale, London*. Click it.
8. You've navigated resource-to-resource. You're now looking at Maida Vale, London.
9. Click Back. You're back on Alan Turing.
10. Click Back again. You're back on your filtered set of 23 scientists.

This single walkthrough demonstrates facets, entity detail, resource-to-resource
navigation, and the back button all in sequence.

---

#### 4.3 Browsing by Type

*Full page. Task-oriented.*

How to use the Types Browser as your starting point — the right choice when you know the
*kind* of thing you want to explore but not which specific one.

**Content:**

- Entering the Types Browser from the Graphs view or via "Browse types →" from a set.
- Reading the class hierarchy: parent types, subtypes, instance counts.
- Clicking *Browse as set* to enter a pre-filtered set for any type.
- The type filter persists in the facet sidebar — you can refine further from there.
- Use case: "I want to look at all the universities in this graph." Find Organisation →
  University → Browse as set.

---

#### 4.4 Filtering with Facets

*Full page. Task-oriented.*

How to use the facet sidebar to narrow, widen, and reshape a set.

**Content:**

- Each facet group corresponds to a relationship or attribute that many entities in
  the current set share.
- Ticking within a group = OR (show me entities that match any of these values).
- Ticking across groups = AND (show me entities that match all of these groups).
- The live count shows what's possible *right now* given your other active filters.
- Greyed-out values are currently reachable — they'd produce an empty result with the
  filters you have active.
- Removing filters: the × chip at the top of each active group, or "Clear all."
- Facets are *dynamic* — they appear based on what the current set actually contains.
  If you filter down to a narrow type, only facets relevant to that type appear.
- What to do if the set becomes empty: the empty state page shows which filter is causing
  the problem and offers one-click suggestions to remove it ("Remove 'New Zealand' →
  would show 7 results").

---

#### 4.5 Following Relationships Across a Set

*Full page. This is Moire's most distinctive feature — give it space.*

How to use *Follow as set* to move an entire group through a relationship.

**Content:**

- Recap the set-to-set concept from §2.4, but now with the actual UI.
- The *Jump via* strip: the three or four most useful relationships are shown right in the
  main view as clickable chips. Click one to immediately traverse the whole set via that
  relationship.
- The Relationships Browser: click *Browse relationships →* to see the full list of
  available relationships for the current set. Each relationship shows:
  - How many entities in the current set have it
  - How many distinct values it connects to
  - *Follow as set →* to traverse, *Add as facet* to use it as a filter instead
- Incoming vs. outgoing: outgoing relationships go *from* the current entities *to*
  something else; incoming relationships go *from* something else *to* the current
  entities. Both can be followed.
- Example walkthrough: "UK 1940s Scientists" → Follow *birthPlace* → a new set of 19
  places. Notice the context header now reads "Birthplaces of UK 1940s Scientists."
  The chain builds.
- Following another relationship from the result set: follow *country* from those 19
  places → "Countries of birthplaces of UK 1940s Scientists." This is multi-hop
  exploration without writing a single query.
- Adding as facet vs. following as set: if you follow, you leave the current entities
  behind (the new set is the birthplaces, not the scientists). If you add as facet, you
  stay with the scientists but can now filter by birthplace.

**Sidebar box:** "The context header always tells you where you are and how you got there.
If you ever feel lost, read the sentence at the top — it traces the path from where you
started to where you are now."

---

#### 4.6 Exploring an Individual Entity

*Full page. Entity detail view.*

How to read and navigate the entity detail view.

**Content:**

- How you arrive: clicking a card from any set view, or selecting a search result.
- The layout of the detail view: name at the top, type badge(s), description text (if
  available), and the relationship table.
- Reading the relationship table: relationship name on the left, value(s) on the right.
  IRI-valued entries (links to other entities) appear as clickable links. Plain values
  (text, dates, numbers) appear as plain text.
- Clicking a linked value: resource-to-resource navigation — you follow that connection to
  the next entity, which opens in entity detail.
- The layer selector (Layer −1, 0, +1, +2): explains what you see at each layer.
  Layer 0 is full detail. Layer 1 shows the entity's direct connections as a set of
  cards. Layer −1 shows things that point to this entity.
- Switching to Layer 1 from Layer 0: the cards grid appears, showing the entity's
  direct neighbourhood. You can filter this set with facets, just like any set.
- Use case: "I want to see everything Alan Turing influenced." Switch to Layer 1, filter
  by relationship type *influenced*.

---

#### 4.7 Searching with ⌘K

*Full page. Search palette.*

How to use the keyboard search to jump quickly to any entity or open a pre-filtered set.

**Content:**

- Opening search: click the search box in the top bar, or press `⌘K` (Mac) / `Ctrl+K`
  (Windows/Linux).
- What search looks for: entity labels in the currently active graph. Starts searching
  after you type the first character; results appear as you type.
- Two kinds of results:
  - *Entities*: specific things whose name matches. Clicking one opens entity detail.
  - *Browse as set*: opens a set pre-filtered to entities whose label contains your
    search term. Useful when many things match and you want to browse, not jump to one.
- Keyboard navigation: arrow keys to move, Enter to select, Escape to cancel.
- Scope: search is always within the currently active graph. If you want to search a
  different graph, switch to it first.
- Tip box: "⌘K is the fastest way to start a new thread of exploration. Type a concept,
  see what exists, jump in."

---

#### 4.8 Using Back and Forward

*Short page.*

Moire keeps a full navigation history — every view you've visited is a step you can
return to.

**Content:**

- Back (← button or browser back): returns to the previous view, with all filters and
  focus exactly as you left them. Nothing is lost; the state is preserved.
- Forward (→ button): moves forward if you've gone back and then navigated somewhere else.
  Forward only exists once you've gone back.
- History across all navigation types: back works whether the previous step was a facet
  filter, a type selection, an entity click, or a set traversal.
- One important clarification: changing a *facet value* within the current view does not
  add a new history entry — it refines the current view in place. Clicking an entity or
  following a relationship does add a history entry.
- Practical tip: explore freely. If you go somewhere unexpected, one Back click brings
  you home.

---

#### 4.9 Reading the Context Header

*Short page.*

The sentence or phrase displayed just below the top bar tells you — in plain language —
exactly what you're looking at and how you arrived there.

**Content:**

- Examples of context headers and what navigation steps produced them:
  - "Scientists" — browsed to the Scientist type
  - "1940s Scientists" — added a Decade filter
  - "UK 1940s Scientists" — added a Country filter
  - "Birthplaces of UK 1940s Scientists" — followed the birthPlace relationship
  - "Countries of birthplaces of UK 1940s Scientists" — followed country from those places
  - "Alan Turing" — clicked an entity card
  - "Relationships on UK 1940s Scientists" — opened the relationships browser
- How to use it as a navigation aid: if the header is getting long and complex, you may
  want to go back a few steps and try a different path. If it's short and clear, you're
  in a well-defined part of the graph.

---

### Part 5: Reference

**Purpose:** Comprehensive reference material for users who know their way around and need
to look something up.

---

#### 5.1 Glossary

*Alphabetical. Every term defined simply.*

Entries to include:

- **Class / Type**: a category of entity (e.g. Person, City, Book).
- **Entity**: a single thing in the knowledge graph — a person, place, event, concept,
  or any other named resource.
- **Endpoint**: the URL address of a SPARQL-compatible knowledge graph database.
- **Facet**: a dimension of the lens — a single relationship or attribute that can be used
  to filter the current set. Facets are generated automatically from the structure of the
  data.
- **Filter**: an active selection within a facet that restricts the set. Synonymous with
  "active facet value."
- **Graph** (or **Named graph**): a named collection of triples within a triplestore.
  Think of it as a dataset or a subject area within a larger database.
- **Incoming relationship**: a relationship where some *other* entity points to the current
  entity (as opposed to the current entity pointing outward). Layer −1 shows incoming
  connections.
- **Introspection**: the automatic process by which Moire reads the structure of a
  knowledge graph when you first connect to it. Runs silently in the background; requires
  no user action.
- **Jump via**: a strip of buttons in the set view showing the most useful outgoing
  relationships for the current set. Clicking one follows the set via that relationship.
- **Knowledge graph**: a database where information is stored as entities (things) and
  relationships (connections between things). Everything has a globally unique identifier,
  and every relationship is named and typed.
- **Layer**: the conceptual distance from a focus entity. Layer 0 is the entity itself;
  Layer 1 is its direct connections; Layer −1 is things that connect to it.
- **Lens**: the combination of all currently active facet filters. Changing the lens
  changes what you see without changing the underlying data.
- **Outgoing relationship**: a relationship where the current entity points to something
  else.
- **Predicate**: the technical term for a named relationship between two entities.
  In the documentation we say "relationship" for readability.
- **Resource-to-resource navigation**: clicking on a single entity to move to it directly,
  one entity at a time.
- **Set**: a group of entities currently matching all active facet filters.
- **Set-to-set navigation**: following an entire set of entities through a shared
  relationship, producing a new set of the things they're all connected to.
- **SPARQL endpoint**: a URL that accepts SPARQL query language requests. This is the
  technical standard that Moire uses to communicate with knowledge graph databases.
- **Triple**: the fundamental unit of a knowledge graph: a subject–predicate–object
  statement. E.g. Alan Turing → birthPlace → Maida Vale, London.
- **Triplestore**: a database designed to store triples. Moire connects to any
  SPARQL 1.1-compatible triplestore.
- **Type hierarchy**: the tree-like structure of classes and their subtypes (e.g.
  Scientist is a subtype of Person). Shown in the Types Browser.

---

#### 5.2 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open search palette |
| `↑` / `↓` | Navigate search results |
| `Enter` | Select highlighted search result |
| `Escape` | Close search palette / dialog |
| Browser `Alt+←` / `Alt+→` | Back / Forward |

---

#### 5.3 Understanding Facet Counts

*Short explainer page.*

The numbers next to each facet value tell you how many entities are currently in the set
that have that value. They update live as you add and remove filters.

- A count of **0** (or greyed out): selecting this value would make the current set empty.
  Moire disables these to prevent frustrating dead ends.
- The count **decreases** as you add more filters in other dimensions (the set narrows).
- The count **increases** as you remove filters (the set widens).
- Counts reflect only the current graph and any active layer context. If you're in Layer 1
  of an entity, counts reflect the neighbours of that entity, not the whole graph.

---

#### 5.4 Empty States Explained

*Short reference page — cover all three empty states.*

Three different things can produce an "empty" result in Moire, and each has a different
cause and recovery:

**"No results via this relationship"**
The relationship you followed (via *Follow as set*) exists in the graph, but none of the
entities in your current set have it. Action: click Back and try a different relationship.

**"No results match all active filters"**
Your combination of filters is too narrow — there are no entities that match all of them
simultaneously. Moire shows you which single filter removal would restore results, and how
many results each removal would yield. Click the suggested removal, or click *Clear all
filters*.

**"Nothing found in this graph"**
The graph appears to be empty, or introspection did not complete. Action: click
*Re-run introspection* to try again, or go back to the Graphs Browser and choose a
different graph.

---

#### 5.5 Relationships Browser Reference

A reference card for the Relationships Browser (opened via *Browse relationships →*).

**Columns:**

- **Relationship name**: the human-readable label or short IRI of the predicate.
- **Coverage**: how many entities in the current set have this relationship.
- **Targets**: how many distinct entities or values this relationship connects to.
- **Follow as set →**: navigate the current set via this relationship to a new set of
  connected entities.
- **Add as facet**: add this relationship to the facet sidebar as a new filter dimension.
  (Only available for relationships whose values have manageable cardinality.)

**Sections:**

- *Outgoing*: relationships going from the current set to other entities.
- *Incoming*: relationships coming from other entities to the current set.
- *Schema/structural*: technical relationships (e.g. `owl:sameAs`, `rdf:type`) collapsed
  at the bottom; expand only if needed.

---

### Part 6: Advanced Topics

**Purpose:** For power users who want to go deeper. Clearly marked as optional reading.

---

#### 6.1 Connecting to Different Kinds of Databases

Brief explanations of the kinds of databases Moire works with:

- Any SPARQL 1.1 endpoint: Apache Jena Fuseki, Oxigraph, Stardog, Virtuoso, Blazegraph.
  All core navigation features work.
- pg-ripple endpoints: unlock additional features (see §5.2).
- Authentication: basic auth and bearer token. Where credentials are stored and why
  they're safe (server-side only, never sent to the browser).
- Named graphs: when a triplestore has multiple named graphs, the Graphs Browser shows
  them all. You can switch between graphs at any time, but facets and focus are cleared
  when you switch.

---

#### 6.2 Enhanced Features with pg-ripple

*(Clearly marked: "This section applies only if your endpoint runs pg-ripple.")*

When Moire detects a pg-ripple endpoint, several features upgrade automatically:

- **Faster, smarter search**: instead of simple text matching, search uses a full-text
  index for instant results. You can also find entities that are *conceptually similar*
  to your query, not just ones that match the exact words.
- **Inferred knowledge**: pg-ripple can derive new facts from rules — for example,
  if "Dog" is a subtype of "Animal", querying for Animals also returns Dogs, even if
  they weren't explicitly tagged as Animals. Moire automatically shows this inferred
  knowledge alongside explicit data.
- **Semantic similarity search**: on any entity card, an optional *Find similar* action
  appears, using vector similarity to surface conceptually related entities across the
  graph.
- **Data quality indicators**: if your graph includes validation rules (SHACL shapes),
  Moire can show which entities have data quality issues.

---

#### 6.3 Multi-Hop Exploration Strategies

Practical guidance for getting the most out of chained set traversal.

- **Start broad, then follow.** Enter a large type (Person), filter down to a meaningful
  subgroup (Physicists, born 1880–1920), then follow a relationship. The smaller the
  starting set, the more meaningful the traversal result.
- **Chain for patterns.** Scientists → birthplaces → countries gives you a geographic
  distribution without any statistics tool. Each hop answers a question about the previous
  result.
- **Use incoming relationships to find "what links here."** Follow Layer −1 or click
  *Incoming* in the Relationships Browser to discover what entities consider the current
  set important.
- **Add as facet vs. follow as set.** When a relationship has values that serve as useful
  filters (e.g. *field of study*), add it as a facet and stay in the current entity set.
  When you want to *visit* the connected entities themselves, follow as set.

---

#### 6.4 Tips for Large Graphs

Practical advice for users working with graphs that contain millions of entities.

- Start with a type filter: jumping into a large graph without a type filter produces very
  large counts and potentially slow page loads. The Types Browser is designed as the right
  entry point.
- Facets grey out values that would produce empty results — trust them. They are computed
  from the actual current set, not from the whole graph.
- Result sets are capped at 100 entities per page. For very large traversals (e.g.
  following a relationship across a set of 10,000 entities), the result is automatically
  limited and a count shows total matching entities.
- If a query is slow, try adding a type filter before traversing. Narrowing the set first
  dramatically reduces the work the database must do.

---

## Production Process

### Phase 1: Foundation (Weeks 1–2)

1. Set up the MkDocs publishing infrastructure (see Publishing section below). Confirm the
   site builds and deploys to GitHub Pages from the start so documentation is live from
   day one.
2. Load `examples/sample-moire1.sql` into a local pg-ripple instance and start Moire in
   dev mode. Confirm all features work against this dataset before taking any screenshots.
3. Write the Glossary (§5.1) first. This forces clarity on terminology before writing
   anything else. All later pages reference it as the canonical source of definitions.

### Phase 2: UI Tour and Screenshots (Weeks 2–3)

4. Work through Part 2 (UI Tour) step by step with the live application. Take all
   screenshots in sequence during this pass — at 1440 px wide, light mode. Store
   screenshots in `docs/img/tour/` with descriptive filenames
   (e.g. `tour-01-graphs-browser.png`, `tour-05-set-traversal.png`).
5. Annotate screenshots using a tool that produces consistent numbered callout circles
   (Skitch, CleanShot X, or a Figma template). Export at 2× resolution for retina.

### Phase 3: Core Concepts and How-to (Weeks 3–5)

6. Write Part 3 (Core Concepts) in sequence. Each page should be reviewed for clarity
   by at least one non-technical reader before moving to the next.
7. Write Part 4 (How-to / Navigation) in sequence. Each walkthrough should be tested by
   following it literally with the demo endpoint live.
8. Record screencasts (optional). 60–90 seconds per major section.

### Phase 4: Reference and Advanced (Week 6)

9. Write Part 1 (Getting Started) last — once the core docs exist, the Getting Started
   page can reference them accurately and show realistic screenshots.
10. Write Part 5 (Reference) and Part 6 (Advanced Topics).
11. Full review pass: read every page aloud. Any sentence that is hard to say aloud is
    probably too complex to read.

### Phase 5: Launch and Iteration (Week 7+)

12. Publish. Share with a small group of target users and collect feedback.
13. Add a feedback mechanism to each page (MkDocs Material has built-in page rating).
14. Treat documentation as a living product: update with every UI change, improve based
    on user questions, add new tour steps as features are added.

---

## Quality Checklist

Before any page is published, it should pass:

- [ ] Readable by a non-technical person with no prior knowledge of knowledge graphs
- [ ] Every technical term used in the page is either defined in-line or linked to the
  Glossary
- [ ] Every screenshot has alt text and numbered callouts
- [ ] Every step in a walkthrough has been tested by following it literally with a live
  demo instance
- [ ] No jargon left unexplained (SPARQL, IRI, triple, predicate — all explained or
  replaced with friendlier terms)
- [ ] Active voice throughout; sentences under 25 words where possible
- [ ] At least one visual (screenshot, diagram, or annotated UI) per page
- [ ] Empty states and error cases covered where relevant to the page's topic

---

## Page Count Summary

| Part | Pages | Estimated word count |
|---|---|---|
| Part 1: Getting Started | 3 | ~1,800 |
| Part 2: UI Tour (Research Graph) | 11 steps + summary | ~3,500 |
| Part 3: Core Concepts | 6 | ~4,500 |
| Part 4: Navigating Moire | 9 | ~7,000 |
| Part 5: Reference | 5 | ~2,500 |
| Part 6: Advanced Topics | 4 | ~2,500 |
| **Total** | **38** | **~21,800** |

This is a complete documentation set, not a starting point. Every significant feature,
concept, and edge case in the current application is covered. The word count is calibrated
to be thorough without being overwhelming — most pages are between 400 and 900 words.

---

## Publishing Infrastructure

The documentation is published using **MkDocs Material**, deployed to **GitHub Pages**
automatically on every push to `main`. The setup mirrors the `riverbank` project exactly.

---

### File Structure

```
docs/
├── index.md                        # Home page
├── SUMMARY.md                      # MkDocs literate-nav table of contents
├── img/
│   ├── tour/                       # UI tour screenshots (tour-01-*.png …)
│   └── concepts/                   # Concept diagrams
├── getting-started/
│   ├── index.md
│   ├── what-is-moire.md
│   ├── connecting.md
│   └── screen-overview.md
├── tour/
│   ├── index.md
│   ├── 01-graphs-browser.md
│   ├── 02-types-browser.md
│   ├── 03-set-view.md
│   ├── 04-facet-filtering.md
│   ├── 05-set-traversal.md
│   ├── 06-chaining-traversals.md
│   ├── 07-entity-detail.md
│   ├── 08-resource-to-resource.md
│   ├── 09-layers.md
│   ├── 10-search.md
│   └── summary.md
├── concepts/
│   ├── index.md
│   ├── entities.md
│   ├── relationships.md
│   ├── types.md
│   ├── sets.md
│   ├── the-lens.md
│   └── layers.md
├── how-to/
│   ├── index.md
│   ├── browse-by-type.md
│   ├── filter-with-facets.md
│   ├── follow-relationships.md
│   ├── explore-entity.md
│   ├── search.md
│   ├── back-and-forward.md
│   ├── read-context-header.md
│   └── four-navigation-views.md
├── reference/
│   ├── index.md
│   ├── glossary.md
│   ├── keyboard-shortcuts.md
│   ├── facet-counts.md
│   ├── empty-states.md
│   └── relationships-browser.md
└── advanced/
    ├── index.md
    ├── database-types.md
    ├── pg-ripple-features.md
    ├── multi-hop-strategies.md
    └── large-graphs.md
mkdocs.yml
```

---

### `mkdocs.yml`

```yaml
site_name: Moire
site_description: Faceted navigation for knowledge graphs
site_url: https://trickle-labs.github.io/moire/
repo_url: https://github.com/trickle-labs/moire
repo_name: trickle-labs/moire
edit_uri: edit/main/docs/

theme:
  name: material
  palette:
    - scheme: default
      primary: slate
      accent: indigo
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      primary: slate
      accent: indigo
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
  features:
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - navigation.top
    - search.suggest
    - search.highlight
    - content.code.copy
    - content.code.annotate

plugins:
  - search
  - literate-nav:
      nav_file: SUMMARY.md
  - section-index

markdown_extensions:
  - admonition
  - pymdownx.details
  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_code_format
  - pymdownx.tabbed:
      alternate_style: true
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.inlinehilite
  - attr_list
  - md_in_html
  - tables
  - toc:
      permalink: true
```

---

### `docs/SUMMARY.md`

```markdown
# Moire documentation

- [Home](index.md)
- Getting started
    - [Overview](getting-started/index.md)
    - [What is Moire?](getting-started/what-is-moire.md)
    - [Connecting to a knowledge graph](getting-started/connecting.md)
    - [The screen at a glance](getting-started/screen-overview.md)
- UI Tour — The Research Graph
    - [Overview](tour/index.md)
    - [Step 1 — The Graphs Browser](tour/01-graphs-browser.md)
    - [Step 2 — The Types Browser](tour/02-types-browser.md)
    - [Step 3 — The Set View](tour/03-set-view.md)
    - [Step 4 — Filtering with Facets](tour/04-facet-filtering.md)
    - [Step 5 — Following a Relationship](tour/05-set-traversal.md)
    - [Step 6 — Chaining Traversals](tour/06-chaining-traversals.md)
    - [Step 7 — Opening an Entity](tour/07-entity-detail.md)
    - [Step 8 — Resource-to-Resource Navigation](tour/08-resource-to-resource.md)
    - [Step 9 — Exploring Layers](tour/09-layers.md)
    - [Step 10 — Using Search](tour/10-search.md)
    - [Tour Summary](tour/summary.md)
- Concepts
    - [Overview](concepts/index.md)
    - [Entities](concepts/entities.md)
    - [Relationships](concepts/relationships.md)
    - [Types](concepts/types.md)
    - [Sets](concepts/sets.md)
    - [The Lens](concepts/the-lens.md)
    - [Layers](concepts/layers.md)
- How-to guides
    - [Overview](how-to/index.md)
    - [The four navigation views](how-to/four-navigation-views.md)
    - [Browse by type](how-to/browse-by-type.md)
    - [Filter with facets](how-to/filter-with-facets.md)
    - [Follow relationships across a set](how-to/follow-relationships.md)
    - [Explore an individual entity](how-to/explore-entity.md)
    - [Search with ⌘K](how-to/search.md)
    - [Use Back and Forward](how-to/back-and-forward.md)
    - [Read the context header](how-to/read-context-header.md)
- Reference
    - [Overview](reference/index.md)
    - [Glossary](reference/glossary.md)
    - [Keyboard shortcuts](reference/keyboard-shortcuts.md)
    - [Understanding facet counts](reference/facet-counts.md)
    - [Empty states explained](reference/empty-states.md)
    - [Relationships Browser](reference/relationships-browser.md)
- Advanced
    - [Overview](advanced/index.md)
    - [Database types](advanced/database-types.md)
    - [Enhanced features with pg-ripple](advanced/pg-ripple-features.md)
    - [Multi-hop exploration strategies](advanced/multi-hop-strategies.md)
    - [Tips for large graphs](advanced/large-graphs.md)
```

---

### GitHub Actions Workflow — `.github/workflows/docs.yml`

```yaml
name: docs

on:
  push:
    branches: [main]

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip

      - name: Install docs dependencies
        run: pip install mkdocs-material mkdocs-literate-nav mkdocs-section-index

      - name: Build docs
        run: mkdocs build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

### `requirements-docs.txt`

A standalone pip requirements file so the docs can be built without installing the full
Node.js application:

```
mkdocs-material>=9.5
mkdocs-literate-nav>=0.6
mkdocs-section-index>=0.3
```

Add a `just docs` recipe to the existing `justfile`:

```just
# Build and serve docs locally
docs:
    pip install -r requirements-docs.txt
    mkdocs serve

# Build docs for production
docs-build:
    pip install -r requirements-docs.txt
    mkdocs build
```

---

### Screenshot Conventions

All screenshots follow these rules so the documentation looks consistent and professional:

| Convention | Value |
|---|---|
| Browser | Chrome, no extensions, default UI |
| Viewport | 1440 × 900 px |
| Theme | Light mode |
| Demo graph | `sample-moire1.sql` loaded at `http://example.org/research` |
| File format | PNG, 2× resolution (2880 × 1800 px saved as retina) |
| Naming | `tour-NN-descriptive-name.png` in `docs/img/tour/` |
| Callouts | Numbered circles in red (#E53E3E), 24 px diameter, Helvetica label |
| Alt text | Required on every image: describe what is visible, not just the step number |
