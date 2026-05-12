# Layers

## Distance as a concept

When you focus on a single entity in Moire — by clicking a card to enter Entity context — you are no longer just browsing a set. You have a *centre*. Everything else in the graph can be described in terms of its distance from that centre: directly connected (Layer +1), connected through one intermediate (Layer +2), connected *to* rather than *from* the focus (Layer −1 and −2).

This idea of distance as a meaningful navigation concept is what the layer system encodes. Moire is not doing spatial layout — there is no visual diagram with Erik Rogstad at the centre and circles radiating outward. The layers are purely conceptual, controlled by the layer selector control: `[−2] [−1] [● Focus] [+1] [+2]`.

---

## What each layer shows

**Layer 0 (● Focus)** is the entity itself. Full detail: complete description, all type badges, every relationship in the table. This is the most information Moire will ever show you about a single entity.

**Layer +1** is the set of entities directly connected to the focus — everything that appears as a clickable link in the focus entity's relationship table. These appear as a card grid at *summary* detail: name, type badge, one-line description. You can apply facets to this Layer +1 set just like any other set. If the focus entity has many connections, filters are how you make sense of them.

**Layer +2** is the set of entities two hops away from the focus — the connections of the connections. At this distance, cards show *headline* detail only: name and type badge. There are typically more entities at Layer +2 than at Layer +1, and the headline level keeps the grid readable without overwhelming you with detail for every entry.

**Layer −1** is the incoming direction: entities that have a relationship *pointing to* the focus. If the focus entity is the University of Oslo, Layer −1 shows every entity that lists it as an affiliation, location, or any other relationship target. This answers the question "who or what cares about this entity?" rather than "what does this entity care about?"

**Layer −2** is two hops in the incoming direction — entities that point to entities that point to the focus. This is a relatively advanced view and will often produce a large, heterogeneous set; it is most useful for discovering unexpected connections.

---

## The ripple model

A drop of water on a still pond sends out rings of ripples. Each ring is a layer of distance from the impact point. Moire's layer system works the same way: the focus entity is the drop, and the layer selector lets you look at whichever ring you are interested in.

One important difference from physical ripples: the rings are not mutually exclusive. An entity that appears in Layer +1 might also appear in Layer +2 via a different path. Moire handles this correctly by showing distinct entities at each layer, regardless of how many paths connect them to the focus.

---

## When layers are available

The layer selector is only shown in **Entity context** — when you have clicked on a specific entity and it is the centre of attention. In **Set context** (no single focal point — you are browsing a class, filtering a group, or exploring a traversal result), the layer selector is replaced by the Jump via strip and the Browse relationships link, because the layer concept does not apply cleanly when the "centre" is a whole set of entities.

This is the design boundary between the two navigation modes. Entity context is for depth: reading one thing in detail, exploring its neighbourhood systematically. Set context is for breadth: seeing patterns across a group, following the group through relationships.

---

## Detail levels by layer

| Layer | Meaning | Card detail level |
|---|---|---|
| −2 | Two hops incoming | Label (name only) |
| −1 | Direct incoming connections | Headline (name + type) |
| 0 (Focus) | The entity itself | Full (all information) |
| +1 | Direct connections | Summary (name + type + description) |
| +2 | Two hops out | Headline (name + type) |

Detail decreases with distance because you are less likely to need full information about every entity far from your focus, and showing it would create an overwhelming wall of text. As you click around and change focus, entities that were distant become close, and their detail level increases automatically.
