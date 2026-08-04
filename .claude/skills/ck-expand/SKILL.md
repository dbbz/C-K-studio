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

This is the literature's own move, not a heuristic invented here — it is how the tested
defixation stimuli in the hen's-egg experiments were authored. See
`references/TECHNIQUES.md` §4 (R2).

**Note where the reversal happens.** This is assumption reversal, and it belongs to
*you*, authoring the partition. It is not an instruction to hand the user ("try
reversing your assumptions"). The tested relative of that instruction — asking people to
consider the opposite of their own answer — produced no effect, and the general finding
is that you can push a room toward a reference but not away from one. Do the reversal;
present the result.

## Two more moves, for when negation stalls

**Reattribute the property to a different entity.** When an attribute you just added is
being killed by knowledge about the object, stop modelling the *object* and model the
*attribute*. Then ask which other entity in the situation could carry it, and partition
on the carrier.

> A team adds "a display" to a smart shopping cart. Knowledge about carts — weather,
> shocks, loads — makes displays expensive, and the concept dies. Forced to model
> *displays* instead, they find most shoppers already carry one. A display is an
> attribute of **the user**, not of the cart. Almost every objection evaporates.

Each candidate carrier is a genuine expansive partition, because the object was not
known to have that attribute *there*. `[E2]` — TECHNIQUES.md R3.

**Hybridise with the object's channel-shifted twin.** Introduce a different
instantiation of the same function — the online "shopping cart" beside the physical one
— and build hybrids in C. Reported to produce expansive partitions systematically, and
to migrate the design object up a level: from *a smart cart in a supermarket* to *a
smart supermarket with appropriate carts*. That migration is what "revises the identity
of the object" concretely means. `[E2]` — TECHNIQUES.md R4.

## The virtual-form move: build the impossible thing, then harvest it

This is the disciplined version of "think of something unrealistic, then extract what's
usable". It runs *backwards* from an ideal, and it is an **attribute generator** — its
output feeds partitioning, it does not replace it.

1. **Sketch the ideal solution.** The working definition: *it does its job perfectly,
   costs nothing, and does not exist.* Do not moderate it toward buildability.
2. **Mark exactly where change must happen.** Only those places. Anything not marked is
   out of scope for this pass — the focus is most of the value.
3. **Let the marked places do magic — but only physical magic.** They may do anything
   physical, chemical, biological or mathematical that makes technological sense.
   **Whimsical effects are not allowed.** That one constraint is the whole difference
   between this and daydreaming.
4. **Decompose.** State the ideal *compoundly* ("the hole is square **and** passes all
   the way through"), split it into clauses, and for each clause work backwards asking
   *what would have to be happening here for that clause to hold?* Those are **actions**.
   Decompose each action into the **properties** required to perform it.
5. **Translate back into C-K terms.** Actions become **functions of real objects**;
   properties become **candidate attributes**. Attributes that recur across different
   clauses are the strongest leads. Attributes that imply a contradiction are better
   still — those are where an expansive partition is hiding.
6. **Gate the output.** Every candidate attribute still has to pass the undecidability
   test. Most won't, and the ones K refutes are knowledge worth recording — but they
   are not concepts.

Steps 4–6 are the part that matters, and the part popular write-ups omit. An
unrealistic idea with no harvesting procedure is not a technique.

**One caution.** A related family (SIT/ASIT/USIT) pairs this with a *closed world*
condition: forbid any object not already in the problem or its immediate environment.
That is a good generator of the reattribution move above — but it is the exact opposite
of C-K's doctrine that expansion needs knowledge from outside the room. Use the closed
world to unstick a specific branch, never as a standing rule. See
`references/TECHNIQUES.md` §6.

## The fallback harvest: five ways to move off a statement you can't build

Sometimes you end up holding a proposition that is plainly unbuildable and won't
decompose — a stray remark, a deliberately broken statement, something the user said and
then laughed at. Don't discard it and don't defend it. Run it through five questions and
keep whatever survives:

| Operator | Ask |
|---|---|
| **Principle** | What principle is at work here, separated from this silly instantiation? |
| **Difference** | What is different about this compared to the normal case? Start from the difference. |
| **Moment to moment** | Play it forward. What happens next, and next? Somewhere downstream is a usable state. |
| **Positive aspects** | Which single aspect of this has value, ignoring that the whole is unworkable? |
| **Special circumstances** | Under what circumstance would this be exactly right? Is that circumstance reachable? |

Whatever comes out is a **candidate attribute** and goes through the undecidability test
like anything else. This is de Bono's "movement" apparatus, and it is worth having for
one reason: it is a *harvest* procedure, the same job as step 5 of the virtual-form move
above. The generation half of that method — deliberately silly statements, random words —
is either untested or tested and failed, so don't import it. `[E4]`, prescription only;
see `references/TECHNIQUES.md` §6f.

## The first partition of a root: author a projector set

When partitioning the root concept itself, treat the children as a **set** rather than
as individual ideas. The KCP specification is the only published guidance:

- each is the (often **reformulated**) root plus *a few* added attributes;
- each attribute is **directional** — it commits that branch to one region;
- the branches are **mutually contrasted**;
- **as a set of 3–6 they reasonably cover the whole expansion of the root.**

Coverage is a set-level property. Never judge one of these alone — the question is
whether the group of them spans the field. And they are explicitly **not proposals**:
nobody is meant to build a projector, so do not soften one to make it buildable.

Check each is *undecidable* in K, not *false*. A branch known false in K is not a
concept and cannot be partitioned — which is why "make it deliberately impossible" is
bad advice, however often it is repeated. See `references/TECHNIQUES.md` §1.

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

Show the user the new children and flag which are expansive and what each breaks.

Then **recommend one and say why**, rather than offering a menu. A list of equal-looking
options asks them to make a call they have less information to make than you do, and
"which would you like to explore?" is usually answered by picking the most familiar one —
which is the branch least worth exploring. Naming your choice and your reason gives them
something concrete to disagree with, and disagreement is what you actually want.

Do not cascade three levels deep unprompted — depth without adjudication is how a C-tree
turns into fiction.
