---
name: ck-conjoin
description: Apply the C→K operator - test whether a concept has acquired logical status and can be promoted into knowledge, closing a branch of a C-K session. Use when a leaf looks achievable or refuted, when the user asks whether a branch is done, or when they click "test status" on the canvas.
---

# C→K — conjunction

The terminating operator. A concept becomes a proposition with definite status, and
the design of that branch is complete.

Read `references/GRAMMAR.md` first.

## The test

Take the leaf's proposition and ask K, as it now stands, whether it holds.

- **K says yes, with evidence** → conjunction. The concept is now knowledge.
- **K says no, with evidence** → refutation. Also a real result: the space shrank and
  you know why.
- **K still can't say** → nothing happened. Leave it `open`. This is the normal
  outcome and you should expect it most of the time.

## The trap

Conjunction is *not*:

- "this seems buildable"
- "we've decided to do this one"
- "this resembles a product that exists"

Those are enthusiasm, prioritisation, and pattern-matching. The requirement is
narrow: **something must now be known that was not known before.** If you cannot
write that sentence as a K entry, the conjunction has not happened, and `lib/ck.cjs`
will refuse the status change — by design.

Watch for the commonest cause of a false conjunction: a restrictive partition that was
mislabelled expansive. If the branch closed suspiciously easily, re-read its `breaks`
line and ask whether it really violated anything.

## Doing it

Conjunction is two commands, in this order. The K entry comes first because it *is*
the conjunction; the status change is bookkeeping.

```bash
node lib/ck.cjs add-k <session> \
  --text "What is now known." \
  --status true \
  --source "<the evidence>" \
  --op "C→K" --for C4 \
  --summary "Conjunction of C4: the hydrofoil."

node lib/ck.cjs set <session> C4 --status conjunct --k K5 --summary "C4 closed."
```

`--for C4` is what makes it a conjunction *of that concept*, and it is how invariant 4
is checked. Without it the status change is refused.

Refutation is simpler — no C→K entry is required, since what you learned is ordinary
knowledge:

```bash
node lib/ck.cjs add-k <session> --text "Why it fails." --status false --source "..." --op "K→K" --for C1
node lib/ck.cjs set <session> C1 --status refuted --k K2 \
  --note "K2 settles this directly." --summary "C1 refuted by K2."
```

## Never decide alone

You do not have the user's situated knowledge, and logical status depends on it.
Propose the conjunction — name the leaf, name the K that settles it, quote the
evidence — and ask them to confirm. If they push back, the concept stays open and
their objection becomes a K entry with them as the source.

## After a conjunction

Two things are worth doing immediately, and both are easy to skip:

1. **Harvest the K.** A conjunction usually teaches more than the one entry recording
   it. What did building this branch reveal about the object? Those entries feed K→C
   elsewhere.
2. **Re-read the open leaves.** New K can decide branches you weren't looking at.
   Run `node lib/ck.cjs show <session>` and scan them against the new knowledge before
   moving on.
