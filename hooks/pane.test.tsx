import { expect, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { FsEntry, On, RenderPropsOf, RenderSurface } from 'claude-code'
import { HULL_SPEED } from './hull-speed.fixture'
import { OPERATORS, START_TEXT } from './model'

const FILE = 'example-hull-speed.ck.json'
const SURFACES = ['desktop', 'terminal'] as const

const PANE = {
  title: 'C-K',
  isFocused: false,
  bodyColumns: 60,
  placement: 'dock',
  scroll: { offset: 0, bodyRows: 24 },
  view: {},
} as const

/** The project as the test's hooks answer it; change a field and refresh to move it. */
type World = {
  /** The names `sessions/` lists; null when there is no `sessions/` (the list rejects). */
  names: string[] | null
  /** What each file's stat and list entry say, unless `mtimes` names the file. */
  mtimeMs: number
  /** Per-file modification times, by name. */
  mtimes: Record<string, number>
  /** What reading a file answers, by name; HULL_SPEED for any name not here. */
  texts: Record<string, string>
  /** The texts `prompt.submit` received, in order. */
  submitted: string[]
  /** How many times a file was read. */
  reads: number
}

/** The last part of a path: the engine hands the hooks beneath it absolute paths. */
const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1)

/** Answers, beneath the plugin, every call it makes outside `$.state`. */
function world(on: On, start: Partial<World> = {}): World {
  const w: World = { names: [FILE], mtimeMs: 1000, mtimes: {}, texts: {}, submitted: [], reads: 0, ...start }
  const textOf = (path: string) => w.texts[baseName(path)] ?? HULL_SPEED
  const mtimeOf = (path: string) => w.mtimes[baseName(path)] ?? w.mtimeMs

  on('fs.list', async (_$, e) => {
    if (baseName(e.path) !== 'sessions' || w.names === null) {
      return { deny: `ENOENT: no such file or directory, scandir '${e.path}'` }
    }
    const entries = w.names.map(
      (name): FsEntry => ({ name, kind: 'file', size: 1, mtimeMs: mtimeOf(name), isLink: false }),
    )
    return { value: entries }
  })
  on('fs.stat', async (_$, e) => ({
    value: { kind: 'file', size: textOf(e.path).length, mtimeMs: mtimeOf(e.path), isLink: false },
  }))
  on('fs.read', async (_$, e) => {
    w.reads += 1
    return { value: textOf(e.path) }
  })
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  // A press while an earlier press's turn runs toasts that it is queued.
  on('ui.toast', async () => ({ value: undefined }))
  on('prompt.submit', async (_$, e) => {
    w.submitted.push(e.text)
    return { text: e.text }
  })
  // The engine starting the turn a press's prompt begins (the test raises it).
  on('turn.start', async (_$, e) => ({ turnId: e.turnId }))
  return w
}

/** The person typing `/ck-pane`, which refreshes before it opens: the engine's `$` takes the whole input. */
async function refresh($: Engine) {
  await $.command.run({
    command: 'ck-pane',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 160 },
  })
}

/** What the helpers read of a drawing, on whichever surface it is mounted. */
type Drawing = Pick<Mounted, 'find' | 'findAll'>

async function openPane<P extends RenderSurface>(
  $: Engine,
  surface: P,
  props: Partial<RenderPropsOf['Pane']> = {},
): Promise<Mounted<P, 'Pane'>> {
  await refresh($)
  return $.ui.mount({ plugin: 'ck-studio', surface, component: 'Pane', requestId: 'ck', props: { ...PANE, ...props } })
}

/**
 * The map's Svg: the brief's `{ type: 'Svg', key: 'map' }`. An Svg element takes no
 * key (SvgProps has none, and the engine drops it), so the key `map` is on the Box
 * that holds the Svg and its legend.
 */
async function svgMap(ui: Drawing): Promise<unknown> {
  const map = await ui.find({ key: 'map' })
  return map?.children.find(child => (child as { type?: unknown }).type === 'Svg')
}

/** A drawn element as the kit describes it: its tag, its props (the key among them), its children. */
type Drawn = { type?: string; key?: string; props?: Record<string, unknown>; children?: unknown[] }

/** Every key in an element's subtree, its own included. */
function keysIn(node: unknown): string[] {
  const el = node as Drawn
  if (typeof el !== 'object' || el === null) return []
  const key = el.key ?? el.props?.key
  return [...(typeof key === 'string' ? [key] : []), ...(el.children ?? []).flatMap(keysIn)]
}

/** The strings in an element's subtree, in document order. */
function stringsIn(node: unknown): string[] {
  if (typeof node === 'string') return [node]
  const el = node as Drawn
  if (typeof el !== 'object' || el === null) return []
  return (el.children ?? []).flatMap(stringsIn)
}

async function operatorKeys(ui: Drawing): Promise<string[]> {
  const buttons = await ui.findAll({ type: 'Button' })
  return buttons.flatMap(b => (b.key?.startsWith('op-') ? [b.key] : []))
}

test('desktop draws the map above the tree, terminal the tree alone', async ($, on) => {
  world(on)

  const desktop = await openPane($, 'desktop')
  expect(await svgMap(desktop)).toBeDefined()
  expect(stringsIn(await desktop.find({ key: 'node-C6' }))).toContain('+ has no hull')
  await desktop.unmount()

  const terminal = await openPane($, 'terminal')
  expect(await terminal.find({ type: 'Svg' })).toBeUndefined()
  expect(stringsIn(await terminal.find({ key: 'node-C6' }))).toContain('+ has no hull')
  await terminal.unmount()
})

test('an operator press becomes the next turn', async ($, on) => {
  const w = world(on)
  for (const surface of SURFACES) {
    w.submitted = []
    const ui = await openPane($, surface)
    await ui.press({ key: 'op-ck-expand' })
    expect(w.submitted).toEqual([
      'ck-expand C12 on example-hull-speed (branch always-in-transit) — pressed in the C-K pane',
    ])
    await ui.unmount()
  }
})

test('rewinding swaps operators for a branch button', async ($, on) => {
  const w = world(on)
  for (const surface of SURFACES) {
    const ui = await openPane($, surface)
    await ui.press({ key: 'step-back' })
    expect(await ui.find({ key: 'op-ck-expand' })).toBeUndefined()
    expect(await ui.find({ key: 'branch-here' })).toBeDefined()

    await ui.press({ key: 'branch-here' })
    expect(w.submitted.at(-1)).toBe(
      'ck-branch from C10 on example-hull-speed (branch always-in-transit) at step 22 — pressed in the C-K pane',
    )

    // Forward from the step before the tip follows the tip again.
    await ui.press({ key: 'step-forward' })
    expect(await ui.find({ key: 'op-ck-expand' })).toBeDefined()
    expect(await ui.find({ key: 'branch-here' })).toBeUndefined()
    await ui.unmount()
  }
})

/** The hull-speed session grown by `extra` concepts, C13, C14, ..., each under the last, at head's tip. */
function grown(extra: number): string {
  const session = JSON.parse(HULL_SPEED) as { branches: Record<string, number>; events: unknown[] }
  for (let i = 0; i < extra; i++) {
    const seq = 24 + i
    session.events.push({
      seq,
      parent: seq - 1,
      branch: 'always-in-transit',
      at: '2026-08-04T09:00:00Z',
      actor: 'claude',
      op: 'C→C',
      kind: 'add-c',
      from: { c: [`C${seq - 12}`], k: [] },
      node: { id: `C${seq - 11}`, attribute: '+ grown', partition: 'expansive', proposition: 'Grown.' },
      summary: `Grew C${seq - 11}.`,
    })
    session.branches['always-in-transit'] = seq
  }
  return JSON.stringify(session)
}

test('stepping forward to the tip follows it live again', async ($, on) => {
  const w = world(on)
  const ui = await openPane($, 'desktop')
  await ui.press({ key: 'step-back' })
  expect(await ui.find({ text: 'Step 22 of 23' })).toBeDefined()

  // Rewound, a new event leaves the view where it was.
  w.mtimeMs = 2000
  w.texts = { [FILE]: grown(1) }
  await refresh($)
  expect(await ui.find({ text: 'Step 22 of 24' })).toBeDefined()

  // Forward onto the tip, the next event moves the view with it.
  await ui.press({ key: 'step-forward' })
  await ui.press({ key: 'step-forward' })
  expect(await ui.find({ text: 'Step 24 of 24' })).toBeDefined()
  w.mtimeMs = 3000
  w.texts = { [FILE]: grown(2) }
  await refresh($)
  expect(await ui.find({ text: 'Step 25 of 25' })).toBeDefined()
  await ui.press({ key: 'op-ck-expand' })
  expect(w.submitted.at(-1)).toBe(
    'ck-expand C14 on example-hull-speed (branch always-in-transit) — pressed in the C-K pane',
  )
})

test('picking a node', async ($, on) => {
  world(on)
  for (const surface of SURFACES) {
    const ui = await openPane($, surface)
    await ui.press({ key: 'node-C4' })
    expect(await operatorKeys(ui)).toEqual([])

    await ui.press({ key: 'node-C6' })
    expect(await ui.find({ key: 'op-ck-defix' })).toBeDefined()
    expect(await operatorKeys(ui)).toEqual(OPERATORS.map(o => `op-${o.op}`))
    await ui.unmount()
  }
})

test('pressing a concept selects it', async ($, on) => {
  world(on)
  for (const surface of SURFACES) {
    const ui = await openPane($, surface)
    await ui.press({ key: 'node-C6' })
    expect(stringsIn(await ui.find({ key: 'card' }))).toContain('+ has no hull')
    expect(await ui.find({ key: 'op-ck-expand' })).toBeDefined()

    await ui.press({ key: 'node-C1' })
    expect(stringsIn(await ui.find({ key: 'card' }))).toContain('refuted')
    expect(await operatorKeys(ui)).toEqual([])
    await ui.unmount()
  }
})

// One test per surface: each starts from a fresh $.state, at the tip.
for (const surface of SURFACES) {
  test(`the selected row is marked (${surface})`, async ($, on) => {
    world(on)
    const ui = await openPane($, surface)
    const plainness = async () => (await treeButtons(ui)).map(b => [b.key, 'plain' in b.props ? b.props.plain : 'none'])
    const rowsMarking = (id: string) =>
      ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C12'].map(k => [
        `node-${k}`,
        k === id ? 'none' : true,
      ])

    // How a row says it is selected: its first run, and its label's weight.
    const marking = async (id: string) => {
      const runs = ((await ui.find({ key: `node-${id}` }))?.children ?? []) as (Drawn | string)[]
      const lead = runs[0]
      const label = runs.find(run => typeof run !== 'string' && run.props?.wrap === 'truncate-end') as Drawn | undefined
      return {
        lead: stringsIn(lead).join(''),
        leadColor: typeof lead === 'string' ? undefined : lead?.props?.color,
        labelWeight: label?.props?.weight,
      }
    }
    const SELECTED = { lead: '▸ ', leadColor: 'claude', labelWeight: 'semibold' }
    const UNSELECTED = { lead: '  ', leadColor: undefined, labelWeight: 'regular' }

    // At the tip C12 is selected: its Button alone is drawn without `plain`, led by ▸, its label heavy.
    expect(await treeButtons(ui)).toHaveLength(12)
    expect(await ui.find({ key: 'node-C12' })).toBeDefined()
    expect('plain' in ((await ui.find({ key: 'node-C12' }))?.props ?? {})).toBe(false)
    expect(await plainness()).toEqual(rowsMarking('C12'))
    expect(await marking('C12')).toEqual(SELECTED)
    expect(await marking('C6')).toEqual(UNSELECTED)

    await ui.press({ key: 'node-C6' })
    expect('plain' in ((await ui.find({ key: 'node-C6' }))?.props ?? {})).toBe(false)
    expect((await ui.find({ key: 'node-C12' }))?.props.plain).toBe(true)
    expect(await plainness()).toEqual(rowsMarking('C6'))
    expect(await marking('C6')).toEqual(SELECTED)
    expect(await marking('C12')).toEqual(UNSELECTED)
  })
}

test('a row draws its concept', async ($, on) => {
  world(on)
  for (const surface of SURFACES) {
    const ui = await openPane($, surface)
    const runs = async (id: string) => ((await ui.find({ key: `node-${id}` }))?.children ?? []) as (Drawn | string)[]
    const text = (run: Drawn | string | undefined) => stringsIn(run).join('')
    const props = (run: Drawn | string | undefined) => (typeof run === 'string' ? undefined : run?.props)

    // C4: the lead, its partition letter, the id, a check for conjunct, two spaces, the label, the status.
    const c4 = await runs('C4')
    expect(c4.map(text)).toEqual(['  ', 'R', ' ', 'C4', ' ✓', '  ', '+ supported by a submerged wing', '  conjunct'])
    expect(props(c4[1])).toMatchObject({ color: '#2a78d6', weight: 'semibold' })
    expect(props(c4[3])).toMatchObject({ weight: 'semibold' })
    expect(props(c4[4])).toMatchObject({ color: 'success' })
    expect(props(c4[6])).toMatchObject({ wrap: 'truncate-end', weight: 'regular' })
    expect(props(c4[7])).toMatchObject({ size: 'caption', dimColor: true })

    // C6: open, so no status; the expansive letter.
    const c6 = await runs('C6')
    expect(c6.map(text)).toEqual(['  ', 'E', ' ', 'C6', '  ', '+ has no hull'])
    expect(props(c6[1])).toMatchObject({ color: '#eb6834', weight: 'semibold' })
    expect(props(c6[3])?.dimColor).toBeUndefined()

    // C1 is refuted: its id and label are dim.
    const c1 = await runs('C1')
    expect(c1.map(text)).toEqual(['  ', 'R', ' ', 'C1', '  ', '+ more power', '  refuted'])
    expect(props(c1[3])).toMatchObject({ dimColor: true })
    expect(props(c1[5])).toMatchObject({ dimColor: true })

    // The root's mark is a dim dot, in no colour.
    const c0 = await runs('C0')
    expect(c0.map(text)).toEqual(['  ', '·', ' ', 'C0', '  ', 'root concept'])
    expect(props(c0[1])).toMatchObject({ dimColor: true })
    expect(props(c0[1])?.color).toBeUndefined()

    // The selected row (C12 at the tip) is led by ▸; the fresh row ends in the claude-coloured dot.
    const c12 = await runs('C12')
    expect(c12.map(text)).toEqual(['▸ ', 'R', ' ', 'C12', '  ', '+ the network never stops', ' •'])
    expect(props(c12.at(-1))).toMatchObject({ color: 'claude' })
    expect(c6.map(text)).not.toContain(' •')

    // Each Button is named for a screen reader: id, partition, label, status.
    const labelOf = async (id: string) => (await ui.find({ key: `node-${id}` }))?.props.label
    expect(await labelOf('C12')).toBe('C12, restrictive, + the network never stops, open')
    expect(await labelOf('C6')).toBe('C6, expansive, + has no hull, open')
    expect(await labelOf('C1')).toBe('C1, restrictive, + more power, refuted')
    expect(await labelOf('C4')).toBe('C4, restrictive, + supported by a submerged wing, conjunct')
    expect(await labelOf('C0')).toBe('C0, root concept, open')

    // Each row: its guide, mono and dim, its spaces unbreakable, beside the Button; the root has none.
    const tree = await ui.find({ key: 'tree' })
    const rowOf = (id: string): Drawn | undefined => {
      const walk = (node: unknown): Drawn | undefined => {
        const el = node as Drawn
        if (typeof el !== 'object' || el === null) return undefined
        const keyOf = (child: unknown) => (child as Drawn).key ?? (child as Drawn).props?.key
        if ((el.children ?? []).some(child => keyOf(child) === `node-${id}`)) return el
        for (const child of el.children ?? []) {
          const found = walk(child)
          if (found) return found
        }
        return undefined
      }
      return walk(tree)
    }
    const row12 = rowOf('C12')
    expect(row12?.props).toMatchObject({ flexDirection: 'row', alignItems: 'center' })
    expect(row12?.props?.gap).toBeUndefined()
    expect(row12?.children).toHaveLength(2)
    expect((row12?.children?.[0] as Drawn).props).toMatchObject({ mono: true, dimColor: true })
    expect(stringsIn(row12?.children?.[0])).toEqual(['\u00a0'.repeat(9) + '└─\u00a0'])
    expect(stringsIn(rowOf('C4')?.children?.[0])).toEqual(['\u00a0'.repeat(3) + '├─\u00a0'])
    expect(rowOf('C0')?.children).toHaveLength(1)
    await ui.unmount()
  }
})

const LEGEND = 'R restrictive · E expansive · ✓ conjunct · • latest step'

/** The legend under the tree: the Text whose runs read LEGEND. */
function legendIn(node: unknown): Drawn | undefined {
  const el = node as Drawn
  if (typeof el !== 'object' || el === null) return undefined
  if (el.type === 'Text' && stringsIn(el).join('') === LEGEND) return el
  for (const child of el.children ?? []) {
    const found = legendIn(child)
    if (found) return found
  }
  return undefined
}

test('the tree carries its legend, on every surface and with the map hidden', async ($, on) => {
  world(on)
  for (const surface of [...SURFACES, 'mobile'] as const) {
    const ui = await openPane($, surface)
    const tree = await ui.find({ key: 'tree' })
    const legend = legendIn(tree)
    expect(legend?.props).toMatchObject({ size: 'caption', dimColor: true })
    // The letters take their partition's colour.
    const [r, , e] = (legend?.children ?? []) as Drawn[]
    expect([stringsIn(r), r?.props?.color]).toEqual([['R'], '#2a78d6'])
    expect([stringsIn(e), e?.props?.color]).toEqual([['E'], '#eb6834'])
    // Before the keys caption, where there is one.
    const strings = stringsIn(tree)
    if (surface !== 'mobile') expect(strings.indexOf('R')).toBeLessThan(strings.indexOf(KEYS_CAPTION))
    await ui.unmount()
  }

  const ui = await openPane($, 'desktop')
  await ui.press({ key: 'map-toggle' })
  expect(await ui.find({ key: 'map' })).toBeUndefined()
  expect(legendIn(await ui.find({ key: 'tree' }))).toBeDefined()
})

test('the node picker is gone', async ($, on) => {
  world(on)
  for (const surface of [...SURFACES, 'mobile'] as const) {
    const ui = await openPane($, surface)
    expect(await ui.find({ key: 'node' })).toBeUndefined()
    await ui.unmount()
  }
})

test('the map can be hidden', async ($, on) => {
  world(on)
  const ui = await openPane($, 'desktop')
  const toggle = async () => (await ui.find({ key: 'map-toggle' }))?.props
  expect(await svgMap(ui)).toBeDefined()
  expect(await toggle()).toMatchObject({ label: 'Hide', plain: true })
  expect(stringsIn(await ui.find({ key: 'map-section' }))).toContain('Map')

  await ui.press({ key: 'map-toggle' })
  expect(await ui.find({ key: 'map' })).toBeUndefined()
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  expect(await toggle()).toMatchObject({ label: 'Show', plain: true })
  // The tree stays to navigate by.
  expect(await ui.find({ key: 'node-C6' })).toBeDefined()

  await ui.press({ key: 'map-toggle' })
  expect(await svgMap(ui)).toBeDefined()
  expect((await toggle())?.label).toBe('Hide')

  // Two quick presses both land: hidden, then shown again.
  await Promise.all([ui.press({ key: 'map-toggle' }), ui.press({ key: 'map-toggle' })])
  expect(await svgMap(ui)).toBeDefined()
  expect((await toggle())?.label).toBe('Hide')
  await ui.unmount()

  const terminal = await openPane($, 'terminal')
  expect(await terminal.find({ key: 'map-section' })).toBeUndefined()
  expect(await terminal.find({ key: 'map-toggle' })).toBeUndefined()
  await terminal.unmount()
})

test('empty project', async ($, on) => {
  const w = world(on, { names: null })
  const terminal = await openPane($, 'terminal')
  expect(keysIn(await terminal.find({ key: 'card' }))).toContain('start-session')
  await terminal.unmount()

  const ui = await openPane($, 'desktop')
  expect(await ui.find({ key: 'start-session' })).toBeDefined()
  expect((await ui.find({ key: 'start-session' }))?.props.variant).toBe('primary')
  expect(keysIn(await ui.find({ key: 'card' }))).toContain('start-session')
  expect(await ui.find({ key: 'map' })).toBeUndefined()

  await ui.press({ key: 'start-session' })
  expect(w.submitted).toEqual([START_TEXT])

  w.names = [FILE]
  await refresh($)
  expect(await svgMap(ui)).toBeDefined()
  expect(await ui.find({ key: 'start-session' })).toBeUndefined()

  w.names = []
  await refresh($)
  expect(await ui.find({ key: 'start-session' })).toBeDefined()
  expect(await ui.find({ key: 'map' })).toBeUndefined()
})

test('old schema', async ($, on) => {
  world(on, { names: [FILE, 'other.ck.json'], texts: { [FILE]: '{"version":2}', 'other.ck.json': '{"version":2}' } })
  for (const surface of SURFACES) {
    const ui = await openPane($, surface)
    expect(await ui.find({ text: /schema v2/ })).toBeDefined()
    expect(keysIn(await ui.find({ key: 'card' }))).toEqual(['card'])
    expect(await ui.find({ key: 'file' })).toBeDefined()
    expect(await ui.find({ key: 'map' })).toBeUndefined()
    await ui.unmount()
  }
})

test('torn write keeps the good copy', async ($, on) => {
  const w = world(on)
  const ui = await openPane($, 'desktop')
  expect(await svgMap(ui)).toBeDefined()

  // The same mtime reads nothing.
  const reads = w.reads
  await refresh($)
  expect(w.reads).toBe(reads)

  w.mtimeMs = 2000
  w.texts = { [FILE]: '{"ver' }
  await refresh($)
  expect(await svgMap(ui)).toBeDefined()
  expect(await ui.find({ text: /not JSON/ })).toBeUndefined()
})

test('picking a session loads it and resets the view', async ($, on) => {
  const OTHER = 'other.ck.json'
  const other = JSON.parse(HULL_SPEED) as { title: string }
  other.title = 'Another session'
  world(on, { names: [FILE, OTHER], texts: { [OTHER]: JSON.stringify(other) } })

  // Both pickers sit in the header's right-hand group, on the terminal too.
  const terminal = await openPane($, 'terminal')
  expect(await terminal.find({ key: 'file' })).toBeDefined()
  expect(await terminal.find({ key: 'branch' })).toBeDefined()
  await terminal.unmount()

  const ui = await openPane($, 'desktop')
  expect(await ui.find({ key: 'file' })).toBeDefined()
  await ui.press({ key: 'step-back' })
  expect(await ui.find({ key: 'branch-here' })).toBeDefined()

  const shown = (await ui.find({ key: 'file' }))?.props.value
  const next = shown === FILE ? OTHER : FILE
  await ui.select({ key: 'file', value: next })
  expect((await ui.find({ key: 'file' }))?.props.value).toBe(next)
  expect(await ui.find({ text: next === OTHER ? /Another session/ : /Beating hull speed/ })).toBeDefined()
  // A new file resets the view: back at the tip, so the operators return.
  expect(await ui.find({ key: 'op-ck-expand' })).toBeDefined()
})

/** A session of one root and `n` children of it: big enough, the map's markup outgrows an Svg. */
function wide(n: number): string {
  const event = (seq: number, id: string, parent: string | null) => ({
    seq,
    parent: seq === 0 ? null : seq - 1,
    branch: 'main',
    at: '2026-08-04T09:00:00Z',
    actor: 'claude',
    op: seq === 0 ? 'seed' : 'C→C',
    kind: 'add-c',
    from: { c: parent ? [parent] : [], k: [] },
    node: {
      id,
      attribute: parent ? `+ option ${seq}` : null,
      partition: parent ? 'expansive' : null,
      proposition: `There exists a design that takes option ${seq}.`,
    },
  })
  const events = [event(0, 'C0', null)]
  for (let i = 1; i <= n; i++) events.push(event(i, `C${i}`, 'C0'))
  return JSON.stringify({ version: 3, title: 'Wide', head: 'main', branches: { main: n }, events })
}

test('a newer session shown in place of the followed one opens live, at its tip', async ($, on) => {
  const w = world(on)
  const ui = await openPane($, 'desktop')
  await ui.press({ key: 'step-back' })
  await ui.press({ key: 'node-C4' })
  expect(await ui.find({ key: 'branch-here' })).toBeDefined()

  // A newer file appears; the view followed the newest file, so it moves there afresh.
  const NEWER = 'newer.ck.json'
  const newer = JSON.parse(grown(1)) as { title: string }
  newer.title = 'A newer session'
  w.names = [FILE, NEWER]
  w.mtimes = { [NEWER]: 5000 }
  w.texts = { [NEWER]: JSON.stringify(newer) }
  await refresh($)

  expect(await ui.find({ text: /A newer session/ })).toBeDefined()
  expect((await ui.find({ key: 'file' }))?.props.value).toBe(NEWER)
  expect(await ui.find({ text: 'Step 24 of 24' })).toBeDefined()
  expect(await selectedId(ui)).toBe('C13')
  expect(await ui.find({ key: 'op-ck-expand' })).toBeDefined()
  expect(await ui.find({ key: 'branch-here' })).toBeUndefined()
})

test('a map too big for an Svg says so, and the tree still lists every concept', async ($, on) => {
  world(on, { texts: { [FILE]: wide(600) } })
  const ui = await openPane($, 'desktop')
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  expect(await ui.find({ key: 'map' })).toBeUndefined()
  expect(stringsIn(await ui.find({ key: 'map-section' }))).toContain('This tree is too large to draw as a map.')
  // Past a Select's 64: one row per concept.
  expect(await treeButtons(ui)).toHaveLength(601)
  expect(stringsIn(await ui.find({ key: 'node-C599' }))).toContain('+ option 599')
  await ui.press({ key: 'node-C540' })
  expect(await selectedId(ui)).toBe('C540')
})

/** `n` session files, f000 to f(n-1), the last the newest: newest first, f(n-1) is shown. */
function manyFiles(n: number): Partial<World> {
  const names = Array.from({ length: n }, (_, i) => `f${String(i).padStart(3, '0')}.ck.json`)
  return { names, mtimes: Object.fromEntries(names.map((name, i) => [name, 1000 + i])) }
}

// One test per surface: each starts from a fresh $.state, at the tip.
for (const surface of SURFACES) {
  test(`a picker shows at most 64 options, the picked one among them (${surface})`, async ($, on) => {
    world(on, manyFiles(100))
    const ui = await openPane($, surface)
    const optionsOf = async () => (await ui.find({ key: 'file' }))?.props.options as { value: string }[]

    // The newest file, f099, is shown and listed first: the window starts with it.
    expect((await optionsOf()).length).toBe(64)
    expect((await optionsOf())[0]?.value).toBe('f099.ck.json')
    expect((await ui.find({ key: 'file' }))?.props.label).toBe('Session (64 of 100)')

    // Picking near the window's end moves the window on.
    await ui.select({ key: 'file', value: 'f040.ck.json' })
    expect((await ui.find({ key: 'file' }))?.props.value).toBe('f040.ck.json')
    const values = (await optionsOf()).map(o => o.value)
    expect(values).toHaveLength(64)
    expect(values).toContain('f040.ck.json')
    expect(values).not.toContain('f099.ck.json')
  })
}

test('one session file draws no session picker', async ($, on) => {
  world(on)
  const ui = await openPane($, 'desktop')
  expect(await ui.find({ key: 'file' })).toBeUndefined()
  expect(await ui.find({ key: 'branch' })).toBeDefined()
})

test('the header and the timeline say where the session stands', async ($, on) => {
  world(on)
  for (const surface of SURFACES) {
    const ui = await openPane($, surface)
    expect(await ui.find({ type: 'Text', text: 'Beating hull speed' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'example-hull-speed · 12 concepts · 7 K' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Step 23 of 23' })).toBeDefined()
    // The health line, one chip per part.
    for (const chip of ['55% expansive', '2 conjunctions', '4 open leaves']) {
      expect(await ui.find({ type: 'Text', text: chip })).toBeDefined()
    }
    expect(await ui.find({ type: 'Text', text: /55% expansive ·/ })).toBeUndefined()
    // The selected concept's card: id, partition, status, attribute, what it rests on.
    const card = await ui.find({ key: 'card' })
    expect(stringsIn(card)).toEqual(
      expect.arrayContaining(['C12', 'R restrictive', 'open', '+ the network never stops', 'Rests on no K yet']),
    )
    await ui.unmount()
  }
})

test("the dock decides the map's mode and size", async ($, on) => {
  world(on)
  const ui = await openPane($, 'desktop', { bodyColumns: 160 })
  const svg = async () => ((await svgMap(ui)) as Drawn | undefined)?.props ?? {}

  // 160 columns, 1,280 px: the labelled map fits at its own size.
  expect(await svg()).toMatchObject({ width: 1016, height: 414, isInteractive: true })
  expect(String((await svg()).source)).toContain('>has no hull<')

  // 129 columns, the dock as measured, 1,032 px: still labelled.
  await ui.redraw({ ...PANE, bodyColumns: 129 })
  expect(await svg()).toMatchObject({ width: 1016, height: 414 })
  expect(String((await svg()).source)).toContain('>has no hull<')

  // 120 columns, 960 px: too narrow for it, so the compact map, at its own size.
  await ui.redraw({ ...PANE, bodyColumns: 120 })
  expect(await svg()).toMatchObject({ width: 380, height: 288 })
  expect(String((await svg()).source)).not.toContain('>has no hull<')

  // 40 columns, 320 px: the compact map scaled down to the room.
  await ui.redraw({ ...PANE, bodyColumns: 40 })
  expect(await svg()).toMatchObject({ width: 320, height: Math.round((288 * 320) / 380) })
  expect((await svg()).height).toBe(243)
})

test('wide and narrow layouts', async ($, on) => {
  world(on)
  const sections = (node: unknown) => keysIn(node).filter(key => ['tree', 'card', 'knowledge'].includes(key))
  for (const surface of SURFACES) {
    // Wide: the tree on the left; the card above the knowledge on the right.
    const ui = await openPane($, surface, { bodyColumns: 160 })
    const lower = await ui.find({ key: 'lower' })
    expect(lower?.props).toMatchObject({ flexDirection: 'row', gap: 'lg', alignItems: 'flex-start' })
    expect(lower?.children).toHaveLength(2)
    const [left, right] = (lower?.children ?? []) as Drawn[]
    expect(sections(left)).toEqual(['tree'])
    expect(left?.props).toMatchObject({ flexGrow: 9, flexShrink: 1, width: 0 })
    expect(sections(right)).toEqual(['card', 'knowledge'])
    expect(right?.props).toMatchObject({ flexDirection: 'column', gap: 'md', flexGrow: 11, flexShrink: 1, width: 0 })
    // The map, where the surface draws one, comes before them all.
    const order = keysIn(await ui.drawn()).filter(key => ['map-section', 'lower'].includes(key))
    expect(order).toEqual(surface === 'desktop' ? ['map-section', 'lower'] : ['lower'])

    // Narrow: one column, tree, card, knowledge.
    await ui.redraw({ ...PANE, bodyColumns: 60 })
    const narrow = await ui.find({ key: 'lower' })
    expect(narrow?.props).toMatchObject({ flexDirection: 'column', gap: 'md' })
    expect(sections(narrow)).toEqual(['tree', 'card', 'knowledge'])
    await ui.unmount()
  }
})

test('the knowledge the selected concept rests on is marked', async ($, on) => {
  world(on)
  for (const surface of SURFACES) {
    const ui = await openPane($, surface)
    await ui.press({ key: 'node-C3' })
    const knowledge = await ui.find({ key: 'knowledge' })
    // An entry is a Box whose first string is its id.
    const entry = (id: string) =>
      (knowledge?.children ?? []).find(child => (child as Drawn).type === 'Box' && stringsIn(child)[0] === id) as
        | Drawn
        | undefined
    expect(entry('K2')?.props?.borderColor).toBe('#2a78d6')
    expect(entry('K3')?.props?.borderColor).toBe('#2a78d6')
    expect(entry('K0')).toBeDefined()
    expect(entry('K0')?.props?.borderColor).toBeUndefined()
    expect(entry('K0')?.props?.borderDimColor).toBe(true)
    // K6 is uncertain, and says so.
    expect(stringsIn(entry('K6'))).toContain('uncertain')
    await ui.unmount()
  }
})

test('a session with no events yet draws on every surface', async ($, on) => {
  const empty = JSON.stringify({ version: 3, title: 'Fresh', head: 'main', branches: { main: null }, events: [] })
  world(on, { texts: { [FILE]: empty } })
  for (const surface of SURFACES) {
    const ui = await openPane($, surface)
    expect(await ui.find({ text: 'Step 0 of 0' })).toBeDefined()
    expect(await ui.find({ text: 'No concepts at step 0.' })).toBeDefined()
    expect(await ui.find({ text: 'K is empty.' })).toBeDefined()
    expect(await ui.find({ key: 'card' })).toBeUndefined()
    expect(await ui.find({ key: 'node' })).toBeUndefined()
    // No concept to overview, so no map section; the tree says why it is empty.
    expect(await ui.find({ key: 'map-section' })).toBeUndefined()
    expect(stringsIn(await ui.find({ key: 'tree' }))).toContain('No concepts at step 0.')
    await ui.unmount()
  }
})

/** The tree's rows: its `node-<id>` Buttons, in order. */
async function treeButtons(ui: Drawing) {
  return (await ui.findAll({ type: 'Button' })).filter(b => b.key?.startsWith('node-'))
}

/** The id of the selected row: the one row Button drawn without `plain`. */
async function selectedId(ui: Drawing): Promise<unknown> {
  const marked = (await treeButtons(ui)).filter(b => !('plain' in b.props))
  return marked.length === 1 ? marked[0]?.key?.slice('node-'.length) : marked.map(b => b.key)
}

const KEYS_CAPTION = 'Keys: j/k concept · h/l step · g latest'

// One test per surface: each starts from a fresh $.state, at the tip.
for (const surface of SURFACES) {
  test(`rewound banner (${surface})`, async ($, on) => {
    world(on)
    const ui = await openPane($, surface)
    expect(await ui.find({ key: 'rewound' })).toBeUndefined()

    await ui.press({ key: 'step-back' })
    const banner = await ui.find({ key: 'rewound' })
    expect(banner?.props).toMatchObject({ borderStyle: 'round', borderColor: 'warning', flexDirection: 'row' })
    expect(stringsIn(banner)).toContain('Viewing step 22 of 23. The past is read-only.')
    expect(await ui.find({ text: 'Viewing step 22 of 23. The past is read-only.' })).toBeDefined()
    expect(await ui.find({ key: 'to-tip' })).toBeDefined()
    expect((await ui.find({ key: 'to-tip' }))?.props).toMatchObject({ label: 'Back to latest', variant: 'primary' })
    expect(await ui.find({ key: 'branch-here' })).toBeDefined()
    // Branch from here lives in the banner only; the card says why its operators are gone.
    expect(keysIn(banner)).toEqual(expect.arrayContaining(['to-tip', 'branch-here']))
    expect(keysIn(await ui.find({ key: 'card' }))).not.toContain('branch-here')
    expect(stringsIn(await ui.find({ key: 'card' }))).toContain('Operators act at the latest step.')
    expect(await operatorKeys(ui)).toEqual([])

    await ui.press({ key: 'to-tip' })
    expect(await ui.find({ text: 'Step 23 of 23' })).toBeDefined()
    expect(await ui.find({ key: 'rewound' })).toBeUndefined()
    expect(await ui.find({ text: /Viewing step/ })).toBeUndefined()
    expect(await operatorKeys(ui)).toEqual(OPERATORS.map(o => `op-${o.op}`))

    // At the tip, on a concept that is not open: the reason, and no branch button.
    await ui.press({ key: 'node-C4' })
    expect(await ui.find({ key: 'branch-here' })).toBeUndefined()
    expect(await ui.find({ text: 'C4 is conjunct: the operators act on open concepts.' })).toBeDefined()
    expect(await operatorKeys(ui)).toEqual([])
  })

  test(`concept stepping (${surface})`, async ($, on) => {
    world(on)
    const ui = await openPane($, surface)
    // Each is named for a screen reader and drawn as its glyph, as the step buttons are.
    const prev = await ui.find({ key: 'concept-prev' })
    const next = await ui.find({ key: 'concept-next' })
    expect(prev?.props).toMatchObject({ label: 'Previous concept', hotkey: 'k' })
    expect(next?.props).toMatchObject({ label: 'Next concept', hotkey: 'j' })
    expect(stringsIn(prev)).toEqual(['‹'])
    expect(stringsIn(next)).toEqual(['›'])
    // They head the tree, and the keys caption sits under it.
    const tree = await ui.find({ key: 'tree' })
    expect(keysIn(tree)).toEqual(expect.arrayContaining(['concept-prev', 'concept-next']))
    expect(stringsIn(tree)).toContain('Concepts')
    expect(stringsIn(tree).at(-1)).toBe(KEYS_CAPTION)

    // At the tip C12, the last in order, is selected: next wraps round to the first.
    expect(await selectedId(ui)).toBe('C12')
    await ui.press({ key: 'concept-next' })
    expect(await selectedId(ui)).toBe('C0')
    await ui.press({ key: 'concept-prev' })
    expect(await selectedId(ui)).toBe('C12')
    await ui.press({ key: 'node-C0' })
    await ui.press({ key: 'concept-prev' })
    expect(await selectedId(ui)).toBe('C12')
    await ui.press({ key: 'node-C6' })
    await ui.press({ key: 'concept-next' })
    expect(await selectedId(ui)).toBe('C7')
    // Two quick presses both land.
    await Promise.all([ui.press({ key: 'concept-next' }), ui.press({ key: 'concept-next' })])
    expect(await selectedId(ui)).toBe('C9')

    // The keys: concepts j/k, steps h/l, the latest step g. No operator has one.
    expect((await ui.find({ key: 'step-back' }))?.props.hotkey).toBe('h')
    expect((await ui.find({ key: 'step-forward' }))?.props.hotkey).toBe('l')
    expect(await ui.find({ type: 'Text', text: KEYS_CAPTION })).toBeDefined()
    await ui.press({ key: 'node-C12' })
    const operators = (await ui.findAll({ type: 'Button' })).filter(b => b.key?.startsWith('op-'))
    expect(operators).toHaveLength(OPERATORS.length)
    for (const b of operators) expect(b.props.hotkey).toBeUndefined()

    await ui.press({ key: 'step-back' })
    expect((await ui.find({ key: 'to-tip' }))?.props.hotkey).toBe('g')
    expect((await ui.find({ key: 'branch-here' }))?.props.hotkey).toBeUndefined()
  })
}

test('knowledge grouping', async ($, on) => {
  world(on)
  for (const surface of SURFACES) {
    const ui = await openPane($, surface)
    // C3 rests on K2 and K3: they come first, under their own label.
    await ui.press({ key: 'node-C3' })
    const grouped = stringsIn(await ui.find({ key: 'knowledge' }))
    const at = (text: string) => grouped.indexOf(text)
    expect(at('Rests on')).toBeGreaterThanOrEqual(0)
    expect(at('Rests on')).toBeLessThan(at('K2'))
    expect(at('K2')).toBeLessThan(at('K3'))
    expect(at('K3')).toBeLessThan(at('Other knowledge'))
    expect(at('Other knowledge')).toBeLessThan(at('K0'))
    expect(at('K0')).toBeLessThan(at('K1'))
    expect(at('K1')).toBeLessThan(at('K4'))
    expect(grouped).not.toContain('Knowledge')

    // C12 rests on nothing: one label, every entry.
    await ui.press({ key: 'node-C12' })
    const plain = stringsIn(await ui.find({ key: 'knowledge' }))
    expect(plain).toContain('Knowledge')
    expect(plain).not.toContain('Rests on')
    expect(plain).not.toContain('Other knowledge')
    expect(plain.filter(text => /^K\d$/.test(text))).toEqual(['K0', 'K1', 'K2', 'K3', 'K4', 'K5', 'K6'])
    await ui.unmount()
  }
})

test('the width line is gone', async ($, on) => {
  world(on)
  for (const surface of SURFACES) {
    const ui = await openPane($, surface, { bodyColumns: 160 })
    expect(await ui.find({ text: /dock \d+ columns/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('mobile draws the rewound banner and the activity line', async ($, on) => {
  const w = world(on)
  const ui = await openPane($, 'mobile')
  // Mobile has no keys to tell of; the tree's rows and the concept buttons pick.
  expect(await ui.find({ type: 'Text', text: KEYS_CAPTION })).toBeUndefined()
  expect(await ui.find({ key: 'concept-next' })).toBeDefined()
  expect(await selectedId(ui)).toBe('C12')
  await ui.press({ key: 'node-C6' })
  expect(await selectedId(ui)).toBe('C6')
  expect(stringsIn(await ui.find({ key: 'card' }))).toContain('+ has no hull')
  await ui.press({ key: 'node-C12' })

  // Mobile draws the map, and it hides.
  expect(await svgMap(ui)).toBeDefined()
  await ui.press({ key: 'map-toggle' })
  expect(await ui.find({ key: 'map' })).toBeUndefined()
  expect((await ui.find({ key: 'map-toggle' }))?.props.label).toBe('Show')
  await ui.press({ key: 'map-toggle' })
  expect(await svgMap(ui)).toBeDefined()

  await ui.press({ key: 'op-ck-expand' })
  expect(w.submitted).toHaveLength(1)
  await $.turn.start({ text: w.submitted[0] ?? '', turnId: 'turn-1' })
  expect(await ui.find({ text: 'Claude is working on: partition C12' })).toBeDefined()

  await ui.press({ key: 'step-back' })
  expect(await ui.find({ text: 'Viewing step 22 of 23. The past is read-only.' })).toBeDefined()
  expect(await ui.find({ key: 'branch-here' })).toBeDefined()
  await ui.press({ key: 'to-tip' })
  expect(await ui.find({ key: 'rewound' })).toBeUndefined()
})
