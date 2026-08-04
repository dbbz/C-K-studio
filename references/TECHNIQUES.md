# Techniques on top of C-K — research notes

Findings from a literature sweep, kept so the skills encode what the literature
supports rather than what is commonly repeated about C-K.

**Status: complete.** All five strands are in — C-K-native, imported techniques, TRIZ,
evidence/criticism, and provocation (§6f, the one that was outstanding: de Bono PO and
its movement operators, synectics, assumption reversal). §6f also carries the
frame-level finding about the creativity-training literature as a whole, which bounds
what anything in this file can claim.

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

## 6. Imported techniques — the closed-world family

TRIZ → SIT (Israeli simplification, early 1990s) → splits into **ASIT** (Horowitz) and
**USIT** (Sickafus, developed inside Ford from 1995). Treat these as **one family with
three dialects**, not three methods — they share two conditions and most of a toolset.

### The "crazy idea, then harvest" technique actually exists here

Two named, documented procedures match the pattern of *deliberately construct something
unrealistic, then systematically extract what's actionable*. Both are better specified
than anything in the popular creativity literature.

**Function Follows Form (SIT).** Invert the usual order. Instead of need → form, first
construct a **Virtual Product** — a form, often absurd — then interrogate it: *what is
this good for, who would want it?* The stated justification is Finke's creative-cognition
work (Geneplore model, *Creative Cognition*, MIT Press 1992): people are measurably
better at finding uses for a given form than at inventing a form for a given need.

**The Particles Method (USIT).** The full harvesting procedure, which is the part
popular accounts always leave vague:

1. Sketch the problem situation, then sketch the **ideal solution** — Sickafus's
   definition: *"does its job perfectly, costs nothing, and doesn't exist."* Add
   intermediate sketches until the morph is logical.
2. Mark **particles** (x's) exactly where change must happen. *Don't analyse areas with
   no particles.*
3. Particles are **magical** — they may do anything physical, chemical, biological or
   mathematical that makes technological sense. **"Whimsical effects are not allowed."**
   That single constraint is what separates this from fantasy.
4. Build an **and/or tree**: top = the ideal solution stated *compoundly*; next level =
   its clauses; then work backwards through the sketches asking *what are the particles
   doing here to accomplish that clause* → **actions**. Decompose terminal actions into
   the **properties** particles must have.
5. **Translate back**: particle actions become **functions** of real objects; particle
   properties become **active attributes**. Attributes that appear across different
   clauses are the best leads; ones implying contradictions are "potent starting points."

**Mapping to C-K.** This is an **attribute generator** — K→C, then C→C. The ideal-solution
sketch behaves like a concept (undecidable, not-yet-existing); the tree decomposition
manufactures candidate attributes; the translation step hands them to partitioning. It
does *not* replace the undecidability gate, and its output still has to pass it.

### The two conditions

**Closed World** — all building blocks for the solution are already present in the
problem, the product, or its immediate environment; the solution is a *reorganisation* of
existing objects. Horowitz's empirical claim: elegant inventive solutions never introduce
entirely new component types. Functionally it converts an open design problem into a
**puzzle**.

**Qualitative Change** — in the problem state, the unwanted effect worsens monotonically
as some *main problem factor* increases. An inventive solution **eliminates or reverses**
that relationship — graphically, moves the problem characteristic **to zero slope**.

### The tension with C-K, stated honestly

The closed world forbids importing new objects. C-K's whole K-phase doctrine is the
opposite: *"out of the box thinking requires knowledge from out of the box"* — import more
knowledge than the room possesses. These are genuinely opposed prescriptions.

The reconciliation worth using: the closed world is a disciplined generator of **R3
moves** (reattribute the property to another entity already in the situation). That is
precisely the smart-cart/shopper's-phone move. So use it when a branch is stuck on an
attribute the object can't carry — and do **not** use it as a general stance, because as
a general stance it forecloses exactly the expansive partitions C-K exists to find.

### Templates (ASIT / SIT)

Unification / Task Unification · Multiplication · Division · Breaking Symmetry /
Attribute Dependency · Object Removal / Subtraction. The authors identify **Attribute
Dependency** as the highest-yield.

**Evidence — the only quantitative validation in this whole area, and it is compromised.**
Goldenberg, Mazursky & Solomon (*Marketing Science* 18(3), 1999): six templates explained
**89%** of 200 award-winning print ads; **50%** of award-winners vs **2.5%** of
non-winners fit the templates; template-trained subjects out-produced controls. But every
validating study is authored by the method's originators, who are principals of the firm
selling it; there is **no independent replication**; the outcome measure is contest
success, not market performance; and the templates are largely absent from the later
advertising-creativity literature, which moved to divergence/relevance constructs.

## 6b. BioTRIZ — one genuinely useful empirical result

Vincent, Bogatyreva, Bogatyrev, Bowyer & Pahl (2006), *J. R. Soc. Interface* 3(9):471–482.
~500 biological phenomena, 270 functions, ~2500 conflicts, compressed into a **6×6** field
(*substance, structure, energy, information, space, time*, from "things do things
somewhere"). **PRIZM** is the technological matrix; **BioTRIZ** the biological one.

**The finding worth carrying into defixation:** at scales up to 1 m — where nearly all
technology sits — problems are solved by manipulating **energy up to 60% of the time**,
then material. Biology at the same scales solves predominantly through **information and
space/structure**. Over 300 synthetic polymers exist and none matches proteins, whose
advantage is informational rather than energetic; insect cuticle spans orders of magnitude
in stiffness with one material.

**Corrections to what usually gets repeated:**
- The **0.12** similarity is a matrix-similarity between the *principles recommended* by
  PRIZM vs BioTRIZ for the same conflicts — **not** "biology and technology are 12%
  similar." Only *structure/space* (0.73) is strongly similar.
- The worked example in that paper is a **cat's-claw tyre**, not building insulation.
- The authors' own caveat: their dataset is **less than a thousandth** of TRIZ's, and the
  6×6 compression "blunts the contradictions tool."

The same paper is also the best published debunking of biomimicry's founding myths
(Crystal Palace, Eiffel Tower, sharkskin swimsuits, polar-bear hair). The boxfish-car
rationale has since been formally refuted — Van Wassenbergh et al. (2015) show boxfish
carapaces are *destabilising*.

**Directly relevant C-K paper:** Salgueiredo & Hatchuel (2016), *AI EDAM* 30(2):159–170,
"Beyond analogy: A model of bioinspiration for creative design" — argues bioinspiration is
**not** reducible to one-way analogical transfer. It requires expansion in *both* knowledge
bases, source and target. Copying a biological solution without expanding biological
knowledge does not work.

## 6c. Morphological analysis — noted, but a different animal

Zwicky (1969); Ritchey, *J. Operational Research Society* 57(7), 2006. Parameters ×
discrete values = a field; **Cross-Consistency Assessment** judges each *pair* of values
for compatibility, and the residue is the solution space.

Its one transferable insight: **configurations grow exponentially, pairwise assessments
only quadratically** — a field of 100,000 configurations needs a few hundred pairwise
judgements. Typical solution space is 1–10% of the problem space.

**But it is enumerate-then-filter, where C-K is partition-and-expand.** It presupposes the
parameter list, which is exactly what an expansive partition revises. Recorded here for
completeness; **not** folded into any skill. Its documented pathologies are worth knowing
if anyone tries: over-constraint from treating indirect relations as direct, and lost
rationale when assessments aren't documented during the pass.

## 6d. Reality check — including on this tool's own premise

The skeptical strand. Several findings here **correct claims made earlier in this file**;
where they conflict, this section wins.

### On C-K itself

**The undecidability gate is not the rigorous criterion it appears to be.** Three
problems, worsening:

1. **The word is borrowed.** In logic, *undecidability* means the demonstrated
   non-existence of a decision procedure (Gödel, Church, Turing). C-K's "undecidable in
   K" means only *K does not currently entail p or ¬p* — ordinary epistemic
   incompleteness. Every unanswered question in the universe satisfies it.
2. **K is never formalised, so entailment can't be checked.** In every published
   application K is a natural-language list, so "is this undecidable in K?" is settled
   by the facilitator's judgement. A criterion that returns whatever the facilitator
   wants is not a criterion.
3. **The Forcing correspondence is an analogy graded by its own authors.** Hatchuel,
   Weil & Le Masson (2013) *interpret* Forcing as a design theory and find "common
   notions". There is no theorem, no independent verification by set theorists, and —
   decisively — it generates **no constraint on what a designer should do.** Nothing in
   a session would change if it were withdrawn.

**Published critique.** Coatanéa, Forest & Choulier (2010): C-K "appears incomplete for
engineering design"; its "ability both to effectively assist and direct the creative
process… is questioned". Choulier et al. (2011): function and structure — engineering
design's two central concepts — "remain outside the perimeter of CK", and its "real
operability scope… is probably limited compared with the initial ambition". These stand
unrebutted. Ullah et al. (2012): C-K's inference is *not* classical abduction and is
underspecified as published.

**KCP has zero controlled evaluations.** No control group, no comparison against another
method, no replication outside the originating school. Reported outcomes are of the form
"two new research lines were integrated into the agenda" — a description of what
happened, not evidence anything else would have done worse.

**Agogué's experiments do not validate C-K.** They test one narrow claim — *does an
example outside the dominant frame produce more original ideas than one inside it?*
(yes, N=160, with independent convergence from Chan et al. 2011). They do **not** test
the C/K duality, the four operators, the undecidability criterion, or partitioning as a
reasoning operation. C-K's real credit here is generating a *testable operationalisation*
— more than most design methods manage — but confirming a derived prediction is not
confirming the theory, especially when the prediction follows from plain associative
memory models too.

### Corrections to §2 and §3 above

**Fixation is not a fluency effect.** Jansson & Smith (1991) found idea *quantity*
unaffected in all four experiments. It is a variety-and-conformity effect. Watching for
"the team ran out of ideas" watches the wrong variable. Also worth knowing: that
foundational paper **reports no inferential statistics at all** — no p-values, no effect
sizes — and its famous "even professionals fixate" experiment has n=6 and n=7.

**Your own first idea fixates you harder than an external example.** Leahy et al. (2020):
participants given an example fixated *less* than controls fixated on their own
self-generated first concept. This is the most actionable finding in the whole sweep, and
it inverts the usual worry.

**Whether a stimulus is expansive depends on the audience, not the stimulus.** Cassotti
et al. (2015): the same example fixates adults and stimulates children. This is C-K's own
R1 arriving from the other direction — and it means a reusable library of "defixation
stimuli" is impossible in principle. Fu et al. (2013) make the same point for
near/far: the terms are relative to the stimulus set, with no absolute scale.

**"Don't copy this" mostly does nothing.** Vasconcelos, Neroni & Crilly (2018), **N=303**:
exposure to examples affected output, "whereas exposure to the instructions did not";
feature incorporation in discouraged groups was no different from no-instruction or
no-stimulus groups. **You can push a room toward a reference; you cannot push it away.**
Wang et al. (2023) list direct don't-copy instruction as consistently null.

This *complicates but does not kill* the category-abstraction finding (Ezzat et al. 2020),
which remains **single-lab and unreplicated**. Honest position: instruction effects are
inconsistent; the best-powered study found null; state prohibitions abstractly if you
state them at all, and do not rely on them.

**Expertise: my earlier framing was half wrong.** Experts do **not** fixate more on
external examples — Viswanathan & Linsey (2013) found faculty and novices "fixate to the
same extent". What differs: experts generate more non-redundant ideas, and **defixation
aids work on experts and do nothing for novices**. Wiley (1998) does support the
schema-fixation mechanism (domain knowledge created mental set, and generic instructions
didn't help). So: expertise relocates fixation inward rather than deepening it, and the
damning finding is that experts fixate equally **and cannot tell** — Linsey et al. (2010)
found faculty "only partially perceive" their own fixation; Bilalić et al. (2008) showed
chess masters who reported searching for alternatives were still eye-tracking the
familiar one. Self-assessment of one's own openness is worthless as a signal.

### The finding that most threatens this tool

**Wang, Okada & Takagi (2023)**, systematic review of 53 experimental studies:
*"Elimination of fixation leads to an increase in solution rates of closed-ended problems.
However, in open-ended problem solving, defixation does not necessarily lead to an
improvement in the performance of problem solving."*

Design problems are open-ended. So the chain **defixate → better designs is empirically
unestablished for exactly the problem class this tool addresses.** Defixation reliably
changes *what kinds of ideas appear*. That it produces *better outcomes* is inference.
Note also that review reports **no quantitative meta-analysis and no standardised effect
sizes** — anyone quoting an effect size for a defixation technique is inventing it.

### The gap this tool doesn't address at all

**Rietzschel, Nijstad & Stroebe (2006):** groups *and individuals* fail to select their
most creative ideas from their own pool; selection systematically favours feasibility
over originality. Generation and selection fail independently, so fixing generation buys
nothing if selection is naive. This may be the dominant failure mode of ideation — and
this tool has no selection step, which is either a gap or an accidental virtue. C-K's own
P-phase prohibition on down-selecting is aligned with the finding.

### For Stage 2 (workshop mode), if it is ever built

- **Verbal group brainstorming was falsified in 1958** (Taylor et al.) and never
  recovered. Nominal groups — individuals working alone, ideas pooled — out-produce real
  ones; the loss grows with group size (Mullen et al. 1991 meta-analysis).
- **The mechanism is production blocking** (Diehl & Stroebe 1987, 1991): only one person
  speaks at a time, holding an idea degrades it. Evaluation apprehension and free-riding
  were experimentally reduced *without* recovering the loss. **This is structural — you
  cannot facilitate your way out of a queueing problem.**
- **Write before speaking** (Paulus & Yang 2000). But 6-3-5's specific parameters have
  never been validated; only the underlying principle has.
- **"Defer judgment" lost head-to-head to debate-and-criticism instructions** across two
  countries (Nemeth et al. 2004). Replication status unclear.
- **Later ideas are more original** (Beaty & Silvia 2012, the serial-order effect). Argues
  against timeboxing for efficiency — stopping early keeps only the unoriginal half.
- **Participant satisfaction is a systematically biased quality signal** — the illusion of
  group productivity is documented (Stroebe et al. 2010): real groups believe they did
  better than nominal groups while doing worse.
- Not evidence, despite constant citation: Google's Project Aristotle (unpublished,
  uncontrolled), Sutton & Hargadon 1996 on IDEO (no control condition; never claimed
  groups out-produce individuals), Dane 2010 on cognitive entrenchment (theory paper, no
  data).

## 6e. TRIZ — a K→C engine with a restricted C→C repertoire

**The mapping, which is the useful part.** Every TRIZ tool operates on an object whose
identity is already settled: the matrix takes parameters *of a given system*; su-field
takes S1/S2/F *of a given system*; IFR says "without complicating *the system*"; ARIZ's
mini-problem literally reads *"with **minimum changes to the system**"*. TRIZ improves and
transforms a **known** thing extremely well.

So in C-K terms TRIZ is a powerful **K→C engine** — a knowledge base that supplies
attributes — with **no operator for revising the object's identity**. Use the 40
principles as an attribute source feeding a partition. Do **not** treat them as a
partitioning method; they cannot produce an expansive partition on their own, because
they presuppose the object that an expansive partition exists to revise. This is a scope
critique, not a validity one, and it is the honest reason C-K and TRIZ compose rather
than compete.

### Worth importing

**MATCEMIB field sweep — the best-evidenced ideation prompt found anywhere in this
sweep.** When a branch is stuck, walk eight field types and spend a couple of minutes on
each: **M**echanical, **A**coustic, **T**hermal, **C**hemical, **E**lectric,
**M**agnetic, **I**ntermolecular, **B**iological.

Belski, Livotov & Mayer (2016), *Procedia CIRP* 39:85–90 — 90 students, three arms,
identical task, 16 minutes. The su-field group beat **both** the no-prompt control **and
a random-word group**, on idea count *and* solution breadth. The random-word arm is a
proper active comparator, so this rules out "any prompt helps." It replicates an earlier
RMIT result. Note what it actually validates: *eight words naming field types*, not TRIZ
as a whole.

**Separation principles — a way to revive a refuted node.** When a concept was refuted
because something must be both P and not-P, the refutation may be premature. Four
questions, cheapest first:

| | Ask | If no → |
|---|---|---|
| **Time** | Must both hold at the same moment? | retractable landing gear; a fuse |
| **Space** | At the same point? | a knife: sharp edge, thick spine |
| **Condition** | Under the same condition? | photochromic glass; a shear pin |
| **Parts/whole** | At the same scale? | a bicycle chain: rigid links, flexible chain |

**Size–Time–Cost (STC/RVS)** — six thought experiments, each followed by re-describing
the problem: size → 0, size → ∞, time → 0, time → ∞, cost → 0, cost → ∞. The point is
not the answers but destroying the implicit scale assumptions that make the current
design look inevitable. This is the documented ancestor of the "take an attribute to its
limit" move already in `ck-defix`. Note it is *not* a step in ARIZ-85C, contrary to
common belief — it is a standalone psychological-inertia operator from earlier versions.

### Evidence — use the tools, disregard the epistemology

- **The patent study is undocumented.** Figures circulating range across two orders of
  magnitude (40,000 to 3 million). The most granular chronology records ~4,000 by 1948
  and ~5,000 by 1965 — Altshuller's *personal* analytical work. There is no published
  protocol, no sampling frame, no inter-coder agreement. Anyone citing "2.5 million
  patents" is not citing a documented study.
- **It selects on the dependent variable.** Patents judged inventive were coded and their
  commonalities reported. No base rate was ever established, so it cannot tell you that
  *applying* the patterns produces inventive results.
- **The matrix is questioned inside TRIZ itself.** ARIZ-85C contains no matrix step at
  all — it routes to the Standards, Separation Principles and Effects. Borgianni et al.
  (2021, *Design Science* 7) find principle selection is domain-dependent, not
  deterministic, undermining the domain-independence claim. No head-to-head test against
  random principle selection exists.
- **The 40 principles are near-unfalsifiable.** They are abstract enough that almost any
  solution retrofits to at least one, and the canonical example set repeatedly notes a
  single example demonstrating two or three simultaneously.
- **What does replicate:** a novelty/variety-up, fluency-down trade-off. Hernandez et al.
  (2012) found TRIZ improved variety and novelty while *decreasing* idea count — and were
  honest that much of it missed p<0.05. Same direction as Okudan et al. (2006) and Howard
  et al. (2008). Consistent with §6d: fixation and its remedies are not fluency effects.

## 6f. Provocation — the family that turns out to be mostly untested

The strand this file was missing. Short version: **the provocation family splits cleanly
into a part that has been tested and works, and a part that has been tested and doesn't.
The split is not where practitioners put it.**

### What de Bono's PO actually prescribes

Two stages, and only the first is ever quoted.

**Setting up the provocation** — five named methods: **escape** (deny something taken for
granted), **reversal**, **exaggeration**, **distortion**, **wishful thinking**. The output
is prefixed *po* to mark that it is not an assertion. `[E4]`

**Movement** — the operators for extracting value, and the real content of the method:
extract a **principle**; focus on the **difference** from the current situation; play it
**moment to moment** and see what happens next; take the **positive aspects**; find the
**special circumstances** in which it would have value. `[E4]`

Note what this is: not an idea generator but a **harvest procedure** — structurally the
same role as USIT's translate-back step (§6). That is the salvageable part.

### The evidence for PO itself: none found

No controlled test of PO, of any individual movement operator, or of the setup methods was
located. The surrounding programme fares no better. Moseley et al., *Frameworks for
Thinking* (CUP 2005), reviewing 42 frameworks: *"There is sparse research evidence to show
that generalised improvements in thinking performance can be attributed to training in the
use of CoRT or Thinking Hats tools."* Sternberg's *Handbook of Creativity* puts the
pragmatic school — de Bono its named exemplar — as *"concerned primarily with developing
creativity, secondarily with understanding it, but almost not at all with testing the
validity of their ideas."*

**On the "Venezuela result", which is the one thing defenders cite.** It exists: a
1970s Venezuelan evaluation reporting generalised improvement in pupils completing CoRT,
usually reached through a secondary source (Nickerson, 1999) rather than read directly.
Two things to hold about it. Venezuela ran **two** thinking-skills programmes under the
same ministry in that period, and the one with a substantial published evaluation record
is **Project Intelligence / Odyssey** (Harvard + Bolt Beranek and Newman) — a different
curriculum, and a common source of borrowed credit. And the closest thing to an
independent follow-up, an Australian study of CoRT-1 (Edwards & Baldauf, 67 Grade-7
students), found *"little evidence of generalisation… other than in the area of creative
thinking."*

Note the shape of that last result honestly: the domain where CoRT did show an effect is
the one this tool cares about. It is a single small study, and it does not rescue the
transfer claim the programme is sold on — but it is not nothing, and reporting it as
nothing would be the same sin this file catches other people in.

### The sibling technique that *was* tested, and failed

**Random entry / random word.** Malthouse, Liang, Russell & Hills (2022), *Cognition*
218:104937 — **pre-registered, N=592**. Treatment was Wikipedia's random-page generator
(four pages, summarise each in ≤10 words), against a mental-arithmetic control, across one convergent
forecasting task and two divergent fluency tasks. Result: **no improvement, and often
significant impairment.** Bayesian meta-analysis gave strong support for the null —
BF₁₀ ran 0.24–0.82 across all seven outcomes (fluency, judge-scored creativity, and
SemDis semantic-distance creativity in both divergent studies).

The authors' own diagnosis is the useful part: the stimulus was *too* random. They
conclude lateral stimulation *"may require such stimuli to be sufficiently task-related or
'optimally random'"*, and note that **failed attempts to connect an irrelevant stimulus may
have derailed trains of thought that were going somewhere.** `[E1]`

This converges with §6e from the other direction: in Belski et al., the su-field field
sweep beat a **random-word arm** used as an active comparator. Two independent lines, same
conclusion — **randomness is the weak form; a structured, domain-relevant prompt list is
the strong form.** Anything random this tool might add is already dominated by MATCEMIB.

Study 1 of the same paper also ran a **consider-the-opposite** arm — the closest tested
relative of assumption reversal — and found no main effect of treatment (p = .24). Scope
that honestly: it was a numerical forecasting task, not a design task, and
consider-the-opposite has support elsewhere as a *debiasing* technique. It is evidence
against reversal-as-an-instruction-to-participants, not against reversal as an analytic
move.

### What does survive: provocation as an artefact, not an instruction

**Smith, Kohn & Shah (2008)**, *Design Computing and Cognition '08*. Experiment 1
(n=56, 47 analysed) built frequency norms for a sketched invention task on four
dimensions — propulsion, medium, motion, number of parts. Experiment 2 (n=139, 119
analysed, ~20 per cell) crossed **example type** (typical vs novel, both drawn from
Experiment 1's own output) with **when it was shown** (before sketch 1, 2 or 3).

Result: the typical example lowered the novelty of the immediately following sketch **at
every stage**; the novel example raised it **at every stage**. Both effects persisted into
later sketches, and both were **stronger the earlier the example was seen**.

Caveat, and it matters: the paper reports cell means only — **no inferential statistics
for Experiment 2**, and one between-subjects sentence is left unfinished in the published
text. Treat it as convergent support, not as a decisive test. `[E2]`

Convergent it certainly is. Agogué's expansive-example result (§3, T1), Chan et al. 2011,
Vasconcelos et al. 2018 (§6d) and this all land on the same place:

> **The effective unit of provocation is a concrete, contrasting artefact placed in front
> of the designer. Not an instruction to be provocative, not a random word, and not a
> prohibition.**

And the timing result inverts standard practice. Provocation is normally held in reserve
for when the room stalls; the data say **give it before the first idea**. That also
composes with Leahy et al. 2020 (§6d) — your own first idea fixates you harder than an
external example — so the contrasting artefact should arrive *before* the thing that will
do most of the fixating exists.

### Synectics

Gordon (1961). Two directions: **making the strange familiar** (ordinary analysis) and
**making the familiar strange** — "distort, invert, or transpose" what is taken for
granted. Four mechanisms: **direct analogy** (how is this like that; biological sources
favoured), **personal analogy** (identify bodily with a component — Faraday "looking into
the middle of an electrolyte"), **symbolic analogy** (a compressed description
"purposefully wrong or illogical", approached as poetic response), **fantasy analogy**.

Evidence, such as it is:

- **Bouchard (1972)**, *J. Applied Psychology* 56(5):418–421 — a synectics-style
  personal-identification instruction vs standard brainstorming, 3 sessions, 9 problems.
  Synectics superior on **all 9**, statistically significant on **4**. The catch: *both
  arms were interacting groups.* Given production blocking (§6d), this shows synectics
  beats brainstorming, not that either beats the same people working alone. `[E1]`
- **Meador (1994)**, n=107 kindergarteners: gains for the synectics group, no
  gifted/non-gifted difference — and **the most creative children gained least**. `[E2]`
- **Gendrop (1996)**, *Creativity Research Journal* 9(1), n=97 nurses: significant gains
  in **originality**; fluency, flexibility and critical thinking null. `[E2]`

Old, small, run on children and nurses, measured on divergent-thinking tests, and sitting
inside the corpus shown below to be severely publication-biased. Of the four mechanisms,
**personal analogy is the one C-K has no substitute for** — it is a K→C attribute
generator that works by embodiment rather than by lookup, and it is the mechanism the one
adult study actually manipulated. Symbolic and fantasy analogy are a different matter; see
immediately below.

### The technique-level finding that cuts across this whole family

**Scott, Leritz & Mumford (2004)**, *Creativity Research Journal* 16(4):361–388. 70
studies, overall Δ = 0.68 across criteria. Buried in it is a course-content analysis that
is the sharpest thing found anywhere in this sweep about *which* techniques earn their
place.

Positively related to training effect size: **critical thinking** (r=.22, β=.26),
**convergent thinking** (r=.17, β=.12), **constraint identification** (r=.15, β=.07), and
**use of analogies**. Negatively related: **expressive activities** (r=−.27, β=−.24),
**illumination** (r=−.27, β=−.38), **imagery** (r=−.21), **elaboration** (r=−.19),
**metaphors** (r=−.18, β=−.22). On problem-solving criteria specifically the gap widens:
convergent thinking r=.44 and constraint identification r=.39, against expressive
activities r=−.42, imagery r=−.37, metaphors r=−.34.

The authors' summary: *"successful training courses devote less time and resources to
techniques that stress unconstrained exploration."* Their explanation is that what training
supplies is **heuristics for working systematically with knowledge you already have** —
which is, almost verbatim, what a partition operator is.

Two caveats. It is correlational across courses, with heavily confounded content
categories. And Sio & Lortie-Forgues (below) fault this specific moderator analysis for
dichotomising continuous moderators, for not testing each moderator's unique contribution,
and for often not reporting statistical significance. Directionally it is still the best
evidence available on the question, and it points one way: **structured beats
unconstrained, and it is not close.**

### The frame-level correction: what the whole literature is worth

**Sio & Lortie-Forgues (2024)**, *Psychological Bulletin* 150(5):554–585 — the largest
meta-analysis of creativity training to date, and the most important single result in this
file for calibration. 169 studies, 844 effect sizes, **48 of them unpublished**, five
decades.

- Unadjusted effect **g = 0.53**, in line with earlier meta-analyses including Scott et al.
- Every publication-bias adjustment method drops it to **0.29–0.32** (PEESE 0.32,
  trim-and-fill 0.30, RoBMA 0.29, top-10% 0.30). The authors call the bias *"severe"* and
  say it *"casts doubt on the representativeness of the published literature in the field
  and on the conclusions of previous meta-analyses."*
- Restricting to the highest-quality evidence — 19 studies meeting at least 3 of 4 quality
  indicators, and **no study met all four** — gives **g = 0.28**.
- Only **7%** of studies were powered at 80% to detect even 0.32. **5%** were replications.
  **One** study out of 169 was preregistered. Of the 72 using a verbal divergent-thinking
  test, over 40% reported only some of fluency/flexibility/originality.
- Publication year did not moderate effect size — the field *"being slow to adopt more
  rigorous research practices."*

What this does and does not do to this file. It does **not** retract anything here: the
strongest results cited above (Agogué, Ezzat, Belski, Vasconcelos, Malthouse) are direct
experiments on ideation, not training-programme evaluations, and the largest of them found
nulls, which is not what a bias-inflated literature produces. What it does is set the
ceiling. **A real but small effect, around a quarter of a standard deviation, is the most
any method in this file can honestly claim** — and that number comes from the literature's
own best-quality subset, not from its advertising.

## 7. Implications for this tool

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
8. **`ck-expand` gains the virtual-form move** (§6) — the documented version of "crazy
   idea, then harvest", with the two constraints that make it work: no whimsical
   effects, and translate particle *actions* into functions and *properties* into
   attributes.
9. **`ck-defix` gains the energy/information forcing move** (§6b) — the single
   empirically-grounded prompt in the imported set.
10. **`ck-learn` gains the cross-domain import caution** (§6b, Salgueiredo & Hatchuel) —
    borrowing from another field requires expanding knowledge *in that field*, not just
    lifting its answer.
11. **Do not adopt the closed world as a general stance** (§6). It forbids importing new
    objects, which is the opposite of C-K's K-phase doctrine. Use it narrowly, as an R3
    generator when a branch is stuck.
12. **Morphological analysis stays out** (§6c). Enumerate-then-filter presupposes the
    parameter list that an expansive partition exists to revise.
13. **Never add a random-word / random-entry move** (§6f). It is the one technique in this
    whole sweep with a pre-registered, adequately powered test against it: null to harmful,
    N=592. It is also already dominated by MATCEMIB, which beat a random-word arm head to
    head. If a prompt list is wanted, use the structured one.
14. **Provocation is delivered as an artefact and delivered early** (§6f). `ck-facilitate`
    and `ck-frame` should place the contrasting example *before* the first idea is
    generated, not hold it back for when the room stalls — the effect is largest earliest,
    and the designer's own first idea is the strongest fixator.
15. **`ck-expand` gains de Bono's movement operators as a harvest checklist, and only
    that** (§6f) — principle, difference, moment-to-moment, positive aspects, special
    circumstances. Marked `[E4]`, prescription only. They are the same move as USIT's
    translate-back step: what to do with a provocation you cannot build.
16. **Do not add imagery, symbolic analogy, fantasy analogy or "illumination" moves**
    (§6f). That cluster is the one measurably *negatively* related to training
    effectiveness, and it is also the cluster with no procedure for getting back to the
    problem. Personal analogy is the exception worth one line in `ck-learn`, as a K→C
    generator, scoped `[E2]`.
17. **Assumption reversal needs no new skill** — it is R2, already `ck-expand`'s core move.
    The discipline the evidence adds is *where* it goes: reversal is for **authoring** the
    partition and the taxonomy, not for instructing the room. Handed out as an
    instruction, its nearest tested relative was null.
18. **Calibrate every claim this tool makes to g ≈ 0.28** (§6f). Small and real. No skill
    should promise more, and none should imply that a session's value rests on the
    literature being stronger than it is.

## Sources

Le Masson, Hatchuel & Weil (2009), ICED'09 · Hatchuel, Le Masson & Weil (2004),
DESIGN 2004 · Hatchuel, Le Masson & Weil (2008), E&PDE'08 · Agogué, Kazakçi, Weil &
Cassotti (2011), ICED'11 · Agogué & Cassotti (2013), ICED'13 · Agogué et al. (2014),
*J. Creative Behavior* 48(1) · Ezzat et al. (2017), *PLoS ONE* 12(6) · Ezzat et al.
(2020), *JOCB* 54(1) · Agogué et al. (2015), *Psych. Aesthetics Creativity Arts* ·
Boudier, Le Masson & Weil (2022), AIMS · Zeiler (2012), ICDC2012.

Provocation strand (§6f): Malthouse, Liang, Russell & Hills (2022), *Cognition*
218:104937 — the pre-registered random-stimuli null · Smith, Kohn & Shah (2008), *Design Computing and
Cognition '08* · Scott, Leritz & Mumford (2004), *Creativity Research Journal*
16(4):361–388 · Sio & Lortie-Forgues (2024), *Psychological Bulletin* 150(5):554–585 ·
Bouchard (1972), *J. Applied Psychology* 56(5):418–421 · Gendrop (1996), *Creativity
Research Journal* 9(1) · Meador (1994), *J. Education of the Gifted* · Gordon (1961),
*Synectics* · Moseley et al. (2005), *Frameworks for Thinking*, CUP · Sternberg (ed.),
*Handbook of Creativity* · Edwards & Baldauf (1987), on CoRT-1 · Nickerson (1999), the
usual secondary route to the Venezuela claim.
