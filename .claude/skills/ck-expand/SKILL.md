---
name: ck-expand
description: Apply the C→C operator - partition a concept node into child concepts, labelled restrictive or expansive. Use when a C-K session has an open node that needs children, when the user asks to explore or branch a concept, or clicks "partition" on the canvas.
---

# C→C — partitioning a concept

Read `references/GRAMMAR.md` first. Partition type is judged relative to the **parent
node's** object, not the root.

## The craft move: negate the constitutive properties

Most people generate partitions by varying performance — faster, cheaper, lighter.
That produces restrictive partitions forever. The reliable route to expansive ones is
mechanical:

**Step 1. Write down the received identity of the object at this node.** Not what it
should do — what something must *be* to count as one of these at all. For "boat":

- it floats by displacing water
- it has a hull
- the cargo travels inside it
- it is a single object
- it is propelled
- it stays on the surface

Aim for six to ten. The good ones feel too obvious to write down. Those are exactly
the ones nobody has questioned.

**Step 2. Negate each in turn.** Each negation is a candidate expansive partition:
*a boat that doesn't float. A boat with no hull. A boat whose cargo travels outside
it. A boat that is many objects. A boat that isn't propelled.*

**Step 3. Run each candidate through the undecidability test.** Discard the ones K
settles — those are knowledge, not concepts. What survives is your expansive set.

**Step 4. Add restrictive partitions deliberately, not by default.** They're how a
branch gets close enough to reality to conjoin. Just know which you're writing.

## Quotas

- **3–6 children per pass.** More is a list, not a partition.
- **At least half expansive**, unless the node is deliberately in a convergence phase —
  and if so, say that out loud to the user.
- **Every expansive node names what it breaks.** `lib/ck.cjs` rejects it otherwise,
  and the rejection is the point: if you cannot name the violated property, you have
  written a restrictive partition and mislabelled it.

## Writing the nodes

```bash
node lib/ck.cjs add-c <session> --parent C3 \
  --attribute "+ does not displace water" \
  --partition expansive \
  --breaks "the definition of a boat as a body supported by buoyancy" \
  --proposition "There exists a vessel that moves over water without displacing it." \
  --k K3 \
  --summary "K3 supplied the attribute that broke buoyancy."
```

When new knowledge supplied the attribute, mark it `--op "K→C"` rather than letting it
default to `C→C`. That distinction is visible on the canvas and in the log, and it is
how you can later tell whether the return path from K ever actually fired.

Restrictive ones drop `--breaks`:

```bash
node lib/ck.cjs add-c <session> --parent C3 \
  --attribute "+ supported by a submerged wing" \
  --partition restrictive \
  --proposition "There exists a vessel lifted clear of the surface by foils." \
  --summary "Partitioned C3 — foils."
```

Give every node its own `--summary`. Each becomes one step on the timeline, so a
partition pass should read as a sequence of distinct moves rather than a batch.

## Self-check before handing back

1. Could K have settled any child? → it belongs in K, delete it from C.
2. Do all children vary the same dimension? → that's parameter fixation. Go back to
   step 1 and negate a *different* constitutive property.
3. Does one child obviously name an existing product? → mark it restrictive honestly,
   and note the product. Pretending it's expansive corrupts the metrics.
4. Is the expansive ratio in the render still under 30%? → run `ck-defix`.

## Then stop

Show the user the new children, flag which are expansive and what each breaks, and
let them pick where to go next. Do not cascade three levels deep unprompted — depth
without adjudication is how a C-tree turns into fiction.
