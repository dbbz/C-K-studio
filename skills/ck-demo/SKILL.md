---
name: ck-demo
description: Load the worked C-K example — the hydrofoil hull-speed session — into the current project and walk the user through the moment the reasoning breaks open.
disable-model-invocation: true
---

# The worked example

A finished 24-event session showing what a C-K tree looks like when it fixates and
when it stops fixating. Use it to explain the method to someone who has never met it,
or to remind yourself what a good tree looks like before starting a real one.

## Load it

The example ships inside the plugin and is never written into a project unless asked.
Copy it into the user's project so they can branch from it and keep their edits:

```bash
mkdir -p sessions
cp "${CLAUDE_PLUGIN_ROOT}/sessions/example-hull-speed.ck.json" sessions/
ck view --open
ck render sessions/example-hull-speed.ck.json --label example
```

If `sessions/example-hull-speed.ck.json` already exists, do **not** overwrite it — the
user may have branched from it. Say so and open what is there.

Give them the **full URL including `?key=…`**; the server 403s without it.

## Walk them through it

The point of the example is a single contrast, and it is lost if you narrate all 24
events. Drive the timeline scrubber and stop twice.

**Stop at event 7.** The tree is at 0% expansive with both branches dead. Say what that
is: not a failure of effort but an accurate picture of what a century of naval
architecture actually did. Displacement hulls have a speed wall set by the wave they
make; every partition in the tree so far accepts the hull and attacks the wave. The
metrics panel is showing fixation, and nothing in the concept space can escape it,
because the escape is not in the concept space.

Then point at the K entry that arrives at event 7. It does not propose anything. It
changes what is *undecidable* — and a partition that was previously unthinkable becomes
merely unproven. This is the K→C move, and it is the whole mechanism: expansion came
from knowledge, not from trying harder to be creative.

**Stop at the `always-in-transit` branch.** Show the branch picker in the header. The
divergence readout (`@22 +1`) means: split at step 22, one step ahead since. Both
timelines share every event before 22 — branching copied nothing.

## What to say when they ask "so it's brainstorming?"

No, and the example is the argument. Point at the `breaks` field on the expansive node:
it names the property of a boat that the concept violates. A brainstorm has no such
field, so it has no way to tell a genuinely new idea from an enthusiastic one. Then
point at the operator sequence in the footer — the file *is* the reasoning, replayable
and auditable, which a whiteboard of sticky notes is not.

Offer to start them a real session with `ck-frame` when they've seen enough.
