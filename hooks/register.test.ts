import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'
import type { FsEntry, On, RenderSurface, UiOpenResult } from 'claude-code'
import { HULL_SPEED } from './hull-speed.fixture'
import { START_TEXT } from './model'

const FILE = 'example-hull-speed.ck.json'

/** The three sentences the spec puts in the `ck-studio:pane` section, verbatim. */
const PANE_NOTE =
  'The C-K Studio pane is open in the Claude app and shows the session live. ' +
  "Don't run `ck view` or arm the canvas Monitor unless the user asks for the browser canvas. " +
  'Messages ending "— pressed in the C-K pane" are the user pressing an operator there.'

/** The project and the app as the test's hooks answer them; change a field to move them. */
type World = {
  /** The names `sessions/` lists. */
  names: string[]
  /**
   * What the store holds for `isClosed`: the person closed the pane by hand, and the
   * state outlived it (a hot reload re-running `session.start`; the state lives for the session).
   */
  isClosed: boolean
  /** What `ui.open` answers. */
  open: UiOpenResult
  /** Makes `ui.open` refuse, so the plugin's call rejects. */
  denyOpen: boolean
  /** Makes `prompt.submit` fail beneath the plugin, so its call rejects. */
  denySubmit: boolean
  /** Makes `prompt.submit` drop the prompt beneath the plugin: it did not enter. */
  dropSubmit: boolean
  /** Makes reading the state's `files` fail, so a refresh rejects. */
  failState: boolean
  lists: number
  stats: number
  opens: number
  /** `command.register` calls, by name and description. */
  registered: { name: string; description: string }[]
  /** The texts of `ui.toast`, in order. */
  toasts: string[]
  /** The lines of `ui.log`, in order, with where each went. */
  logs: { text: string; to: string }[]
  /** The texts `prompt.submit` received that were not refused. */
  submitted: string[]
  /** In order: each write of the state's `pending` (its entries' `doing`), and each prompt as it is sent. */
  journal: string[]
}

/** The last part of a path: the engine hands the hooks beneath it absolute paths. */
const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1)

const BASH_RESULT = { stdout: 'done', stderr: '', interrupted: false }

/** Answers, beneath the plugin, every call and event it meets outside `$.state` and `$.clock`. */
function world(on: On, start: Partial<World> = {}): World {
  const w: World = {
    names: [FILE],
    isClosed: false,
    open: { isPlaced: true },
    denyOpen: false,
    denySubmit: false,
    dropSubmit: false,
    failState: false,
    lists: 0,
    stats: 0,
    opens: 0,
    registered: [],
    toasts: [],
    logs: [],
    submitted: [],
    journal: [],
    ...start,
  }

  on('fs.list', async (_$, e) => {
    w.lists += 1
    if (baseName(e.path) !== 'sessions') return { deny: `ENOENT: no such file or directory, scandir '${e.path}'` }
    const entries = w.names.map(
      (name): FsEntry => ({ name, kind: 'file', size: 1, mtimeMs: 1000, isLink: false }),
    )
    return { value: entries }
  })
  on('state.get', { plugin: 'ck-studio', key: 'files' }, async (_$, e, next) =>
    w.failState ? { deny: 'the state is unavailable' } : next(e),
  )
  // The kit cannot raise a close by the person (see `closer`), so a pane the person closed
  // is the store holding `isClosed` already, as after a hot reload re-runs `session.start`.
  on('state.get', { plugin: 'ck-studio', key: 'isClosed' }, async (_$, e, next) =>
    w.isClosed ? { value: { value: true, version: 1 } } : next(e),
  )
  on('state.set', { plugin: 'ck-studio', key: 'isClosed' }, async (_$, e, next) => {
    w.isClosed = e.value
    return next(e)
  })
  on('state.set', { plugin: 'ck-studio', key: 'pending' }, async (_$, e, next) => {
    w.journal.push(`pending: ${e.value.map(p => p.doing).join(', ')}`)
    return next(e)
  })
  on('fs.stat', async () => {
    w.stats += 1
    return { value: { kind: 'file', size: HULL_SPEED.length, mtimeMs: 1000, isLink: false } }
  })
  on('fs.read', async () => ({ value: HULL_SPEED }))
  on('ui.open', async () => {
    w.opens += 1
    return w.denyOpen ? { deny: 'a pane cannot open here' } : { value: w.open }
  })
  on('ui.close', async () => ({ value: undefined }))
  on('ui.toast', async (_$, e) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.log', async (_$, e) => {
    w.logs.push({ text: e.text, to: e.to })
    return { value: undefined }
  })
  on('command.register', async (_$, e) => {
    w.registered.push({ name: e.name, description: e.description })
    return { value: { command: e.name } }
  })
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  on('session.attach', async (_$, e) => ({ clientId: e.clientId }))
  on('turn.start', async (_$, e) => ({ turnId: e.turnId }))
  on('prompt.submit', async (_$, e) => {
    w.journal.push(`submit: ${e.text}`)
    if (w.denySubmit) throw new Error('the app is not listening')
    if (w.dropSubmit) return { drop: 'a hook refused it' }
    w.submitted.push(e.text)
    return { text: e.text }
  })
  on('prompt.compose', async () => ({ sections: [] }))
  on('turn.complete', async (_$, e) => ({ text: e.answer }))
  on('tool.call', async () => ({ result: BASH_RESULT }))
  return w
}

/** The person typing `/ck-pane`: the engine's `$` takes the whole input. */
function typeCkPane($: Engine) {
  return $.command.run({
    command: 'ck-pane',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 160 },
  })
}

/** Claude running `command` in a shell. */
function runBash($: Engine, command: string) {
  return $.tool.call({ tool: 'Bash', command })
}

/**
 * A second plugin whose `/close-ck` closes the pane by calling `$.ui.close`: the only way
 * the kit can raise one, since the engine's `$` has no `ui.close` and a plugin's close is
 * stamped origin `plugin`. The person's own close (origin `person`) cannot be raised here.
 */
const closer: Plugin = {
  name: 'closer',
  register(on) {
    on('command.run', { command: 'close-ck' }, async $ => {
      await $.ui.close({ id: 'ck' })
      return { text: 'closed' }
    })
  },
}

function closePane($: Engine) {
  return $.command.run({
    command: 'close-ck',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 160 },
  })
}

/** The system prompt as composed beneath the plugin, which adds nothing: its section ids. */
async function sectionsOf($: Engine) {
  const composed = await $.prompt.compose({
    model: 'test-model',
    promptModel: 'test-model',
    surfaces: ['desktop'],
    tools: [],
    outputStyle: null,
    traits: [],
  })
  return composed.sections
}

/** The user's own prompt arriving: a turn starts or is queued behind the running one. */
function userTypes($: Engine, text: string) {
  return $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
}

/** A turn starting: the main loop's, or a subagent's when `agentId` is given. */
function turnStarts($: Engine, turnId: string, agentId?: string) {
  return $.turn.start({ text: 'go on', turnId, ...(agentId === undefined ? {} : { agentId }) })
}

/** The Claude app's page attaching to the session. */
function pageAttaches($: Engine) {
  return $.session.attach({ surface: 'desktop', clientId: 'desktop:default' })
}

/** The main loop's turn starting with `text`: the prompt as it entered, a press's or not. */
function mainTurnStarts($: Engine, text: string, turnId = 'turn-1') {
  return $.turn.start({ text, turnId })
}

/** What each operator press on C12 at the hull-speed tip sends. */
const PRESSED = (op: string) => `${op} C12 on example-hull-speed (branch always-in-transit) — pressed in the C-K pane`

/** A turn of the main loop ending. */
function mainTurnEnds($: Engine) {
  return $.turn.complete({ answer: 'ok', durationMs: 10, isAborted: false, turnId: 'turn-1', reason: 'answer' })
}

const PANE = {
  title: 'C-K',
  isFocused: false,
  bodyColumns: 60,
  placement: 'dock',
  scroll: { offset: 0, bodyRows: 24 },
  view: {},
} as const

async function mountPane($: Engine, surface: RenderSurface = 'desktop') {
  await typeCkPane($)
  return $.ui.mount({ plugin: 'ck-studio', surface, component: 'Pane', requestId: 'ck', props: PANE })
}

/** A subagent's turn ending: not the main loop's. */
function subagentTurnEnds($: Engine) {
  return $.turn.complete({
    answer: 'ok',
    durationMs: 10,
    isAborted: false,
    turnId: 'turn-sub',
    agentId: 'agent-1',
    reason: 'answer',
  })
}

const WORKING = /Claude is working on/

test('compose adds the pane section only while open', { plugins: [closer] }, async ($, on) => {
  world(on)
  expect(await sectionsOf($)).toEqual([])

  await typeCkPane($)
  expect(await sectionsOf($)).toEqual([{ id: 'ck-studio:pane', scope: 'session', text: PANE_NOTE }])

  await closePane($)
  expect(await sectionsOf($)).toEqual([])

  await typeCkPane($)
  expect((await sectionsOf($)).map(s => s.id)).toEqual(['ck-studio:pane'])
})

test('compose leaves the section out when the pane was not placed', async ($, on) => {
  world(on, { open: { isPlaced: false, reason: 'the terminal is 100 columns wide' } })
  await typeCkPane($)
  expect(await sectionsOf($)).toEqual([])
})

test('/ck-pane says whether the pane is shown', async ($, on) => {
  const w = world(on)
  expect((await typeCkPane($)).text).toBe('C-K pane opened.')

  w.open = { isPlaced: false, reason: 'the terminal is 100 columns wide' }
  expect((await typeCkPane($)).text).toBe('C-K pane not shown: the terminal is 100 columns wide')
})

test('a ck command refreshes', async ($, on) => {
  const w = world(on)
  await typeCkPane($)
  const [lists, stats] = [w.lists, w.stats]

  const ran = await runBash($, 'ck show x')
  expect(w.lists).toBe(lists + 1)
  expect(w.stats).toBe(stats + 1)
  // The tool's answer goes through as it came.
  expect(ran.result).toEqual(BASH_RESULT)
})

test('a ck command is found in a path and a pipeline too', async ($, on) => {
  const w = world(on)
  await typeCkPane($)

  for (const command of ['node ~/plugin/lib/ck.cjs show x', 'cd sessions && ck-expand C12', 'echo ok | ck show']) {
    const stats = w.stats
    await runBash($, command)
    expect(w.stats, command).toBe(stats + 1)
  }
})

test('a non-ck command does not', async ($, on) => {
  const w = world(on)
  await typeCkPane($)
  const [lists, stats, opens] = [w.lists, w.stats, w.opens]

  for (const command of ['ls', 'git check-ignore sessions', 'npm run lock']) {
    await runBash($, command)
  }
  expect([w.lists, w.stats, w.opens]).toEqual([lists, stats, opens])
})

test('the first ck command opens the pane, and later ones leave it alone', async ($, on) => {
  const w = world(on)

  await runBash($, 'ck show x')
  expect(w.opens).toBe(1)
  expect((await sectionsOf($)).map(s => s.id)).toContain('ck-studio:pane')

  await runBash($, 'ck show y')
  expect(w.opens).toBe(1)
})

test('a ck command opens nothing while the project holds no session', async ($, on) => {
  const w = world(on, { names: [] })
  await runBash($, 'ck new')
  expect(w.opens).toBe(0)
})

test('closed stays closed', async ($, on) => {
  // The person closed the pane, and the state still says so when `session.start` runs again.
  const w = world(on, { isClosed: true })
  mock.clock(on)

  await runBash($, 'ck show x')
  expect(w.opens, 'ck command').toBe(0)
  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  expect(w.opens, 'session start').toBe(0)
  expect(await sectionsOf($)).toEqual([])

  // Asking for it is the way back, and it stays: the next ck command finds it open.
  await typeCkPane($)
  expect(w.opens, 'ck-pane').toBe(1)
  await runBash($, 'ck show x')
  expect(w.opens, 'ck after reopen').toBe(1)
})

test('a close that is not the person is no refusal', { plugins: [closer] }, async ($, on) => {
  const w = world(on)
  await typeCkPane($)
  await closePane($)
  const opens = w.opens

  await runBash($, 'ck show x')
  expect(w.opens).toBe(opens + 1)
  expect((await sectionsOf($)).map(s => s.id)).toEqual(['ck-studio:pane'])
})

test('a ck command whose pane fails to open still returns the tool answer, and logs why', async ($, on) => {
  const w = world(on, { denyOpen: true })
  const ran = await runBash($, 'ck show x')
  expect(w.opens).toBe(1)
  expect(ran.result).toEqual(BASH_RESULT)
  expect(w.logs).toHaveLength(1)
  expect(w.logs[0]?.to).toBe('debug')
  expect(w.logs[0]?.text).toMatch(/ck-studio.*a pane cannot open here/)
})

test('a ck command whose refresh fails still returns the tool answer, and logs why', async ($, on) => {
  const w = world(on, { failState: true })
  const ran = await runBash($, 'ck show x')
  expect(ran.result).toEqual(BASH_RESULT)
  expect(w.opens).toBe(0)
  expect(w.logs).toHaveLength(1)
  expect(w.logs[0]?.to).toBe('debug')
  expect(w.logs[0]?.text).toMatch(/ck-studio.*the state is unavailable/)
})

test('a session start whose refresh fails still starts, and logs why', async ($, on) => {
  const w = world(on, { failState: true })
  mock.clock(on)
  const started = await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  expect(started.cwd).toBe('/work')
  expect(w.registered).toHaveLength(1)
  expect(w.logs).toHaveLength(1)
  expect(w.logs[0]?.to).toBe('debug')
  expect(w.logs[0]?.text).toMatch(/ck-studio.*the state is unavailable/)
})

test('the timer logs a failure once, not every second, and again when it fails anew', async ($, on) => {
  const w = world(on)
  const clock = mock.clock(on)
  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  expect(w.logs).toEqual([])

  w.failState = true
  await clock.advance(3000)
  expect(w.logs).toHaveLength(1)
  expect(w.logs[0]?.to).toBe('debug')
  expect(w.logs[0]?.text).toMatch(/ck-studio.*the state is unavailable/)

  // Back well, then failing the same way: a new failure is worth a line.
  w.failState = false
  await clock.advance(1000)
  w.failState = true
  await clock.advance(2000)
  expect(w.logs).toHaveLength(2)
})

test('session start registers the command, opens the pane and refreshes every second', async ($, on) => {
  const w = world(on)
  const clock = mock.clock(on)

  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  expect(w.registered).toEqual([{ name: 'ck-pane', description: 'Show the C-K session as a pane' }])
  expect(w.opens).toBe(1)
  const [lists, stats] = [w.lists, w.stats]

  // Each second checks the open file; every fifth lists the folder as well.
  await clock.advance(4000)
  expect(w.stats).toBe(stats + 4)
  expect(w.lists).toBe(lists)
  await clock.advance(1000)
  expect(w.stats).toBe(stats + 5)
  expect(w.lists).toBe(lists + 1)
  await clock.advance(5000)
  expect(w.lists).toBe(lists + 2)
})

test('a pane no surface placed at start is told to Claude once the page attaches', async ($, on) => {
  // In the desktop app session.start has no surface to draw on yet.
  const w = world(on, { open: { isPlaced: false, reason: 'no-surface' } })
  mock.clock(on)
  await $.session.start({ cwd: '/work', surface: null, isInteractive: false })
  expect(w.opens).toBe(1)
  expect(await sectionsOf($)).toEqual([])

  w.open = { isPlaced: true }
  await pageAttaches($)
  expect(w.opens).toBe(2)
  expect((await sectionsOf($)).map(s => s.id)).toEqual(['ck-studio:pane'])

  // Another page attaching finds it up already.
  await pageAttaches($)
  expect(w.opens).toBe(2)
})

test('a page attaching does not open a pane the person closed', async ($, on) => {
  const closed = world(on, { isClosed: true })
  await pageAttaches($)
  expect(closed.opens).toBe(0)
  expect(await sectionsOf($)).toEqual([])
})

test('a page attaching opens nothing in a project with no session', async ($, on) => {
  const w = world(on, { names: [] })
  await pageAttaches($)
  expect(w.opens).toBe(0)
})

test('session start opens nothing in a project with no session', async ($, on) => {
  const w = world(on, { names: [] })
  mock.clock(on)
  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  expect(w.registered).toHaveLength(1)
  expect(w.opens).toBe(0)
})

test('a press while a turn runs says it is queued; once the turn ends it does not', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)

  // Idle: nothing to wait for.
  await ui.press({ key: 'op-ck-expand' })
  expect(w.toasts).toEqual([])
  expect(w.submitted).toHaveLength(1)

  // That press started a turn, which is still running.
  await ui.press({ key: 'op-ck-learn' })
  expect(w.toasts).toEqual(['Queued: expand K for C12'])
  expect(w.submitted).toHaveLength(2)

  await mainTurnEnds($)
  await ui.press({ key: 'op-ck-expand' })
  expect(w.toasts).toEqual(['Queued: expand K for C12'])
  expect(w.submitted).toHaveLength(3)
})

test('a prompt the user typed also makes a press wait its turn', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)

  await userTypes($, 'what is C6?')
  await ui.press({ key: 'op-ck-expand' })
  expect(w.toasts).toEqual(['Queued: partition C12'])
  expect(w.submitted.at(-1)).toMatch(/^ck-expand C12 on /)

  // A subagent finishing is not the main turn finishing.
  await $.turn.complete({
    answer: 'ok',
    durationMs: 10,
    isAborted: false,
    turnId: 'turn-2',
    agentId: 'agent-1',
    reason: 'answer',
  })
  await ui.press({ key: 'op-ck-learn' })
  expect(w.toasts).toEqual(['Queued: partition C12', 'Queued: expand K for C12'])

  await mainTurnEnds($)
  await ui.press({ key: 'op-ck-defix' })
  expect(w.toasts).toHaveLength(2)
})

test('Branch from here queues by its own name', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)
  await userTypes($, 'a turn is running')

  await ui.press({ key: 'step-back' })
  await ui.press({ key: 'branch-here' })
  expect(w.toasts).toEqual(['Queued: branch from C10'])
})

test('Start a session never says queued', async ($, on) => {
  const w = world(on, { names: [] })
  const ui = await mountPane($)
  await userTypes($, 'a turn is running')

  await ui.press({ key: 'start-session' })
  expect(w.toasts).toEqual([])
  expect(w.submitted).toContain(START_TEXT)
})

test('a press that cannot be sent says so, and leaves no turn counted as running', async ($, on) => {
  const w = world(on, { denySubmit: true })
  const ui = await mountPane($)

  await ui.press({ key: 'op-ck-expand' })
  expect(w.toasts).toEqual(["Couldn't send that to Claude."])
  expect(w.submitted).toEqual([])

  w.denySubmit = false
  await ui.press({ key: 'op-ck-expand' })
  // The refused prompt started no turn, so this one waited for nothing.
  expect(w.toasts).toEqual(["Couldn't send that to Claude."])
  expect(w.submitted).toHaveLength(1)
})

test('the next queued prompt\'s turn counts as running once it starts', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)

  await ui.press({ key: 'op-ck-expand' })
  expect(w.toasts).toEqual([])
  await ui.press({ key: 'op-ck-learn' })
  expect(w.toasts).toEqual(['Queued: expand K for C12'])

  // The first turn ends and the queued one begins, with no prompt.submit between.
  await mainTurnEnds($)
  await turnStarts($, 'turn-2')
  await ui.press({ key: 'op-ck-defix' })
  expect(w.toasts).toEqual(['Queued: expand K for C12', 'Queued: defix C12'])
})

test('a subagent starting a turn is not the main loop running', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)

  await turnStarts($, 'turn-sub', 'agent-1')
  await ui.press({ key: 'op-ck-expand' })
  expect(w.toasts).toEqual([])
})

test('a slash command raises prompt.submit but starts no turn, so a press after it is not queued', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)

  await $.prompt.submit({
    text: '/ck-pane',
    wait: false,
    origin: { kind: 'composer' },
    command: { name: 'ck-pane', args: '' },
  })
  await ui.press({ key: 'op-ck-expand' })
  expect(w.toasts).toEqual([])
  expect(w.submitted).toHaveLength(2)
})

test('activity line', async ($, on) => {
  const w = world(on)
  for (const surface of ['desktop', 'terminal'] as const) {
    w.journal = []
    const ui = await mountPane($, surface)
    expect(await ui.find({ text: WORKING })).toBeUndefined()

    // The press is noted before its prompt goes; nothing is said until its turn starts.
    await ui.press({ key: 'op-ck-expand' })
    expect(w.journal).toEqual(['pending: partition C12', `submit: ${PRESSED('ck-expand')}`])
    expect(await ui.find({ text: WORKING })).toBeUndefined()

    await mainTurnStarts($, PRESSED('ck-expand'))
    expect(await ui.find({ text: 'Claude is working on: partition C12' })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: '●' }))?.props.color).toBe('claude')
    expect(w.journal.at(-1)).toBe('pending: ')

    // A subagent's turn ending is not Claude done with the press.
    await subagentTurnEnds($)
    expect(await ui.find({ text: 'Claude is working on: partition C12' })).toBeDefined()

    await mainTurnEnds($)
    expect(await ui.find({ text: WORKING })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: '●' })).toBeUndefined()
    await ui.unmount()
  }
})

test('a press queued behind a turn is said once its own turn starts', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)
  await userTypes($, 'what is C6?')
  await mainTurnStarts($, 'what is C6?')
  expect(await ui.find({ text: WORKING })).toBeUndefined()

  await ui.press({ key: 'op-ck-expand' })
  expect(w.toasts).toEqual(['Queued: partition C12'])
  expect(await ui.find({ text: WORKING })).toBeUndefined()

  // The user's turn ends: Claude has not started on the press yet.
  await mainTurnEnds($)
  expect(await ui.find({ text: WORKING })).toBeUndefined()

  await mainTurnStarts($, PRESSED('ck-expand'), 'turn-2')
  expect(await ui.find({ text: 'Claude is working on: partition C12' })).toBeDefined()
  await mainTurnEnds($)
  expect(await ui.find({ text: WORKING })).toBeUndefined()
})

test('two queued presses are said in order as their turns start', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)
  await userTypes($, 'a turn is running')
  await mainTurnStarts($, 'a turn is running')
  await ui.press({ key: 'op-ck-expand' })
  await ui.press({ key: 'op-ck-learn' })
  expect(w.toasts).toEqual(['Queued: partition C12', 'Queued: expand K for C12'])
  // The second press does not overwrite the first.
  expect(w.journal.filter(line => line.startsWith('pending'))).toEqual([
    'pending: partition C12',
    'pending: partition C12, expand K for C12',
  ])
  await mainTurnEnds($)
  expect(await ui.find({ text: WORKING })).toBeUndefined()

  await mainTurnStarts($, PRESSED('ck-expand'), 'turn-2')
  expect(await ui.find({ text: 'Claude is working on: partition C12' })).toBeDefined()
  await mainTurnEnds($)
  expect(await ui.find({ text: WORKING })).toBeUndefined()

  await mainTurnStarts($, PRESSED('ck-learn'), 'turn-3')
  expect(await ui.find({ text: 'Claude is working on: expand K for C12' })).toBeDefined()
  await mainTurnEnds($)
  expect(await ui.find({ text: WORKING })).toBeUndefined()
})

test('a turn the pane did not start says nothing', async ($, on) => {
  world(on)
  const ui = await mountPane($)
  await mainTurnStarts($, 'hello')
  expect(await ui.find({ text: WORKING })).toBeUndefined()
  await mainTurnEnds($)

  // Pending, a press waits for its own turn: a continuation (no text) is not it.
  await ui.press({ key: 'op-ck-expand' })
  await mainTurnStarts($, '', 'turn-2')
  expect(await ui.find({ text: WORKING })).toBeUndefined()
  await mainTurnEnds($)
  await mainTurnStarts($, PRESSED('ck-expand'), 'turn-3')
  expect(await ui.find({ text: 'Claude is working on: partition C12' })).toBeDefined()
})

test('a press that cannot be sent, or is dropped, leaves the other pending presses alone', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)
  await userTypes($, 'a turn is running')
  await mainTurnStarts($, 'a turn is running')
  await ui.press({ key: 'op-ck-expand' })

  w.denySubmit = true
  await ui.press({ key: 'op-ck-learn' })
  expect(w.toasts.at(-1)).toBe("Couldn't send that to Claude.")

  w.denySubmit = false
  w.dropSubmit = true
  await ui.press({ key: 'op-ck-defix' })
  expect(w.journal.filter(line => line.startsWith('pending'))).toEqual([
    'pending: partition C12',
    'pending: partition C12, expand K for C12',
    'pending: partition C12',
    'pending: partition C12, defix C12',
    'pending: partition C12',
  ])
  // The running turn is still the user's: nothing is said.
  expect(await ui.find({ text: WORKING })).toBeUndefined()

  // The refused and dropped presses are gone; the queued one is still told when its turn starts.
  await mainTurnEnds($)
  await mainTurnStarts($, PRESSED('ck-learn'), 'turn-2')
  expect(await ui.find({ text: WORKING })).toBeUndefined()
  await mainTurnEnds($)
  await mainTurnStarts($, PRESSED('ck-expand'), 'turn-3')
  expect(await ui.find({ text: 'Claude is working on: partition C12' })).toBeDefined()
})

test('Branch from here and Start a session say what Claude is working on', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)
  await ui.press({ key: 'step-back' })
  await ui.press({ key: 'branch-here' })
  await mainTurnStarts($, w.submitted.at(-1) ?? '')
  expect(await ui.find({ text: 'Claude is working on: branch from C10 at step 22' })).toBeDefined()
  await mainTurnEnds($)
  expect(await ui.find({ text: WORKING })).toBeUndefined()

  w.names = []
  await typeCkPane($)
  await ui.press({ key: 'start-session' })
  expect(w.submitted.at(-1)).toBe(START_TEXT)
  await mainTurnStarts($, START_TEXT, 'turn-2')
  expect(await ui.find({ text: 'Claude is working on: start a session' })).toBeDefined()
})

test('the same press again while its prompt waits or its turn runs is dropped, unsaid', async ($, on) => {
  const w = world(on)
  const ui = await mountPane($)

  // Two presses in a row: the second finds the first still waiting for its turn.
  await ui.press({ key: 'op-ck-expand' })
  await ui.press({ key: 'op-ck-expand' })
  expect(w.submitted).toEqual([PRESSED('ck-expand')])
  expect(w.toasts).toEqual([])

  // Its turn running, the same press is still the same request.
  await mainTurnStarts($, PRESSED('ck-expand'))
  await ui.press({ key: 'op-ck-expand' })
  expect(w.submitted).toEqual([PRESSED('ck-expand')])
  expect(w.toasts).toEqual([])

  // Another operator is another request, and waits its turn; two at once go once.
  await Promise.all([ui.press({ key: 'op-ck-learn' }), ui.press({ key: 'op-ck-learn' })])
  expect(w.submitted).toEqual([PRESSED('ck-expand'), PRESSED('ck-learn')])
  expect(w.toasts).toEqual(['Queued: expand K for C12'])

  // The turn over and the session idle, nothing waits: the same press is a new request.
  await mainTurnEnds($)
  await ui.press({ key: 'op-ck-expand' })
  expect(w.submitted).toEqual([PRESSED('ck-expand'), PRESSED('ck-learn'), PRESSED('ck-expand')])
})
