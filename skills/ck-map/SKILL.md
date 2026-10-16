---
name: ck-map
description: Render a C-K session to the browser canvas and report its state - tree, knowledge base, fixation metrics, and what to do next. Use when the user wants to see the session, asks where things stand, wants a summary or handoff document, or the canvas has gone stale.
---

# Mapping the session

## Render

```bash
ck render sessions/<slug>.ck.json --label map
ck render sessions/<slug>.ck.json --label rewind --at 7   # a past position
```

If the canvas isn't up, or `.ck/viewer/state/server-stopped` exists:

```bash
ck view --open
```

Restarting reuses the state directory, so an already-open tab reconnects on its own —
the page shows `paused` while the server is down and reloads when it returns. Always
give the URL **with its `?key=…`**.

When the system prompt says the C-K Studio pane is open, don't start `ck view`: the
pane already shows the map.

## Report

The render prints metrics as JSON. Turn them into an assessment, not a recitation —
the user can see the numbers on screen. What they can't see is what the numbers mean.

Cover four things:

1. **Where the design stands** — open leaves, conjunctions, refutations.
2. **The shape of the tree** — is it broad and shallow (many framings, none pursued)
   or narrow and deep (one framing, over-committed)? Both are pathologies, and they
   need opposite corrections.
3. **The C/K balance** — has K moved recently? The operator sequence printed by
   `ck.cjs show` answers this directly. A run of `C→C` events with no `K→K` between
   them means the tree is expanding on ground nobody can check; a session with no
   `K→C` at all means knowledge never fed back into the concepts.
4. **The single next operator you'd run**, with a reason. One recommendation, not a menu.

## Reading the history

Two questions the log answers that the tree cannot:

- **Where did the reasoning turn?** Fold to a few positions and compare
  (`ck.cjs show <session> --at N`). A jump in the expansive ratio marks the event that
  unlocked the space — usually a `K→K` finding, not a clever partition. In the worked
  example the ratio sits at 0% until event 7, then moves.
- **What did we know when we decided that?** Rewinding to a node's `seq` shows the K
  that existed at the time. Branches abandoned under thin K are worth revisiting now
  that K has grown, and they're invisible in the current-state view.

Point the user at the scrubber for this — it's faster to feel than to read, and the
arrow keys step through it one operation at a time.

## Handoff document

This is the one place in the session where length is allowed — it is read later, by
someone who wasn't in the room. Write the document properly, and keep the turn that
hands it over to a couple of sentences. Don't summarise the report in chat as well.

When the user wants something to share or keep, write
`sessions/<slug>-report.md` covering:

- the root concept and why it was undecidable at the time
- the K that was in play at the start, and what K→K added since
- each major branch: its attribute, what it broke, where it ended
- conjunctions with their evidence, and refutations with theirs
- what remains open, and what would decide it

Order branches by what they teach, not by tree position. A refuted branch that
revealed a false assumption is often the most valuable thing in the session, and it
will be buried if you just walk the tree in order.

## A note on the metrics

The expansive ratio is **this tool's invention, not the literature's** — no such metric
appears in the C-K corpus, and that is worth saying out loud when reporting it. What the
literature does say is adjacent and cautionary: counting-style measures are **biased**
estimators of concept-space expansion, because a session can score well while never
leaving one branch. Originality and category-shift are the endorsed proxies.

So the ratio is a smoke detector, not a score. A session in a convergence
phase *should* see it fall as restrictive partitions accumulate toward conjunction.
What matters is whether it fell because the work moved toward realisation, or because
nobody questioned the object. The `log` distinguishes these; the number alone doesn't.
Don't let the user optimise it.
