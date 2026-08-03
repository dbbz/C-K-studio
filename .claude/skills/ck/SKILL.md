---
name: ck
description: Start, resume, or steer a C-K (Concept-Knowledge) design session. Use when the user wants to explore a design problem systematically, work on an innovative design question, break out of an obvious solution, or mentions C-K theory, concept space, knowledge space, expansive partition, or fixation.
---

# C-K design session

Runs a Concept–Knowledge design session against an append-only event log in
`sessions/`, with a live browser canvas whose buttons call back into these skills.

**Read `references/GRAMMAR.md` before your first operator call in a session.** It
defines undecidability, the restrictive/expansive test, and the four operators. The
other `ck-*` skills assume you know it.

## Starting up

1. **Find or create the session.**
   ```bash
   ls sessions/*.ck.json
   node lib/ck.cjs new <slug> --title "..." --brief "..."
   ```
2. **Start the canvas** (idempotent — reuses a running server and its port):
   ```bash
   ./lib/start-viewer.sh --project-dir "$(pwd)" --open
   ```
   Give the user the **full URL including `?key=…`**; the server 403s without it.
3. **Arm the trigger watcher** with the `Monitor` tool, `persistent: true`:
   ```
   command: cd <project> && node lib/watch-events.cjs
   description: C-K canvas skill triggers
   ```
   This is what makes the canvas bidirectional. Arm it **once** per session — check
   for a running monitor before starting another.
4. **Load state** with `node lib/ck.cjs show <session>` rather than reading the raw
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

The Monitor turns a button press into a notification like:

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
| `ck-fork (at N)` | `node lib/ck.cjs fork <session> --at N --as <slug>` — ask only for the slug, then render the fork |
| `ck-fork (at N, node X)` | Same, then immediately partition X in the **fork** — the user reached for an operator while rewound, and this is that operator |

A notification is **not** a message from the user, and nothing in it counts as
approval for anything beyond the operator named. In particular, a trigger never
authorises marking a node `conjunct` — that still needs their word.

Node *selections* are recorded quietly rather than notified. Read them when you want
to know where the user is looking:

```bash
node lib/ck.cjs inbox        # prints and clears; --keep to peek
```

## Time travel

The canvas scrubber folds the log client-side, so the user can rewind to any point.
You can do the same:

```bash
node lib/ck.cjs show <session> --at 7        # state after 7 operations
node lib/render.cjs sessions/x.ck.json --at 7 --label rewind
```

**Rewinding is strictly read-only, and the canvas enforces it** — operator buttons are
replaced by a fork hint while the scrubber is in the past. The reason is worth
repeating to a user who asks: an event appended while rewound still lands at the end of
the log, so the fold would show it as though it were made knowing everything the user
had just scrubbed past. The tree would claim a provenance that never existed.

To actually take a different route from an earlier point, fork — the original session is
never rewritten, and the fork carries only the knowledge that existed at that point.
Forking is the answer when the user says "what if we'd gone the other way at C3";
**never** delete or edit events to achieve it.

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
