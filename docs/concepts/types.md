# Types

## Categories with depth

Every entity in a knowledge graph belongs to one or more *types* — also called *classes*. A type is a category: Professor, University, City, Topic. But unlike the folders in a filing system, types in a knowledge graph can be nested inside each other, forming a hierarchy.

In the research graph, the type hierarchy looks like this: Professor is a subtype of Researcher, which is a subtype of Person, which is a subtype of Agent. This means a Professor is simultaneously all four of those things. If you ask "give me all Persons", a Professor qualifies. If you ask "give me all Researchers", a Professor qualifies. If you ask "give me all Professors", only a Professor qualifies.

This accumulation of types up the hierarchy is called *inheritance*, and it gives knowledge graphs an expressive power that flat categories do not have. You can query broadly (give me all Agents) or narrowly (give me only Professors) using the same type system, and the results will be sensible because the hierarchy encodes the real-world relationships between categories.

---

## The Types Browser

When you enter a graph in Moire, the Types Browser shows you the full class hierarchy discovered during introspection. It is the best overview of "what kinds of things are in here?" that Moire can give you without actually looking at any individual entities.

Each row in the Types Browser shows:

- The type name (with indentation reflecting its position in the hierarchy)
- The count of instances of that type
- A **Browse as set →** button

The indentation is meaningful: types indented under another type are subtypes of it. Reading the tree top-to-bottom gives you a map of the knowledge graph's conceptual structure.

---

## Choosing where to start

The instance counts in the Types Browser are your first tool for choosing a productive starting point. Very broad types (Agent: 9 instances, in the research graph) include everything in their subtree, so the count can be deceptive — browsing all Agents gives you both researchers and organisations, which may be more mixed than you want. Very narrow types (Professor: 3 instances) give you a well-defined, homogeneous group that is easy to filter.

A good rule of thumb: start at the type level where the instance count is large enough to be interesting but the type name is specific enough to be meaningful. "Researcher" with 6 instances is a better starting point than "Agent" with 9 or "Professor" with 3, for most exploration purposes.

---

## Types and facets

When you enter a set via the Types Browser, Moire adds the selected type as a pre-applied filter in the facet sidebar. You will see it as an active selection in the *Type* facet group. This filter persists as you add other filters — it is the baseline of your exploration.

You can remove the type filter if you want. Removing *Researcher* from the type facet would expand the set to include everything in the graph — which is probably not what you want, but the option is there.

You can also add type filters manually from the facet sidebar without going through the Types Browser. If you are browsing all Researchers and want to narrow to Professors only, just click *Professor* in the Type facet. The Types Browser is the starting point; the facet sidebar is how you refine.

!!! tip "Types are not mutually exclusive"
    Because a single entity can have multiple types simultaneously (a Professor is also a Researcher and a Person), type facets use OR logic within the group. Checking both *Professor* and *PhDStudent* in the Type facet shows you everyone who is either a Professor or a PhDStudent — which, in the research graph, is all six researchers.
