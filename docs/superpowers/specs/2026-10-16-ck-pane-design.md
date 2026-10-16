# C-K pane: the canvas inside the Claude app

Date: 2026-10-16. Status: implemented; see "Revisions after the live check" at the end for what changed.

## Goal

Give C-K Studio a visual canvas that lives inside the Claude app, as a pane docked
beside the conversation, so a session runs without a browser tab, a local server, a
`?key=` URL or a Monitor watcher. Pressing an operator on a node starts Claude's turn
on that node at once.

The browser canvas stays. It remains the canvas for terminal users and for presenting
a session; in the Claude app the pane takes its place.

## Decisions taken

| Question | Decision |
|---|---|
| Role relative to the browser canvas | Primary in the app; the browser canvas stays for the terminal and presenting |
| What a press does | Starts Claude's turn immediately, as the user's own message |
| Layout | B: an SVG map of the tree on top, a node picker under it, then the node's card and operators, then K |

## Non-goals

- Editing nodes from the pane. Every change still goes through Claude and `lib/ck.cjs`,
  which is where the invariants are enforced.
- Stage 2 (KCP workshop mode) and stage 3 (teaching mode).
- Replacing or changing the browser canvas, `ck-server.cjs` or `watch-events.cjs`.

## Where it lives

The pane is a hooks module of the `ck-studio` plugin itself, so one install carries the
skills and the pane:

```
hooks/hooks.json        { "modules": ["./register.tsx"] }
hooks/register.tsx      events: session.start, command.run, tool.call, prompt.compose,
                        ui.render (Pane), ui.close
hooks/model.ts          pure: session file → what the pane shows (fold, layout, messages)
hooks/map.ts            pure: tree layout → SVG markup
hooks/*.test.ts(x)      claude plugin test
types/index.d.ts        the $.state contract: interface PluginState { 'ck-studio': … }
lib/view.mjs            the pure fold, now canonical (see "One fold")
```

`plugin.json` gains `"types": "./types/index.d.ts"`. Nothing else in the manifest
changes.

During development the module runs from this session's mods folder under the name
`ck-pane`, so edits hot-reload. Moving it into the repo renames its state keys to
`ck-studio`.

## What the pane shows

Top to bottom, in one column, sized to the dock's width:

1. **Header.** A session picker when `sessions/` holds more than one `*.ck.json` (else
   the title alone), and a branch picker listing every branch with its divergence
   (`@22 +1`), the head marked.
2. **Timeline.** `◀  step n/N  ▶`, the `summary` caption of the event at the current
   step, and one line of health from `metrics()`: `64% expansive · 2 conjunctions ·
   6 open leaves`. Each of `metrics().warnings` follows as a warning-coloured line.
3. **Map.** On the desktop (and mobile) surfaces, one `Svg` with `isInteractive`, so
   `<title>` tooltips work on hover. Top-down tidy tree, one rounded box per concept
   labelled with its id. Fill encodes partition: restrictive blue, expansive orange,
   root neutral, using the README's validated palette (`#2a78d6` / `#eb6834` light,
   `#3987e5` / `#d95926` dark, switched inside the SVG by
   `prefers-color-scheme`). Status: `refuted` and `abandoned` are drawn at reduced
   opacity with a dashed outline; `conjunct` carries a check mark. Partition type is
   also carried by an `R`/`E` letter in the tooltip, never by colour alone. A ring
   marks the selected node; a second, dotted ring marks the node the current step
   added or changed. Each box's tooltip is `C6 [E] + has no hull — open` and the
   proposition. A one-line legend in native `Text` sits under the map.
   On the terminal surface, which has no `Svg`, the map is an indented text tree in
   the same place, one line per concept: id, `R`/`E`, attribute, status.
4. **Node picker.** A `Select` over the concepts in tree order, labelled
   `C6  + has no hull`. Defaults to the node the latest step touched, else the root.
5. **Node card.** Id, `R`/`E`, status, attribute, the proposition, `breaks` when
   present, the note when present, and the K ids it rests on.
6. **Operators.** For an `open` node at the tip of the timeline: Partition, Expand K,
   Test status, Defix. While rewound to an earlier step, or for a node that is not
   open, they are replaced by one **Branch from here** button and a line saying the
   past is read-only. This is the browser canvas's rule, for the same reason: an event
   appended while rewound would claim knowledge it never had.
7. **K.** Every K entry: id, status when not `true`, text, source. Entries the selected
   node rests on (its `kRefs`) are drawn emphasised; the rest dim.

An empty project (no `sessions/` or no `*.ck.json`) shows one line and a **Start a
session** button that submits `Start a C-K session with ck-studio.`.

## How a press reaches Claude

A press calls `$.prompt.submit({ text, asUser: true })`. The turn starts at once when
the session is idle; otherwise it waits for the running turn to end, and a toast says
`Queued: partition C6`.

| Press | Text submitted |
|---|---|
| Partition | `ck-expand C6 on example-hull-speed (branch main) — pressed in the C-K pane` |
| Expand K | `ck-learn C6 on …` |
| Test status | `ck-conjoin C6 on …` |
| Defix | `ck-defix C6 on …` |
| Branch from here | `ck-branch from C6 on example-hull-speed (branch main) at step 9 — pressed in the C-K pane` |
| Start a session | `Start a C-K session with ck-studio.` |

The branch named is the one being viewed, which may differ from `head`; the skill
switches head before operating (see "Skill changes"). As with canvas triggers today, a
press never authorises marking a node `conjunct`.

## Data and refresh

- The session list is `$.fs.list('sessions')` filtered to `*.ck.json`, read relative to
  the session's working directory. A file that fails to parse, or is not schema v3,
  is listed with its error and shown as a one-line message instead of a map.
- The open session's file is re-read when its `mtimeMs` changes. A `$.clock.every`
  timer started in `session.start` stats it once a second and lists `sessions/` every
  five seconds. A `tool.call` hook on `Bash` refreshes immediately after any command
  that mentions `ck`, so the map moves as soon as Claude mutates.
- Values in `$.state`, declared in `types/index.d.ts`:
  - `doc`: `{ file, mtimeMs, session }` of the open file, or `{ file, error }`.
  - `files`: the `*.ck.json` names with their titles.
  - `view`: `{ file, branch, at, node }`. `branch: null` follows `head`, `at: null`
    follows the tip, `node: null` follows the latest step's node. So a live session
    keeps moving until the user picks something, and a hot reload keeps what they
    picked.
- Folding happens while drawing, from `doc` and `view`, with the shared functions.

## Opening and closing

- `session.start` registers the `/ck-pane` command and opens the pane when the project
  holds a `*.ck.json`. Unasked, the desktop docks it; a narrow terminal keeps it
  undrawn until asked, which is the engine's rule.
- `/ck-pane` opens it on request, and the first `ck` command seen in a session opens it
  if it is not already open.
- `ui.close` records that the user closed it, so it is not reopened unasked in that
  session.

## Telling Claude the pane is there

While the pane is placed, a `prompt.compose` hook appends one `session`-scoped section,
`ck-studio:pane`:

> The C-K Studio pane is open in the Claude app and shows the session live. Don't run
> `ck view` or arm the canvas Monitor unless the user asks for the browser canvas.
> Messages ending "— pressed in the C-K pane" are the user pressing an operator there.

## One fold, not two

The pure functions in `lib/view.cjs` (`esc`, `chainOf`, `divergence`, `foldEvents`,
`metrics`, `renderTree`, `renderK`) move to `lib/view.mjs` as ES exports, which the
hooks module imports. A hooks module cannot load CommonJS, and `require` of an ES
module needs a newer Node than the plugin can assume.

`lib/view.cjs` becomes a generated file: `scripts/build-view.cjs` strips the `export`
keywords, appends the `SHARED` serialisation and `module.exports`, and writes it with a
"generated, edit view.mjs" header. CI runs the script and fails on a diff, the same
pattern as the README figures. `ck.cjs` and `render.cjs` keep requiring `view.cjs`
unchanged. `lib/view.d.mts` types the exports for the hooks module.

## Skill changes

- `skills/ck/SKILL.md`, Starting up: when the system prompt says the C-K pane is open,
  skip starting the canvas and arming the Monitor.
- `skills/ck/SKILL.md`, triggers: pane presses arrive as user messages of the forms in
  the table above. Act on them as on a canvas trigger; when the branch named is not
  `head`, `ck switch` to it first.
- `skills/ck-demo/SKILL.md`: in the app, point at the pane rather than the URL.
- README: a short "In the Claude app" section with a screenshot, the files table, and
  the CI step.

## Testing

- **Unit (`claude plugin test`).** `model.ts`: folding the hull-speed example at its
  tip and at step 7 matches `ck show` (concept count, statuses, open leaves); the
  tidy-tree layout gives no two boxes the same position and centres each parent over
  its children; message texts match the table. `map.ts`: the markup is under the
  131,072-character limit for a 200-concept tree and carries a `<title>` per node.
- **Pane (`claude plugin test`).** Mount the Pane on `desktop` and on `terminal` with
  the test answering `fs.list`, `fs.stat` and `fs.read` from the example session.
  Desktop draws an `Svg`, terminal a text tree; pressing Partition submits the right
  text; stepping back replaces the operators with Branch from here; an empty
  `sessions/` shows Start a session.
- **Generated fold.** `node scripts/build-view.cjs && git diff --exit-code lib/view.cjs`.
- **Live.** In this app with the hull-speed example: the pane docks, the map draws in
  both themes, the timeline steps, a press starts a turn that runs the right skill,
  and the map updates when Claude's `ck` command lands.

## Risks to check early

- **SVG theme.** Whether `prefers-color-scheme` inside an `Svg` follows the app's theme
  or the system's. If it follows the system, the map uses mid-tone colours legible on
  both backgrounds instead of switching.
- **Dock width.** The map scales to the dock. A wide tree (more than ~12 leaves in a
  narrow dock) shrinks its labels; if that proves unreadable, switch to a left-to-right
  layout above a leaf-count threshold.
- **Plugin name during development.** The installed `ck-studio` is disabled here, so
  the development copy runs as `ck-pane` to avoid two plugins of one name.

## Revisions after the live check

The live check (plan Task 7) found the first version hard to read and the map unable
to take a press. What changed from the sections above, and why (the last two points
came out of the final review):

- **A panel, not a column.** The single column was unreadable in the dock. The pane is
  now a header with the pickers, a bordered timeline bar with the health as chips,
  warnings in their own box, the map, then the tree beside the card and the knowledge
  in a dock of 100 columns or more, stacked in a narrower one. The map is a
  left-to-right tidy tree drawn to the dock's width: labelled when it fits, ids alone
  when not, scaled down past that.
- **A tree view replaces the node picker.** An `Svg` is drawn in a frame with no script
  and can never take a click, so the map cannot be the navigator. One button row per
  concept, keyed `node-<id>`, picks the node instead; each row carries its `R`/`E`
  letter, and `▸` marks the selected one, so neither is told by colour or chrome alone.
  The map stays as a read-only overview with a Hide/Show toggle (`isMapHidden` in
  `$.state`). The terminal draws no map; the tree view is its text tree.
- **A rewound banner.** While rewound, a banner under the timeline says the past is
  read-only and carries **Back to latest** and **Branch from here**; the card's
  operators give way to a caption. The rule is unchanged; the banner makes it hard to
  miss.
- **Keys, for navigation only.** `j`/`k` move between concepts, `h`/`l` step the
  timeline, `g` goes to the latest step. Nothing that starts a Claude turn has a key, so
  a stray keystroke never sends a message.
- **Knowledge first.** The K entries the selected concept rests on are listed first,
  under "Rests on", and the rest after, rather than emphasised in place among them.
- **What Claude is working on.** A press notes its text as pending before it is
  submitted; when a main-loop turn starts with that text, the pane says "Claude is
  working on: …" until the turn completes. Matching the turn's own text keeps a press
  queued behind another turn from claiming the one already running, and a turn no press
  started says nothing.
- **Opening on attach.** In the desktop app `session.start` has no page to draw on, so
  its open is not placed. The pane also opens on `session.attach`, and the section for
  Claude appears from then.
- **Section id `ck-studio:pane`.** The development copy ran as `ck-pane` and named its
  section `ck-pane:pane`; folded into the plugin, the section and the state keys are
  `ck-studio`'s, as specified. The `/ck-pane` command and the pane id `ck` keep their
  names.
- **Names it won't send, presses it won't repeat.** The node id, the file's slug and the
  branch name come from a file anyone can edit, and a press sends them as the user's own
  words, so a press whose names are not plain tokens (letters, digits, `.`, `_`, `-`; 64
  at most) sends nothing, and a toast says which name. The same press again while its
  prompt waits or its turn runs is dropped, unsaid.
- **The view follows head when head moves.** After Branch from here (or any `ck switch`)
  the pane goes back to head at its tip, so the new branch shows live rather than
  rewound. Picking a branch opens it at its tip; picking head follows head.
