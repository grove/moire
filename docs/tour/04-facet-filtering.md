# Step 4 — Filtering with Facets

## Narrowing the set

The facet sidebar is how you sculpt the set into something more specific. Each filter group is a dimension you can use to include or exclude entities. Let us try a few combinations using the six researchers.

### Adding a first filter

Click **SE** in the Nationality facet group.

The set narrows immediately to **two researchers**: Julia Lindström and Anders Bergström — the two Swedes. The count next to **Professor** updates to 2; **PhDStudent** dims out entirely (greyed out), because there are no Swedish PhD students in this dataset. The context header updates to: **"SE Researchers"**.

Notice that Moire did not make you wait for the filter to load — the set updated as soon as you clicked. Also notice the greyed-out *PhDStudent* value: this is Moire being honest with you. It is saying "if you click PhDStudent right now, with Nationality = SE already active, you will get zero results." The greyed-out value is not disabled forever — remove the nationality filter and it becomes available again.

### Adding a second filter

With Nationality = SE still active, click **Professor** in the Type facet.

The set narrows further to exactly **two Swedish Professors**: Julia Lindström and Anders Bergström. Both filters are now active simultaneously — AND logic across facet groups. The context header now reads: **"SE Professors"**. (Moire promotes the type label — Professors — over the more generic Researcher when a type filter is active.)

### The empty state

Let us push the filters until they produce nothing. With *SE* and *Professor* active, click **female** in the Gender facet.

Moire shows an empty state: **"0 SE female Professors."** But it does not leave you stranded. The empty state page tells you exactly which filter is causing the problem and offers specific, one-click suggestions:

- "Remove 'female' → would show 2 results"
- "Remove 'SE' → would show 1 result (Julia Lindström)"

This is Moire's honesty principle in action. It never silently produces an empty result — it explains why the combination is impossible and shows you the fastest path back to something useful.

### Clearing filters

Click **Clear all filters**. All three active filters are removed simultaneously, and the full set of six researchers reappears. The context header returns to: **"Researchers"**.

You can also remove filters one at a time: click the **×** button next to any active filter chip to remove just that one, leaving the others in place.

---

## How filters combine

The logic behind facet filtering is intuitive once you see it in action:

- **Within a facet group** (e.g. ticking two nationalities), Moire uses OR — show entities that match *any* of these values. Tick both SE and NO, and you get the two Swedish researchers plus the one Norwegian researcher: three in total.
- **Across facet groups** (e.g. a nationality filter and a type filter active simultaneously), Moire uses AND — show entities that match *all* active groups. SE AND Professor gives you only the entities that are both Swedish and Professors.

This combination of OR-within and AND-across is the standard behaviour for faceted search, and it mirrors the way you naturally think about filtering: "Show me Norwegian or Swedish researchers (within nationality) who are Professors (separate condition)."

---

## The live counts

The count next to each facet value updates constantly as you add and remove filters. It always shows you how many entities in the *current set* have that value — not how many exist in the whole graph. This is important: the counts reflect the reality of your current exploration, not an abstract total. If you are looking at SE Professors and the count next to *Knowledge Graphs* is 1, that means one of the two Swedish Professors works in Knowledge Graphs — a meaningful, contextual number.

---

## What to do

Clear all filters to return to all six researchers. Then continue to [Step 5](05-set-traversal.md) to see what happens when you move the entire set through a relationship.
