// Loading: the project's `sessions/*.ck.json` into $.state. `refresh` lists the
// folder, picks the file to show and re-reads it only when its mtime changed. A
// file caught half-written keeps the good copy already shown (Review Focus 1).
import type { EngineInterface } from 'claude-code'
import type { FileEntry, Loaded } from '../types'
import { parseSession } from './model'
import { changeView, readDoc, readFiles, readView, writeDoc, writeFiles } from './state'

const SESSIONS = 'sessions'
const SUFFIX = '.ck.json'

/** The file's name without `.ck.json`: what the skill and the press texts call the session. */
export const slugOf = (file: string): string =>
  file.endsWith(SUFFIX) ? file.slice(0, -SUFFIX.length) : file

export const messageOf = (err: unknown): string => (err instanceof Error ? err.message : String(err))

/** The session files, newest first; a missing `sessions/` is no files. */
async function listSessions($: EngineInterface): Promise<FileEntry[]> {
  let entries
  try {
    entries = await $.fs.list(SESSIONS)
  } catch {
    return []
  }
  return entries
    .filter(e => e.kind !== 'dir' && e.name.endsWith(SUFFIX) && e.name.length > SUFFIX.length)
    .map(e => ({ file: e.name, mtimeMs: e.mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))
}

const sameFiles = (a: FileEntry[], b: FileEntry[]) =>
  a.length === b.length && a.every((f, i) => f.file === b[i]?.file && f.mtimeMs === b[i]?.mtimeMs)

/** Same file, same stat, same outcome: writing it again would only redraw. */
const sameDoc = (a: Loaded | null, b: Loaded | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.file === b.file &&
    a.mtimeMs === b.mtimeMs &&
    ('error' in a ? 'error' in b && a.error === b.error : 'session' in b && a.session === b.session))

async function setDoc($: EngineInterface, next: Loaded | null): Promise<void> {
  if (sameDoc(await readDoc($), next)) return
  await writeDoc($, next)
}

/**
 * Brings `files` and `doc` up to date with the disk.
 *
 * `list` (default true) lists `sessions/` first; false reuses the last listing, for
 * a cheap check of the open file alone. The file shown is `view.file` while it is
 * listed, else the newest. It is re-read only when its mtime differs from `doc`'s;
 * a read or parse that fails replaces `doc` only when `doc` does not already hold a
 * good copy of that file, so a torn write never blanks the map.
 */
export async function refresh($: EngineInterface, options: { list?: boolean } = {}): Promise<void> {
  let listed: FileEntry[]
  if (options.list ?? true) {
    listed = await listSessions($)
    if (!sameFiles(await readFiles($), listed)) await writeFiles($, listed)
  } else {
    listed = await readFiles($)
  }

  const newest = listed[0]
  if (!newest) return setDoc($, null)
  const picked = await readView($)
  const file = picked.file !== null && listed.some(f => f.file === picked.file) ? picked.file : newest.file
  const path = `${SESSIONS}/${file}`

  const current = await readDoc($)
  // Another file takes the pane (a newer one while following the newest, or the
  // picked one gone): it opens live, on head at its tip, so the branch, step and
  // node picked in the last file go. `file` stays as the user set it. A no-op after
  // pickFile, which reset them, and on a hot reload, where `doc` holds this file.
  const isOtherFile = current === null || current.file !== file
  if (isOtherFile && (picked.branch !== null || picked.at !== null || picked.node !== null)) {
    await changeView($, v => ({ ...v, branch: null, at: null, node: null }))
  }
  const hasGoodCopy = current !== null && current.file === file && 'session' in current
  const failed = (mtimeMs: number, error: string) =>
    hasGoodCopy ? undefined : setDoc($, { file, mtimeMs, error })

  let mtimeMs: number
  try {
    mtimeMs = (await $.fs.stat(path)).mtimeMs
  } catch (err) {
    return failed(0, `cannot read it: ${messageOf(err)}`)
  }
  if (current !== null && current.file === file && current.mtimeMs === mtimeMs) return

  let text: string
  try {
    text = await $.fs.read(path)
  } catch (err) {
    return failed(mtimeMs, `cannot read it: ${messageOf(err)}`)
  }

  let session
  try {
    session = parseSession(text)
  } catch (err) {
    return failed(mtimeMs, messageOf(err))
  }
  return setDoc($, { file, mtimeMs, session })
}
