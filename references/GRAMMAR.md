# The C-K grammar

Shared reference for every `ck-*` skill. Read this before operating on a session.

## Two spaces

**K** holds propositions with a definite logical status *for this designer, now*:
known true, known false, or not yet looked up. K is ordinary knowledge.

**C** holds propositions of the form *"there exists an object X with properties
p₁…pₙ"* whose status K cannot settle — neither provable nor refutable from what is
known. That undecidability is not vagueness or ignorance. It is structural: the
object does not exist yet, so no investigation can settle it. Only *designing* can.

Design is the co-expansion of both spaces. It terminates when a concept acquires
logical status — when C→K fires.

## The undecidability test — the gate everything passes through

For any candidate concept, ask K three questions:

| K's answer | What you actually have | Do this |
|---|---|---|
| "Yes, those exist" | Knowledge | Put it in K. Not a concept. |
| "No, that's impossible" | Knowledge | Put it in K as `status: false`. Not a concept. |
| "I can't say" | **A concept** | Add it to C. |
| "I'd have to look it up" | An unanswered question | Run K→K first, then re-test. |

The fourth row is the one that ruins C-K sessions. *Uncertain K is not a concept.*
"Do lithium-air batteries work?" is a literature search. "There exists a vehicle
that stores no energy on board" is a concept. Conflating them turns the whole
exercise into brainstorming with extra vocabulary.

## Restrictive vs expansive

Partition type is judged **relative to the parent node's object**, never relative to
the root. In the worked example, `+ supported by a submerged wing` is *restrictive*
under "a vessel that doesn't displace water" — once you accept a non-displacing
vessel, foils are a known means — even though its parent was expansive.

- **Restrictive** — K already knows the attribute is compatible with this object.
  It selects among known variants. Necessary, but it never generates novelty.
- **Expansive** — K does not know the attribute is compatible, and adding it forces
  the object's definition to be revised.

**The test:** name the property of the object's received identity that the attribute
violates. If you can name it, the partition is expansive and that name goes in
`breaks`. If you cannot, it is restrictive. There is no third option, and a node
that claims to be expansive without a `breaks` is rejected by `lib/ck.cjs`.

## The four operators

| Op | Name | Precondition | Result |
|---|---|---|---|
| **C→C** | partition | a node with `status: open` | one or more child concepts |
| **K→K** | learning | a branch whose progress is blocked by ignorance | new K entries, sourced |
| **K→C** | disjunction | new K containing a usable attribute | a new partition seeded by that attribute |
| **C→K** | conjunction | a leaf that K may now be able to decide | the concept gains status → new K |

K→C is the operator people forget. It is the *return path*: knowledge you acquired
while investigating one branch supplies the attribute that opens a different one.
In the worked example K3 ("wave drag belongs to displacement, not to boats") came
from studying the restrictive branches, and it is what made "does not displace
water" thinkable at all.

## What a conjunction actually requires

C→K fires only when the concept has acquired logical status — not when it merely
*seems* achievable, and not when you have decided to build it. A conjunction produces
knowledge: something is now known that was not known before. If you cannot write the
K entry, the conjunction has not happened. `ck.cjs` enforces this.

A branch that ends `refuted` is a success too. K grew; the space shrank honestly.
Only `abandoned` is neutral.

## Failure modes to watch for

1. **Brainstorm drift** — C fills with ideas that K could have settled. Every node
   should survive the undecidability test.
2. **Fixation** — every partition varies the same dimension (usually a performance
   parameter). Symptom: a low expansive ratio, or an open branch with no expansive
   step anywhere on its path. `ck-defix` hunts for this.
3. **Frozen K** — C expands for hours and K never moves. Without K growth there is
   no way to distinguish an expansive partition from a false one, and no route to
   conjunction. The viewer flags an empty K.
4. **Premature conjunction** — declaring a branch solved because it looks familiar.
   Usually means a restrictive partition was mislabelled expansive.
5. **Solution smuggling** — the root concept is written so that a known product is
   the obvious answer. Then the session is documentation, not design.
