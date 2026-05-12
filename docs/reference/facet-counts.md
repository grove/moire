# Understanding Facet Counts

Every value in the facet sidebar shows a count. This page explains exactly what that count means, how it changes, and how to read it when exploring.

---

## What the count represents

The number shown next to a facet value is the count of entities in the **current set** that have that value. It is not a count of all entities in the graph that have that value — it is scoped to exactly the entities currently displayed.

Example: you are browsing the full set of Researchers (6 entities). The Nationality facet shows:

```
Nationality
  SE  2
  NO  2
  FR  1
  PL  1
```

This means: 2 of the 6 researchers have Nationality = SE, 2 have NO, and so on. The counts add up to 6 because every researcher has exactly one Nationality value in this dataset. If the counts did not add up to the set size, it would mean some entities have multiple values for that dimension (common in real knowledge graphs) or some entities have no value for it at all.

---

## How counts update when filters are applied

When you activate a filter, the counts in **other facet groups** update immediately to reflect the narrowed set. The counts in the **active facet group** do not change — they continue to show the counts from the unfiltered set within that group, so you can see the relative size of each value before deciding which to add.

Example: you click Nationality = SE. The set narrows to 2 researchers. The Type facet updates to show counts scoped to those 2 researchers. The Nationality facet still shows all four original values and their original counts — so you can see that OR-ing SE+NO would give 4 entities.

---

## Why some counts are 0 (greyed out)

A value with count 0 — shown greyed out and unclickable — would produce an empty result if clicked. Moire shows it rather than hiding it so you can see that the dimension exists but is currently not applicable given the active filters.

If a value was previously clickable and then becomes greyed out after you apply another filter, it means the two conditions are mutually exclusive within the current set. No entity in the set has both values simultaneously. Removing the conflicting filter will restore the value to its clickable state.

The greyed-out state is dynamic. It reflects the *current possible actions* given your active filters — not an abstract list of all values that exist in the graph.

---

## Very large counts

If an entity in the set has many values for a single dimension — for example, an entity with 12 tags — the count for those tag values may add up to more than the set size. This is expected: one entity can contribute to multiple count buckets. Moire shows the count of entities that have that value, not the count of distinct value-entity pairs.

---

## When counts are exact vs approximate

For most endpoints, facet counts are exact — computed by SPARQL queries against the live database. For very large graphs or endpoints with query timeout limits, Moire may show approximate counts or cap the display at the most frequent values. If the count shows "100+" it means the actual count is at least 100 but the exact figure was not retrieved.

---

## Using counts to decide

Facet counts are decision aids. Before clicking a value:

| Count | Interpretation | Action |
|---|---|---|
| Close to set size | Near-universal — filtering by it will barely narrow the set | Consider skipping |
| Moderate (25–75% of set) | Meaningfully divides the set | Good candidate for filtering |
| Small (1–3) | Picks out a specific subset | Use when drilling into a specific case |
| 0 (greyed out) | Incompatible with current filters | No action available |
