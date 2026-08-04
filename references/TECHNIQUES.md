# Techniques on top of C-K — research notes

Findings from a literature sweep, kept so the skills encode what the literature
supports rather than what is commonly repeated about C-K.

**Status: partial.** The C-K-native strand completed. Three further strands —
provocation techniques (de Bono PO, synectics, assumption reversal), TRIZ and its
published C-K integrations, and an evidence/criticism reality-check — were cut short
by a session limit and are **not yet done**. Do not treat their absence as a finding.

Evidence grades: `[E1]` randomised experiment · `[E2]` quasi-experiment / classroom ·
`[E3]` industrial case · `[E4]` prescription only, never evaluated.

---

## 1. What the literature does NOT support

Worth stating first, because these are the claims that circulate.

| Common claim | Actual status |
|---|---|
| Concept projectors are deliberately unrealistic / impossible / absurd | **Not supported by Mines sources.** They say *contrasted*, *surprising*, *not proposals for development*. "Impossible optimal solution direction" comes from Zeiler (TU Eindhoven, 2012), an outside adopter. |
| Provocation is a projector property | **Mis-transposed.** "Provocative examples" belongs to the **K phase**, not to projectors. |
| A named rule-set for generating expansive partitions exists | **Not in the papers.** Only the criterion (R1) plus worked heuristics (R2–R5). May exist in the 2010/2017 books, which the sweep could not access. |
| KCP has been experimentally validated | **No.** Le Masson/Hatchuel/Weil (ICED'09) lists lab evaluation of KCP as *future work*. Evidence is case-based. |
| An "expansive ratio" metric comes from the literature | **Not found.** ICED'09 argues **fluency is a biased estimator** of C-expansion — you can be fluent while staying in one branch — and endorses flexibility and originality instead. |

**The deep reason the "impossible concept" framing is wrong:** a concept is a
proposition with *no logical status in K*. A projector known false in K is not a
concept at all, and cannot be partitioned. The target is **undecidability**, not
impossibility. This is the same gate `ck-frame` enforces.

---

## 2. Fixation — the empirical core

**The hen's-egg paradigm** (Agogué, Kazakçi, Weil & Cassotti). Brief: *"propose as many
original solutions as possible: ensure that a hen's egg dropped from 10 m does not
break."* 10 minutes, individual, silent. Chosen because it needs minimal engineering
expertise — so fixation is attributable to heuristics, not ignorance.

Ten solution categories. Three are **restrictive** — damping the shock, protecting the
egg, slowing the fall. All three silently assume *a device*, and an *inert* one. Naming
that unstated attribute is what generates the other seven (interrupting the fall,
acting before/after the fall, living device, modifying the egg's properties, using the
egg's natural properties, using the environment's properties).

**Everyone is fixated, and expertise changes only its shape** `[E1]`, n=142 across six
populations: 63–81% of answers fall in the three restrictive categories. Psychology
undergrads 81%, engineers 76%, designers 63% (the best, still fixated). Engineers
answer "slowing the fall" more than others and "protecting" less — their knowledge of
falls makes them believe no shell would suffice. **More domain knowledge produces more
fixation, differently shaped.**

Children proposed wrapping the egg in foil; *no adult did*. Ten-year-olds know what
parachutes are, but that knowledge was not spontaneously activated. Hence the
model's key distinction: fixation is a failure of **activation**, not of possession.
That is precisely why K-injection works.

---

## 3. Defixation interventions with real evidence

### T1 — Expansive examples `[E1]`
Restrictive example in the brief ("the most common solution is a parachute") **reduces
both originality and fluency**. Expansive example ("train an eagle to catch the egg")
raises originality above control.

Two operationally critical corollaries:

- **The obvious solution does not need suppressing.** A group given *both* a
  restrictive and an expansive example, framed competitively, scored far above the
  restrictive-only group and not significantly below pure-expansive groups. You don't
  remove the fixated answer; you place something outside it alongside.
- **One bad example erases professional advantage.** Industrial designers exposed to an
  uncreative example behaved like engineers who saw no example at all.

**Authoring recipe:** pre-test the raw brief on naive subjects to locate the natural
fixation empirically → build the C-K map, naming the hidden shared attribute → take the
example from a branch the pre-test shows is rarely visited.

### T2 — Abstraction level of a prohibition flips its sign `[E1]`
Telling people to avoid common examples **stated specifically increases fixation**.
Stating the same prohibition **as a category** ("avoid solutions in the class *slowing
the fall*") mitigates fixation and reportedly doubles creative output.

Consequence: building a taxonomy of restrictive branches *before* a session is itself
the defixation instrument. Naive "avoid the obvious" briefs actively harm.

### T3 — Congruent minimal per-idea feedback `[E1]`
After each idea, classify it against a pre-built taxonomy and return exactly one of:
*"continue in this path"* (expansive) or *"search for another path"* (fixated).

n=60. Congruent feedback raised expansive solutions (M=6.75 vs control 4.70);
**incongruent feedback was far worse than no feedback** (M=2.75; d≈1.05 congruent vs
incongruent). A follow-up ruled out encouragement as the mechanism: constant feedback
regardless of content produced no effect. **The effect is content-contingency.**

This is the strongest argument in the literature for mapping the task *before*
facilitating — a facilitator steering against a misjudged taxonomy destroys originality.

### T4 — Heterogeneous fixations defixate better `[E1]`, preliminary
Leaders whose own fixations differ from the designer's give more correct directive
feedback. Supplies the mechanism for why KCP prescribes maximal disciplinary variety.

### Also
Originality **rises across a session** — the first solution is reliably less original
than the last. Argues for longer generation, against early stopping.

---

## 4. Rules for expansive partitioning

**R1 — the criterion.** If the added property is *already known in K as a property of
one of the entities concerned*, the partition is **restrictive**; if not, it is
**expansive**. Expansiveness is relative to a specific K and a specific entity —
"a house with a red roof" is restrictive because red-roofed houses exist. The
operational test is K-membership, not a judgement of surprisingness.

**R2 — name the hidden shared attribute, then negate it.** Enumerate existing
solutions; find the attribute they all silently share; make it explicit; take the
complement. This is how the tested egg-task stimuli were authored. *(This is already
`ck-expand`'s core move — independently validated.)*

**R3 — reattribute the property to a different entity.** Worked case: a team adds "a
display" to a smart shopping cart; knowledge about carts (weather, shocks, loads) makes
it expensive; the concept dies. Forced to model *displays* in K instead, they found
most shoppers already carry one — so a display is an attribute of **the user**, not the
cart. Procedure: when an attribute is being killed by knowledge about the object, model
the *attribute* in K, enumerate which other entities could carry it, and partition on
the carrier. `[E2]`

**R4 — hybridise with the object's channel-shifted twin.** Introduce a different
instantiation of the same function (the online "shopping cart") and build hybrids.
Reported to produce expansive partitions systematically, and to migrate the design
object up a level — from *a smart cart in a supermarket* to *a smart supermarket with
appropriate carts*. `[E2]`

**R5 — a refuted partition never kills its parent.** "C0+A1 false" does not imply "C0
false". On refutation: record which node was refuted, climb to the parent, and
partition it differently **using the knowledge the refutation just produced**. In the
ESA/CNES Mars-engine case this was the move that reopened a concept that looked
dead. `[E3]`

**R6 — breadth-first when alternatives are cheap and knowledge is dear.** The Mars case
failed initially by partitioning depth-first with many known attributes before
evaluating, so every scenario came out negative. `[E3]`, two cases — do not over-trust.

---

## 5. KCP, as actually specified

**K phase.** 6–10 half-days, all participants, **no idea generation**. Cover User,
Client, Company strategy, State of the art, Phenomenology. Deliberately import more
knowledge than the union of the room possesses — "out of the box thinking requires
knowledge from out of the box".

Its defixation payload, which is the most under-quoted instruction in the corpus:
collect and present **paradoxes, ambiguity, polysemy, strange cases, the object's
transformation over time (genealogy), and provocative examples** — and *do not resolve
the ambiguity*. These are K items that make the object's definition soft, which is the
precondition for an expansive partition being formulable at all.

**C phase.** 2-day residential, 20–40 people, sub-groups per projector, live access to
external knowledge, cross-group reuse expected ("coopetition"). Deliverable is a
**C-K diagram, not an idea list**; participants are told to *maximise expansions in C
and K*, explicitly **not** told to "be creative". Coaches must interrupt the natural
drift into K-talk and force explicit C-structuring — observed in every studied group.

**Projector authoring — the only published spec:** each projector adds *a few*
attributes to the (usually reformulated) root concept; the attributes must (1)
facilitate exploration in one direction, (2) be contrasted, (3) as a **set** of 3–6
reasonably cover the whole expansion of the root. Coverage is a set-level property —
you never judge a projector alone. They are explicitly **not** proposals; nobody is
meant to build them.

**P phase.** Produces a design strategy holding **multiple alternatives alive**, plus a
knowledge-acquisition plan, plus commitment across levels. **It is not a selection
committee** — the explicit purpose is to stop management converging on one apparently
dominant solution.

**Not documented anywhere in the peer-reviewed sources:** roles beyond "the organizers",
timings within the C seminar, participant selection rules, artefact templates, or any
P-phase process.

---

## 6. Implications for this tool

1. **Do not build a "crazy idea" skill** on the premise that projectors are absurd. The
   supported construct is *contrasted and undecidable*, and provocation belongs to K.
2. **`ck-defix` should state prohibitions at category level**, never at exemplar level
   — the specific form measurably backfires.
3. **`ck-defix` should offer an expansive example rather than suppressing the obvious
   one** — both can coexist.
4. **`ck-conjoin` needs R5**: a refutation must climb to the parent and re-partition
   using the new knowledge, not close the branch.
5. **`ck-expand` should gain R3 and R4** as named moves; R2 is already there.
6. **A `ck-steer` feature would be dangerous** without a pre-built taxonomy —
   incongruent steering is worse than none.
7. **The expansive-ratio metric has no literature basis.** Keep it as a smoke detector
   (as `ck-map` already says), and never as a score — fluency-like metrics are
   explicitly argued to be biased estimators of C-expansion.

## Sources

Le Masson, Hatchuel & Weil (2009), ICED'09 · Hatchuel, Le Masson & Weil (2004),
DESIGN 2004 · Hatchuel, Le Masson & Weil (2008), E&PDE'08 · Agogué, Kazakçi, Weil &
Cassotti (2011), ICED'11 · Agogué & Cassotti (2013), ICED'13 · Agogué et al. (2014),
*J. Creative Behavior* 48(1) · Ezzat et al. (2017), *PLoS ONE* 12(6) · Ezzat et al.
(2020), *JOCB* 54(1) · Agogué et al. (2015), *Psych. Aesthetics Creativity Arts* ·
Boudier, Le Masson & Weil (2022), AIMS · Zeiler (2012), ICDC2012.
