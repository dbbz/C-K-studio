---
name: ck-frame
description: State the root concept of a C-K session and gate it against the undecidability test. Use when starting a design exploration, when the user describes a problem or goal to work on, or when an existing concept needs reformulating because it reads as a requirement rather than a concept.
---

# Framing the root concept

The single highest-leverage step. A root that fails the undecidability test produces
a tree of obvious answers no matter how well the rest of the session is run.

Read `${CLAUDE_PLUGIN_ROOT}/references/GRAMMAR.md` first.

## Procedure

### 1. Seed K before writing C

You cannot test undecidability against an empty K. Four to eight propositions defining
what is currently known and currently constraining is plenty.

**Research and present them; don't ask for them.** Supplying propositions from a blank
page is hard work and it is your job, not theirs. Correcting a list you put in front of
them is easy, fast, and produces sharper K — people who cannot generate a constraint
will immediately tell you when one is wrong.

```bash
ck add-k <session> --text "..." --status true --source "..." --op seed \
  --summary "Seeded the constraint everyone treats as a law of nature."
```

Include the constraint that makes the problem interesting. In the worked example
that's hull speed: the thing everyone treats as a law of nature.

### 2. Convert the user's framing into concept form

People arrive with goals, requirements, or solutions. None of those are concepts.

| They say | What it is | Reformulate to |
|---|---|---|
| "Cut delivery cost 30%" | a target | "There exists a delivery system with no marginal cost per drop." |
| "We should use drones" | a solution | Ask what property of delivery drones break. Then make *that* the concept. |
| "Our onboarding is too slow" | a problem | "There exists a product that is fully useful before it is configured." |
| "Can we do X with lithium-air?" | a K question | Run `ck-learn`. Come back after. |

The canonical form is literal and worth keeping literal:
**"There exists a ⟨object⟩ such that ⟨properties⟩."** The stiltedness is doing work —
it forces you to name an object rather than gesture at an outcome.

### 3. Run the gate

Put the candidate to K and take the answer seriously:

- **K settles it "yes"** → it exists. That's knowledge. Say so and push for the
  property that would make it *not* exist yet.
- **K settles it "no"** → record it as false K. Then ask which assumption in K
  produced the "no", and whether *that* assumption is the real object to attack.
  This move — refutation into re-framing — is where good roots come from.
- **K can't say** → you have a concept.
- **K hasn't been asked** → `ck-learn` first.

### 4. Check for solution smuggling

Read the candidate and ask: *does a product I can name already answer this?* If yes,
the root is a description of that product with the brand filed off. Widen it by
deleting the attribute that points at the known answer.

### 5. Write it

```bash
ck add-c <session> \
  --proposition "There exists a ... such that ..." \
  --k K0,K1 \
  --note "Undecidable against K0–K1 because ..." \
  --summary "Framed C0 against K0–K1."
```

The `--note` should record *why* K can't settle it. Future turns rely on that, and
writing it is a last check on yourself: if the reason is hard to state, the root is
probably not undecidable.

`--k` matters more than it looks: it records which knowledge the root was framed
against, so a reader scrubbing the timeline can see what was known at the moment the
concept was posed. That is usually the most interesting thing about a root concept.

## Present the framing before expanding

Show the user the root, the seeded K, and the sentence explaining the undecidability.
Keep it to the root, the two or three K entries that actually bind, and that one
sentence — the rest is on the canvas. Reading out all eight propositions spends their
attention before the session has asked them anything.

Then — rather than asking "is this the right object?", which invites a polite yes —
**state which object you chose, why, and what you are therefore *not* designing.** That
last clause is the one that draws a real objection, because it makes the cost concrete.
"We're designing the delivery system, which means we're not designing the vehicle" gets
a reaction; "does this look right?" does not.

Do not partition until that lands. A wrong root wastes every subsequent operator, and
reframing at step three costs one exchange.

## Put one contrasting example on the table before anyone has an idea

Alongside the root, show **one concrete concept from a region nobody would go to
unprompted**. Not a proposal, not something to build — a marker that the space extends
that way. One sentence is enough: *"For calibration: something in this space could look
like ⟨far-off concrete thing⟩. I'm not proposing it."*

This is the most consistently supported intervention in the whole research base, and its
timing is the part that gets lost. A contrasting example raises the novelty of what
follows at any point it is introduced, but **the effect is largest when it arrives before
the first idea** — and a designer's own first idea fixates them harder than any external
example does. So the window is now, at framing, not later when the tree looks stuck.

Two constraints on the example, both measured: it must sit **outside** the obvious class,
because a typical example standing alone *lowers* originality and fluency and wipes out
the advantage experienced designers otherwise hold; and it does **not** need to displace
the obvious answer — obvious and far-off shown side by side works nearly as well as
far-off alone. Flank, don't suppress. See `${CLAUDE_PLUGIN_ROOT}/references/TECHNIQUES.md` §3 and §6f.

Whether an example is far-off is a property of *this* designer's knowledge, not of the
example. Pick it against the K you just seeded, not against your own sense of surprise.
