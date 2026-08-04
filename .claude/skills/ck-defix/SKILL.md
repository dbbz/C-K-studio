---
name: ck-defix
description: Adversarial anti-fixation pass over a C-K tree - detect where the design reasoning has collapsed onto obvious answers and force alternative partitions. Use when the expansive ratio is low, a branch has no expansive step, the tree looks like a list of existing products, or the user feels stuck or wants to be pushed.
---

# Defixation

Fixation is the default state of design reasoning, not an occasional lapse. This pass
assumes the tree is fixated and looks for the evidence.

Read `references/GRAMMAR.md` first. Load state with `node lib/ck.cjs show <session>`.

## Detect

Work through all six. Report what you find with node IDs, not impressions.

1. **Low expansive ratio.** Under 30% across the tree. The renderer computes it.
2. **All-restrictive path.** An open leaf with no expansive step anywhere between it
   and the root. The renderer flags these by ID. It means an entire line of reasoning
   never questioned the object.
3. **Parameter fixation.** All siblings vary the same dimension — usually a
   performance number. Symptom: the attributes are comparatives (faster, cheaper,
   smaller) rather than structural changes.
4. **Product shadows.** Leaves that each name an existing product. The tree has become
   a market survey.
5. **Frozen K.** The `log` shows many C→C entries and no K→K. Without K movement,
   "expansive" is unfalsifiable — nobody can tell a breakthrough from a fantasy.
6. **Premature narrowing.** The first partition of the root was restrictive. Everything
   downstream inherits that framing, and no amount of later work escapes it.

## Force

For each fixation found, generate concrete alternative partitions. These moves are
mechanical — use them when inspiration doesn't arrive:

| Move | Question | Example |
|---|---|---|
| **Negate a constitutive property** | Which property has nobody questioned? | a boat that doesn't float |
| **Delete the object** | Who says there must be one at all? | delivery with no vehicle |
| **Invert the actor** | What if the user, the environment, or the object itself does it? | the building receives the parcel |
| **Change granularity** | One → many, or many → one? | cargo as a thousand self-guiding units |
| **Displace it in time** | Before the need, after the fact, or never? | the part arrives before it breaks |
| **Take an attribute to its limit** | Zero, infinite, or negative? | a battery with zero stored energy |
| **Swap the beneficiary** | What if it's designed for a non-obvious party? | packaging designed for the recycler |
| **Leave the energy attractor** | Is every partition manipulating energy or material? | solve it with structure or information instead |

That last one is the only forcing move here with a measured basis. Across ~2500 analysed
conflicts, technology at human scales resolves problems by manipulating **energy up to
60% of the time**, then material. Biology at the same scales resolves them predominantly
through **information and structure** — over 300 synthetic polymers exist and none
matches proteins, whose advantage is informational rather than energetic.

So "add power, add material, add strength" is not just one option among many; it is a
documented attractor. When a tree is full of it, the productive question is *what would
solve this with no extra energy and no new material — only a different arrangement or a
different piece of information?* See `references/TECHNIQUES.md` §6b.

Run the *survivors* through the undecidability test. Many limit-moves produce
propositions K refutes instantly — those are knowledge, and worth adding to K, but
they are not concepts.

## Two rules from the experimental evidence

These are not style preferences. Both are measured effects, and both are easy to get
backwards. Detail and sources in `references/TECHNIQUES.md` §3.

**1. State prohibitions at category level, never at exemplar level.**

Telling someone to avoid a *specific* common answer measurably **increases** fixation.
Stating the same prohibition as a **category** mitigates it, reportedly doubling
creative output.

| Don't say | Say |
|---|---|
| "Don't propose a parachute." | "Don't propose anything in the class *slowing the fall*." |
| "Not another subscription model." | "Nothing in the class *recurring payment for access*." |

So the taxonomy of restrictive branches you build during detection **is** the
intervention — it's not just diagnosis. Name the class, not the instance.

**2. Flank the obvious answer; do not suppress it.**

The instinct is to get the fixated solution off the table. The evidence says that isn't
necessary and the attempt is where the damage happens. A group given the fixated
example *and* an expansive one, side by side, performed close to groups given only the
expansive one. What reliably harms is a **restrictive example standing alone** — it cuts
both originality *and* fluency, and it wipes out the advantage trained designers
otherwise hold over engineers.

So when you report fixation, always pair it: name the class the tree is stuck in, and
put one concrete concept from an unvisited branch next to it. Naming the fixation
without supplying somewhere else to stand is the intervention that backfires.

## Why "just don't be obvious" fails

Defixation needs two capacities, and suppression only supplies one: **inhibiting** the
answer that arrives unbidden, and **expanding** toward somewhere else. Telling a designer
to avoid the obvious does the first and nothing of the second — which is exactly the
condition under which specific prohibitions were found to backfire.

Steering carries the same risk in sharper form. Per-idea feedback works when it is
correctly matched to the branch — but *mismatched* feedback is substantially worse than
saying nothing at all. If you are unsure which branch a concept belongs to, say nothing
rather than guess.

## Report

Lead with the diagnosis, then the proposals:

> **C2 → C7 → C11 has no expansive step.** Every attribute on that path refines a
> known object. The unquestioned property is *«the cargo travels inside the vessel»* —
> it appears in K1 and has been assumed at every node since.
>
> Three partitions that break it: …

Then propose the `add-c` calls but **do not run them unprompted**. Defixation
proposals are provocations; the user decides which are worth carrying. Adding seven
speculative nodes to their tree without asking is its own kind of vandalism.

## Tone

Be genuinely adversarial about the *reasoning* and not about the user. "This branch
never questions X" is useful. "You're being unimaginative" is not, and it's usually
wrong anyway — fixation is a property of how design problems are structured, not a
character flaw. Cognitive-psychology work on the effect (Agogué and colleagues) finds
it in experts as reliably as in novices; expertise deepens the K that makes the
obvious answer obvious.
