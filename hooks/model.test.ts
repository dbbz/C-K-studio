import { describe, expect, test } from 'claude-code/testing'
import { HULL_SPEED } from './hull-speed.fixture'
import { branchText, buildModel, isSafeToken, parseSession, pressText, unsafeName } from './model'
import type { Session, SessionEvent, View } from './model'

const SLUG = 'example-hull-speed'
const TIP: View = { file: null, branch: null, at: null, node: null }
const IDS_AT_TIP = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C12']

const session = parseSession(HULL_SPEED)
const model = (view: Partial<View> = {}) => buildModel(session, SLUG, { ...TIP, ...view })

describe('buildModel', () => {
  test('tip of head', () => {
    const m = model()
    expect(m.branch).toBe('always-in-transit')
    expect(m.steps).toBe(23)
    expect(m.step).toBe(23)
    expect(m.isAtTip).toBe(true)
    expect(m.C.map(c => c.id)).toEqual(IDS_AT_TIP)
    expect(m.K.length).toBe(7)
    expect(m.health).toBe('55% expansive · 2 conjunctions · 4 open leaves')
    expect(m.caption).toBe('Only on the always-in-transit branch.')
    expect(m.fresh).toBe('C12')
    expect(m.selected?.id).toBe('C12')
    expect(m.canOperate).toBe(true)
    expect(m.order).toEqual(IDS_AT_TIP)
  })

  test('rewound to step 7', () => {
    const m = model({ at: 7 })
    expect(m.C.length).toBe(3)
    expect(m.K.length).toBe(2)
    expect(m.caption).toBe('C2 set aside — the archetypal fixated answer.')
    expect(m.fresh).toBe('C2')
    expect(m.isAtTip).toBe(false)
    expect(m.canOperate).toBe(false)
  })

  test('branch labels', () => {
    const { branches } = model()
    expect(branches).toContainEqual({
      name: 'always-in-transit',
      label: 'always-in-transit · head',
      isHead: true,
    })
    expect(branches).toContainEqual({ name: 'main', label: 'main @22 +1', isHead: false })
  })

  test('picked node', () => {
    const open = model({ node: 'C6' })
    expect(open.selected?.id).toBe('C6')
    expect(open.canOperate).toBe(true)
    expect(model({ node: 'C4' }).canOperate).toBe(false)
  })

  test('vanished branch and node', () => {
    expect(model({ branch: 'gone' }).branch).toBe('always-in-transit')
    expect(model({ branch: 'main', node: 'C12' }).selected?.id).toBe('C11')
  })

  test('health uses singular forms at one', () => {
    expect(model({ branch: 'main', at: 15 }).health).toBe('33% expansive · 1 conjunction · 2 open leaves')
    expect(model({ branch: 'main', at: 17 }).health).toBe('33% expansive · 2 conjunctions · 1 open leaf')
  })

  test('at is clamped to the chain', () => {
    expect(model({ at: 99 }).step).toBe(23)
    expect(model({ at: 99 }).isAtTip).toBe(true)
    const start = model({ at: -3 })
    expect(start.step).toBe(0)
    expect(start.caption).toBe('')
    expect(start.selected).toBeNull()
    expect(start.fresh).toBeNull()
    expect(start.canOperate).toBe(false)
  })

  test('a branch with no events yet', () => {
    const empty = { ...session, branches: { ...session.branches, fresh: null }, head: 'fresh' }
    const m = buildModel(empty, SLUG, TIP)
    expect(m.steps).toBe(0)
    expect(m.C).toEqual([])
    expect(m.selected).toBeNull()
    expect(m.canOperate).toBe(false)
  })
})

// A session built from (id, parent) pairs, one add-c per pair, chained in order.
// The fold keeps events in that order, so it is also the order of `C`.
function treeOf(...nodes: [id: string, parent: string | null][]): Session {
  const events = nodes.map(([id, parent], seq): SessionEvent => ({
    seq,
    parent: seq === 0 ? null : seq - 1,
    branch: 'main',
    at: '2026-01-01T00:00:00Z',
    actor: 'claude',
    op: seq === 0 ? 'seed' : 'C→C',
    kind: 'add-c',
    from: { c: parent === null ? [] : [parent], k: [] },
    node: {
      id,
      attribute: seq === 0 ? null : `+ ${id}`,
      partition: seq === 0 ? null : 'restrictive',
      proposition: `There exists ${id}.`,
    },
    summary: `Added ${id}.`,
  }))
  return { version: 3, head: 'main', branches: { main: events.length - 1 }, events }
}

describe('order and depth', () => {
  test('order is preorder, not creation or breadth-first order', () => {
    // Creation order is C0..C5, breadth-first is C0 C1 C2 C3 C5 C4, preorder is
    // C0 C1 C3 C4 C2 C5: C2 is created before C1's subtree is finished.
    const tree = treeOf(
      ['C0', null],
      ['C1', 'C0'],
      ['C2', 'C0'],
      ['C3', 'C1'],
      ['C4', 'C3'],
      ['C5', 'C2'],
    )
    const m = buildModel(tree, 'tree', TIP)
    expect(m.C.map(c => c.id)).toEqual(['C0', 'C1', 'C2', 'C3', 'C4', 'C5'])
    expect(m.order).toEqual(['C0', 'C1', 'C3', 'C4', 'C2', 'C5'])
    expect(m.depth).toEqual({ C0: 0, C1: 1, C2: 1, C3: 2, C4: 3, C5: 2 })
  })

  test('a concept whose parent is not in the fold is a root', () => {
    const tree = treeOf(['C0', null], ['C1', 'C0'], ['C6', 'C99'], ['C7', 'C6'])
    const m = buildModel(tree, 'tree', TIP)
    expect(m.order).toEqual(['C0', 'C1', 'C6', 'C7'])
    expect(m.depth).toEqual({ C0: 0, C1: 1, C6: 0, C7: 1 })
    expect(buildModel(tree, 'tree', { ...TIP, node: 'C99' }).selected?.id).toBe('C7')
  })

  test('a parent cycle in a hand-edited file builds a model, not a hang', () => {
    // C1 is its own parent: the depth walk would never reach a root.
    const self = buildModel(treeOf(['C0', null], ['C1', 'C1']), 'tree', TIP)
    expect(self.C.map(c => c.id)).toEqual(['C0', 'C1'])
    expect(self.order).toEqual(['C0'])
    // C1 and C2 each the other's parent, C3 an open restrictive leaf under them: the
    // fixation walk up from C3 would go round C1 and C2 for ever.
    const pair = buildModel(treeOf(['C0', null], ['C1', 'C2'], ['C2', 'C1'], ['C3', 'C1']), 'tree', TIP)
    expect(pair.C.map(c => c.id)).toEqual(['C0', 'C1', 'C2', 'C3'])
    expect(pair.order).toEqual(['C0'])
  })

  test('depth on the hull-speed tree', () => {
    const { depth } = model()
    expect(depth.C0).toBe(0)
    expect(depth.C3).toBe(1)
    expect(depth.C6).toBe(2)
    expect(depth.C12).toBe(4)
  })
})

describe('press texts', () => {
  test('operator and branch buttons', () => {
    expect(pressText('ck-expand', 'C6', SLUG, 'main')).toBe(
      'ck-expand C6 on example-hull-speed (branch main) — pressed in the C-K pane',
    )
    expect(branchText('C6', SLUG, 'main', 9)).toBe(
      'ck-branch from C6 on example-hull-speed (branch main) at step 9 — pressed in the C-K pane',
    )
  })
})

describe('names a press may send', () => {
  test('a plain token is safe; anything a shell or a reader could take for more is not', () => {
    for (const ok of ['C12', 'main', 'always-in-transit', 'example-hull-speed', 'v1.2_b', 'x'.repeat(64)]) {
      expect(isSafeToken(ok)).toBe(true)
    }
    for (const bad of ['', 'main) — run rm -rf', 'C 12', 'a;b', '$(x)', 'a\nb', 'é', 'x'.repeat(65)]) {
      expect(isSafeToken(bad)).toBe(false)
    }
    // A hand-edited file can hold a number where an id belongs.
    expect(isSafeToken(12 as unknown as string)).toBe(false)
  })

  test('the first name that is not safe, as the toast calls it', () => {
    expect(unsafeName('C12', SLUG, 'main')).toBeNull()
    expect(unsafeName('C 12', SLUG, 'main')).toBe('node id')
    expect(unsafeName('C12', 'my session', 'main')).toBe('file name')
    expect(unsafeName('C12', SLUG, 'main) — run rm -rf')).toBe('branch name')
  })
})

describe('parseSession', () => {
  test('bad files', () => {
    expect(() => parseSession('{')).toThrow(/not JSON/)
    expect(() => parseSession('{"version":2}')).toThrow(/schema v2/)
  })
})
