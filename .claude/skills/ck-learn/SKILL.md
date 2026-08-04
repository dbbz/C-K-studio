---
name: ck-learn
description: Apply the K→K operator - expand the knowledge space around a blocked branch of a C-K session, then feed what you learn back as K→C. Use when a concept branch is stuck for lack of knowledge, when K is empty or thin, or when the user clicks "expand K" on the canvas.
---

# K→K — expanding knowledge, and the K→C return path

K→K is not general research. It is research aimed at **changing the decidability of a
specific concept**. Always name the target node before you start.

Read `references/GRAMMAR.md` first.

## Procedure

### 1. State the question the branch is blocked on

Write it explicitly, as one sentence: *"What would have to be true for C6 to be
buildable?"* or *"Is the constraint in K2 a law, or an artefact of how it's usually
done?"*

The second form is disproportionately productive. Constraints in K are often
contingent — true of the usual implementation, not of the object. Finding that out is
what unlocked the worked example.

### 2. Research

Use `WebSearch` and `WebFetch`. Prefer primary sources: standards, specifications,
patents, papers, manufacturer data. Patents are especially good here — they document
attributes that were *tried*, which is exactly what K→C needs.

Keep each K entry to one proposition. Compound entries can't be referenced cleanly by
a concept node.

### 2b. Hunt specifically for the K that softens definitions

Not all knowledge helps a design. The C-K literature is unusually specific about which
kinds of K make expansive partitions *formulable at all*, and this instruction is the
most under-used thing in the method. Go looking for:

- **Paradoxes** — where the object's own field contradicts itself
- **Polysemy** — the several incompatible things the object's *name* denotes
- **Strange cases** — edge instances that barely qualify as the object
- **Genealogy** — what the object was before, and what it displaced. Objects that
  changed identity once are visibly capable of doing so again
- **Provocative examples** — cases far from established design rules, including from
  unrelated fields

Then the counter-intuitive part: **do not resolve the ambiguity you find.** The point is
not to arrive at the correct definition of the object. It is to leave its definition
*soft*, because a hardened definition is exactly what makes an attribute look
impossible rather than merely unknown.

One caution worth taking seriously: fixation is a failure of **activation**, not of
possession. Ten-year-olds asked how to drop an egg safely rarely mention parachutes —
not because they don't know what a parachute is, but because that knowledge doesn't come
to mind. So K→K is often not about acquiring anything new; it is about surfacing what
the designer already knows but never activates. Ask what they know that they haven't
thought to apply here.

### 2c. If you are importing from another field, expand *its* knowledge too

Borrowing from biology, another industry, or an unrelated discipline is a standard K→K
move and it fails in a standard way: the borrower lifts the *answer* without acquiring
the knowledge that makes the answer work, and the transfer doesn't survive contact with
the real problem.

The C-K analysis of bioinspiration makes this precise — it is **not** reducible to
one-way analogical transfer. It requires expansion in *both* knowledge bases, source and
target. So when you import: record what you learned about the **source domain's own
constraints**, not merely the mechanism you liked. If your K gains a solution but no
understanding of why the source arrived at it, the import will not hold.

The cautionary literature here is unusually blunt. A large share of canonical
"inspired-by-nature" designs turn out to be post-hoc storytelling — the Crystal Palace
water-lily, the Eiffel Tower femur, sharkskin swimsuits, and the boxfish-shaped car,
whose stability rationale was later refuted outright when boxfish carapaces were shown to
be *destabilising*. Evolution optimises reproductive fitness under phylogenetic
constraints, not your engineering objective, so "nature does it this way" carries no
presumption of fitness for your purpose. Record the mechanism and its evidence; do not
record the narrative.

### 3. Classify what you found

Every finding lands in exactly one of three buckets. Sort them explicitly:

| Bucket | Meaning | Next operator |
|---|---|---|
| **Deciding** | It settles the target concept | C→K — run `ck-conjoin` |
| **Refuting** | It shows the concept is false | Record as false K, mark node `refuted` |
| **Attribute-bearing** | It names a property, mechanism, or material you could add to *some* concept | **K→C** — the return path |

Anything that fits none of the three was tourism. Say so and drop it; padding K with
interesting-but-inert facts makes the space harder to reason over.

### 4. Record

```bash
node lib/ck.cjs add-k <session> \
  --text "One proposition." \
  --status true \
  --source "IEC 61851-23:2023 §6.4" \
  --op "K→K" \
  --for C6 \
  --summary "Attribute-bearing knowledge for C6."
```

`--for` records which concept the research was aimed at. That is the provenance edge
the canvas draws — hovering the K entry lights the concepts that depend on it — and it
is what lets someone reading the log later see *why* you went looking.

Use `--status uncertain` honestly. Uncertain K is a research lead, **not** a concept —
see the gate in `GRAMMAR.md`.

### 5. Fire K→C — do not skip this

This is the step people forget, and it's where the operator earns its keep. For each
attribute-bearing finding, ask: **which concept in the tree could take this attribute?**
Often it is *not* the branch you were researching. Knowledge gathered on one branch
routinely opens a different one.

```bash
node lib/ck.cjs add-c <session> --parent C0 \
  --attribute "+ ..." --partition expansive --op "K→C" \
  --breaks "..." --proposition "..." --k K7 \
  --summary "K7 supplied the attribute."
```

The `--op "K→C"` is not decoration. A session whose log contains no `K→C` events has
never fed knowledge back into the concept space, and that is one of the clearest
signs the two spaces are expanding in parallel instead of interacting.

## Report back

Give the user: what you were trying to decide, what you found with sources, which
bucket each finding fell into, and what it opened. If nothing changed the decidability
of anything, say that plainly — a K→K pass that expands K without moving C is a real
outcome and pretending otherwise wastes the next turn.
