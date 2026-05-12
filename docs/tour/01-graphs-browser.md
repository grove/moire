# Step 1 — The Graphs Browser

## What you will see

After connecting your endpoint and waiting a few seconds for introspection to complete, Moire shows you the **Graphs Browser** — your starting point for all exploration. The Graphs Browser is essentially a lobby: it gives you an overview of every named graph in the connected database and lets you choose which one to enter.

For the research dataset, you will see a single card labelled with the graph's identifier — `http://example.org/research`. The card shows:

- The total number of triples in the graph (the raw count of individual facts stored)
- The top entity types with their instance counts — for example, *Researcher: 6*, *University: 3*, *Paper: 4*
- A **Browse this graph →** button

The endpoint URL and a **↺ Refresh** button appear at the top of the page. Refresh triggers a fresh introspection if the underlying data has changed since you last connected.

---

## What to notice

Even before you click anything, the graph card tells you something useful: you can see at a glance what *kinds* of things live in this dataset. The research graph contains researchers, universities, places, topics, projects, and papers. That summary is built entirely from the data — Moire did not need to be told what to expect. It discovered the structure itself during introspection.

If you were connected to a database with many named graphs — a large institutional knowledge base with separate graphs for people, publications, and projects, for instance — you would see one card per graph here, each with its own type summary. You can switch between graphs at any time from this screen.

---

## What to do

Click **Browse this graph →** on the research graph card.

Moire transitions to the [Types Browser](02-types-browser.md), which shows you the full class hierarchy of the graph you have just entered.

!!! tip "Multiple graphs"
    If you see more than one graph card, spend a moment reading the type summaries on each before clicking in. The summary gives you a useful preview of what you will find inside — you can save yourself a trip back by choosing the right graph first.
