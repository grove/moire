# Filter with Facets

The facet sidebar is Moire's primary tool for narrowing and shaping a set. This guide explains how filtering works, what the live counts mean, and how to recover when your filters produce nothing.

---

## How to apply a filter

In any Set view, the facet sidebar appears on the left. Each group in the sidebar corresponds to one relationship or attribute shared by the entities in the current set — for example, *Type*, *Nationality*, *Gender*, or *Location*. Each value in a group shows a count and a checkbox.

Click any value to activate it as a filter. The entity cards update immediately: only cards matching the filter remain visible. The counts in other facet groups update to reflect the narrowed set.

---

## Adding multiple filters

**Within a facet group:** Clicking a second value in the same group *adds* it to the filter — the logic is OR. If you click *SE* and then *NO* in the Nationality group, the set shows Swedish OR Norwegian researchers. The count next to each value tells you how many entities in the *current set* have that value, helping you decide whether combining values makes sense.

**Across facet groups:** Clicking values in *different* facet groups narrows the set — the logic is AND. Nationality = SE *and* Type = Professor shows only Swedish Professors. Every active filter from a different group is another condition the entity must satisfy to remain in the set.

This combination — OR within a group, AND across groups — is the standard behaviour for faceted filtering, and it mirrors how people naturally think: "show me researchers from Norway or Sweden (within nationality) who are also Professors (a separate condition)."

---

## Understanding greyed-out values

Some values in the facet sidebar appear greyed out and cannot be clicked. These are values that would produce an empty result given your current active filters. If you have Nationality = SE active and Gender = female is greyed out, it means: there are no entities in the current set that are both Swedish and female. Moire disables the value rather than letting you click into a dead end.

The greyed-out state is dynamic. Remove the Nationality filter and the Gender = female value becomes available again, because the restriction that was preventing it is gone. The facet sidebar reflects the *current possible actions* at all times — not an abstract list of all values that exist in the graph.

---

## Removing individual filters

There are three ways to remove a filter:

1. **Click an active value again** — clicking a checked value unchecks it, removing that specific value from the filter.
2. **Click the × chip** at the top of an active facet group — this removes all active values in that group in one click, while keeping other groups' filters active.
3. **Click Clear all filters** — removes all active filters simultaneously and returns the set to its unfiltered state.

None of these actions creates a new history entry. Filters are refinements of the current view, not new navigation destinations. The Back button will take you past all of your filter activity to the last navigation step — the last time you clicked an entity, traversed via a relationship, or entered via a type.

---

## The empty state

If your combination of filters produces zero results, Moire shows the empty state instead of an empty grid. The empty state tells you:

- How many entities *would* be in the set if you removed each active filter
- Which filter removal gives the most results

For example: *"0 SE female Professors. Remove 'female' → 2 results. Remove 'SE' → 1 result (Julia Lindström)."* Click either suggestion to apply that removal, or click *Clear all filters* to start fresh.

---

## Facets are dynamic

The facet sidebar is not a fixed list of dimensions — it is generated fresh from whatever is currently in the set. If you filter down to a narrow subgroup, the facets may change: dimensions that had only one value (and are therefore useless as filters) may disappear; new dimensions relevant only to the remaining entities may appear.

This dynamism means the facet sidebar always shows you the most useful filters for *this* particular set, not a generic list for the whole graph. If you are browsing only University entities, you will see facets relevant to universities (location, research groups affiliated, etc.) rather than the full set of facets that appeared when you were browsing all Researchers.
