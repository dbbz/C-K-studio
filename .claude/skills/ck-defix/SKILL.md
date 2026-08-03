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

Run the *survivors* through the undecidability test. Many limit-moves produce
propositions K refutes instantly — those are knowledge, and worth adding to K, but
they are not concepts.

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
