// The pane's values in $.state (declared in types/index.d.ts). Everything the
// drawing reads comes from here, so a hot reload keeps what the user picked.
//
// The atoms stay private to this file on purpose: the engine scans each module
// at load and refuses `read` or `update` on an atom made in another file ("a
// const of this file"), so every read and write of them is a function here. Each
// is a function declaration because past an import the scan follows $ only into
// one. Read while a ui.render hook draws, these subscribe the drawing as `read` does.
import { atom, read, update } from 'claude-code'
import type { StateDollar } from 'claude-code'
import type { FileEntry, Loaded, Pending, View } from '../types'

/** The open session file as last read, or null when `sessions/` holds none. */
const doc = atom({ plugin: 'ck-studio', key: 'doc' } as const, null)

/** The `*.ck.json` files in `sessions/`, newest first. */
const files = atom({ plugin: 'ck-studio', key: 'files' } as const, [])

/** What the user picked; each null follows the live session (newest file, head, tip, latest node). */
const view = atom({ plugin: 'ck-studio', key: 'view' } as const, {
  file: null,
  branch: null,
  at: null,
  node: null,
})

/** The user closed the pane this session, so it is not reopened unasked. */
const isClosed = atom({ plugin: 'ck-studio', key: 'isClosed' } as const, false)

/** The user hid the map overview; the tree view stays. */
const isMapHidden = atom({ plugin: 'ck-studio', key: 'isMapHidden' } as const, false)

/**
 * The press whose turn is running, its prompt and what it asked Claude for: set when the
 * main loop's turn starts with a pending press's prompt, null when the turn completes or
 * was not the pane's.
 */
const activity = atom({ plugin: 'ck-studio', key: 'activity' } as const, null)

/** The presses whose turns have not started, oldest first: a turn is told apart by its text. */
const pending = atom({ plugin: 'ck-studio', key: 'pending' } as const, [])

export function readDoc($: StateDollar): Promise<Loaded | null> {
  return read($, doc)
}
export function writeDoc($: StateDollar, value: Loaded | null): Promise<Loaded | null> {
  return update($, doc, () => value)
}

export function readFiles($: StateDollar): Promise<FileEntry[]> {
  return read($, files)
}
export function writeFiles($: StateDollar, value: FileEntry[]): Promise<FileEntry[]> {
  return update($, files, () => value)
}

export function readView($: StateDollar): Promise<View> {
  return read($, view)
}
/** Applies `change` to the view as it stands when written, so two quick presses both land. */
export function changeView($: StateDollar, change: (value: View) => View): Promise<View> {
  return update($, view, change)
}

export function readIsClosed($: StateDollar): Promise<boolean> {
  return read($, isClosed)
}
export function writeIsClosed($: StateDollar, value: boolean): Promise<boolean> {
  return update($, isClosed, () => value)
}

export function readIsMapHidden($: StateDollar): Promise<boolean> {
  return read($, isMapHidden)
}
/** Flips the map's hidden flag as it stands when written, so two quick presses both land. */
export function toggleIsMapHidden($: StateDollar): Promise<boolean> {
  return update($, isMapHidden, value => !value)
}

export function readActivity($: StateDollar): Promise<Pending | null> {
  return read($, activity)
}
export function writeActivity($: StateDollar, value: Pending | null): Promise<Pending | null> {
  return update($, activity, () => value)
}

/**
 * Notes a press before its prompt goes, so its turn is known when it starts; true when
 * noted. With `isOnce`, a press whose prompt is pending already is the same request
 * again: it is not noted, `pending` is left unwritten, and the answer is false. The
 * check is made again inside the write, so of two presses at once only one is noted.
 */
export async function addPending($: StateDollar, entry: Pending, isOnce = false): Promise<boolean> {
  const isWaiting = (list: Pending[]) => isOnce && list.some(p => p.text === entry.text)
  if (isWaiting(await read($, pending))) return false
  let isAdded = false
  await update($, pending, list => {
    isAdded = !isWaiting(list)
    return isAdded ? [...list, entry] : list
  })
  return isAdded
}

/** Forgets a press whose prompt did not enter: the latest entry equal to it, and nothing else. */
export function dropPending($: StateDollar, entry: Pending): Promise<Pending[]> {
  return update($, pending, list => {
    let at = list.length - 1
    while (at >= 0 && (list[at]?.text !== entry.text || list[at]?.doing !== entry.doing)) at--
    return at < 0 ? list : [...list.slice(0, at), ...list.slice(at + 1)]
  })
}

/**
 * The main loop's turn starting with `text`: the oldest press that sent it is taken from
 * `pending` and becomes `activity`; null when no press sent it. A turn no press sent
 * leaves `pending` unwritten.
 */
export async function startActivity($: StateDollar, text: string): Promise<Pending | null> {
  let press: Pending | null = null
  if ((await read($, pending)).some(p => p.text === text)) {
    await update($, pending, list => {
      const at = list.findIndex(p => p.text === text)
      press = at < 0 ? null : (list[at] ?? null)
      return at < 0 ? list : [...list.slice(0, at), ...list.slice(at + 1)]
    })
  }
  return update($, activity, () => press)
}
