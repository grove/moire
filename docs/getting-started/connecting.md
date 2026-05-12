# Connecting to a Knowledge Graph

## What is an endpoint?

Before you can explore anything, Moire needs to know where your data lives. The address of a knowledge graph database is called an *endpoint* — a URL that Moire uses to send questions to the database and receive answers back. You can think of it exactly like a website address: it tells your browser where to go, and it tells Moire where to ask. A typical endpoint looks something like `http://localhost:3030/ds/sparql` for a database running on your own computer, or `https://myorg-kg.example.com/sparql` for one running on a server.

You can register as many endpoints as you like. Moire keeps track of each one separately and remembers your settings.

---

## Adding your first endpoint

When you open Moire for the first time, you will see the Graphs Browser with a prompt to add an endpoint. Click **+ Add Endpoint** in the top area of the screen. A form appears asking for:

**Endpoint URL** *(required)*
The SPARQL query URL for the database. This is the only required field. If you are working with the demo dataset described in this documentation, the URL will be whatever address your local pg-ripple or Fuseki instance is running on.

**Label** *(optional)*
A short, friendly name you choose for this endpoint — something like "Research Graph" or "My Fuseki". This is only for your own reference; it does not affect anything in the database.

**Authentication** *(optional)*
If your database requires a username and password (Basic auth) or a token (Bearer auth), enter those here. Your credentials are stored securely on the server and are never sent to your browser — Moire acts as a proxy, so your password stays private.

**Default graph** *(optional)*
Some databases contain multiple named graphs. If you want Moire to start in a specific one rather than showing you all of them, you can enter the graph's IRI here. You can change this at any time.

Click **Save**. Moire immediately begins connecting.

---

## What happens automatically: introspection

The moment you save a new endpoint, Moire runs a process called *introspection*. This is Moire learning the shape of the data — reading the database's structure so it can build the right navigation for it.

During introspection, Moire asks the database a sequence of questions: What named graphs are there? What types of entities exist in each graph? Which relationships appear most frequently? What do labels look like? What is the class hierarchy? None of this requires any action from you — it runs in the background and takes a few seconds. When it finishes, the Graphs Browser fills in with a card for each named graph, showing the number of triples it contains, the entity types found inside it, and the most common relationships.

!!! note "What is introspection?"
    Introspection is the automatic process by which Moire reads the structure of a knowledge graph when you first connect to it. Think of it as Moire asking the database: "What kinds of things do you contain, and how are they connected?" The answers power the Types Browser, the facet sidebar, and the Relationships Browser — all of the navigation that makes Moire useful. Introspection runs silently; you just wait a moment and the interface fills in. You can re-trigger it manually at any time using the **↺ Refresh** button on the Graphs Browser if the underlying data has changed.

---

## After connecting: the Graphs Browser

Once introspection completes, you will see the Graphs Browser — the starting point for all exploration in Moire. Each card represents one named graph in the connected database. The card shows the graph's IRI (its unique identifier), the total number of triples in the graph, and a summary of the most common entity types with their counts.

If your database has only one named graph, you will see a single card. Click **Browse this graph →** to enter that graph and start exploring. If there are multiple graphs, browse the list and choose the one that looks most relevant to what you want to explore. You can always switch between graphs later.

---

## Troubleshooting

**The endpoint URL is not responding.**
Double-check the URL for typos, and make sure the database is running. If it is a remote database, check that your network can reach it. Moire shows an error message if the connection times out.

**Authentication failed.**
Check that the username, password, or token you entered is correct. Note that credentials are case-sensitive. If you are using Basic auth, the username and password go in the appropriate fields — do not combine them in the URL.

**The Graphs Browser is empty after connecting.**
This can mean the database is empty, or that introspection encountered an unexpected response format. Try clicking **↺ Re-run introspection** on the Graphs Browser. If the graph truly has no data, a message will say so clearly.

**I see the graph card but triple count is zero.**
Some databases use a default graph that is not listed as a named graph. Moire will detect this and show the default graph with its triple count. If the count is genuinely zero, the database may be empty.
