# Resource and Predicate Annotations for Moire

Moire already does something unusually valuable: it turns a SPARQL endpoint into a browsable, text-first interface without asking the user to understand RDF, SPARQL, or an ontology before they begin. That is the right promise. The next major improvement is not to expose more of the graph's machinery, but to make the existing movement through the graph feel more legible, confident, and humane. Annotations are the layer that can do that.

In this report, an annotation is any piece of metadata, inference, statistic, shape, local override, or computed hint that helps Moire explain what a resource or predicate means, why it appears where it does, and where it can take the user next. Some annotations are already present in many RDF datasets through standards such as RDF Schema, OWL, SKOS, SHACL, PROV-O, and VoID. Others can be derived from Moire's own introspection counts. Others still can live in a local overlay file when a graph is private, under-documented, or full of opaque internal identifiers.

The goal is not to turn Moire into an ontology editor. The goal is to give the user better information scent while they browse. A relationship button should feel less like a raw edge in a graph and more like a well-labelled door. An entity card should tell the user enough about identity, type, provenance, and data richness that they can decide whether to open it. A facet should reveal its likely usefulness before the user spends a click expanding it. Empty states should explain what happened in the language of the current traversal, not only say that nothing was found.

This is also a navigability project. Knowledge graphs become hard to use when every step feels equally plausible and equally opaque. Good annotations let Moire rank, group, describe, and de-emphasize paths. They help the interface answer small but constant user questions: What kind of thing is this? What does this relationship mean? Is this value a label, a category, a source, or an identifier? Does this path usually lead somewhere? Is this missing because the data is sparse, because my filters are too narrow, or because the relationship is not used for this kind of entity?

## 1. The Current Annotation Layer

Moire already has the beginning of an annotation system. During graph introspection, the application discovers classes, predicates, labels, counts, value kinds, and graph summaries. The `PredicateSummary` model currently stores a predicate IRI, a display label, subject and object counts, a value kind, and booleans for whether the predicate is a good facet candidate, a navigation candidate, or structural plumbing. The `EntityNode` model currently stores an IRI, label, optional type, type label, and optional abstract. This is a compact and useful baseline.

The existing `annotatePredicates` logic in `facet-generator.ts` is especially important because it proves the product direction. It already treats some predicates as more useful for browsing than others. It marks structural predicates so they can be hidden or de-emphasized, recognizes IRI-valued predicates as possible navigation paths, and uses value-kind/count heuristics to decide which predicates should become facets. In other words, Moire already knows that not every triple should be treated equally in the UI.

The limitation is that the current layer is mostly statistical and syntactic. It can tell that a predicate has IRI values, but not whether those IRIs are people, places, works, organizations, or source documents. It can tell that a predicate is frequent, but not whether it is a label, a provenance link, a date, a classification, or a relationship worth traversing. It can derive a short label from an IRI, but it cannot yet use `rdfs:comment`, `skos:definition`, SHACL property names, inverse labels, or a local steward's explanation. The user gets a navigable graph, but the interface often has to whisper where it could speak plainly.

The opportunity is to build a layered annotation pipeline that starts with what Moire already knows, then enriches it when the graph provides standard metadata, and finally allows local overlays where the graph is silent. The experience should always degrade gracefully: a bare endpoint should still work, a well-described endpoint should feel beautifully self-explanatory, and a private enterprise graph should be rescuable with a small local annotation file.

## 2. What The Standards Contribute

The Semantic Web standards are useful here not because Moire needs to become more academic, but because they contain a practical vocabulary for exactly the problems a graph browser faces. RDF datasets often already carry labels, definitions, type hierarchies, provenance links, validation shapes, and dataset descriptions. Moire can read these as product cues.

### RDF Schema: Names, Descriptions, And Expected Shape

RDF Schema gives Moire the most basic human-facing layer: `rdfs:label` for readable names, `rdfs:comment` for descriptions, `rdfs:subClassOf` for type hierarchy, `rdfs:subPropertyOf` for predicate hierarchy, and `rdfs:seeAlso` or `rdfs:isDefinedBy` for links to more information. These are the lowest-friction annotations to harvest because they are common, simple, and directly useful in the UI.

The most tempting RDFS properties are `rdfs:domain` and `rdfs:range`, but they need careful handling. In RDF and OWL, domain and range are inference cues, not closed database constraints. If a predicate has domain `Person`, that does not mean the UI should say the predicate can only appear on people. It means the ontology describes subjects using that predicate as people, or lets a reasoner infer them as people. For Moire, the right product language is therefore suggestive: "usually describes people", "points to organizations", "documented for publications", or "expected value type: date". That language is accurate and helpful without pretending the graph is cleaner or more closed than it is.

For navigability, RDFS hierarchy is as important as labels. A user who opens a `Professor` should be able to see that it sits under `Researcher`, `Person`, and perhaps `Agent`. A predicate such as `doctoralAdvisor` may sit under a broader `advisor` relationship. These hierarchies help the interface group, collapse, and explain. They also let Moire say why an entity appears in a broader type view, which reduces the feeling that the graph has done something mysterious.

### OWL: Relationship Behavior And Inverses

OWL adds a richer description of relationships. The most immediately useful property for Moire is `owl:inverseOf`. Graph navigation is directional, but human language often depends on the direction from which the user arrived. If the graph stores `person affiliatedWith university`, then a set reached by traversing from people to universities should not be described as "affiliatedWith of SE Researchers". With an inverse label or a derived range label, Moire can say "Institutions for SE Researchers" or "Universities affiliated with SE Researchers". That small change makes the context header feel authored rather than assembled.

OWL property characteristics can also be valuable, especially in relationship browsers and predicate tables. A functional property is expected to have at most one value per subject, so it can be shown as a single-valued fact rather than a branching path. An inverse-functional property often behaves like a key. A symmetric property means the distinction between incoming and outgoing is less important. A transitive property signals that following the relationship may reveal chains, not just immediate neighbors. These are not decorations; they are behavioral hints about how a relationship can be used.

The same caveat applies here as with RDFS. OWL operates in an open-world setting. Missing data is not proof that something is false, and domain or range declarations are not the same as form validation rules. Moire should present OWL-derived annotations as hints about meaning and behavior, not as hard promises. That phrasing keeps the interface honest while still giving advanced users useful graph-theoretic information.

### SKOS: Human Vocabulary, Aliases, And Concept Navigation

SKOS is especially aligned with Moire because it was designed for knowledge organization systems: thesauri, taxonomies, subject headings, classification schemes, and controlled vocabularies. These are exactly the kinds of structures that make faceted browsing feel natural. SKOS gives Moire better names through `skos:prefLabel`, search aliases through `skos:altLabel`, hidden search terms through `skos:hiddenLabel`, and readable explanations through `skos:definition`, `skos:scopeNote`, and `skos:example`.

For resource cards and type badges, SKOS labels can be stronger than a generic `rdfs:label` because they carry the idea of a preferred display label in a language. Alternative labels are useful for search and command palettes. Hidden labels are useful for misspellings, legacy names, and local shorthand that should help retrieval without cluttering the UI. If Moire indexes these labels, users can search in the words they actually know while the interface still displays the clean preferred term.

SKOS also gives Moire relationship annotations that are naturally navigational. `skos:broader`, `skos:narrower`, and `skos:related` are user-facing semantic relations, not merely graph plumbing. They can power "broader topics", "narrower topics", and "related topics" sections in entity detail. SKOS mapping properties such as `skos:exactMatch`, `skos:closeMatch`, `skos:broadMatch`, and `skos:narrowMatch` can help Moire explain cross-vocabulary connections without overclaiming identity. In particular, SKOS is a good reminder not to use `owl:sameAs` casually in user language when the data really means "close enough for this vocabulary" rather than "identical in all contexts".

### SHACL: UI Hints And Data Quality Feedback

SHACL is often introduced as a validation language, but it is also a rich source of interface metadata. Shapes describe what properties are expected for a class of resource, what datatype or class a value should have, how many values are expected, which values are allowed, and which messages should be shown when data does not conform. That directly maps to Moire's entity detail view, predicate table, empty states, and data quality cues.

Several SHACL properties are not validation constraints at all; they are UI gifts. `sh:name` and `sh:description` can provide context-specific labels and explanations for a property. This matters because the same predicate can mean slightly different things in different shapes. A global property label may be too generic, while a SHACL property shape can say what it means in the context of `Person`, `Publication`, or `Organization`. `sh:order` can tell Moire how to sort properties in an entity detail view. `sh:group` can cluster related properties. `sh:defaultValue` can later matter if Moire grows editing or curation flows.

Validation results are also valuable for browsing, not only for data stewardship. A SHACL report can identify the focus node, result path, offending value, severity, and message. Moire can turn that into a quiet but powerful data quality panel: warnings on entity cards, highlighted predicates in entity detail, and empty state explanations that distinguish "there are no results" from "records of this type are missing expected values". The tone should be careful: this is not a moral judgment about a resource, just a signal about how well it matches known shapes.

### PROV-O: Where A Resource Came From

Provenance is one of the fastest ways to turn a resource from a bare record into a trustworthy object of inquiry. PROV-O describes entities, activities, and agents, with properties such as `prov:wasGeneratedBy`, `prov:wasDerivedFrom`, `prov:wasAttributedTo`, `prov:used`, `prov:hadPrimarySource`, `prov:wasQuotedFrom`, and `prov:wasRevisionOf`. Dublin Core and schema.org source properties often play a similar practical role.

For Moire, provenance annotations should answer small, concrete questions: Where did this fact or entity come from? Who or what produced it? Is it a revision of another record? Is there a primary source? Was it quoted from somewhere? The entity detail header can surface one best source link, while a provenance section can show the fuller chain when available. This makes Moire a better research surface because users can move from graph exploration to verification without digging through every predicate.

PROV-O also supports navigability. A source document, generating activity, publisher, collector, or attributed agent can itself be a resource worth opening. Provenance paths are often useful routes through a graph: from a claim to its source, from a dataset item to its import activity, from an article to its publication venue, from a record to its revision history. These paths should be visible, but not mixed indiscriminately with domain relationships. A user browsing people and institutions should be able to tell the difference between "works at" and "was imported from".

### VoID: The Map Around The Graph

VoID describes RDF datasets rather than individual facts. It can tell Moire what dataset it is looking at, what vocabularies are used, how many triples/classes/properties/entities exist, what property and class partitions are available, what example resources or root resources are recommended, and whether the graph represents links between datasets. This is the kind of metadata that can make the initial screen and graph overview feel less blank.

Moire's current introspection already computes some VoID-like facts: graph names, counts, classes, predicates, and sample graph information. If a dataset publishes actual VoID metadata, Moire can use it to improve orientation. A graph card can show a dataset title and description rather than only a graph IRI. A screen overview can name the vocabularies in play. A "start here" section can use `void:rootResource` or `void:exampleResource`. Property partitions can confirm or augment Moire's predicate counts. Linkset descriptions can help the user understand when a graph is mainly a bridge between datasets.

VoID is especially useful for empty and first-run states. Instead of beginning with a generic list of graphs, Moire can say, in effect: this dataset is about these classes, uses these vocabularies, has these common relationships, and offers these example entry points. That does not require extra user configuration when the metadata is present, and it gracefully falls back to Moire's own introspection when it is not.

## 3. Annotation Sources And Precedence

A durable annotation system should treat annotation data as layered. Different sources have different strengths. Observed statistics are always available after introspection, but they explain usage rather than intended meaning. RDF/OWL/SKOS metadata can explain intended meaning, but it may be incomplete or overly abstract. SHACL can be more context-specific, but it may only exist for curated graphs. Local overlays can be precise for one deployment, but they should not pretend to be facts from the graph.

The proposed precedence for display labels and descriptions is:

1. Local overlay labels and descriptions supplied by the endpoint owner.
2. SHACL property shape labels and descriptions when the UI is rendering a predicate in the context of a known class or entity type.
3. SKOS preferred labels and definitions.
4. RDFS labels and comments.
5. Known vocabulary registry labels for common predicates.
6. Derived short IRI labels.

This order makes the interface feel right in practice. A local steward's label should win because it reflects the deployment and the audience. A SHACL label should win inside a specific entity view because it may be more precise than the global predicate label. SKOS and RDFS should win over string-splitting because they are authored metadata. A vocabulary registry should be a helpful fallback for common terms. The short IRI should remain the final fallback because Moire must never require metadata to function.

Moire should also keep annotation provenance internally. The UI does not need to display this everywhere, but the system should know whether a description came from an overlay, SHACL, SKOS, RDFS, a registry, or a heuristic. That lets tooltips say "from local overlay" or "from ontology" in advanced contexts, and it helps developers debug why a label appeared. It also protects against accidentally treating a computed hint as a declared semantic fact.

## 4. Predicate Annotations: Turning Edges Into Decisions

Predicates are the verbs of the graph. They are also the points where users make most navigation decisions. When a user sees a predicate in the Relationships Browser, Jump strip, Facet Panel, or entity detail view, they are asking whether it is worth following, filtering, trusting, or ignoring. Predicate annotations should help answer that question quickly.

### 4.1 Human Labels And Descriptions

The first predicate annotation is simply a good name. Moire should prefer labels from overlays, SHACL, SKOS, RDFS, and known vocabularies before falling back to a derived short IRI. This affects every part of the UI because predicate labels appear everywhere: relationship rows, facet headers, context headers, entity detail tables, jump buttons, breadcrumbs, and empty states.

Descriptions should be short, contextual, and progressive. A tooltip can show a one- or two-sentence description from `skos:definition`, `skos:scopeNote`, `rdfs:comment`, `dcterms:description`, `schema:description`, or an overlay. Longer documentation can live behind a small "defined by" link when `rdfs:isDefinedBy` or `rdfs:seeAlso` is available. The UI should avoid forcing these descriptions into the main browsing surface. Their value is that they are nearby when the user hesitates.

For example, a predicate derived as `affiliatedWith` is serviceable, but "Affiliated with" plus a tooltip saying "Connects a researcher to the institution where they hold an appointment" is much better. In a relationship browser, that description helps the user choose the path. In an empty state, it helps explain why a traversal did not produce results. In a context header, it helps generate a phrase that sounds like the product understands the graph.

### 4.2 Domain And Range Hints

Domain and range annotations let Moire explain the expected shape of a relationship. If the domain is `Person` and the range is `Organization`, the relationship row can show "Person -> Organization" or, more softly, "usually connects people to organizations". If the range is a literal datatype, the UI can describe the value as date, number, language-tagged text, or identifier. This improves both comprehension and ranking: a user is more likely to follow a relationship when they know what kind of entity it leads to.

These hints should be phrased with open-world humility. The interface should not say "only people have this property" unless that fact comes from a closed SHACL shape. RDFS/OWL domain and range are better expressed as "documented subject type" and "documented value type". SHACL can provide stricter language because a shape may explicitly require a class, datatype, node kind, or count in a validation context.

Domain/range hints also improve navigation buttons. A Jump strip button labelled only "publisher" is less informative than one that says "Publishers" with a tooltip "Publication -> Organization". In set traversal, Moire can preview "Follow publisher to 18 organizations" rather than only "publisher". This is a small copy change with a large orientation payoff.

### 4.3 Inverse Labels And Directional Language

Graph direction and human direction are not the same thing. A predicate stored as `memberOf` may need to be displayed as "Members" when viewed from the organization side. A predicate stored as `hasPart` may need "Part of" in one direction and "Parts" in the other. Without inverse labels, context headers and breadcrumbs often become grammatical compromises.

Moire should look for inverse metadata through `owl:inverseOf`, local overlays, vocabulary registry entries, and simple known-pair rules. If an inverse IRI has its own label, Moire can use it when rendering incoming relationships. If no explicit inverse exists, Moire can still derive a softer phrase from range/domain labels: "Organizations connected by affiliation" is better than a raw predicate name. The fallback should remain the current behavior so no graph breaks.

Directional language matters most in the context header, traversal breadcrumbs, and relationship browser. These are the places where the user builds a mental sentence about where they are. "Cities containing universities affiliated with SE Researchers" gives the user a coherent route. "locatedIn of affiliatedWith of SE Researchers" exposes the machinery and asks the user to translate.

### 4.4 Predicate Role Classification

Predicates should be grouped by what they do for the user, not only by whether their values are IRIs or literals. A predicate role is a compact product annotation that helps Moire group, rank, style, and explain relationships. It can be computed from known vocabularies, value kind, counts, structural lists, predicate names, SHACL shape information, and overlays.

Useful roles include:

| Role | What it means | UI treatment |
|---|---|---|
| `labelling` | Names, titles, preferred labels, aliases | Used for display and search; hidden from traversal by default |
| `descriptive` | Abstracts, comments, notes, descriptions | Hoisted into summaries; rarely a facet |
| `classifying` | Type, category, concept, status, scheme membership | Strong facet and grouping candidate |
| `relational` | Links between domain entities | Strong navigation candidate |
| `temporal` | Dates, periods, events, revisions | Timeline and sorting candidate |
| `numeric` | Amounts, scores, measures, ranks | Range facet and sorting candidate |
| `provenance` | Source, derivation, attribution, generation | Source section and trust context |
| `structural` | RDF plumbing, blank-node scaffolding, internal IDs | Collapsed or hidden from primary navigation |
| `media` | Images, pages, downloads, documents | Preview or external-link treatment |

This role model gives Moire a cleaner relationship browser. Instead of a long flat list, the browser can show "Explore", "Filter", "Describe", "Source", and "Technical" groupings. The names shown to users do not need to match the internal enum. A domain expert wants to see useful groups; a developer wants stable roles. The two can be decoupled.

### 4.5 Vocabulary Recognition

Many predicates come from well-known vocabularies, and recognizing them gives Moire immediate product intelligence. RDF/RDFS/OWL predicates often describe type and ontology structure. SKOS predicates often describe concept schemes and labels. Dublin Core often describes title, creator, date, source, license, and publication metadata. FOAF and schema.org often describe people, organizations, pages, and media. PROV-O describes provenance. VoID describes datasets.

A lightweight vocabulary registry should map common namespaces and predicates to roles, preferred labels, icons, source priority, and display hints. This registry should not become a full ontology reasoner. Its job is to catch high-value common cases before they become raw IRIs in the UI. For example, `skos:prefLabel` should clearly be a label, `dcterms:source` should be a source link candidate, `prov:wasDerivedFrom` should be provenance, `schema:image` should be media, and `rdf:type` should be classifying or structural depending on the view.

Vocabulary badges can also help advanced users. A small "SKOS" or "PROV" badge in a tooltip tells the user that a predicate belongs to a known family. This should remain subtle; the badge is context, not the main content. The main content should still be the user's task: finding, filtering, understanding, and following entities.

### 4.6 Cardinality And Coverage

Moire already has `subjectCount` and `objectCount` for predicates, which makes cardinality hints almost free. The ratio of objects to subjects can classify a predicate as single-valued, usually single-valued, multi-valued, or highly multi-valued. A single-valued predicate often behaves like a fact field. A highly multi-valued predicate often behaves like a list, membership relation, keyword set, or dense graph edge. Users benefit from knowing which is which before they follow a path.

Coverage is equally useful. A predicate used by 95 percent of the current set is a reliable dimension. A predicate used by 3 percent may still be important, but it is a narrow path. Showing coverage near facet headers and relationship rows lets the user judge whether a filter or traversal is likely to matter. This reduces wasted clicks and makes empty states easier to explain.

The product language should be plain: "available on most records", "used by a few records", "usually one value", "many values per record". These phrases are easier to act on than raw ratios. The raw counts can remain available in tooltips or secondary text for users who want them.

### 4.7 Value Distribution Previews

Facet systems ask users to open panels to discover whether the values are useful. Moire can remove some of that friction by showing the top values directly in collapsed facet headers. If the facet count query already returns the top 50 values, the first three can become a preview: "Nationality: Norwegian (42), Swedish (31), Danish (18)". For literal predicates in relationship views, the same preview can say "Most common: Draft, Published, Archived".

This is a small annotation derived from runtime data, but it changes the feel of the interface. The user no longer has to poke every facet to learn what it contains. The UI becomes more self-revealing. It also helps rank facets: a predicate with a balanced, meaningful distribution is often more useful than a predicate where almost every record has the same value.

### 4.8 OWL Characteristics

OWL property characteristics should appear as quiet behavioral badges. `FunctionalProperty` can become "single value". `InverseFunctionalProperty` can become "unique key" or "identifies subject" in advanced contexts. `SymmetricProperty` can show a bidirectional indicator. `TransitiveProperty` can show a "chains" hint. These badges should be visible in predicate detail and tooltips, but not allowed to dominate the browsing surface.

The highest-value use is navigation explanation. If a relationship is symmetric, Moire can make incoming/outgoing distinctions less prominent. If it is transitive, Moire can eventually offer immediate neighbors versus expanded closure as separate modes. If it is functional, empty or multiple values may be notable in data quality views. These are downstream features, but storing the characteristics early makes them possible.

### 4.9 Predicate Usefulness Score

Annotations can improve sorting. Today, a predicate can be a facet or navigation candidate, but a long list still needs an order. Moire should compute a usefulness score for each predicate in a context. The score should be transparent and conservative: boost predicates with good labels/descriptions, known roles, meaningful coverage, useful value distributions, navigable IRI ranges, and non-structural roles; penalize structural predicates, opaque IDs, extremely sparse predicates, extremely uniform literal values, and predicates with values that are mostly blank nodes or invalid IRIs.

This score should not be shown as a number. It should shape default ordering. Users should feel that the best doors are near the top, not that the interface is scoring the graph in a mysterious way. Overlays can override the score with explicit groups, hidden flags, or priority values when a dataset owner knows better than the heuristic.

## 5. Resource Annotations: Turning Records Into Things

Resources are the nouns of the graph, but a raw resource is often only an IRI plus some facts. Moire's resource annotations should help the user answer four questions quickly: What is this thing? What kind of thing is it? Why should I trust or inspect it? Where can I go from here?

### 5.1 Preferred Labels, Aliases, And Search Names

Resource identity begins with names. Moire should gather display labels from local overlays, SHACL node shapes where appropriate, `skos:prefLabel`, `rdfs:label`, `schema:name`, `foaf:name`, `dcterms:title`, and other vocabulary-registry entries. It should gather aliases from `skos:altLabel`, alternate names in schema.org, hidden labels, acronyms, and local overlay search terms. The display label should stay clean; the search index can be generous.

Aliases matter because users rarely search in the exact words stored by a graph. A historical person may have names in several languages. An organization may have a full name, abbreviation, old name, and local shorthand. A concept may have a preferred label for display and hidden labels for misspellings. When Moire indexes these forms, search becomes forgiving without making entity cards noisy.

The entity detail view should expose aliases in a compact way. A small "also known as" line is often enough. For large alias lists, the detail view can show the first few and collapse the rest. The Set view should generally display only the preferred label, type, and one or two high-value hints; too many names on every card will slow scanning.

### 5.2 Type Hierarchy And Type Confidence

Types orient the user. An entity with type `Professor` is easier to understand when Moire can also show that `Professor` is a kind of `Researcher`, `Person`, or `Agent`. The existing class hierarchy introspection already gives a foundation for this. Entity type badges can show the direct type, while a tooltip or detail section shows the broader chain.

When an entity has multiple types, Moire should choose a primary display type without hiding the others. The primary type can be selected by specificity, frequency, vocabulary priority, overlay preference, or current context. For example, when browsing a set of publications, `Article` may be more helpful than `CreativeWork`; when browsing a provenance graph, `prov:Entity` may matter. This is another place where annotations should be context-sensitive rather than absolute.

Type confidence should be phrased carefully. In RDF, an entity can have multiple types, inferred types, and no explicit type. Moire should not treat missing type as an error. It can say "type not stated" rather than "unknown" and still use predicate patterns or SHACL targets to infer likely display behavior. That keeps the UI useful on messy graphs without pretending to know more than the data says.

### 5.3 Descriptions, Abstracts, And Summaries

Many resources carry descriptions through `rdfs:comment`, `skos:definition`, `schema:description`, `dcterms:abstract`, or domain-specific predicates. Moire should hoist the best short description into entity detail and, when space allows, into expanded entity cards. This is one of the simplest ways to make a graph feel readable.

The challenge is choosing the right text. A definition from SKOS may be better for concepts. A schema.org description may be better for creative works or organizations. A Dublin Core abstract may be better for publications. An overlay may be best for internal classes. The annotation pipeline should rank descriptions by source and role, prefer language matches when available, and avoid showing very long text in cards.

For resources with no authored description, Moire can generate a cautious summary from facts: primary type, one or two high-value relationships, temporal hints, and source. This should be formatted as a data-derived summary, not as a confident natural-language biography. The product should avoid inventing meaning that the graph does not provide.

### 5.4 Temporal Context

Dates are often the fastest way to understand a resource. Created, modified, published, born, died, started, ended, valid from, valid to, generated at, and revised at all provide orientation. Moire should detect temporal predicates through vocabulary recognition, value kind, and SHACL datatype constraints, then build concise temporal summaries.

The summary should be tuned to the resource type. A publication might show "Published 2019". A dataset record might show "Created 2021, modified 2024". A person might show lifespan if birth and death dates are present. A provenance entity might show generation time. These summaries belong in the entity detail header and can optionally appear on cards when the current view is time-sensitive.

Temporal annotations also support navigation. If a set has rich date predicates, Moire can offer sorting, grouping, timeline facets, or "recently modified" filters. The first implementation does not need a timeline UI; it only needs to recognize dates well enough that later views can build on the same annotation model.

### 5.5 Provenance And Trust Cues

A source link in the right place can change how trustworthy an entity feels. Moire should detect source and provenance predicates such as `prov:wasDerivedFrom`, `prov:hadPrimarySource`, `prov:wasQuotedFrom`, `prov:wasRevisionOf`, `dcterms:source`, `dcterms:creator`, `dcterms:publisher`, `schema:url`, `foaf:page`, and `schema:sameAs`. It should hoist the most useful external link into the entity header and leave the full provenance structure available in a dedicated section.

The provenance section should separate source, attribution, derivation, and revision. A creator is not the same as a source. A source is not the same as a same-as link. A revision is not the same as a derived work. The UI does not need to teach PROV-O, but it should preserve these distinctions because they matter to researchers and data stewards.

Provenance should also affect empty states and data quality messaging. If an entity is sparse but has a source, the user can inspect the source. If a set mixes data from several sources, filtering by source may become a valuable facet. If a record was generated by an import activity, a quality issue can point to that activity instead of implying the entity itself is wrong.

### 5.6 Completeness And Data Density

Completeness is tricky in RDF because many graphs do not have a closed schema. Moire should avoid saying that an entity is "complete" or "incomplete" unless SHACL or another explicit shape provides that frame. A safer and still useful annotation is data density: sparse, typical, or rich compared with similar entities in the current graph or current set.

Data density can be computed from the number of populated non-structural predicates, compared with the median for entities of the same primary type. In a set of researchers, an entity with 3 properties may be sparse while one with 30 may be rich. In a set of concepts, 3 properties may be typical. The comparison must be local, not universal.

This signal should be subtle. A small indicator in cards and a line in entity detail are enough. Its purpose is to help users find well-described records or notice sparse ones, not to shame the data. When SHACL is present, Moire can add stronger shape-based messages such as "missing required title" or "expected one publication date".

### 5.7 Media, Documents, And External Pages

Some resources are best understood visually or through associated documents. Predicates such as `schema:image`, `foaf:depiction`, `schema:thumbnailUrl`, `schema:url`, `foaf:page`, and download links can be annotated as media or external page fields. Entity cards can show thumbnails when available and appropriate. Entity detail can group documents and pages separately from core semantic relationships.

This grouping matters because links are not all navigational in the same way. A link to another resource in the graph keeps the user inside Moire. A link to an external web page takes the user out to verify or inspect. A link to an image can improve recognition. A link to a download may be supporting evidence. Clear annotations let the UI use the right affordance for each case.

### 5.8 Similar And Related Entities

Moire should support two families of relatedness. The first is explicit graph relatedness: SKOS related concepts, same-as or close-match resources, shared source, shared class, common relationships, or direct edges. The second is computed similarity, especially when a pg-ripple endpoint exposes semantic similarity through vector features. These should be presented differently.

Explicit relatedness can be explained with a predicate: "related topic", "same source", "close match", "same organization", "broader concept". Computed similarity should be labelled as such and include a score or relative ordering only if that is meaningful. The UI should avoid blending explicit facts and vector similarity into one undifferentiated "related" list. Users trust recommendations more when they know why an item appears.

## 6. Dataset And Graph Annotations: Giving The User A Map

Resource and predicate annotations help inside a graph. Dataset annotations help before and around the graph. They answer the user's first questions: What is this endpoint? What graphs are available? What kind of data lives here? What vocabularies does it use? Where should I start?

VoID metadata, Dublin Core dataset metadata, and Moire's own introspection can combine into graph-level summaries. A graph card can show title, description, modified date, publisher, license, triple count, class count, predicate count, major vocabularies, and example resources when available. The screen overview can emphasize the most common classes and most navigable relationships. If a dataset publishes `void:rootResource` or `void:exampleResource`, Moire can surface those as recommended starting points.

Property and class partitions are especially useful because they validate what Moire discovers. If a VoID property partition says a predicate has a certain triple count, Moire can use that as a starting statistic or compare it with live introspection. If a class partition identifies dominant classes, the Types Browser can rank and explain them. Linkset metadata can tell Moire that a graph is mainly about links between datasets, which changes the expected browsing experience.

Dataset annotations also help with trust. Publisher, creator, source, license, and modified date belong near graph selection, not buried in an entity table. Users should know what dataset they are entering before they begin making claims from it. This does not need to be heavy; a quiet metadata strip can carry the essential context.

## 7. Navigation Annotations: Keeping The User Oriented

Moire's central experience is movement: from graph to type, type to set, set to entity, entity to relationship, relationship to new set, and back again. Annotation should therefore be measured partly by whether it improves movement.

### 7.1 Natural Context Headers

The current context header builds a narrative from the navigation stack, but it only has predicate labels to work with. With annotations, the header can choose better phrases. The order of preference should be: explicit inverse label, shape-specific label, overlay phrase, known vocabulary phrase, domain/range-derived phrase, then the existing predicate label fallback.

Examples:

| Current | Better |
|---|---|
| `affiliatedWith of SE Researchers` | `Institutions for SE Researchers` |
| `locatedIn of Universities for SE Researchers` | `Cities containing universities for SE Researchers` |
| `creator of Publications` | `Creators of Publications` |
| `broader of Climate Concepts` | `Broader topics for Climate Concepts` |

This is not cosmetic. The context header is the user's sentence for where they are. If it is awkward, the user carries the cognitive load. If it reads naturally, Moire feels like it is keeping pace.

### 7.2 Traversal Breadcrumbs

A breadcrumb should show the path as the user travelled it, with each predicate step rendered as an annotated chip. For example: `SE Researchers -> affiliated with -> Universities -> located in -> Cities`. Each chip should be clickable, moving the navigation pointer back to that frame. Predicate chips can carry role icons, coverage hints, and tooltips.

This gives users recovery. Faceted graph exploration can become disorienting because each step is locally reasonable while the whole path grows hard to remember. The breadcrumb makes the path visible and reversible. It also teaches the graph by repetition: users see the verbs that connect their concepts.

### 7.3 Relationship Previews

Before the user follows a relationship, Moire should preview what it will likely produce. A relationship row can show the target type, estimated result count, coverage, top target labels, and whether it is mostly one-to-one or one-to-many. For example: "affiliated with -> 18 organizations, available on 82 percent of this set". This turns a blind traversal into an informed choice.

These previews can be computed from existing relationship queries, facet counts, or light on-demand sampling. They should be cached per set/frame where possible. The user does not need perfect counts; they need enough confidence to choose a path.

### 7.4 Empty State Explanations

Empty states are where annotation work pays off most visibly. A generic "No entities found" tells the truth but gives no recovery path. With predicate and facet annotations, Moire can explain likely causes: the active relationship has low coverage, the selected facets have no overlap, the current type rarely has the chosen property, a SHACL shape says the property is optional, or the endpoint returned no results for a sampled range.

Good empty states should be specific and actionable. "Only 3 of 100 entities in this set have a `works on` relationship, and none match the current filters" is more useful than "No entities found". "Try removing the status filter" is more useful than "Broaden your search". When Moire can name the relevant predicate and facet, it should.

### 7.5 Search And Command Palette Improvements

Annotations should feed search. Resource aliases, hidden labels, alternate labels, type labels, source names, and vocabulary labels can all improve recall. Predicate search should also become possible: a user should be able to search for "source", "created", "publisher", or "broader topic" and find relevant predicates even if the graph uses a less obvious IRI.

The command palette can use annotations to offer richer actions: "Jump via affiliated with", "Filter by publication year", "Open source link", "Show broader topics", "Show data quality warnings". This makes annotations active. They are not only labels on a screen; they become ways to move.

## 8. Overlay Annotations For Private Or Sparse Graphs

Not all useful metadata lives in the graph. Many real datasets use internal predicates like `legacySystemId`, `statusCode`, `rel_42`, or `importBatch`. They may have meaning inside an organization but no public ontology. Asking data owners to modify the underlying RDF before Moire can be useful would weaken Moire's promise. A local overlay file solves this.

An overlay should let an endpoint owner provide labels, descriptions, inverse labels, roles, groups, icons, hidden flags, priorities, and resource annotations without changing the source graph. It should be applied after graph-derived annotations so it can correct or specialize them. It should be explicit in configuration, versioned, and easy to validate.

Example:

```json
{
  "version": 1,
  "predicates": {
    "http://example.org/research/affiliatedWith": {
      "label": "Affiliated With",
      "inverseLabel": "Has Affiliate",
      "description": "Connects a researcher to the institution where they hold an appointment.",
      "role": "relational",
      "group": "Academic Roles",
      "priority": 80
    },
    "http://example.org/research/legacyId": {
      "label": "Legacy Record ID",
      "description": "Internal identifier from the pre-migration system.",
      "role": "structural",
      "hidden": true
    }
  },
  "resources": {
    "http://example.org/research/Researcher": {
      "label": "Researcher",
      "description": "A person conducting academic research.",
      "icon": "user"
    }
  }
}
```

Overlay annotations should be understood as display policy, not graph truth. If an overlay hides a predicate from primary navigation, the predicate should still be visible in a full technical view or export path. If an overlay renames a predicate, the original IRI should remain accessible. This keeps Moire honest while letting it become much more usable for specific audiences.

## 9. Proposed Type Model

The type model should stay additive. Existing fields do not need to be removed. The new fields can be optional so bare endpoints remain supported and features can roll out incrementally.

```typescript
type AnnotationSource =
  | "overlay"
  | "shacl"
  | "skos"
  | "rdfs"
  | "owl"
  | "prov"
  | "void"
  | "registry"
  | "observed"
  | "derived";

type PredicateRole =
  | "labelling"
  | "descriptive"
  | "classifying"
  | "relational"
  | "temporal"
  | "numeric"
  | "provenance"
  | "structural"
  | "media";

interface AnnotationText {
  value: string;
  language?: string;
  source: AnnotationSource;
}

interface PredicateAnnotation {
  role?: PredicateRole;
  labelSource?: AnnotationSource;
  descriptions?: AnnotationText[];
  domain?: string;
  domainLabel?: string;
  range?: string;
  rangeLabel?: string;
  inverseIRI?: string;
  inverseLabel?: string;
  vocabularyBadge?: string;
  group?: string;
  priority?: number;
  hidden?: boolean;
  cardinalityHint?: "single-valued" | "usually-single" | "multi-valued" | "highly-multi-valued";
  coverageHint?: "rare" | "some" | "common" | "near-universal";
  owlCharacteristics?: Array<"Functional" | "InverseFunctional" | "Symmetric" | "Transitive" | "Reflexive">;
  topValues?: Array<{ value: string; label: string; count: number }>;
}

interface ResourceAnnotation {
  labelSource?: AnnotationSource;
  aliases?: AnnotationText[];
  descriptions?: AnnotationText[];
  typeHierarchy?: Array<{ iri: string; label: string }>;
  primaryType?: string;
  temporalSummary?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  provenanceSummary?: string;
  dataDensity?: "sparse" | "typical" | "rich";
  media?: Array<{ url: string; kind: "image" | "page" | "document"; label?: string }>;
  shaclResults?: ShaclResultSummary[];
  similarEntities?: Array<{ iri: string; label: string; score?: number; reason?: string }>;
}

interface ShaclResultSummary {
  message: string;
  severity: "Info" | "Warning" | "Violation";
  focusPath?: string;
  value?: string;
  sourceShape?: string;
}

interface DatasetAnnotation {
  title?: string;
  description?: string;
  publisher?: string;
  creator?: string;
  source?: string;
  license?: string;
  created?: string;
  modified?: string;
  vocabularies?: string[];
  rootResources?: Array<{ iri: string; label?: string }>;
  exampleResources?: Array<{ iri: string; label?: string }>;
  voidStats?: {
    triples?: number;
    entities?: number;
    classes?: number;
    properties?: number;
    distinctSubjects?: number;
    distinctObjects?: number;
  };
}
```

The annotations can either be embedded directly into existing `PredicateSummary`, `EntityNode`, and `GraphSummary` objects or attached as nested `annotation` fields. A nested field is cleaner over time because it separates raw graph summary facts from Moire's display interpretation. For example, `PredicateSummary.subjectCount` is observed graph data, while `PredicateAnnotation.coverageHint` is a UI interpretation of graph data.

## 10. SPARQL Query Sketches

The implementation should avoid many tiny metadata queries. The best first step is one batched predicate metadata query during graph introspection, using the predicates Moire has already discovered. Later features can be loaded on demand in entity detail or graph overview.

### 10.1 Predicate Metadata Query

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX schema: <https://schema.org/>

SELECT ?predicate ?label ?prefLabel ?comment ?definition ?description
       ?domain ?domainLabel ?range ?rangeLabel
       ?inverse ?inverseLabel ?characteristic ?definedBy ?seeAlso
WHERE {
  VALUES ?predicate { <$PREDICATE_IRIS> }

  OPTIONAL { ?predicate rdfs:label ?label }
  OPTIONAL { ?predicate skos:prefLabel ?prefLabel }
  OPTIONAL { ?predicate rdfs:comment ?comment }
  OPTIONAL { ?predicate skos:definition ?definition }
  OPTIONAL { ?predicate dcterms:description ?description }
  OPTIONAL { ?predicate schema:description ?description }

  OPTIONAL {
    ?predicate rdfs:domain ?domain .
    OPTIONAL { ?domain rdfs:label ?domainLabel }
    OPTIONAL { ?domain skos:prefLabel ?domainLabel }
  }

  OPTIONAL {
    ?predicate rdfs:range ?range .
    OPTIONAL { ?range rdfs:label ?rangeLabel }
    OPTIONAL { ?range skos:prefLabel ?rangeLabel }
  }

  OPTIONAL {
    { ?predicate owl:inverseOf ?inverse }
    UNION
    { ?inverse owl:inverseOf ?predicate }
    OPTIONAL { ?inverse rdfs:label ?inverseLabel }
    OPTIONAL { ?inverse skos:prefLabel ?inverseLabel }
  }

  OPTIONAL {
    ?predicate rdf:type ?characteristic .
    FILTER(?characteristic IN (
      owl:FunctionalProperty,
      owl:InverseFunctionalProperty,
      owl:SymmetricProperty,
      owl:TransitiveProperty,
      owl:ReflexiveProperty
    ))
  }

  OPTIONAL { ?predicate rdfs:isDefinedBy ?definedBy }
  OPTIONAL { ?predicate rdfs:seeAlso ?seeAlso }
}
```

This query should be graph-scoped when the endpoint requires named graph scoping, but ontology metadata often lives outside the data graph. The implementation may need a strategy: try the active graph first, then optionally try default graph metadata if the endpoint supports it. The result should be merged by predicate IRI, with language preference applied after binding normalization.

### 10.2 SHACL Shape Metadata Query

```sparql
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?targetClass ?path ?name ?description ?order ?group ?datatype ?class ?nodeKind ?minCount ?maxCount
WHERE {
  ?shape a sh:NodeShape ;
         sh:targetClass ?targetClass ;
         sh:property ?propertyShape .

  ?propertyShape sh:path ?path .
  OPTIONAL { ?propertyShape sh:name ?name }
  OPTIONAL { ?propertyShape sh:description ?description }
  OPTIONAL { ?propertyShape sh:order ?order }
  OPTIONAL { ?propertyShape sh:group ?group }
  OPTIONAL { ?propertyShape sh:datatype ?datatype }
  OPTIONAL { ?propertyShape sh:class ?class }
  OPTIONAL { ?propertyShape sh:nodeKind ?nodeKind }
  OPTIONAL { ?propertyShape sh:minCount ?minCount }
  OPTIONAL { ?propertyShape sh:maxCount ?maxCount }
}
```

This query is most useful when a selected type is known. It does not need to run for every endpoint at startup. It can run when a type view or entity detail view is opened, then cache shape metadata by target class. Shape metadata can influence property ordering, grouping, labels, descriptions, and validation language.

### 10.3 Resource Annotation Query

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX schema: <https://schema.org/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX prov: <http://www.w3.org/ns/prov#>

SELECT ?resource ?type ?typeLabel ?prefLabel ?label ?title ?name
       ?altLabel ?hiddenLabel ?definition ?comment ?description ?abstract
       ?source ?page ?image ?created ?modified ?generatedAt
WHERE {
  VALUES ?resource { <$RESOURCE_IRIS> }

  OPTIONAL { ?resource rdf:type ?type . OPTIONAL { ?type rdfs:label ?typeLabel } }
  OPTIONAL { ?resource skos:prefLabel ?prefLabel }
  OPTIONAL { ?resource rdfs:label ?label }
  OPTIONAL { ?resource dcterms:title ?title }
  OPTIONAL { ?resource schema:name ?name }
  OPTIONAL { ?resource foaf:name ?name }
  OPTIONAL { ?resource skos:altLabel ?altLabel }
  OPTIONAL { ?resource skos:hiddenLabel ?hiddenLabel }
  OPTIONAL { ?resource skos:definition ?definition }
  OPTIONAL { ?resource rdfs:comment ?comment }
  OPTIONAL { ?resource schema:description ?description }
  OPTIONAL { ?resource dcterms:abstract ?abstract }
  OPTIONAL { ?resource dcterms:source ?source }
  OPTIONAL { ?resource prov:hadPrimarySource ?source }
  OPTIONAL { ?resource prov:wasDerivedFrom ?source }
  OPTIONAL { ?resource foaf:page ?page }
  OPTIONAL { ?resource schema:url ?page }
  OPTIONAL { ?resource schema:image ?image }
  OPTIONAL { ?resource foaf:depiction ?image }
  OPTIONAL { ?resource dcterms:created ?created }
  OPTIONAL { ?resource dcterms:modified ?modified }
  OPTIONAL { ?resource prov:generatedAtTime ?generatedAt }
}
```

This can be used for entity detail and, in a smaller version, for set card enrichment. The card version should avoid expensive fan-out. It only needs label, primary type, compact description, image, and one or two temporal/source hints.

### 10.4 VoID Dataset Metadata Query

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT ?dataset ?title ?description ?creator ?publisher ?source ?license
       ?created ?modified ?sparqlEndpoint ?rootResource ?exampleResource
       ?vocabulary ?triples ?entities ?classes ?properties
WHERE {
  ?dataset a void:Dataset .
  OPTIONAL { ?dataset dcterms:title ?title }
  OPTIONAL { ?dataset dcterms:description ?description }
  OPTIONAL { ?dataset dcterms:creator ?creator }
  OPTIONAL { ?dataset dcterms:publisher ?publisher }
  OPTIONAL { ?dataset dcterms:source ?source }
  OPTIONAL { ?dataset dcterms:license ?license }
  OPTIONAL { ?dataset dcterms:created ?created }
  OPTIONAL { ?dataset dcterms:modified ?modified }
  OPTIONAL { ?dataset void:sparqlEndpoint ?sparqlEndpoint }
  OPTIONAL { ?dataset void:rootResource ?rootResource }
  OPTIONAL { ?dataset void:exampleResource ?exampleResource }
  OPTIONAL { ?dataset void:vocabulary ?vocabulary }
  OPTIONAL { ?dataset void:triples ?triples }
  OPTIONAL { ?dataset void:entities ?entities }
  OPTIONAL { ?dataset void:classes ?classes }
  OPTIONAL { ?dataset void:properties ?properties }
}
```

This should be optional and opportunistic. Some endpoints will not expose VoID metadata. When they do, Moire can use it to make graph selection, screen overview, and documentation-like side panels much more helpful.

## 11. UI Touchpoints

The same annotations should appear differently depending on where the user is. The UI should avoid dumping all metadata into every component. Each surface has a job.

| Surface | Annotation use |
|---|---|
| Graph Browser | Dataset title, description, publisher, license, modified date, vocabularies, root/example resources, class/property counts |
| Types Browser | Type labels, hierarchy, descriptions, class counts, source vocabulary, shape hints |
| Set View | Entity labels, primary type, compact description, temporal/source hints, data density, warning indicator, optional thumbnail |
| Entity Detail | Full annotations: aliases, descriptions, type hierarchy, provenance, temporal summary, grouped predicates, SHACL results, media, similar entities |
| Predicate Table | Role, description, domain/range, vocabulary badge, cardinality, OWL characteristics, shape group/order |
| Relationships Browser | Group by role, show coverage, target type, cardinality, top values, inverse/directional labels, usefulness ordering |
| Jump Via Strip | Annotated traversal buttons with role icons, target type/count preview, concise tooltip |
| Facet Panel | Coverage, top values, role-aware ordering, range/value-kind display, shape constraints where relevant |
| Context Header | Inverse labels, natural phrases, domain/range words, path-aware narrative |
| Breadcrumb | Annotated predicate chips with click-to-return behavior |
| Empty States | Predicate-specific explanations, active facet diagnosis, shape-aware missing-value hints |
| Search Palette | Preferred labels, aliases, hidden labels, predicate search, annotated commands |

The design principle is progressive disclosure. A label and one hint should be visible. The deeper explanation should be one hover, expand, or detail panel away. Moire should feel calmer as it becomes smarter, not denser.

## 12. Implementation Roadmap

The roadmap should deliver value quickly while keeping endpoint cost low. The tiers below preserve Moire's current strength: a usable interface appears immediately, and richer metadata improves it when available.

### Tier 1: No Additional Network Queries

Tier 1 uses data Moire already has or can compute locally. It should be the first implementation target because it improves the UX for every endpoint.

| Annotation | Source | Work |
|---|---|---|
| Predicate roles | Value kind, structural list, vocabulary registry, name heuristics | Extend `annotatePredicates` |
| Vocabulary badges | Namespace/predicate registry | Add `vocabulary-registry.ts` |
| Cardinality hints | `subjectCount` and `objectCount` | Local computation |
| Basic usefulness ordering | Role, counts, value kind, structural flag | Local computation |
| Type hierarchy display | Existing class introspection | UI rendering |
| Temporal summary | Existing entity predicates where loaded | Client-side detection |
| Source link hoisting | Existing entity predicates where loaded | Client-side detection |
| Traversal breadcrumb | Existing navigation stack | UI rendering |
| Facet value preview | Existing facet count results | UI rendering |

The product win in Tier 1 is that Moire starts making better choices without asking endpoints for more data. Relationship lists become better ordered. Structural details recede. Cards and entity headers gain dates and source links when the data is already present. Breadcrumbs make exploration safer.

### Tier 2: One Batched Introspection Query

Tier 2 adds a predicate metadata query during graph introspection. It should collect labels, descriptions, domain/range, inverse properties, OWL characteristics, and definition links for all discovered predicates in a single round trip. This data should be cached with the graph summary.

The UI impact is large because predicate annotations touch every navigation surface. Tooltips become explanatory. Context headers become more natural. Relationship rows can show target types. Jump buttons can tell the user where they go. Empty states can name the relevant relationship in human language.

### Tier 3: On-Demand Resource, Shape, And Dataset Queries

Tier 3 should load richer annotations when the user opens a relevant view. Entity detail can fetch resource annotations, provenance, media, and optional SHACL results. Type views can fetch SHACL shape metadata for that type. Graph overview can opportunistically fetch VoID metadata. pg-ripple endpoints can expose SHACL validation and semantic similarity as enhanced panels.

This tier should be careful about performance. It should batch resource card enrichment, cache by resource IRI, and avoid blocking primary rendering. The first paint can use existing labels; annotations can fill in after. The interface should feel faster with annotations, not slower.

### Tier 4: Local Overlay System

Tier 4 adds endpoint-specific overlays. It is not technically first, but it may be strategically important for private graphs. The overlay schema should be small at first: predicate label, inverse label, description, role, group, hidden flag, icon, priority; resource label, description, icon, aliases. Validation can be added before the overlay is applied so bad files fail clearly.

Overlays should be merged as the final annotation pass. They should never erase raw graph data; they only affect display and navigation policy. This makes overlays powerful without making them dangerous.

## 13. Risks And Product Guardrails

The first risk is overconfidence. RDF and OWL metadata often describes intended meaning under open-world assumptions. Moire should avoid closed-world language unless SHACL or another explicit constraint supports it. "Expected", "documented as", "usually", and "available on" are safer and more accurate than "must" and "only".

The second risk is clutter. Annotations are meant to reduce cognitive load, not replace raw triples with a wall of badges. The default display should show the best label, one compact hint, and a sensible order. Details belong in tooltips, disclosure panels, or advanced views. A quiet interface with excellent labels will outperform a noisy interface with every possible standard exposed.

The third risk is performance. Metadata queries can become expensive if they are per-predicate or per-card. The implementation should batch aggressively, cache by graph/type/resource, and treat advanced annotations as progressive enhancement. The current browsing path should remain fast even when an endpoint does not respond well to metadata queries.

The fourth risk is misleading local overlays. A local overlay can improve usability, but it can also hide important details or rename things in ways that obscure the underlying graph. Moire should keep raw IRIs accessible, mark overlay-sourced annotations internally, and provide a technical view where hidden predicates can still be inspected.

The fifth risk is language handling. Labels and descriptions may exist in many languages. Moire should prefer the user's language when known, then language-neutral literals, then English, then any available value, then derived labels. This logic should be centralized so components do not make inconsistent choices.

## 14. Recommended First Slice

The best first slice is a narrow but complete path through predicate annotations, because predicates drive navigation and many improvements can be reused across components.

1. Add a vocabulary registry that classifies common predicates and namespaces into roles, labels, and display hints.
2. Extend `annotatePredicates` to compute role, cardinality hint, vocabulary badge, and a usefulness score from existing introspection data.
3. Update relationship and facet ordering to use the usefulness score while preserving current fallback behavior.
4. Add annotated tooltips in the Relationships Browser and Jump strip using role, value kind, counts, and cardinality.
5. Add a traversal breadcrumb from the existing navigation stack.
6. Add one batched predicate metadata query for labels, descriptions, domain/range, inverse properties, and OWL characteristics.
7. Use inverse labels and target type hints in the context header.

This slice is coherent because it improves the moment-to-moment act of moving through the graph. It also lays the foundation for resource annotations, SHACL, VoID, and overlays without requiring them immediately.

## 15. Conclusion

Annotations should become Moire's interpretation layer. They should not replace RDF, hide the graph, or require every endpoint to be beautifully documented. They should let Moire use whatever context is available: observed counts, authored labels, ontology hints, SKOS vocabulary structure, SHACL shape metadata, PROV-O provenance, VoID dataset descriptions, pg-ripple capabilities, and local steward knowledge.

The user experience improvement is concrete. Predicates become understandable choices instead of opaque IRIs. Resources become recognizable things instead of records with addresses. Paths become sentences. Facets reveal their value before they are opened. Empty states become explanations. Dataset screens become maps rather than lists. The graph remains flexible and open, but the interface gains enough structure to help users keep moving.

The implementation can be staged safely. Tier 1 brings immediate gains with no additional queries. Tier 2 adds one high-value introspection query. Tier 3 enriches entity, type, and dataset views on demand. Tier 4 lets private and sparse graphs become humane through overlays. Each tier preserves Moire's core promise: point at a SPARQL endpoint and get a useful navigable interface, with richer understanding when the graph has more to say.

## References For Further Design

- RDF Schema 1.1: labels, comments, domain/range, subclass/subproperty, see-also and definition links.
- OWL 2 Primer: inverse properties, property characteristics, annotations, equivalence, and open-world semantics.
- SKOS Reference: preferred, alternate, and hidden labels; definitions and scope notes; broader, narrower, related, and mapping relationships.
- SHACL: shapes as validation and UI metadata; property names, descriptions, order, groups, defaults, severity, and validation results.
- PROV-O: entities, activities, agents, generation, derivation, attribution, source, quotation, and revision.
- VoID: dataset metadata, structural statistics, vocabularies, class/property partitions, root resources, example resources, and linksets.