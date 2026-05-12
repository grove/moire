# Step 5 — Following a Relationship Across the Set

## Moving a whole group

So far we have been filtering: keeping the same entities but showing more or fewer of them. Now we will do something different — we will move the *entire* set through a relationship to arrive at a completely new group of entities.

This is called **set-to-set traversal**, and it is one of the most powerful ideas in Moire. Instead of clicking on one researcher and following their affiliation individually, you tell Moire: "take all six researchers simultaneously, follow the *affiliatedWith* relationship for every one of them, and show me the union of everything they are affiliated with." The input is a set of people; the output is a set of institutions.

---

## Using the Jump via strip

Make sure you are looking at all six researchers with no filters active. At the bottom of the cards area you will see the **Jump via** strip — a row of small buttons:

- **affiliatedWith (→ 3)**
- **locatedIn (→ 3)**
- **worksOn (→ 2)**

The number in parentheses tells you how many distinct entities the current set connects to via that relationship. *affiliatedWith (→ 3)* means the six researchers collectively are affiliated with three distinct universities.

Click **locatedIn (→ 3)**.

---

## What just happened

The entity cards change entirely. You now see **three city cards**: Oslo, Uppsala, Stockholm. The facet sidebar has updated to reflect city properties rather than researcher properties. The context header reads: **"Locations of Researchers"**.

You have not lost the researchers — they are still in Moire's navigation history. But the *current set* is now the cities that those researchers are located in. You moved the group through a relationship and landed somewhere new.

This is the crucial difference between set-to-set traversal and clicking on a single entity:

- When you **click a researcher card**, you navigate to that one researcher. The result is one person in detail.
- When you **click locatedIn in the Jump via strip**, you navigate from all six researchers to all their locations simultaneously. The result is a new set — in this case, three cities.

---

## The Relationships Browser

The Jump via strip shows only the most traversal-useful relationships — the three or four with IRI-valued objects and the broadest coverage. To see the full picture of every relationship available on the current set, click **Browse relationships →** from the researchers set (click Back first to return to the researchers, then click Browse relationships →).

The Relationships Browser opens and shows a table:

**Outgoing relationships** (from researchers to other entities):

| Relationship | Subjects | Targets | |
|---|---|---|---|
| affiliatedWith | 6 researchers | → 3 universities | **Follow as set →** |
| locatedIn | 6 researchers | → 3 cities | **Follow as set →** |
| worksOn | 2 researchers | → 2 projects | **Follow as set →** |
| leads | 3 researchers | → 3 groups | **Follow as set →** |
| coAuthorOf | 1 researcher | → 1 researcher | **Follow as set →** |
| knows | 1 researcher | → 1 researcher | **Follow as set →** |

**Literal-valued relationships** (values that work better as filters):

| Relationship | Subjects | Values | |
|---|---|---|---|
| nationality | 6 researchers | 5 distinct nationalities | **Add as facet** |
| gender | 6 researchers | 2 values | **Add as facet** |

The **Follow as set →** buttons are for IRI-valued relationships — those that connect to other entities you can navigate into. The **Add as facet** option is for literal values (text, numbers) that work better as filters than as navigation targets.

Click **Follow as set →** next to **affiliatedWith**. The set becomes the three universities: University of Oslo, Uppsala University, and KTH Royal Institute of Technology. Context header: **"Affiliations of Researchers"**.

!!! tip "Follow as set vs Add as facet"
    Use **Follow as set** when you want to *visit* the connected entities — to see them as cards, read their details, and navigate further from them. Use **Add as facet** when you want to *filter by* those values while staying with the current entities. Adding nationality as a facet keeps you with the researchers but lets you filter by national origin. Following affiliatedWith as a set takes you to the universities themselves.

---

## What to do

From the universities set, continue to [Step 6](06-chaining-traversals.md) to see what happens when you traverse again.
