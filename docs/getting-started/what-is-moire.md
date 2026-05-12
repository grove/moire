# What is Moire?

## The problem it solves

Imagine you have access to a vast collection of structured information — thousands of researchers, their publications, the universities they belong to, the topics they work on, the cities they live in, and the projects they collaborate on. All of it is connected: a researcher belongs to a university; a university is located in a city; a project covers a topic; a paper cites another paper. The connections are what make the data valuable. But how do you explore them?

A standard search box gives you one answer at a time: you search for "Erik Rogstad", you get Erik Rogstad. That is useful, but it does not help you discover patterns. What if you want to know which cities host the most researchers in a particular field? Which topics appear most often in papers with high citation counts? Which universities have researchers who collaborate with each other? Answering those questions with a search box means dozens of individual lookups and a lot of mental arithmetic.

At the other extreme, a database query tool lets you write precise questions in a formal query language and get exact answers. Powerful — but only if you already know the structure of the data and are comfortable writing queries. For most people, most of the time, that is not a realistic option.

Moire sits in between. It is a *navigable* interface for structured knowledge: you can explore freely, follow connections, zoom into individual items, pull back to see the group, and change direction whenever something interesting catches your eye — all without writing a single query.

---

## The newspaper analogy

A well-designed newspaper is a useful model for how Moire works. When you pick up a newspaper, you do not read it from the first word to the last. You scan the front page for headlines that catch your interest (*Types Browser* — an overview of categories). You turn to the section that seems most relevant — Science, or Culture, or Business — and see the full list of stories in that section (*Set view* — all the items in a chosen category). You read a story that grabs you (*Entity detail* — full information about one item). That story mentions a related piece from last week, and you follow the link (*Resource-to-resource navigation* — jumping from one item to a connected one). At any point you can fold the paper, go back to the front page, and start a different thread.

Moire works the same way. The knowledge graph is the content; Moire is the interface that makes it navigable. You start broad, zoom in, follow connections, and backtrack — at whatever pace and in whatever direction makes sense for what you are trying to understand.

---

## What Moire works with

Moire connects to *knowledge graphs* — databases where information is stored as a web of named things and named connections between them. The technical standard underlying this kind of database is called RDF (Resource Description Framework), and Moire can connect to any database that supports it. In practice, this includes:

- **Research data** — researchers, papers, topics, institutions, and grants
- **Cultural heritage** — artworks, artists, collections, places, and periods
- **Organisational knowledge** — people, teams, projects, products, and processes
- **Linked open data** — public datasets from governments, libraries, and scientific institutions
- **Bibliographic databases** — books, authors, publishers, and subjects

The [UI Tour](../tour/index.md) uses a small research dataset — six academics at three Scandinavian universities — as a consistent example throughout. It is specific enough to be concrete and small enough to understand at a glance.

---

## What Moire does not do

Moire is a navigation and exploration tool. It reads data; it does not write it. You cannot use Moire to add, edit, or delete information in a knowledge graph. It also does not require you to understand query languages, RDF syntax, or graph theory — those things happen behind the scenes. Your job is to explore.

---

## Who is it for?

Moire is designed for people who work *with* structured data but do not necessarily work *in* it. Researchers who want to understand the shape of a dataset before analysing it. Librarians who need to navigate a catalogue. Journalists exploring a public dataset for patterns. Analysts who want to ask "who is connected to whom, and through what?" without writing a query. If you have ever found yourself with access to a rich database and no easy way to explore it, Moire is for you.

!!! tip "You do not need to know what a 'triple' is"
    Knowledge graphs are built from small units called *triples* — a subject, a relationship, and an object. You will never see a triple in Moire. The interface translates all of that structure into readable names, browsable cards, and clickable links. The only technical term worth knowing upfront is *endpoint*, which just means the web address of the database you are connecting to. Everything else is explained as you go.
