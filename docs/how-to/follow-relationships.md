# Follow Relationships Across a Set

Set-to-set traversal is what makes Moire different from ordinary browsing. This guide explains how to use it via both the Jump via strip and the full Relationships Browser.

---

## The Jump via strip

At the bottom of the entity cards area in any Set view, the **Jump via** strip shows three to five buttons, each labelled with a relationship name and a target count in parentheses. These are the most useful outgoing relationships available on the current set — chosen because they are IRI-valued (connecting to other entities, not just text), have broad coverage across the set, and lead somewhere meaningful.

Example, from the researcher set:

```
Jump via:  [affiliatedWith (→ 3)]  [locatedIn (→ 3)]  [worksOn (→ 2)]
```

Click any of these buttons to traverse. The entire current set — all entities matching your active filters — follows that relationship simultaneously. The result is a new set containing the union of everything they connect to via that relationship.

The new set replaces the current set in the main area. The context header updates to describe the traversal. The Back button will take you back to the source set.

---

## The Relationships Browser

When you want to see *all* available relationships, not just the top three, click **Browse relationships →** from any Set view. The Relationships Browser opens and shows a complete table, divided into two sections.

### Outgoing relationships

These go from entities in the current set to other entities. Each row shows:

- **Relationship name** — the human-readable label
- **Subjects** — how many entities in the current set have this relationship
- **Targets** — how many distinct entities they connect to
- **Follow as set →** — traverse the whole set via this relationship
- **Add as facet** — add this relationship to the sidebar as a filter dimension (available only for relationships with manageable cardinality)

### Incoming relationships

These go from *other* entities to entities in the current set — someone or something else is pointing to the current group. Each row shows:

- **Relationship name**
- **Sources** — how many distinct entities point to members of the current set via this relationship
- **Follow incoming as set →** — traverse in the incoming direction to see what points at the current group

For example: if you are looking at universities and *affiliatedWith (incoming)* shows "6 researchers → this set", clicking *Follow incoming as set →* gives you the set of researchers who are affiliated with one of the current universities.

---

## Choosing what to traverse

The coverage stats in the Relationships Browser help you decide:

- **High subject coverage + moderate target diversity** = usually the most revealing traversal. "6 subjects → 3 targets" means every entity in the set participates and the result is a focused new group.
- **Low subject coverage** = only some entities in the set have this relationship. The result set may be smaller and less representative of the whole.
- **Very high target diversity** = the result may be large and diverse — which can be interesting for discovery but harder to make sense of.
- **Literal-valued relationships** (showing *Add as facet* rather than *Follow as set →*) are better used as filters; they connect to text strings, not to navigable entities.

---

## After traversal

After clicking *Follow as set →*, you arrive at the new set. The context header adds a phrase describing the traversal: if you were browsing "Researchers" and followed *affiliatedWith*, the header becomes "Affiliations of Researchers". 

From the new set, you can:
- Apply facet filters to narrow it further
- Traverse again via the Jump via strip or Relationships Browser
- Click a card to enter Entity context
- Press Back to return to the source set with all your original filters intact

---

## Follow as set vs Add as facet

These two actions do fundamentally different things:

| Action | What it does | When to use |
|---|---|---|
| **Follow as set →** | Navigates to a new set of the connected entities themselves | When you want to *visit* the targets — read their details, filter them, traverse from them |
| **Add as facet** | Adds the relationship as a new filter dimension in the current set's sidebar | When you want to *filter by* the relationship while staying with the current entities |

Example: from the researcher set, *locatedIn* appears in the Jump via strip. If you *Follow as set*, you leave the researchers and arrive at the cities. If you *Add as facet* (using the Relationships Browser), you stay with the researchers but can now filter them by which city they are located in. Both are useful — the choice depends on whether you want to visit the cities or use city as a filter on the researchers.
