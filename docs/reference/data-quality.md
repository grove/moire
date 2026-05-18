# Data Quality Indicators

Moire can display data quality signals when a knowledge graph publishes
validation rules using [SHACL](https://www.w3.org/TR/shacl/) (Shapes Constraint
Language). This page explains what the indicators mean, when they appear, and
what to do when you see one.

Data quality indicators only appear when the connected graph provides SHACL
shape data. On graphs without SHACL, this feature is silently absent.

---

## What is SHACL?

SHACL is a standard language for defining rules about what well-formed records
in an RDF graph should look like. A graph's administrators can use SHACL to
specify, for example:

- "Every `Researcher` record should have exactly one `foaf:name`."
- "Every `Project` record must link to at least one `fundedBy` value."
- "The `startDate` of a project must be a valid date."

When a record does not meet these rules, SHACL calls it a *constraint
violation*. Moire reads these violations and surfaces them quietly alongside the
record.

---

## Severity levels

SHACL defines three severity levels. Moire shows each with a distinct visual
indicator:

| Severity | Indicator | Meaning |
|---|---|---|
| **Info** | Blue badge | The record has a minor deviation from the expected shape. No action is required. |
| **Warning** | Amber badge | The record is missing something expected. This may indicate incomplete data. |
| **Violation** | Red badge | The record fails a hard constraint. The data may be invalid or corrupt. |

---

## Where indicators appear

### Entity cards

A small severity badge appears in the corner of an entity card when that entity
has at least one SHACL violation. The badge shows the highest severity across
all violations for that entity.

Hover over the badge to see a short summary of the most serious issue. Click the
entity to open entity detail for the full list.

### Entity detail

The **Data quality** panel in entity detail lists every SHACL violation found
for the focus entity. Each row shows:

- The affected predicate (the property that failed the constraint).
- The violation message in plain English (as written by the graph's
  administrators).
- The severity level.

The panel is collapsed by default. Click to expand it.

---

## Reading a violation message

Violation messages are written by the people who designed the knowledge graph.
They describe the rule that was broken in domain terms, not technical SHACL
language.

Examples of what you might see:

- *"Expected at least one publication date, but none was found."*
- *"Name is required."*
- *"Affiliated institution must be a known organisation."*

If a message is unclear, contact the administrator of the endpoint.

---

## pg-ripple graphs

On graphs connected through a
[pg-ripple endpoint](../advanced/pg-ripple-features.md), data quality results
are pre-computed and available immediately. On standard SPARQL endpoints, shape
queries run on demand and may take a moment on large graphs.

---

## What to do with violations

Data quality indicators are informational. You cannot edit records in Moire.
If you need to fix a violation, report it to the team responsible for
maintaining the knowledge graph.

For graphs you administer, you can also suppress misleading indicators using an
[annotation overlay](../how-to/configure-overlay.md) — for example, by hiding a
predicate that is producing spurious violations because the SHACL shape does not
match the actual data model.
