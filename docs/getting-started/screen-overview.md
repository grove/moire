# The Screen at a Glance

Moire has one main screen that changes its content depending on what you are doing — but the structure of the screen stays the same throughout. Before you click anything, it helps to know the name of every part. This page is a map of the interface.

---

## The top bar

The top bar runs across the full width of the screen and is always visible. It contains three elements:

**Back and Forward controls** sit on the left. The left arrow (`←`) takes you to the previous view; the right arrow (`→`) takes you forward if you have gone back. These work exactly like a browser's back and forward buttons — Moire keeps a full history of every view you have visited, including the filters you had active. Nothing is lost when you go back.

**The context header** sits in the centre-left area, just below the top bar on most views. This is a short prose sentence — generated automatically — that describes exactly what you are looking at and how you arrived there. Examples: *"Researchers"*, *"SE Professors"*, *"Locations of Researchers"*, *"Erik Rogstad"*. If you ever feel lost, read this sentence.

**The search button** sits on the right of the top bar. Clicking it — or pressing `⌘K` on Mac / `Ctrl+K` on Windows and Linux — opens the search palette, where you can type any name to find an entity directly.

---

## The facet sidebar

On the left side of the screen (in Set and Entity contexts), the facet sidebar shows groups of filters. Each group corresponds to one relationship or attribute shared by entities in the current set — for example, *Type*, *Nationality*, or *Location*. Each value in a group shows a count: how many entities in the current set have that value. Click a value to filter the set down to only those entities. Click it again to remove the filter.

Moire generates the facet sidebar automatically from the structure of the data. You do not configure it manually — it reflects whatever properties are actually present on the entities you are currently browsing.

---

## The entity cards area

The large central area of the screen shows the entity cards — one card per item in the current set. Cards adjust their level of detail depending on context: a card for an entity you have directly selected shows its full information; cards for neighbouring entities show a briefer summary; cards further away show just a headline and type badge.

Every card is clickable. Clicking a card navigates to that entity's detail view.

---

## The Jump via strip

At the bottom of the entity cards area (in Set context), you will see the **Jump via** strip — a row of buttons, each labelled with a relationship name and a count. For example: *affiliatedWith (6→)*, *locatedIn (3→)*. Clicking one of these buttons takes the entire current set and follows that relationship, producing a new set of connected entities. This is the fastest way to traverse the graph without opening the full Relationships Browser.

---

## The Browse links

Just below the facet sidebar, two text links appear in Set and Entity contexts:

- **Browse relationships →** opens the Relationships Browser, which shows every relationship available on the current set — both outgoing (from these entities to others) and incoming (from other entities to these). From there you can follow any relationship as a set, or add it as a new filter.
- **Browse types →** returns to the Types Browser for the current graph, so you can re-enter from a different class.

---

## The layer selector

In Entity context only (when you have clicked on a single entity), a layer selector appears in the lower area of the screen: `[−2] [−1] [● Focus] [+1] [+2]`. This lets you look at the neighbourhood of the focused entity at different distances. Layer 0 is the entity itself in full detail. Layer +1 shows its direct connections. Layer −1 shows entities that point *to* it. The layer selector is hidden in Set context — it is replaced by the Jump via strip, which is more appropriate when there is no single focal point.

---

## Summary

| Element | Location | Purpose |
|---|---|---|
| Back / Forward | Top bar, left | Navigate through history |
| Context header | Below top bar | Plain-language description of current view |
| Search button | Top bar, right | Open the ⌘K search palette |
| Facet sidebar | Left panel | Filter the current entity set |
| Entity cards | Central area | Browse and click entities |
| Jump via strip | Below cards | One-click set traversal via a relationship |
| Browse relationships | Below sidebar | Open the full Relationships Browser |
| Browse types | Below sidebar | Return to the Types Browser |
| Layer selector | Below cards (entity context only) | Explore entity neighbourhood at different depths |
