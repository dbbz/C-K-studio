# C-K Studio

An interactive tool for running **Concept–Knowledge design sessions** (Hatchuel & Weil,
Mines ParisTech) with Claude as the generating and challenging half of the loop.

Not a brainstorm app. The difference is a gate: every node in the concept space must be
*undecidable* against the knowledge space, and every expansive partition must name the
property of the object's identity it violates. Those rules are enforced mechanically,
not by good intentions.

## Install

C-K Studio is a Claude Code plugin. From any session:

```
/plugin marketplace add dbbz/C-K-studio
/plugin install ck-studio@ck-tools
```

Then, in whatever project you actually want to think about:

```bash
ck new my-session --title "..." --brief "..."
ck view --open
```

Sessions are written to `sessions/` in your current directory, not into the plugin, so
they live and get committed alongside the work they're about.

Then talk to Claude, or press the buttons on the canvas — both drive the same loop.
Open the printed URL **including its `?key=…`**; the server rejects requests without it.

To see the shape of a finished session first, run `/ck-studio:ck-demo`. That's the
hydrofoil case: it copies the worked example into your project and walks you to
**event 7**, where the tree sits at 0% expansive with both branches dead — which is what
a century of naval architecture looked like. Event 7 is the piece of knowledge that
broke it open.

While the plugin is enabled, `bin/ck` is on the Bash `PATH`, so `ck` shadows any other
command by that name.

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
| `ck-facilitate` | all | Runs the whole session as practitioner — sequencing, diagnosis, when to stop |
| `ck` | — | Session hub: start, resume, route, handle canvas triggers |
| `ck-frame` | — | The undecidability gate. Rejects requirements dressed as concepts |
| `ck-expand` | C→C | Negate constitutive properties; label every partition; name what it breaks |
| `ck-learn` | K→K, K→C | Research aimed at decidability, sorted into deciding / refuting / attribute-bearing |
| `ck-conjoin` | C→K | A conjunction requires new knowledge; a refutation climbs and re-partitions |
| `ck-defix` | — | Six fixation signatures, seven forcing moves, and the two evidence-backed rules |
| `ck-map` | — | Render, assess, hand off |
| `ck-demo` | — | Loads the worked example and narrates it |

Skills live in `skills/` and are invocable as `/ck-studio:ck-frame`,
`/ck-studio:ck-expand`, and so on. `references/GRAMMAR.md` is the shared theory core they
all read; inside a skill it is addressed as `${CLAUDE_PLUGIN_ROOT}/references/GRAMMAR.md`,
because it ships with the plugin rather than living in your project.

## Architecture

A session is an **append-only event DAG in one file**. Events carry a `parent` seq;
`branches` maps a name to the seq it points at. The tree and knowledge base are
*derived* by walking a branch to the root and folding it. Four things fall out of that
rather than being built: provenance (every event names the C and K it came from), the
timeline (folding the first *n* events of a chain is the state after *n* operations),
branches (a name pointing at an existing event — creating one copies nothing), and
auditability (the operator sequence *is* the file).

```
sessions/*.ck.json ──fold──▶ render.cjs ──▶ .ck/viewer/content/*.html ──server──▶ browser
        ▲                                                                          │
        │                                                                    click │
   ck.cjs appends ◀── skills ◀── Monitor notification ◀── watch-events.cjs ◀── JSONL
```

**Bidirectional.** Canvas buttons don't just leave a note for later — `lib/watch-events.cjs`
runs under the `Monitor` tool and turns each press into a notification, so clicking
*partition* on a node wakes Claude and runs `ck-expand` without you typing anything.

**One renderer, two runtimes.** `lib/view.cjs` holds pure functions (`chainOf`,
`divergence`, `foldEvents`, `metrics`, `renderTree`, `renderK`) used in Node for the
initial paint and serialised into the page for scrubbing and branch switching. There is
no second implementation to drift out of sync.

**Tool and data are in different trees.** The plugin holds the code and the shared theory
docs; your project holds `sessions/` and `.ck/`. Every entry point takes that split
explicitly — `ck` resolves `lib/` from `$BASH_SOURCE` while leaving cwd alone, and
`render.cjs`, `watch-events.cjs` and `ck-server.cjs` all accept `--project-dir`
(defaulting to cwd). Skills address the plugin side as `${CLAUDE_PLUGIN_ROOT}` and the
project side as bare relative paths, which is the whole distinction in one line.

**`lib/ck.cjs` is the only mutation path.** It enforces the invariants in `SCHEMA.md` —
an expansive partition without a `breaks` is rejected, and a conjunction without a
backing `C→K` entry is refused.

**The server is deliberately dumb**: serve the newest HTML, push a reload on change,
append clicks to JSONL. Zero dependencies, SSE rather than WebSockets.

## Time travel

The scrubber folds client-side, so rewinding is instant and read-only. Arrow keys step
one operation at a time.

Operator buttons are withdrawn while the scrubber is in the past, and replaced by a
branch hint. That isn't timidity: an event appended while rewound would still land at
the tip of the current branch, so the fold would present it as though it were made
knowing everything you had just scrubbed past — a provenance that never existed.
Branching gives you the line *with only the knowledge that existed at that point*,
which is the thing you actually wanted.

```bash
ck show my-session --at 7                # state after 7 operations
ck branch my-session alt --at 7          # a different route from there
ck branches my-session                   # list, with divergence
ck switch my-session main
```

Branching never rewrites history — that's the point of an append-only log — and it
copies nothing: `branches[name]` is just a seq to start walking from, so two branches
sharing a prefix share the same event objects. Node ids are allocated across the whole
file, so `C12` means the same concept in every timeline and branches can be compared.

Since every branch ships inside the page, **switching timelines is a click in the
header** — instant and client-side. The picker shows divergence as `@22 +1`: split at
step 22, one step ahead since.

## Files

| Path | |
|---|---|
| `.claude-plugin/` | `plugin.json` and the self-hosted `marketplace.json` — the repo is its own marketplace |
| `bin/ck` | The `ck` command: resolves `lib/` relative to itself, leaves cwd alone |
| `lib/ck.cjs` | Event-DAG mutation CLI — branches and invariant enforcement live here |
| `lib/view.cjs` | Pure chain/fold/render functions, shared by Node and the browser |
| `lib/render.cjs` | Session → canvas HTML |
| `lib/ck-server.cjs` | Zero-dep viewer server (SSE reload + click capture) |
| `lib/migrate-v3.cjs` | Converts v2 one-file-per-fork sessions into v3 branches |
| `lib/watch-events.cjs` | Monitor script: canvas clicks → Claude notifications |
| `lib/start-viewer.sh`, `stop-viewer.sh` | Lifecycle |
| `scripts/check-skills.cjs` | Frontmatter gate — `claude plugin validate` doesn't cover skills here |
| `references/GRAMMAR.md` | The operator grammar and the undecidability test |
| `references/TECHNIQUES.md` | Literature notes: which techniques have evidence, which do not |
| `SCHEMA.md` | Event log format and the five invariants |
| `sessions/` | The worked example. *Your* sessions go in your own project, not here |

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

## Developing this repo

Install it from the working copy, so edits to skills and `lib/` take effect where you can
see them:

```
/plugin marketplace add .
/plugin install ck-studio@ck-tools
```

Before pushing, run what CI runs:

```bash
claude plugin validate . --strict     # manifests; does NOT read skills/
node scripts/check-skills.cjs         # frontmatter, which the above misses
for f in lib/*.cjs; do node --check "$f"; done
bash -n bin/ck lib/start-viewer.sh lib/stop-viewer.sh
```

`version` appears in both `.claude-plugin/plugin.json` and the marketplace entry; keep
them equal or `--strict` will say so.

## Colour

Blue = restrictive, orange = expansive, validated for colour-vision deficiency and
contrast in both light and dark modes. Partition type also carries an `R`/`E` badge, so
it is never encoded by colour alone.
