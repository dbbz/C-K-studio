// The view model: a parsed session file plus what the user is viewing, in, and
// everything the pane draws out, plus the exact text each button submits. Pure
// TypeScript: no drawing, no $ calls. The fold (chainOf, foldEvents, metrics)
// is lib/view.mjs, the same code the browser canvas runs.
import { chainOf, divergence, foldEvents, metrics } from '../lib/view.mjs'
import type { Concept, Knowledge } from '../lib/view.mjs'
import type { Session, SessionEvent, View } from '../types'

export type { Session, SessionEvent, View }

export type Operator = 'ck-expand' | 'ck-learn' | 'ck-conjoin' | 'ck-defix'

export type BranchOption = { name: string; label: string; isHead: boolean }

export type PaneModel = {
  /** The session's title, else its file slug. */
  title: string
  slug: string
  /** The branch being viewed: view.branch if it exists, else head. */
  branch: string
  branches: BranchOption[]
  /** Events folded so far, 0..steps. */
  step: number
  /** Length of the viewed branch's chain. */
  steps: number
  /** The summary of the event at `step`, '' before the first. */
  caption: string
  isAtTip: boolean
  health: string
  warnings: string[]
  C: Concept[]
  K: Knowledge[]
  /** Concept ids, preorder from the root, children in fold order. */
  order: string[]
  depth: Record<string, number>
  selected: Concept | null
  /** The id the event at `step` added or changed; null when it touched none. */
  fresh: string | null
  canOperate: boolean
}

export const START_TEXT = 'Start a C-K session with ck-studio.'

/** The operator buttons, in the order drawn; `verb` completes "Queued: <verb> C6". */
export const OPERATORS: { op: Operator; label: string; verb: string }[] = [
  { op: 'ck-expand', label: 'Partition', verb: 'partition' },
  { op: 'ck-learn', label: 'Expand K', verb: 'expand K for' },
  { op: 'ck-conjoin', label: 'Test status', verb: 'test the status of' },
  { op: 'ck-defix', label: 'Defix', verb: 'defix' },
]

const PRESSED = 'pressed in the C-K pane'

export function pressText(op: Operator, node: string, slug: string, branch: string): string {
  return `${op} ${node} on ${slug} (branch ${branch}) — ${PRESSED}`
}

export function branchText(node: string, slug: string, branch: string, step: number): string {
  return `ck-branch from ${node} on ${slug} (branch ${branch}) at step ${step} — ${PRESSED}`
}

export function parseSession(text: string): Session {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('not JSON')
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('not a C-K session')
  }
  const s = raw as Record<string, unknown>
  if (s.version !== 3) {
    const v = typeof s.version === 'number' ? s.version : '?'
    throw new Error(`schema v${v}; convert it with lib/migrate-v3.cjs`)
  }
  if (
    typeof s.head !== 'string' ||
    typeof s.branches !== 'object' ||
    s.branches === null ||
    !Array.isArray(s.events)
  ) {
    throw new Error('schema v3 file lacks head, branches or events')
  }
  return raw as Session
}

const has = (o: object, key: string) => Object.prototype.hasOwnProperty.call(o, key)

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Preorder walk from the root; a concept whose parent is not in the fold roots too. */
export function treeOrder(C: Concept[]): { order: string[]; depth: Record<string, number> } {
  const ids = new Set(C.map(c => c.id))
  const kids = new Map<string | null, Concept[]>()
  for (const c of C) {
    const key = c.parent !== null && ids.has(c.parent) ? c.parent : null
    const list = kids.get(key)
    if (list) list.push(c)
    else kids.set(key, [c])
  }

  const order: string[] = []
  const depth: Record<string, number> = {}
  const seen = new Set<Concept>()
  const visit = (c: Concept, d: number) => {
    if (seen.has(c)) return
    seen.add(c)
    order.push(c.id)
    depth[c.id] = d
    for (const kid of kids.get(c.id) ?? []) visit(kid, d + 1)
  }
  for (const root of kids.get(null) ?? []) visit(root, 0)
  return { order, depth }
}

/** The id the event added (add-c) or changed (set-status, annotate), if any. */
function freshOf(e: SessionEvent | undefined): string | null {
  if (!e) return null
  if (e.kind === 'add-c') return e.node?.id ?? null
  if (e.kind === 'set-status' || e.kind === 'annotate') return e.target ?? null
  return null
}

export function buildModel(session: Session, slug: string, view: View): PaneModel {
  const { events, branches, head } = session
  const branch = view.branch !== null && has(branches, view.branch) ? view.branch : head

  const chain = chainOf(events, branches[branch])
  const steps = chain.length
  const step =
    view.at !== null && Number.isFinite(view.at)
      ? Math.min(Math.max(Math.trunc(view.at), 0), steps)
      : steps
  const isAtTip = step === steps

  const { C, K } = foldEvents(chain, step)
  const m = metrics(C, K)
  const { order, depth } = treeOrder(C)

  const event = chain[step - 1]
  const fresh = freshOf(event)
  const byId = new Map(C.map(c => [c.id, c]))
  const selected =
    (view.node !== null ? byId.get(view.node) : undefined) ??
    (fresh !== null ? byId.get(fresh) : undefined) ??
    byId.get(order[0] ?? '') ??
    null

  const branchOptions = Object.keys(branches).map((name): BranchOption => {
    if (name === head) return { name, label: `${name} · head`, isHead: true }
    const d = divergence(events, branches[head], branches[name])
    const len = chainOf(events, branches[name]).length
    return { name, label: `${name} @${d.step} +${len - d.step}`, isHead: false }
  })

  return {
    title: session.title ?? slug,
    slug,
    branch,
    branches: branchOptions,
    step,
    steps,
    caption: event?.summary ?? '',
    isAtTip,
    health:
      `${Math.round(m.ratio * 100)}% expansive · ` +
      `${count(m.conjunctions, 'conjunction', 'conjunctions')} · ` +
      `${count(m.openLeaves.length, 'open leaf', 'open leaves')}`,
    warnings: m.warnings,
    C,
    K,
    order,
    depth,
    selected,
    fresh,
    canOperate: isAtTip && selected?.status === 'open',
  }
}
