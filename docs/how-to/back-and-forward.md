# Use Back and Forward

Moire keeps a complete history of every view you have visited. You can move backward and forward through that history at any time without losing anything you built up along the way.

---

## The Back button

The **← Back** button (top-left of the top bar) takes you to the previous view in your navigation history. Every navigation action that takes you somewhere new creates a history entry:

- Clicking Browse this graph → (Graphs → Types context)
- Clicking Browse as set → (Types → Set context)
- Clicking a card (Set → Entity context)
- Clicking Follow as set → or a Jump via button (Set → Set context via traversal)
- Clicking a link in the relationship table (Entity → Entity context)
- Selecting a result from the search palette

Each of these creates a new history entry. Pressing Back once undoes the most recent one. Pressing Back again undoes the one before that. You can go as far back as the beginning of your session.

---

## The Forward button

The **→ Forward** button becomes active only after you have pressed Back. It re-applies a navigation step you have undone, moving you forward in history again. If you press Back three times, you can press Forward up to three times.

Forward is cleared when you navigate somewhere new after going Back. History is linear — if you go back and then click somewhere, that creates a new branch and the forward history is gone. This is the same behaviour as a web browser.

---

## What is NOT a history entry

**Facet filter changes do not create history entries.** Adding a filter, removing a filter, changing a filter value — all of these modify the current view in place. If you add five filters one after another, pressing Back once takes you past all of them to the previous navigation step, not one filter back at a time.

This is intentional: filtering is exploration within a view, not navigation to a new destination. The Back button respects that distinction.

---

## What is preserved

When you press Back, the restored view is exactly as you left it:

- Active facet filters are restored
- The layer selection (if you were in Entity context) is restored
- The scroll position in the card grid is approximately restored

Nothing is lost. You can explore freely — dive into an entity, follow links, traverse several relationships — and press Back repeatedly to unwind exactly back to where you started.

---

## Practical tips

**Press Back freely.** Exploring in Moire is low-risk. If you end up somewhere unexpected, Back always takes you home. You cannot break anything by navigating.

**Back is session-persistent.** The navigation history persists for the duration of your browser session. If you reload the page, the history is lost. This is a current limitation — a future version may persist history across reloads.

**The context header + Back = orientation.** If you ever feel lost, read the context header first (it tells you where you are), then press Back a few times to see the path you came from. The combination of these two tools means you are never truly lost in Moire.
