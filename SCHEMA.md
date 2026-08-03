# Session state — schema v2

A session is an **append-only event log**. Nothing is ever edited or deleted; the
concept tree and the knowledge base are *derived* by folding the log
(`lib/view.cjs → foldEvents`).

Three things fall out of that choice rather than being built:

- **Provenance** — every event names the C and K it came from, so the link between
  the two spaces is structural, not a side note.
- **The timeline** — folding the first *n* events is the state after *n* operations.
  Rewinding is a fold, not an undo stack.
- **Auditability** — the operator sequence *is* the file. There is no separate log to
  drift out of sync with the tree.

```jsonc
{
  "version": 2,
  "title": "Beating hull speed",
  "brief": "One paragraph of what prompted the session.",
  "createdAt": "2026-08-03",
  "forkedFrom": { "session": "example-hull-speed.ck.json", "at": 9 },  // forks only

  "events": [
    {
      "seq": 8,                                  // index in the log; also the timeline position
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

## Forking

`ck fork <session> --at N --as <slug>` writes a new session containing `events[0..N]`
and a `forkedFrom` stamp. The original is untouched. This is how you go back to a
partition point and take a different route without losing the road already travelled —
which is the whole reason a designer would want to rewind at all.
