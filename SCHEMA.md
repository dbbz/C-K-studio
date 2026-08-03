# Session state — schema v3

A session is an **append-only event DAG in one file**. Nothing is ever edited or
deleted; the concept tree and the knowledge base are *derived* by walking a branch
back to the root and folding it (`lib/view.cjs → chainOf`, `foldEvents`).

Four things fall out of that choice rather than being built:

- **Provenance** — every event names the C and K it came from, so the link between
  the two spaces is structural, not a side note.
- **The timeline** — folding the first *n* events of a chain is the state after *n*
  operations. Rewinding is a fold, not an undo stack.
- **Branches** — a branch is a *name pointing at an event*. Creating one copies
  nothing, because the shared history is the same events, not a duplicate of them.
- **Auditability** — the operator sequence *is* the file. There is no separate log to
  drift out of sync with the tree.

```jsonc
{
  "version": 3,
  "title": "Beating hull speed",
  "brief": "One paragraph of what prompted the session.",
  "createdAt": "2026-08-03",

  "branches": { "main": 22, "always-in-transit": 23 },  // name → tip seq
  "head": "main",                                        // where mutations append

  "events": [
    {
      "seq": 8,                                  // globally unique, never reused
      "parent": 7,                               // ← the DAG edge; null at the root
      "branch": "main",                          // which branch appended it (provenance)
      "at": "2026-08-03T09:36:00Z",
      "actor": "claude",                         // claude | user
      "op": "K→C",                               // seed | C→C | K→K | K→C | C→K | prune
      "kind": "add-c",                           // add-c | add-k | set-status | annotate
      "from": { "c": ["C0"], "k": ["K2"] },      // ← the provenance edge
      "node": {
        "id": "C3",
        "attribute": "+ does not displace water",
        "partition": "expansive",
        "breaks": "the definition of a boat as a body supported by buoyancy",
        "proposition": "There exists a vessel that moves over water without displacing it.",
        "note": ""
      },
      "summary": "K2 supplied the attribute that broke buoyancy."
    }
  ]
}
```

## `from` — the field that does the work

| On event | `from.c` means | `from.k` means |
|---|---|---|
| `add-c` | the parent concept | the K entries that justified or seeded this partition |
| `add-k` | the concept this was learned *about*, or conjoined *from* | — |
| `set-status` | — | the K entries that decided it |

The fold reads `from.c[0]` as the parent and `from.k` as the node's `kRefs`, and for a
`C→K` entry it writes the link back onto the concept as well. The canvas uses those
edges directly: hovering a concept lights the knowledge it rests on, and hovering a K
entry lights the concepts that depend on it.

## Event kinds

- **`add-c`** — a new concept. `op` is `seed` for the root, `C→C` for an ordinary
  partition, `K→C` when new knowledge supplied the attribute. That distinction is
  worth recording: `K→C` is the operator people forget, and the log is where you see
  whether it ever fires.
- **`add-k`** — a new knowledge entry. `op` is `seed`, `K→K` for research, or `C→K` for
  a conjunction (which requires `from.c`).
- **`set-status`** — a concept changes status: `open`, `conjunct`, `refuted`, `abandoned`.
- **`annotate`** — a note on an existing node, changing nothing else.

## Node fields that carry theory rather than bookkeeping

**`partition`** — judged relative to the **parent's** object, never the root.
- `restrictive` — K already knows the attribute is compatible with this object.
  "A boat *with a sail*." Refines; never innovates.
- `expansive` — K does not know it is compatible, so adding it forces the object's
  identity to be revised. "A boat *that flies*."

Every expansive node carries **`breaks`**: which property of the received identity the
attribute violates. If you cannot name it, the partition is restrictive and mislabelled.

**`status`** on a concept.
- `open` — still undecidable against current K. The healthy state of a concept.
- `conjunct` — C→K fired; the concept gained logical status. Produces a K entry.
- `refuted` — K grew until the proposition is known false. Real knowledge, not failure,
  and *not* the same as `abandoned`.
- `abandoned` — still undecidable, deliberately set aside. Retrievable by rewinding.

**`status`** on a K entry is ordinary logical status: `true`, `false`, `uncertain`.
Uncertain K is **not** a concept. A concept is undecidable *by construction* — no
investigation settles it, because the object doesn't exist yet. Uncertain K is just
something you haven't looked up. Conflating the two is how C-K work degenerates into
brainstorming.

## Invariants enforced by `lib/ck.cjs`

1. Exactly one root: `from.c` empty, `partition: null`.
2. Every non-root `add-c` has an `attribute` and a `partition`.
3. Every `expansive` partition has a non-empty `breaks`.
4. `set-status … conjunct` requires an earlier `add-k` with `op: "C→K"` whose
   `from.c` includes that node. A conjunction that produced no knowledge did not happen.
5. Ids are allocated from the folded state and never reused. Nothing is deleted —
   pruning appends a `set-status` event.

## Branching

```bash
ck branch <session> <name> [--at N] [--from B]
```

sets `branches[name]` to the seq of the Nth event on branch `B`. **No events are
copied.** Two branches that share a prefix share the *same event objects*; they differ
only in where their walk starts. Folding either one gives an independent tree.

The earlier design wrote a whole new file per fork, duplicating the shared prefix. That
was wasteful and, worse, made "which timeline am I in" a filesystem question instead of
a session one. `lib/migrate-v3.cjs` converts such files, verifying that a fork's events
really are the prefix it claims before absorbing it as a ref.

Two rules that make branches meaningful rather than merely possible:

1. **Node ids are allocated across the whole file**, never per branch. `C12` denotes the
   same concept in every timeline, so branches can be compared. Per-branch allocation
   would let two different concepts both be `C12`.
2. **Mutations always append to `head`**, with `parent` set to the current tip. An event
   therefore records both *when* it happened and *on which line of reasoning*.

`divergence(events, tipA, tipB)` walks both chains to the last common event, which is
what the canvas shows as `@22 +1` — diverged at step 22, one step ahead since.
