# Changelog

What's new in Moire — written for everyone, not just developers.

For future plans and upcoming features, see [ROADMAP.md](ROADMAP.md).

## Table of Contents

<!-- TOC start -->
- [0.9.0 — pg-ripple Enhanced Features](#090--pg-ripple-enhanced-features)
- [0.8.0 — VoID Dataset Metadata](#080--void-dataset-metadata)
- [0.7.0 — SHACL Data Quality](#070--shacl-data-quality)
- [0.6.0 — Rich Entity Detail Annotations](#060--rich-entity-detail-annotations)
- [0.5.0 — Richer Relationship Browser & Explanatory Empty States](#050--richer-relationship-browser--explanatory-empty-states)
- [0.4.0 — Predicate Metadata from the Graph](#040--predicate-metadata-from-the-graph)
- [0.3.0 — Natural Context Headers](#030--natural-context-headers)
- [0.2.4 — Integration Tests for Server Actions](#024--integration-tests-for-server-actions)
- [0.2.3 — E2E Reliability Fixes](#023--e2e-reliability-fixes)
- [0.2.2 — Unit Tests for Stores](#022--unit-tests-for-stores)
- [0.2.1 — Unit Tests for Core Logic](#021--unit-tests-for-core-logic)
- [0.2.0 — Breadcrumbs & Annotated Tooltips](#020--breadcrumbs--annotated-tooltips)
- [0.1.0 — Predicate Roles & Smarter Ordering](#010--predicate-roles--smarter-ordering)
<!-- TOC end -->

---

## 0.9.0 — pg-ripple Enhanced Features

When connected to a pg-ripple endpoint, Moire now activates a set of enhanced
features that go beyond what standard SPARQL endpoints can offer. Everything
activates automatically based on what the endpoint supports — no configuration
required.

### What you'll notice *(pg-ripple graphs only)*

- **Full-text search.** The search palette (⌘K) now searches the full text of
  every string field — labels, descriptions, abstracts, notes — using
  pg-ripple's built-in `pg:fts()` index. On standard SPARQL endpoints the
  search is unchanged (label-only substring match).
- **Semantically similar entities.** When browsing an individual entity, a
  "Semantically similar" section appears at the bottom of the page — a ranked
  list of entities whose overall description in the graph is similar to the
  current one, even if they are not directly connected. Clicking any item
  navigates to that entity. This section only appears when the pg-ripple
  dataset has been indexed for similarity.
- **Richer data quality panel.** pg-ripple computes and stores SHACL validation
  results directly in the graph. When violations exist for the current entity,
  Moire reads the pre-computed results instead of deriving them locally from
  shapes. The collapsible "Data Quality" panel on the entity detail page shows
  the same violations as before, now sourced directly from pg-ripple's
  validation engine.

### Details

- Standard SPARQL endpoints are completely unaffected — no new queries, no
  change in behaviour, no latency increase.
- The similar-entities section is absent when the similarity index has not been
  built for a dataset; no error or empty box is shown.
- The pg-ripple SHACL panel degrades gracefully: if the violations query fails
  or returns nothing, no panel is shown.
- All three features are covered by unit tests (query builder + parser) and
  integration E2E tests against a mock pg-ripple server.

---

## 0.8.0 — VoID Dataset Metadata

The screen where you choose a graph to explore now shows real dataset information
— title, description, publisher, last-updated date, and the vocabularies in use —
instead of just a raw web address.

### What you'll notice

- **Dataset title and description.** When a graph publishes VoID metadata, its
  card shows the human-readable title (e.g. *"Research Dataset"*) and a short
  description instead of the raw IRI.
- **Publisher and modified date.** Secondary metadata lines show who published
  the dataset and when it was last updated.
- **Vocabulary badges.** If the graph declares which vocabularies it uses
  (SKOS, FOAF, Dublin Core, etc.), small badges appear on the card.
- **Suggested starting points.** When the dataset defines root or example
  resources via `void:rootResource` / `void:exampleResource`, a "Suggested
  starting points" section appears, giving you an entry point into the data.

### Details

- VoID metadata is fetched opportunistically during introspection — it never
  blocks or delays the card from appearing.
- Graphs without VoID metadata continue to show the same raw-IRI card as before
  with no visible change.
- The feature is fully tested: 9 E2E tests verify VoID rendering, fallback
  behaviour, and absence of regression on graphs that have no VoID.

---

## 0.7.0 — SHACL Data Quality

When a graph's owners have defined rules about what a complete and correct record
should look like, Moire can now surface quiet warnings when individual records
fall short.

### What you'll notice

A small warning badge appears on entity cards where the graph's own quality rules
flag a problem. Opening one of those entities shows a collapsible panel at the
bottom of the page listing each issue in plain English — for example, *"This
record is missing an expected publication date."*

Nothing appears on graphs that have no quality rules defined, so the interface
stays clean for graphs that haven't been annotated that way.

### Details

- Warning badges are shown only on entity cards that have actual violations —
  not on every card.
- The violations panel on the entity detail page lists the violation message, its
  severity (Info, Warning, or Violation), and the affected field.
- When the graph defines no rules, the badge and panel are simply absent. No
  error messages, no empty boxes.
- SHACL-sourced field names are now used when labelling predicates, giving you
  the name the graph's author intended rather than a raw IRI.

---

## 0.6.0 — Rich Entity Detail Annotations

When you open an individual entity, its page now fills in with richer context
drawn from the graph's own metadata — progressively, so the page loads fast and
the extra information appears shortly after.

### What you'll notice

- **Type hierarchy.** The type badge now shows the full family tree — for
  example, *"Professor → Researcher → Person → Agent"* — so you can see at a
  glance what kind of thing an entity is and how it fits into the broader
  classification scheme.
- **Other names.** If the record has known aliases or alternate labels, a compact
  "Also known as" line appears below the title.
- **Dates.** When the data includes creation or modification dates, a temporal
  line appears — *"Created 2023-05-12, last modified 2024-01-03"*.
- **Source and provenance.** The best external source link is surfaced near the
  top of the page. A full provenance chain is available expanded below when
  the data includes it.
- **Media.** Images, external pages, and document links are grouped into a
  dedicated media section when the data provides them.
- **Organised properties.** The property table is now grouped by semantic role
  (descriptive, relational, provenance, and so on) rather than appearing as a
  flat, unsorted list.

### Details

The extra annotation query runs in the background after the entity's primary
data has already painted — so the page is never held up waiting for it.
Sections that have no data to show are simply omitted.

---

## 0.5.0 — Richer Relationship Browser & Explanatory Empty States

Relationship rows now tell you enough to decide whether a traversal is worth
following, and when a traversal or filter returns nothing, Moire explains why
and suggests a way forward.

### What you'll notice

- **Domain and range on every row.** Each relationship in the browser now shows
  what kind of thing it typically connects — for example, *"Usually describes:
  Researcher"* and *"Usually points to: Organization"*.
- **Inverse label badge.** Where applicable, a badge shows the relationship's
  reverse reading.
- **Coverage percentage.** Each row shows what fraction of the current set
  actually uses that relationship.
- **OWL characteristic badges.** Tooltips note when a relationship is
  functional (each record has at most one), symmetric, or transitive.
- **Helpful empty states.** When a traversal finds nothing, the message
  explains the likely reason — *"Only 3 of 100 researchers in this set have
  this relationship"* — and suggests a recovery action such as removing a
  filter or choosing a different path. The screen no longer just says "No
  results".

---

## 0.4.0 — Predicate Metadata from the Graph

Moire now reads the descriptions that the graph's own authors wrote for each
relationship and uses them wherever relationships are displayed.

### What you'll notice

When you hover over a relationship, the tooltip now shows the label and
description that came from the graph itself — the name and explanation the
people who designed the data intended. This happens automatically in the
background when you connect, so there is nothing to configure.

### Details

During the connection phase, Moire runs a single batched query to collect
labels, descriptions, domain and range declarations, inverse relationships,
and property characteristics (such as whether a relationship is unique per
record) for every predicate in the graph. The results are cached so subsequent
navigation stays fast. If the query fails or times out, Moire falls back to
the heuristic labels it has always used.

---

## 0.3.0 — Natural Context Headers

The line at the top of the screen that describes where you are now reads like
a plain English sentence.

### What you'll notice

Instead of something like *"affiliatedWith of SE Researchers"*, the header
now says *"Institutions for SE Researchers"*. The interface sounds as though it
understands the graph, rather than quoting a raw database field.

**Before / after examples:**

| Before | After |
|---|---|
| `affiliatedWith of SE Researchers` | `Institutions for SE Researchers` |
| `locatedIn of Universities` | `Cities containing Universities` |
| `broader of Climate Concepts` | `Broader topics for Climate Concepts` |

### Details

Labels are now chosen in a well-defined order of preference: local overlay →
SHACL shape name → SKOS preferred label → RDFS label → vocabulary registry
name → a human-readable shortening of the raw IRI. Moire also computes soft
inverse labels for common predicates (so following `affiliatedWith` in reverse
produces "institutions" rather than "reverse affiliatedWith"). When no better
label is found, Moire falls back to the previous behaviour.

---

## 0.2.4 — Integration Tests for Server Actions

This is an internal quality release. No user-visible behaviour changed.

### What changed

A new layer of integration tests verifies that the connection and data-loading
logic behaves correctly against a simulated SPARQL server. The test suite now
checks scenarios such as connection timeouts, server errors, and the filtering
of malformed predicates — ensuring regressions in these areas are caught before
they reach you.

---

## 0.2.3 — E2E Reliability Fixes

This is an internal quality release. No user-visible behaviour changed.

### What changed

The end-to-end test suite was tightened up: selectors are more precise, waits
are based on content being ready rather than arbitrary delays, and intentional
skips are now clearly annotated. The result is fewer false failures in CI and
a suite that catches real regressions more reliably.

---

## 0.2.2 — Unit Tests for Stores

This is an internal quality release. No user-visible behaviour changed.

### What changed

Automated unit tests were added for the two Zustand stores that manage
navigation history and endpoint configuration. The tests cover all state
transitions — navigating forward and backward, truncating forward history
after a branch, connecting, disconnecting, and updating the label predicate.

---

## 0.2.1 — Unit Tests for Core Logic

This is an internal quality release. No user-visible behaviour changed.

### What changed

A fast unit test suite (`npm run test:unit`) was added for the core library
code — SPARQL query builders, the facet generator, the context-header
formatter, and the vocabulary registry. Line coverage for these modules is
above 80%. The suite runs in under a second, giving immediate feedback on
changes to query logic before the longer end-to-end suite is needed.

---

## 0.2.0 — Breadcrumbs & Annotated Tooltips

### What you'll notice

- **Breadcrumb trail.** A path appears below the heading showing every step
  you took to get to the current view — for example,
  *"SE Researchers → affiliated with → Universities → located in → Cities"*.
  You can click any step to jump straight back to it.
- **Hover tooltips.** Hovering over a relationship in the browser or the jump
  strip now shows a small tooltip with the relationship's role, how many
  records use it, the coverage percentage, and the top three values with
  counts — enough to decide whether it is worth following before you click.
- **Role icons.** Each relationship row and jump button carries a small icon
  indicating its semantic role (explore, filter, describe, and so on).

---

## 0.1.0 — Predicate Roles & Smarter Ordering

### What you'll notice

The list of relationships you can follow is now organised into groups —
*Explore*, *Filter*, *Describe*, *Source*, and *Technical* — instead of one
long unsorted list. The most useful paths appear at the top. Relationships that
are mainly technical plumbing are moved to a collapsed section at the bottom so
they stay out of the way.

Cardinality indicators show at a glance whether a relationship typically points
to one thing or many, and a small vocabulary badge (SKOS, PROV, and so on)
identifies the standard the predicate comes from.

### Details

Moire maps over 50 common predicates from RDF, RDFS, OWL, SKOS, Dublin Core,
FOAF, PROV, and schema.org to semantic roles. Predicates not in that list
receive a role based on their namespace and name pattern. A usefulness score
determines ordering: relational and classifying predicates that appear on most
records rank high; purely structural or extremely sparse predicates rank low
and are tucked away.
