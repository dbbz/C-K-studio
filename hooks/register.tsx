import type { EngineInterface, Register } from 'claude-code'
import { markBusy, markIdle, trackSubmit } from './busy'
import { messageOf, refresh } from './load'
import { drawPane } from './pane'
import { readDoc, readIsClosed, startActivity, writeActivity, writeIsClosed } from './state'

const PANE = 'ck'
const TITLE = 'C-K'

/** A `ck` word in a shell command: `ck show`, `ck-expand`, `node …/lib/ck.cjs …`; not `check`. */
const CK_COMMAND = /\bck\b/

/** What Claude is told while the pane is up (spec, "Telling Claude the pane is there"). */
const PANE_NOTE =
  'The C-K Studio pane is open in the Claude app and shows the session live. ' +
  "Don't run `ck view` or arm the canvas Monitor unless the user asks for the browser canvas. " +
  'Messages ending "— pressed in the C-K pane" are the user pressing an operator there.'

/**
 * Whether the pane is up: the last `ui.open` placed it and no `ui.close` since. Module
 * state, so a hot reload forgets it, and then `session.start` runs again and opens it.
 */
let isPaneOpen = false

/** Opens the pane and notes whether a surface drew it. */
async function openPane($: EngineInterface) {
  const opened = await $.ui.open({ id: PANE, title: TITLE })
  isPaneOpen = opened.isPlaced
  return opened
}

/** Opens the pane unasked: only for a project that holds a session, and never after the user closed it. */
async function openUnlessClosed($: EngineInterface): Promise<void> {
  if (isPaneOpen || (await readIsClosed($)) || (await readDoc($)) === null) return
  await openPane($)
}

/** The failure's line in the debug log, which is all a failed refresh or open gets. */
const failureLine = (err: unknown) => `ck-studio: ${messageOf(err)}`

/**
 * Reads the project's sessions, then opens the pane unasked. A failure here is never the
 * caller's (the pane is a view: it must not break a turn or the session's start); it goes
 * to the debug log.
 */
async function refreshAndOpen($: EngineInterface): Promise<void> {
  try {
    await refresh($)
    await openUnlessClosed($)
  } catch (err) {
    $.ui.log(failureLine(err), { to: 'debug' })
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'ck-pane',
      description: 'Show the C-K session as a pane',
    })
    await refreshAndOpen($)

    // Each second checks the open file; every fifth lists `sessions/` too, for a new
    // file. A reload registers this again, and the engine drops the old timer.
    let tick = 0
    let isRefreshing = false
    // A failure that lasts would write every second: a line only when it differs from the
    // last one logged, and a refresh that works starts the count afresh.
    let lastLogged = ''
    $.clock.every(1000, () => {
      if (isRefreshing) return
      tick += 1
      isRefreshing = true
      refresh($, { list: tick % 5 === 0 })
        .then(() => {
          lastLogged = ''
        })
        .catch((err: unknown) => {
          const line = failureLine(err)
          if (line === lastLogged) return
          lastLogged = line
          $.ui.log(line, { to: 'debug' })
        })
        .finally(() => {
          isRefreshing = false
        })
    })

    return next(e)
  })

  // Read the project's sessions first, so the pane opens on what is on disk.
  on('command.run', { command: 'ck-pane' }, async $ => {
    await refresh($)
    await writeIsClosed($, false)
    const opened = await openPane($)

    return { text: opened.isPlaced ? 'C-K pane opened.' : `C-K pane not shown: ${opened.reason}` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, ($, e) => drawPane($, e))

  // In the desktop app `session.start` finds no page to draw on, so its open is not placed
  // and the pane is drawn only when the page attaches. Opening an open id retitles it and
  // answers placed, which is what the section for Claude waits on.
  on('session.attach', async ($, e, next) => {
    const attached = await next(e)
    await refreshAndOpen($)
    return attached
  })

  // Claude ran a `ck` command: the session file changed under it, so show it now, and
  // open the pane if this is the first. The tool's answer goes through untouched.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (CK_COMMAND.test(e.command)) await refreshAndOpen($)
    return ran
  })

  // Only the person's close is remembered: a plugin's or the engine's is no refusal.
  on('ui.close', { id: PANE }, async ($, e, next) => {
    isPaneOpen = false
    if (e.origin.kind === 'person') await writeIsClosed($, true)
    return next(e)
  })

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    if (!isPaneOpen) return composed
    return { sections: [...composed.sections, { id: 'ck-studio:pane', scope: 'session', text: PANE_NOTE }] }
  })

  // A prompt starts a turn or waits behind the running one, from any origin but a slash
  // command, which raises this too and starts no turn.
  on('prompt.submit', ($, e, next) => (e.command === undefined ? trackSubmit(() => next(e)) : next(e)))

  // The main loop's turns begin and end here (a subagent's are not its). A prompt that
  // waited behind a turn begins one with no prompt.submit of its own, so the start counts too.
  // A turn that starts with a pending press's prompt is that press's: the pane says what it
  // asked for until the turn ends. Any other turn is not the pane's, and it says nothing. A
  // failure to say so is the debug log's, never the turn's.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      markBusy()
      try {
        await startActivity($, e.text)
      } catch (err) {
        $.ui.log(failureLine(err), { to: 'debug' })
      }
    }
    return next(e)
  })
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      markIdle()
      try {
        await writeActivity($, null)
      } catch (err) {
        $.ui.log(failureLine(err), { to: 'debug' })
      }
    }
    return next(e)
  })
}
