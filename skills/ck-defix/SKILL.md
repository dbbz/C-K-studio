---
name: ck-defix
description: Adversarial anti-fixation pass over a C-K tree - detect where the design reasoning has collapsed onto obvious answers and force alternative partitions. Use when the expansive ratio is low, a branch has no expansive step, the tree looks like a list of existing products, or the user feels stuck or wants to be pushed.
---

# Defixation

Fixation is the default state of design reasoning, not an occasional lapse. This pass
assumes the tree is fixated and looks for the evidence.

Read `${CLAUDE_PLUGIN_ROOT}/references/GRAMMAR.md` first. Load state with `ck show <session>`.

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

## When nothing above unsticks it: sweep the field types

The best-evidenced ideation prompt in the whole research sweep, and it takes five
minutes. Walk eight field types, pausing on each to ask *could this do the work?*

> **M**echanical · **A**coustic · **T**hermal · **C**hemical · **E**lectric ·
> **M**agnetic · **I**ntermolecular · **B**iological

In a three-arm controlled study this beat **both** a no-prompt control **and a
random-word group** — on idea count *and* solution breadth. The random-word arm matters:
it rules out "any prompt helps." Most forcing moves in this file are reasoned; this one
was measured.

**Never substitute a random prompt for this list.** Random stimulation is the one
technique in this area with a pre-registered, adequately powered test against it: N=592,
random Wikipedia pages, one convergent and two divergent tasks — **no improvement and
often significant impairment**, with a Bayesian meta-analysis strongly supporting the
null. The authors' reading is the useful part: the stimulus was *too* random, and failed
attempts to connect an irrelevant prompt appear to have derailed trains of thought that
were going somewhere. A prompt list earns its keep by being structured and plausibly
related to the domain, not by being surprising. See `${CLAUDE_PLUGIN_ROOT}/references/TECHNIQUES.md` §6f.

Its output is raw attribute material, so run the survivors through the undecidability
test before anything reaches C.

---

The energy/information move above is the other one with a measured basis. Across ~2500 analysed
conflicts, technology at human scales resolves problems by manipulating **energy up to
60% of the time**, then material. Biology at the same scales resolves them predominantly
through **information and structure** — over 300 synthetic polymers exist and none
matches proteins, whose advantage is informational rather than energetic.

So "add power, add material, add strength" is not just one option among many; it is a
documented attractor. When a tree is full of it, the productive question is *what would
solve this with no extra energy and no new material — only a different arrangement or a
different piece of information?* See `${CLAUDE_PLUGIN_ROOT}/references/TECHNIQUES.md` §6b.

Run the *survivors* through the undecidability test. Many limit-moves produce
propositions K refutes instantly — those are knowledge, and worth adding to K, but
they are not concepts.

## Three rules from the experimental evidence

These are not style preferences. All three are measured effects, and all three are easy
to get backwards. Detail and sources in `${CLAUDE_PLUGIN_ROOT}/references/TECHNIQUES.md` §3 and §6f.

**1. If you state a prohibition at all, state it at category level.**

Telling someone to avoid a *specific* common answer measurably **increases** fixation.
Stating the same prohibition as a **category** mitigates it, reportedly doubling creative
output.

⚠️ But hold this loosely. The category finding is **single-lab and unreplicated**, and the
best-powered study in the area (N=303) found that discouraging instructions of *any* kind
had **no effect** — feature incorporation in discouraged groups was no different from
groups given no instruction at all. The robust asymmetry is: **you can push a room toward
a reference; you cannot push it away.** So prefer rule 2 below, and treat prohibitions as
a weak instrument even in their best form.

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

**3. The contrasting example is worth most early, and this pass is usually too late.**

In a design-sketching experiment, a novel example raised the novelty of the following
design at *every* stage it was introduced, and a typical one lowered it at every stage —
but both effects were **strongest when the example came before the first sketch**, and
they persisted through later sketches. Pair that with the finding that a designer's own
first idea fixates them **harder** than any external example does, and the ordering is
forced: the contrasting artefact should arrive *before* the thing that will do most of
the fixating exists.

The practical consequence for this skill is uncomfortable: `ck-defix` is remedial by
construction, and remediation is the weaker position. When you run it, say so — and if
there is a next session or a next branch, get the contrasting example in at framing time
rather than saving it for the rescue.

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

Short and blunt. The diagnosis is one sentence — name the assumption and the path that
carries it — and each proposal is one line. A defixation pass that arrives as three
paragraphs reads as a lecture, and a lecture is the one register in which nobody concedes
a thing.

Be genuinely adversarial about the *reasoning* and not about the user. "This branch
never questions X" is useful. "You're being unimaginative" is not, and it's usually
wrong anyway — fixation is a property of how design problems are structured, not a
character flaw. Experts and novices fixate **to the same extent**; what differs is that
experts generate more non-redundant ideas, and that **defixation aids work on experts and
do essentially nothing for novices**. So this pass is worth more, not less, with someone
who knows the domain cold.

The genuinely damning finding is not that experts fixate more. It is that they fixate
equally **and cannot tell** — design faculty only partially perceive their own fixation,
and chess masters who report searching for alternatives are still, on eye-tracking,
looking at the familiar move. Treat "I've already considered the alternatives" as
uninformative, from anyone, including yourself.
