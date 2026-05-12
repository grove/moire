# Database Types and Compatibility

Moire works with any SPARQL 1.1-compliant triplestore — the open standard that all modern knowledge graph databases support. This page explains what that means, which databases have been tested, and what specific behaviours to expect from each.

---

## The SPARQL 1.1 standard

SPARQL (pronounced "sparkle") is the query language for knowledge graphs, analogous to SQL for relational databases. SPARQL 1.1 is the current standard, published by the W3C in 2013. Any database that supports it will work with Moire. Moire generates SPARQL queries automatically — you never write queries directly, but knowing the underlying technology helps when troubleshooting connectivity.

When you connect Moire to an endpoint, it runs a series of introspection queries. These queries ask: what named graphs are available? What entity types exist? What are the relationships used? What label predicates does this graph use? The database must respond correctly to these queries for Moire to function.

---

## Supported databases

The following triplestores have been tested with Moire:

### Apache Jena Fuseki

Fuseki is the most commonly used open-source triplestore. It is the primary development target for Moire and the database used in all screenshots and examples in this documentation. Running Fuseki locally (port 3030 by default) is the recommended starting point.

- Endpoint URL format: `http://localhost:3030/[dataset-name]/sparql`
- Named graphs: fully supported
- Authentication: optional HTTP Basic Auth

### Oxigraph

A modern, lightweight triplestore written in Rust. Excellent performance on moderate-sized datasets. Well-suited for development and testing.

- Endpoint URL format: `http://localhost:7878/query`
- Named graphs: supported

### Stardog

A commercial enterprise triplestore with advanced inference capabilities and full-text search. Moire connects via its standard SPARQL endpoint.

- Endpoint URL format: `https://[server]/[database]/query`
- Named graphs: supported
- Authentication: requires HTTP Basic Auth (enter credentials in the Endpoint Manager)

### Virtuoso

OpenLink Virtuoso is a high-performance database used by DBpedia, Wikidata, and many large public knowledge graphs.

- Endpoint URL format: `http://[server]:8890/sparql`
- Named graphs: supported; Virtuoso uses a *default graph* scheme that may require specifying a graph IRI explicitly

### Blazegraph

Used historically by Wikidata. No longer actively maintained but still widely deployed.

- Endpoint URL format: `http://[server]:9999/blazegraph/sparql`
- Named graphs: supported

---

## pg-ripple

pg-ripple is a knowledge graph database developed by Trickle Labs that serves as Moire's primary development target. When Moire detects a pg-ripple endpoint, it automatically activates enhanced features that are not available on standard SPARQL endpoints. See [Enhanced features with pg-ripple](pg-ripple-features.md) for details.

---

## Authentication

If your endpoint requires authentication, enter the credentials in the Endpoint Manager when adding the endpoint. Moire supports HTTP Basic Auth. Credentials are stored in browser local storage and are not sent to any server other than the endpoint you specify.

!!! warning "Public endpoints"
    Some public knowledge graph endpoints (DBpedia, Wikidata) impose strict rate limits and may return errors if queried too frequently. Moire's introspection makes several queries on connect and more with each navigation step. Use public endpoints with awareness of their terms of service.

---

## Named graphs and the default graph

Most triplestores have a *default graph* containing triples not explicitly assigned to a named graph, and one or more *named graphs* for specific datasets. Moire shows named graphs in the Graphs Browser. If your data is in the default graph only, you may need to load it into a named graph first, or configure your triplestore to expose it as one.

---

## Troubleshooting connectivity

If Moire cannot connect or returns "Introspection returned no results":

1. Confirm the endpoint URL is correct by opening it in a browser — it should return a SPARQL endpoint welcome page or prompt you for a query.
2. Check for CORS restrictions. If the database and Moire are on different origins, the database must allow cross-origin requests. Fuseki and Oxigraph allow this by default; enterprise triplestores may require configuration.
3. Verify that your named graphs contain typed, labelled resources (entities with `rdf:type` and `rdfs:label` triples). Moire's introspection depends on these.
