# C-K Studio

An interactive tool for running **Concept–Knowledge design sessions** (Hatchuel & Weil,
Mines ParisTech) with Claude as the generating and challenging half of the loop.

Not a brainstorm app. The difference is a gate: every node in the concept space must be
*undecidable* against the knowledge space, and every expansive partition must name the
property of the object's identity it violates. Those rules are enforced mechanically,
not by good intentions.

## Quick start

```bash
node lib/ck.cjs new my-session --title "..." --brief "..."
./lib/start-viewer.sh --project-dir "$(pwd)" --open
```

Then talk to Claude, or press the buttons on the canvas — both drive the same loop.
Open the printed URL **including its `?key=…`**; the server rejects requests without it.

To see the shape of a finished session first:

```bash
node lib/render.cjs sessions/example-hull-speed.ck.json --label example
```

That's the hydrofoil case. **Drag the timeline scrubber to event 7** — the tree sits at
0% expansive with both branches dead, which is what a century of naval architecture
looked like. Event 7 is the piece of knowledge that broke it open.

## The loop

```
   ┌──────── C→C partition ────────┐
   │                               ▼
 K→C disjunction              concept space
   ▲                               │
   │                          C→K conjunction
knowledge space ◀── K→K learning ──┘
```

| Skill | Operator | What it enforces |
|---|---|---|
| `ck` | — | Session hub: start, resume, route, handle canvas triggers |
| `ck-frame` | — | The undecidability gate. Rejects requirements dressed as concepts |
| `ck-expand` | C→C | Negate constitutive properties; label every partition; name what it breaks |
| `ck-learn` | K→K, K→C | Research aimed at decidability, sorted into deciding / refuting / attribute-bearing |
| `ck-conjoin` | C→K | A conjunction requires new knowledge, not enthusiasm |
| `ck-defix` | — | Six fixation signatures, seven forcing moves |
| `ck-map` | — | Render, assess, hand off |

Skills live in `.claude/skills/` and are invocable as `/ck-frame`, `/ck-expand`, and so
on. `references/GRAMMAR.md` is the shared theory core they all read.

## Architecture

A session is an **append-only event log**. The tree and the knowledge base are *derived*
by folding it. Three things fall out of that rather than being built: provenance
(every event names the C and K it came from), the timeline (folding the first *n*
events is the state after *n* operations), and auditability (the operator sequence
*is* the file).

```
sessions/*.ck.json ──fold──▶ render.cjs ──▶ .ck/viewer/content/*.html ──server──▶ browser
        ▲                                                                          │
        │                                                                    click │
   ck.cjs appends ◀── skills ◀── Monitor notification ◀── watch-events.cjs ◀── JSONL
```

**Bidirectional.** Canvas buttons don't just leave a note for later — `lib/watch-events.cjs`
runs under the `Monitor` tool and turns each press into a notification, so clicking
*partition* on a node wakes Claude and runs `ck-expand` without you typing anything.

**One renderer, two runtimes.** `lib/view.cjs` holds pure functions (`foldEvents`,
`metrics`, `renderTree`, `renderK`) that are used in Node for the initial paint and
serialised into the page for timeline scrubbing. There is no second implementation to
drift out of sync.

**`lib/ck.cjs` is the only mutation path.** It enforces the invariants in `SCHEMA.md` —
an expansive partition without a `breaks` is rejected, and a conjunction without a
backing `C→K` entry is refused.

**The server is deliberately dumb**: serve the newest HTML, push a reload on change,
append clicks to JSONL. Zero dependencies, SSE rather than WebSockets.

## Time travel

The scrubber folds client-side, so rewinding is instant and read-only. Arrow keys step
one operation at a time.

Operator buttons are withdrawn while the scrubber is in the past, and replaced by a
fork hint. That isn't timidity: an event appended while rewound would still land at the
end of the log, so the fold would present it as though it were made knowing everything
you had just scrubbed past — a provenance that never existed. Forking gives you the
branch *with only the knowledge that existed at that point*, which is the thing you
actually wanted.

```bash
node lib/ck.cjs show my-session --at 7            # state after 7 operations
node lib/ck.cjs fork my-session --at 7 --as alt   # take a different route from there
```

Forking never rewrites the original — that's the point of an append-only log. It's the
answer to "what if we'd gone the other way at C3", which is the only reason a designer
wants to rewind at all.

## Files

| Path | |
|---|---|
| `lib/ck.cjs` | Event-log mutation CLI — invariant enforcement lives here |
| `lib/view.cjs` | Pure fold + render functions, shared by Node and the browser |
| `lib/render.cjs` | Session → canvas HTML |
| `lib/ck-server.cjs` | Zero-dep viewer server (SSE reload + click capture) |
| `lib/watch-events.cjs` | Monitor script: canvas clicks → Claude notifications |
| `lib/start-viewer.sh`, `stop-viewer.sh` | Lifecycle |
| `references/GRAMMAR.md` | The operator grammar and the undecidability test |
| `SCHEMA.md` | Event log format and the five invariants |
| `sessions/` | Your sessions, plus the worked example |

## Status

**Stage 1 (built): the solo core.** Full operator set, canvas, invariants, fixation
detection, timeline, bidirectional triggers.

**Stage 2 (not built): KCP workshop mode.** The Knowledge–Concept–Proposal protocol for
facilitated group sessions: K-sharing rounds, concept projectors, multi-participant
capture, presentable outputs.

**Stage 3 (not built): teaching mode.** Worked-example walkthroughs, and a stricter
tutor that explains *why* a proposed partition is restrictive when you thought it was
expansive.

Both reuse the same event log, so they're additive rather than a rewrite.

## Colour

Blue = restrictive, orange = expansive, validated for colour-vision deficiency and
contrast in both light and dark modes. Partition type also carries an `R`/`E` badge, so
it is never encoded by colour alone.
