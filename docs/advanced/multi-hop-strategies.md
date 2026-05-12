# Multi-hop Exploration Strategies

Moire lets you chain traversals — following one relationship, then another, then another — building up a sequence of context changes. This page covers practical strategies for navigating complex, interconnected graphs where the path from question to answer is not obvious.

---

## Start broad, then follow

The most reliable strategy for any unfamiliar graph is to start at the broadest level — browse all entities of a general type — and then follow relationships to narrow in.

**Example:** You want to find all research topics that are studied by researchers located in cities that host a university you already know. Instead of searching for topics directly, you might:

1. Browse all Researchers (Types Browser → Researcher → Browse as set)
2. Filter by affiliation using a facet (or follow *affiliatedWith* as a set to get universities)
3. Follow *locatedIn* as a set to get cities
4. Follow back with an incoming traversal: who is located in these cities?

Starting broad means you always have counts and coverage information before committing to a path. You can see whether traversing a specific relationship will give you 3 results or 300.

---

## Chain for patterns

When you want to find entities that fit a multi-step structural pattern — "things connected to things connected to things" — chaining traversals is the right approach. Each traversal step produces a set that is the input to the next.

The context header narrates the chain as you build it: "Topics of projects of Researchers in Oslo" is the natural-language description of a three-hop chain. Reading the header tells you whether your chain is building the concept you intended.

**Strategy for chaining:**
- Choose traversals that have **high subject coverage** — you want every entity in the current set to participate in each hop, not just a few.
- Watch for **set size shrinkage** — if each hop produces a progressively smaller set, you are either filtering by traversal (expected) or the graph is sparsely connected (can be a dead end).
- Use **Add as facet** at any point to turn a traversal dimension into a filter instead — this lets you stay at a broader level while still filtering by connected entity.

---

## Use incoming relationships for "what links here"

Outgoing relationships answer "what does this entity/set connect to?" Incoming relationships answer "what connects *to* this entity/set?" The incoming direction is often the most interesting and surprising.

When you are on a well-connected entity — a major city, a widely-referenced concept, a foundational paper — the incoming Relationships Browser often reveals unexpected connections. Who cites this paper? What projects are located in this city? What datasets refer to this concept?

To explore incoming connections systematically:

1. Navigate to an entity (via search or clicking a card)
2. Open the Layer selector to Layer −1 — this shows all entities that point *to* the focus entity as a browsable set
3. Or: open the Relationships Browser, scroll to Incoming, and click *Follow incoming →* on a specific relationship

---

## Follow vs Add as facet: a decision framework

At every step, you face a choice: traverse (move the entire set through a relationship to a new set) or facet (add the relationship as a filter dimension without moving). The right choice depends on what you want to do next.

**Traverse (Follow as set →) when:**
- You want to visit, read, and explore the *target* entities themselves
- You want to chain another traversal from the target entities
- You want to see facets and counts scoped to the target entities
- The target entities are the end-goal of this particular question

**Add as facet when:**
- You want to *filter* the current entities by something about their connections, without leaving the current set
- You are interested in the *source* entities (researchers, papers, etc.) and want to subdivide them by a connected attribute (city, topic, etc.)
- You want to compare subgroups within the current set side by side

In the sample research dataset: *affiliatedWith as a facet* lets you compare Swedish researchers at Uppsala vs KTH while staying in the researcher set; *affiliatedWith as a traversal* takes you to the universities themselves so you can read each university's details.

---

## Recover from deep chains

After several hops, the context header can become long and the current set can be small and specialised. If you are unsure whether the chain is meaningful, these signals help:

- **Context header longer than 4–5 words:** you are deep in the graph. This is fine if intentional; press Back to step out if it feels wrong.
- **Set size is 1:** you may have followed a relationship that is unique to one entity. Often interesting! But also a dead end for further filtering.
- **Facet sidebar is empty or has only one option:** the current set is so narrow that faceting adds no value. This is normal at the end of a focused exploration.

Pressing Back any number of times is always safe and always recovers the previous state exactly.

---

## Avoid over-filtering before traversal

A common pattern is to apply many facet filters to narrow a set to a very small group, then traverse from that tiny group. This often works, but it also limits the traversal result: traversing from 2 entities gives a much smaller and less informative result than traversing from 20.

For discovery work, consider traversing first and filtering second: the broader set produces a richer traversal result, and you can filter the result set afterwards. Filtering then traversing is better suited to verification tasks, where you know exactly which subset you want to follow.
