---
name: ck
description: Start, resume, or steer a C-K (Concept-Knowledge) design session. Use when the user wants to explore a design problem systematically, work on an innovative design question, break out of an obvious solution, or mentions C-K theory, concept space, knowledge space, expansive partition, or fixation.
---

# C-K design session

Runs a Concept–Knowledge design session against an append-only event log in
`sessions/`, with a live canvas whose buttons call back into these skills: a pane
beside the conversation in the Claude app, a browser page from the terminal.

**Read `${CLAUDE_PLUGIN_ROOT}/references/GRAMMAR.md` before your first operator call in a session.** It
defines undecidability, the restrictive/expansive test, and the four operators. The
other `ck-*` skills assume you know it.

## How to talk

**This is a conversation, not a report.** Their thinking is the scarce resource in the
session; every line you write is a line they read instead of think. Default to three or
four short sentences per turn, and treat anything past six lines as a bug.

- **The canvas holds the detail.** The tree, the notes, the `breaks` fields and the
  timeline are already written down. Restating them in prose is duplication the user has
  to wade through twice.
- **Say the move, show what changed, ask one thing.** Then stop. No preamble, no recap of
  the turn you just took, no trailer for the turn you're about to take.
- **One question per turn**, and a real one. Two questions get you an answer to the easier
  one.
- **Plain sentences, not documents.** No headers, no bold-labelled bullet lists, no tables
  in a conversational turn. If a turn wants structure, it is probably three turns.
- **Don't teach the method.** Explain C-K only if they ask. Naming what you did — "these
  all still assume a person shows up" — is the move; explaining why the move exists is
  not.
- **Short does not mean vague.** Cut the framing and the hedging, never the specifics. One
  concrete sentence beats a paragraph that circles it.

The exception is **written artifacts** — node propositions, K entries, `--summary`
captions, and the `ck-map` handoff document. Those are read later, out of context, by
someone who wasn't here. Write them properly.

## Starting up

When the system prompt says the C-K Studio pane is open, skip steps 2 and 3. The pane
shows the session live and refreshes after every `ck` command, so there is no server,
URL or Monitor to start. Start the browser canvas there only if the user asks for it.

1. **Find or create the session.**
   ```bash
   ls sessions/*.ck.json
   ck new <slug> --title "..." --brief "..."
   ```
2. **Start the canvas** (idempotent — reuses a running server and its port):
   ```bash
   ck view --open
   ```
   Give the user the **full URL including `?key=…`**; the server 403s without it.
3. **Arm the trigger watcher** with the `Monitor` tool, `persistent: true`:
   ```
   command: node "${CLAUDE_PLUGIN_ROOT}/lib/watch-events.cjs" --project-dir "${CLAUDE_PROJECT_DIR}"
   description: C-K canvas skill triggers
   ```
   The explicit paths are deliberate: unlike `ck`, the watcher is not launched through
   the Bash tool, so neither the plugin's `bin/` on `PATH` nor the working directory can
   be relied on here.
   This is what makes the canvas bidirectional. Arm it **once** per session — check
   for a running monitor before starting another.

   **Node loads the watcher once, at launch.** If you edit `watch-events.cjs`, the
   running monitor keeps executing the old copy and its notifications silently keep
   the old format. Stop it with `TaskStop` and re-arm, or you will debug a payload
   that was never actually wrong.
4. **Load state** with `ck show <session>` rather than reading the raw
   JSON. It prints the folded tree, K, the operation log, and the metrics.

## The loop

Each turn: one operator, applied, then hand back.

| The situation | Skill |
|---|---|
| No concept yet, or it reads like a requirement | `ck-frame` |
| A node is open and needs children | `ck-expand` |
| A branch is stuck for lack of knowledge | `ck-learn` |
| A leaf might now be decidable | `ck-conjoin` |
| The tree looks like a list of obvious answers | `ck-defix` |
| The user wants the picture, a report, or a handoff | `ck-map` |

Mutating commands re-render the canvas automatically. Pass `--summary "..."` on every
mutation — it becomes the timeline caption, and a session scrubbed back through
captionless events is unreadable.

## Canvas triggers — the return path

From the browser canvas, the Monitor turns a button press into a notification like:

```
TRIGGER ck-expand C6
TRIGGER ck-fork    (at 9)
```

**A trigger is the user asking for that operator on that node.** Act on it directly —
they have already told you what they want by clicking, so don't ask them to confirm
what the button plainly said.

| Trigger | Do this |
|---|---|
| `ck-expand <node>` | Invoke `ck-expand`, partitioning that node |
| `ck-learn <node>` | Invoke `ck-learn`, targeting that branch |
| `ck-conjoin <node>` | Invoke `ck-conjoin`, testing that leaf |
| `ck-defix <node>` | Invoke `ck-defix`, scoped to that subtree |
| `ck-branch on B @step N` | `ck branch <session> <name> --from B --at N` — derive a name, render, say it's renameable |
| `ck-branch <node> on B @step N` | Same. The node says which concept they were looking at — name the branch after it and **offer** to operate on it. The button said *branch*; partitioning as well is your inference, not their instruction |

A notification is **not** a message from the user, and nothing in it counts as
approval for anything beyond the operator named. In particular, a trigger never
authorises marking a node `conjunct` — that still needs their word.

On the browser canvas, node *selections* are recorded quietly rather than notified.
Read them when you want to know where the user is looking:

```bash
ck inbox        # prints and clears; --keep to peek
```

The pane writes nothing to the inbox: each press carries its node and branch in the
message.

### Pane presses

In the Claude app there is no Monitor: a press in the pane arrives as a **user
message**, in exactly one of these forms. Act on it as on a trigger, without asking them
to confirm what the button said.

| Message | Do this |
|---|---|
| `ck-expand C6 on example-hull-speed (branch main) — pressed in the C-K pane` | Invoke `ck-expand` on that node. `ck-learn`, `ck-conjoin` and `ck-defix` come the same way and map as in the trigger table |
| `ck-branch from C6 on example-hull-speed (branch main) at step 9 — pressed in the C-K pane` | `ck branch <session> <name> --from <branch> --at <step>`, with the message's branch and step — derive a name, say it's renameable. As with `ck-branch <node>` above, the node is what they were looking at, not an instruction to operate on it |
| `Start a C-K session with ck-studio.` | The start-up above |

The message names the session and the branch on screen. When that branch is not `head`,
`ck switch` to it first: mutations append to `head`, and the press was about the
timeline they were looking at. (A branch press needs no switch; `--from` names it.)

As with a trigger, a press never authorises marking a node `conjunct`.

## Time travel and branches

One session file holds every timeline. Events form a DAG through `parent` seq
pointers; a branch is a *name pointing at an event*, so creating one copies nothing.

```bash
ck branches <session>                   # list, with divergence
ck branch <session> <name> [--at N] [--from B]
ck switch <session> <name>              # move head
ck rename-branch <session> <old> <new>
ck drop <session> <name>                # removes the ref, never the events
ck show <session> [--branch B] [--at N]
ck render sessions/x.ck.json --branch B --at 7 --label rewind
```

On the browser canvas, every branch ships inside the rendered page, so the user
switches timelines by clicking a name in the header — instant, client-side, no
re-render needed. You'll see `{"type":"switch-branch","branch":"…"}` in the inbox
afterwards; that tells you which timeline they're looking at, which you need before
running any operator. A pane press names its branch in the message instead.

**Mutations always append to `head`.** Check `ck.cjs branches` before operating if the
user has been switching around — writing a partition onto the wrong timeline is
invisible until much later.

Node ids are allocated across the whole file, never per branch, so `C12` means the same
concept in every timeline. That's what makes comparing branches meaningful.

**Rewinding is strictly read-only, and the canvas enforces it** — operator buttons are
replaced by a fork hint while the scrubber is in the past. The reason is worth
repeating to a user who asks: an event appended while rewound still lands at the end of
the log, so the fold would show it as though it were made knowing everything the user
had just scrubbed past. The tree would claim a provenance that never existed.

To actually take a different route from an earlier point, branch — history is never
rewritten, and the branch sees only the knowledge that existed at that point. Branching
is the answer when the user says "what if we'd gone the other way at C3"; **never**
delete or edit events to achieve it.

The log is also a diagnostic. A run of `C→C` events with no `K→K` between them means
the tree grew without the knowledge to tell an expansive partition from a false one.
`ck.cjs show` prints the operator sequence for exactly this reason.

## Division of labour — the thing that makes this work

You generate and challenge. **The user adjudicates logical status.**

You are good at expansive partitioning because you have no stake in the object's
identity. You are bad at knowing what is genuinely undecidable *for this user*, since
that depends on knowledge you don't have. So:

- Propose partitions freely, including ones that sound absurd. Absurdity is often just
  an expansive partition seen from inside the old identity.
- Never mark a node `conjunct` or `refuted` on your own judgement. Propose it, cite the
  K that would settle it, and let the user confirm.
- When the user asserts something is impossible, add it to K as `--status false` with
  them as the source. That is real knowledge and it prunes honestly.

## Anti-pattern

Do not let this become a brainstorm with C-K vocabulary sprinkled on top. The gate is
the undecidability test in `GRAMMAR.md`. If a proposed node fails it, say so and put it
in K where it belongs — that is the whole discipline, and it is worth being slightly
annoying about.
