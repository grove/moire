# Moire Roadmap

Moire uses [semantic versioning](https://semver.org/). Minor versions (`v0.x.0`) introduce new user-facing features. Patch versions (`v0.x.y`) deliver bug fixes and small improvements within a feature set. A `v1.0.0` will mark the first stable, publicly documented release.

The current theme is **Annotations**: making Moire explain predicates, resources, and datasets through layered metadata from standards (RDFS, OWL, SKOS, SHACL, PROV-O, VoID), graph introspection, and local overlays. Full design context is in [plans/annotations.md](plans/annotations.md).

---

## v0.1.0 — Predicate Roles & Smarter Ordering

**Theme**: Predicate Foundation  
**Goal**: Make predicates in the Relationships Browser, facet panel, and Jump strip feel like authored choices rather than raw graph plumbing. Uses data Moire already has — no additional network queries.

> **What you'll notice**: The list of relationships you can follow is now organized into groups — "Explore", "Filter", "Describe", and so on — instead of one long unsorted list. The most useful paths appear at the top. Relationships that are mainly technical plumbing are moved to a collapsed section at the bottom so they stay out of the way.

### Changes

**`src/lib/vocabulary-registry.ts`** _(new file)_
- [x] Map 50+ common predicates from RDF/RDFS/OWL/SKOS/Dublin Core/FOAF/PROV/schema.org to semantic roles: `labelling`, `descriptive`, `classifying`, `relational`, `temporal`, `numeric`, `provenance`, `structural`, `media`.
- [x] Heuristic fallback for predicates not in the registry (by namespace and name pattern).

**`src/lib/facet-generator.ts`** — extend `annotatePredicates`
- [x] Add `role: PredicateRole` to `PredicateSummary` (from registry, then heuristic).
- [x] Add `cardinality: "single" | "usually-single" | "multi" | "highly-multi"` (from `objectCount / subjectCount` ratio).
- [x] Add `vocabularyBadge?: string` (short namespace label: "SKOS", "PROV", etc.).
- [x] Add `usefulness: number` (0–100 score: boost relational/classifying roles, high coverage, meaningful cardinality; penalize structural, extremely sparse, or uniform-value predicates).

**Relationships Browser**
- [x] Group predicates by role into sections: Explore, Filter, Describe, Source, Technical.
- [x] Show cardinality indicator and vocabulary badge on each row.

**Jump strip**
- [x] Sort buttons by usefulness score (most useful first).
- [x] Limit to 3–5 buttons.

**Facet panel**
- [x] Show classifying predicates first, relational second.

### Acceptance criteria
- [x] All discovered predicates in test graphs receive role and cardinality.
- [x] Usefulness ordering is stable and sensible.
- [x] No performance regression on introspection.

---

## v0.2.0 — Breadcrumbs & Annotated Tooltips

**Theme**: Navigation Clarity  
**Goal**: Make exploration paths visible and reversible. Give users enough information to commit to a traversal before clicking.

> **What you'll notice**: A breadcrumb trail appears below the heading showing every step you took to get here — for example, "SE Researchers → affiliated with → Universities → located in → Cities". You can click any step to jump straight back to it. Hovering over a relationship button now shows a small tooltip explaining what the relationship is, how many records use it, and the most common values.

### Changes

**Traversal breadcrumb** _(new UI component)_
- [x] Shown below the context header on all navigations.
- [x] Format: `SE Researchers → affiliated with → Universities → located in → Cities`
- [x] Each chip shows: predicate role icon, predicate label, target type label.
- [x] Clicking any chip navigates back to that frame.

**Hover tooltips** on predicate rows in the Relationships Browser and Jump strip
- [x] Show: role, cardinality hint, coverage percentage ("available on 94% of this set"), top 3 values with counts.

**Role icons** in Relationships Browser and Jump strip buttons. ✓

### Acceptance criteria
- [x] Breadcrumb appears on all navigation steps.
- [x] Tooltips render without layout shift.
- [x] Role icons are visually distinct and accessible.

---

## Test Infrastructure — Unit, Integration & E2E Reliability

**Theme**: Test Coverage  
**Goal**: Add a fast-feedback unit test layer for the pure library code, improve reliability of existing E2E tests, and add integration tests for server actions using a fake SPARQL server. Full plan in [plans/improved-test-coverage-1.md](plans/improved-test-coverage-1.md).

> **What you'll notice** _(developer-facing only)_: `npm run test:unit` gives a sub-second pass/fail signal for the query-building and scoring logic. The E2E suite stops swallowing silent failures and its matchers are precise enough to catch copy-paste regressions.

### v0.2.1 — Track 1: Unit tests for `src/lib/`

**Setup**: install Vitest + `@vitest/coverage-v8`; add `vitest.config.ts` with `@` alias; add `test:unit` / `test:unit:coverage` scripts to `package.json`.

**`src/lib/sparql.test.ts`**
- [x] `buildLayerQuery` throws for unsupported layer values
- [x] `buildLayerQuery` throws when `focusIRI` is not a valid IRI
- [x] `buildLayerQuery` omits `GRAPH` clause when `graphIRI` is null
- [x] `buildLayerQuery` wraps in `GRAPH` clause when `graphIRI` is provided
- [x] `buildLayerQuery` inserts `rdf:type` filter when facet dimension is `rdf:type`
- [x] `buildLayerQuery` skips non-IRI facet dimensions without throwing — regression test for the documented IRI validation bug
- [x] `buildLayerQuery` uses `STR()` comparison for literal facet values
- [x] `buildSetTraversalQuery` with `direction = "incoming"` reverses the triple pattern
- [x] `buildFacetCountQuery` produces a `GROUP BY` over `?value`
- [x] `buildSearchQuery` escapes double-quotes, backslashes, and newlines in the search term

**`src/lib/facet-generator.test.ts`**
- [x] A predicate with `isStructural = true` is not returned as a facet candidate
- [x] `valueKind = "iri"` with `objectCount = 5` → `FacetDefinition` with `valueType = "uri"`
- [x] `valueKind = "date"` → `valueType = "date-range"`; `valueKind = "numeric"` → `"numeric-range"`
- [x] Predicates in `STRUCTURAL_PREDICATES` (e.g., `owl:sameAs`) receive `isStructural = true`
- [x] `computeCardinality`: ratio ≤ 1.1 → `"single"`, 1.2–1.5 → `"usually-single"`, 1.6–5.0 → `"multi"`, > 5 → `"highly-multi"`
- [x] A `"relational"` predicate scores higher than a `"structural"` one
- [x] Output list is ordered by descending usefulness score

**`src/lib/context-header.test.ts`**
- [x] `context = "graphs"` returns `""`
- [x] `context = "types"` returns `"Types in <graph label>"`
- [x] `context = "entity"` returns label; falls back to `shortIRI` when label is undefined
- [x] `context = "set"` with no facets returns the pluralised class label
- [x] `context = "set"` with facets prepends facet phrases before the class label
- [x] `context = "set"` with `navigationPredicate` produces `"<pred> of <parent header>"`
- [x] `context = "relationships"` produces `"Relationships on <parent header>"`
- [x] Recursive two-deep traversal produces the correct composed string

**`src/lib/vocabulary-registry.test.ts`**
- [x] `lookupPredicate` returns the correct entry for well-known IRIs (e.g., `rdfs:label`)
- [x] `lookupPredicate` returns undefined for unknown IRIs
- [x] No IRI appears twice in the registry

### v0.2.2 — Track 2: Unit tests for `src/stores/`

**`src/stores/navigation-store.test.ts`**
- [x] Initial state has one frame and `pointer = 0`
- [x] `push(frame)` appends to the stack and increments the pointer
- [x] `push(frame)` when pointer is mid-stack truncates forward history
- [x] `back()` decrements pointer; no-ops when pointer is 0
- [x] `forward()` increments pointer; no-ops when at end of stack
- [x] After `back(); push(newFrame)`, `forward()` does nothing

**`src/stores/endpoint-store.test.ts`**
- [x] `setEndpoint(config)` stores config and marks `isConnected = true`
- [x] `clearEndpoint()` resets to initial disconnected state
- [x] `setLabelPredicate(iri)` updates the predicate without changing other fields

### v0.2.3 — Track 3: E2E reliability fixes

- [x] Tighten `/\d+\s+entit/` to `/(entity|entities)/` in `05-entity-set.spec.ts`, `10-facets.spec.ts`, `07-navigation.spec.ts`
- [x] Add `data-testid` attributes to graph cards, class rows, entity cards, relationship rows, and facet groups
- [x] Replace `.animate-pulse` + `.catch(() => {})` waits with positive content-ready assertions using the new `data-testid` selectors
- [x] Annotate intentional search-palette skips with `test.info().annotations.push(...)` instead of silent returns
- [x] Deduplicate `test.setTimeout(180_000)` into a shared fixture override in `fixtures.ts`

### v0.2.4 — Track 4: Integration tests for server actions

- [x] Create `e2e/sparql-mock-server.ts`: minimal in-process HTTP server that returns configurable SPARQL JSON responses
- [x] `setupEndpoint` returns capabilities and summaries for a valid SPARQL response
- [x] `setupEndpoint` throws `"Cannot reach endpoint: connection timed out."` on no response
- [x] `setupEndpoint` throws on HTTP 500
- [x] Introspection pipeline filters out predicates with non-IRI values — regression test for the documented bug
- [x] Default-graph endpoint represented as `graphIRI = null`
- [x] Facet count query rejects non-IRI facet dimensions before sending the query

### Acceptance criteria
- [x] `npm run test:unit` passes; `src/lib/` line coverage ≥ 80%
- [x] All 12 existing E2E specs pass after reliability fixes
- [x] `data-testid` attributes in place on the five listed components
- [x] IRI validation regression test exists and passes against the mock server

---

## v0.3.0 — Natural Context Headers

**Theme**: Navigation Clarity  
**Goal**: Context headers should read like sentences, not assembled IRI fragments.

> **What you'll notice**: The line at the top of the screen that describes where you are starts reading like plain English. Instead of something like "affiliatedWith of SE Researchers", it now says "Institutions for SE Researchers". The interface sounds like it understands the graph, not like it is quoting a database field name.

### Changes

**`src/lib/context-header.ts`** — label precedence and inverse support
- [x] Label order: overlay > SHACL shape name > SKOS prefLabel > RDFS label > vocabulary registry name > derived short IRI.
- [x] Compute soft inverse labels for common predicates (e.g., `affiliatedWith` incoming → "institutions").
- [x] Generate outgoing phrase: `[source set] [predicate label] [target type]` → "Researchers affiliated with universities".
- [x] Generate incoming phrase: `[predicate inverse label] of [source set]` → "Affiliations of researchers".

**Before / after examples**:

| Before | After |
|---|---|
| `affiliatedWith of SE Researchers` | `Institutions for SE Researchers` |
| `locatedIn of Universities` | `Cities containing universities` |
| `broader of Climate Concepts` | `Broader topics for Climate Concepts` |

### Acceptance criteria
- [x] Common traversal paths in the test graph read naturally.
- [x] Headers stay under 100 characters.
- [x] Fallback to current behavior when no better label is available.

---

## v0.4.0 — Predicate Metadata from the Graph

**Theme**: Metadata Harvest  
**Goal**: Enrich predicate annotations by querying the graph itself during introspection. One batched SPARQL query collects labels, descriptions, domain/range, OWL inverses, and property characteristics for all discovered predicates.

> **What you'll notice**: Moire now reads the descriptions that the graph's own authors wrote for each relationship. If a graph documents that "affiliated with" connects a person to an institution, that description shows up in tooltips. Relationship names become clearer because they come from the people who designed the data, not from guesswork. This happens automatically in the background when you connect.

### Changes

**`src/lib/metadata-queries.ts`** _(new file)_
- [x] Batched predicate metadata query: `rdfs:label`, `skos:prefLabel`, `rdfs:comment`, `skos:definition`, `rdfs:domain`, `rdfs:range`, `owl:inverseOf`, OWL property type (`FunctionalProperty`, `SymmetricProperty`, `TransitiveProperty`, etc.).
- [x] Executes once during graph introspection; cached with graph summary.
- [x] Query spec: [plans/annotations.md § 10.1](plans/annotations.md#101-predicate-metadata-query).
- [x] Graceful fallback to v0.1 heuristics if query fails or times out.

**`PredicateSummary` type** — new optional fields
- [x] `rdfsLabel?: string`
- [x] `skosDefinition?: string`
- [x] `inverseIRI?: string; inverseLabel?: string`
- [x] `domain?: string; domainLabel?: string`
- [x] `range?: string; rangeLabel?: string`
- [x] `owlCharacteristics?: string[]`

**Context header** (builds on v0.3)
- [x] Now uses `inverseLabel` from graph metadata, not only registry.

### Acceptance criteria
- [x] Metadata query executes in < 2s on test graphs.
- [x] Results survive page reload (cached in graph summary).
- [x] Label precedence observable in debug output.

---

## v0.5.0 — Richer Relationship Browser & Explanatory Empty States

**Theme**: Metadata Harvest  
**Goal**: Relationship browser rows convey enough to make traversal decisions confidently. Empty states explain what happened and suggest a recovery path.

> **What you'll notice**: Each relationship in the browser now shows what kind of thing it usually connects to — for example, "Usually describes: Researcher" and "Usually points to: Organization". When a search or traversal finds nothing, the screen no longer just says "No results". Instead it tells you why — such as "Only 3 of 100 records in this set have this relationship" — and suggests a way out.

### Changes

**Relationships Browser rows** (builds on v0.4 metadata)
- [x] Show domain ("Usually describes: Researcher") and range ("Usually points to: Organization") as secondary text.
- [x] Inverse label badge for applicable predicates.
- [x] Coverage percentage on each row.
- [x] OWL characteristic badges (Functional, Symmetric, Transitive) in tooltip.

**Empty states**
- [x] On zero-result traversal: check and report coverage ("Only 3 of 100 entities have this relationship").
- [x] On zero-result filter: diagnose facet overlap ("Active filters leave no matching records").
- [x] Suggest at least one recovery: "Try removing [filter]" or "Try a different path".

Example:
```
No cities found.
"locatedIn" is used by 3 of 100 researchers in this set.
Try filtering researchers first, or follow a different path.
```

### Acceptance criteria
- [x] Relationships Browser rows render without layout thrashing.
- [x] Domain/range labels visible on row (or tooltip for space-constrained layouts).
- [x] Empty states name the relevant predicate and suggest one action.

---

## v0.6.0 — Rich Entity Detail Annotations

**Theme**: Rich Annotations  
**Goal**: Entity detail becomes a richer surface: type hierarchy, temporal summary, provenance, media, and aliases load on demand without blocking primary render.

> **What you'll notice**: When you open an individual entity, its page fills in with more context. You might see where the record came from (a source link or attribution), when it was created or last updated, other names it is known by, and images or document links when the data includes them. The type badge now shows the full family tree of the type — for example, "Professor → Researcher → Person → Agent" — so you understand what kind of thing it is at a glance.

### Changes

**On-demand resource annotation query** (runs when entity detail opens)
- [x] Fetches: preferred labels, aliases (`skos:altLabel`), descriptions, type hierarchy, dates, source/provenance links, media (image, page, document), SHACL result stubs.
- [x] Query spec: [plans/annotations.md § 10.3](plans/annotations.md#103-resource-annotation-query).
- [x] Results fill in progressively after initial entity render.

**Entity detail — new sections**
- [x] **Type hierarchy**: "Professor < Researcher < Person < Agent" as a breadcrumb chain.
- [x] **Also known as**: compact alias line (collapsed if > 3).
- [x] **Temporal**: "Created 2023-05-12, modified 2024-01-03" from any detected date predicate.
- [x] **Source / Provenance**: best external link hoisted to header; expandable chain below.
- [x] **Media**: thumbnails, external pages, document links in a grouped section.

**Entity detail — predicate table**
- [x] Group predicates by role (using v0.1 roles).
- [x] Apply SHACL shape ordering (`sh:order`) when available.

### Acceptance criteria
- [x] Entity detail first paint is not blocked by annotation query.
- [x] Temporal and provenance sections appear when data exists, absent otherwise.
- [x] No performance regression on entity navigation.

---

## v0.7.0 — SHACL Data Quality

**Theme**: Rich Annotations  
**Goal**: When a graph publishes SHACL shapes, surface data quality warnings quietly on entity cards and entity detail.

> **What you'll notice**: If the graph's owners have defined rules about what complete records should look like, Moire will quietly flag records that don't meet those rules. A small warning badge appears on cards with known issues, and the entity detail page shows a plain-English explanation — for example, "This record is missing an expected publication date." This only appears when the graph provides that kind of quality information.

### Changes

**`src/lib/metadata-queries.ts`** — SHACL shape query
- [x] On-demand query when a type view or entity detail opens for a known type.
- [x] Collects `sh:name`, `sh:description`, `sh:order`, `sh:group`, `sh:datatype`, `sh:class`, `sh:minCount`, `sh:maxCount` for the target class.
- [x] Cached by class IRI.
- [x] Query spec: [plans/annotations.md § 10.2](plans/annotations.md#102-shacl-shape-metadata-query).

**Entity cards** — small warning badge on SHACL violations.
- [x] Badge appears only on entities with actual violations.

**Entity detail** — SHACL results panel (quiet, collapsible)
- [x] Shows violation message, severity (Info / Warning / Violation), affected predicate.
- [x] Empty state improvements: "Expected one publication date, but none found" when shape data supports it.

**`PredicateSummary`** — SHACL-sourced `sh:name` and `sh:description` added to label precedence.
- [x] `shaclName?: string` and `shaclDescription?: string` fields added to `PredicateSummary`.

### Acceptance criteria
- [x] Shape query degrades gracefully on graphs without SHACL.
- [x] Badge appears only on entities with actual violations.
- [x] Panel is visually distinct from primary entity content.

---

## v0.8.0 — VoID Dataset Metadata

**Theme**: Rich Annotations  
**Goal**: Graph Browser cards and screen overviews show human-readable dataset information when VoID metadata is available, instead of only raw graph IRIs.

> **What you'll notice**: The screen where you choose a graph to explore now shows real descriptions — the dataset's title, who published it, when it was last updated, and what kind of information it contains — instead of just a raw web address. When the graph suggests good starting points, Moire can offer them to you directly.

### Changes

**`src/lib/metadata-queries.ts`** — VoID dataset query
- [x] Runs opportunistically during graph introspection (does not block).
- [x] Collects: `dcterms:title`, `dcterms:description`, `dcterms:publisher`, `dcterms:license`, `dcterms:modified`, `void:vocabulary`, `void:rootResource`, `void:exampleResource`, triple/entity/class/property counts.
- [x] Query spec: [plans/annotations.md § 10.4](plans/annotations.md#104-void-dataset-metadata-query).

**Graph Browser cards**
- [x] Show dataset title and description instead of raw graph IRI when available.
- [x] Show publisher, license, modified date as secondary metadata.
- [x] Show vocabulary badges (Dublin Core, FOAF, SKOS, etc.).

**Screen overview**
- [x] "Suggested starting points" from `void:rootResource` / `void:exampleResource`.
- [x] "Uses these vocabularies" strip when known.

### Acceptance criteria
- [x] Cards show human-readable metadata on test graphs with VoID.
- [x] Graceful fallback to current introspection data when VoID absent.
- [x] No performance penalty when VoID query returns nothing.

---

## v0.9.0 — pg-ripple Enhanced Features

**Theme**: Rich Annotations  
**Goal**: When connected to a pg-ripple endpoint, unlock full-text search, semantic similarity, and richer SHACL data quality integration.

> **What you'll notice** _(pg-ripple graphs only)_: Search (⌘K) now finds things based on the full text of descriptions and notes, not just the name. On an entity detail page, a "Semantically similar entities" section may appear — a ranked list of records that are about similar things, even if they are not directly connected in the graph.

### Changes

- [x] Full-text search (`pg:fts()`) in search palette, replacing label-only matching.
- [x] "Semantically similar entities" section in entity detail (when similarity index built).
- [x] Richer SHACL data quality as a first-class panel (pg-ripple provides pre-computed results).

All features activate automatically on pg-ripple detection; no user configuration required.

### Acceptance criteria
- [x] Features appear only on pg-ripple endpoints.
- [x] Standard SPARQL endpoints unaffected.
- [x] No increase in query latency on non-pg-ripple endpoints.

---

## v0.10.0 — Local Annotation Overlays

**Theme**: Local Overlays  
**Goal**: Endpoint owners can customize annotations for private, sparse, or opaque graphs without modifying source RDF.

> **What you'll notice**: If you connect to a private or internal knowledge graph that uses cryptic relationship names, the administrator can now supply a small configuration file that gives those relationships clear, plain-language labels — without touching the underlying data. You can also switch to a "technical view" at any time to see the original names.

### Changes

**`src/lib/overlay-loader.ts`** _(new file)_
- [x] Load and validate a JSON overlay file configured per endpoint in the Endpoint Manager.
- [x] Schema covers: predicate label, inverse label, description, role, group, hidden flag, icon, priority; resource label, description, icon, aliases.
- [x] Validation runs before apply; invalid files fail with clear error messages.
- [x] Overlays merge as the final annotation pass (highest precedence).

Example overlay:
```json
{
  "version": 1,
  "predicates": {
    "http://example.org/research/legacyId": {
      "label": "Legacy Record ID",
      "description": "Internal identifier from the pre-migration system.",
      "role": "structural",
      "hidden": true
    }
  }
}
```

**"Show technical view" toggle**
- [x] Reveals hidden predicates and raw IRIs alongside overlay-curated labels.
- [x] Overlay-sourced annotations marked internally (visible in technical view).

**Endpoint Manager** — overlay URL field per endpoint.
- [x] Overlay URL input field in the add-endpoint form.

### Acceptance criteria
- [x] Overlay overrides display without affecting underlying graph data.
- [x] Technical view restores access to all hidden predicates.
- [x] Invalid overlay files fail clearly at load time.

---

## v0.11.0 — Overlay Documentation & Examples

**Theme**: Local Overlays  
**Goal**: Endpoint owners can self-serve overlay creation from documentation and working templates.

> **What you'll notice**: If you manage a knowledge graph and want to set up an overlay, step-by-step documentation and ready-to-use templates are now available. No prior experience with the overlay format is needed to get started.

### Changes

- [x] Overlay schema reference in developer docs.
- [x] Three example overlay files: "Hide structural predicates", "Rename internal IDs", "Add descriptions for sparse graphs".
- [x] User-facing docs updated: predicate roles, data quality indicators, provenance, overlay configuration.

---

## v1.0.0 — Stable Release

First fully documented, publicly stable release. All annotation features from v0.1–v0.11 are complete, tested across bare SPARQL / SKOS-rich / SHACL-validated / pg-ripple profiles, and documented for end users and developers.

> **What you'll notice**: Moire is ready for broad use. Every part of the interface has been tested against a range of real knowledge graphs, from bare-bones endpoints to richly annotated ones. The documentation covers everything from first connection to advanced customization.

---

## Risk Mitigations

| Risk | Mitigation |
|---|---|
| Metadata queries become expensive | v0.4 uses one batched query; v0.6–v0.8 load on demand and cache aggressively |
| Overlay misuse obscures data | Raw IRIs always accessible via technical view; overlay-sourced annotations marked internally |
| Language handling complexity | Centralize label selection logic; add language preference to settings |
| Too much UI noise | Progressive disclosure: best label + one hint visible; details in tooltips and panels |
| Performance degradation | Measure each release's impact; skip annotation queries on unresponsive endpoints |

---

## Version Summary

| Version | Theme | Key deliverable |
|---|---|---|
| v0.1.0 | Predicate Foundation | Vocabulary registry, roles, cardinality, usefulness ordering |
| v0.2.0 | Navigation Clarity | Traversal breadcrumbs, annotated tooltips |
| v0.2.1 | Test Coverage | Vitest unit tests for `src/lib/` (sparql, facet-generator, context-header, vocabulary-registry) |
| v0.2.2 | Test Coverage | Unit tests for `src/stores/` (navigation-store, endpoint-store) |
| v0.2.3 | Test Coverage | E2E reliability fixes (matchers, data-testid, assertions, annotations) |
| v0.2.4 | Test Coverage | Integration tests via mock SPARQL server |
| v0.3.0 | Navigation Clarity | Natural context headers with inverse labels |
| v0.4.0 | Metadata Harvest | Batched predicate metadata query (RDFS, SKOS, OWL) |
| v0.5.0 | Metadata Harvest | Richer relationship browser rows, explanatory empty states |
| v0.6.0 | Rich Annotations | Entity detail: type hierarchy, aliases, temporal, provenance, media |
| v0.7.0 | Rich Annotations | SHACL data quality warnings on cards and entity detail |
| v0.8.0 | Rich Annotations | VoID dataset metadata on graph browser cards |
| v0.9.0 | Rich Annotations | pg-ripple: full-text search, semantic similarity |
| v0.10.0 | Local Overlays | Overlay schema, loader, technical view toggle |
| v0.11.0 | Local Overlays | Overlay documentation and example templates |
| v1.0.0 | Stable Release | Fully documented, tested across all endpoint profiles |
