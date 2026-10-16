import { describe, expect, test } from 'claude-code/testing'
import { HULL_SPEED } from './hull-speed.fixture'
import { layoutTree, renderMap, treeRows } from './map'
import { buildModel, parseSession } from './model'
import type { PaneModel, Session, SessionEvent, View } from './model'

const SLUG = 'example-hull-speed'
const TIP: View = { file: null, branch: null, at: null, node: null }

const session = parseSession(HULL_SPEED)
const model = (view: Partial<View> = {}) => buildModel(session, SLUG, { ...TIP, ...view })

/** The lines of a labelled box's label: the text of each `.t` tspan, in order. */
function linesOf(box: string): string[] {
  return [...box.matchAll(/<tspan class="t"[^>]*>([^<]*)<\/tspan>/g)].map(m => m[1] ?? '')
}

/** The `<g>` of one concept's box: it holds the tooltip, the rings, the box and its label. */
function boxOf(svg: string, id: string): string {
  const found = svg.match(new RegExp(`<g [^>]*><title>${id} \\[[^]*?</g>`))
  if (!found) throw new Error(`no box for ${id}`)
  return found[0]
}

describe('layoutTree', () => {
  test('layout is a tidy tree', () => {
    const m = model()
    const { boxes, slots, levels } = layoutTree(m.C)
    const at = new Map(boxes.map(b => [b.id, b]))

    expect(boxes.length).toBe(m.C.length)
    expect(new Set(boxes.map(b => `${b.x},${b.y}`)).size).toBe(boxes.length)
    expect(slots).toBe(8)
    expect(levels).toBe(5)

    for (const c of m.C) {
      expect(at.get(c.id)?.y).toBe(m.depth[c.id])
      const kids = m.order.filter(id => m.C.find(k => k.id === id)?.parent === c.id)
      if (kids.length === 0) continue
      const first = at.get(kids[0] ?? '')
      const last = at.get(kids[kids.length - 1] ?? '')
      expect(at.get(c.id)?.x).toBe(((first?.x ?? NaN) + (last?.x ?? NaN)) / 2)
    }
  })

  test('leaves take consecutive slots, left to right', () => {
    const { boxes } = layoutTree(model().C)
    const x = (id: string) => boxes.find(b => b.id === id)?.x
    expect(['C1', 'C2', 'C4', 'C5', 'C7', 'C8', 'C9', 'C12'].map(x)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    // A parent sits between its first and last child, not between its leaves:
    // C6 = (C7 + C10) / 2, C3 = (C4 + C6) / 2, C0 = (C1 + C3) / 2.
    expect(x('C10')).toBe(7)
    expect(x('C6')).toBe(5.5)
    expect(x('C3')).toBe(3.75)
    expect(x('C0')).toBe(1.875)
  })

  test('an empty fold and a forest', () => {
    expect(layoutTree([])).toEqual({ boxes: [], slots: 0, levels: 0 })

    // C6's parent is not in the fold, so it roots a second tree beside C0's.
    const forest = buildModel(treeOf(['C0', null], ['C1', 'C0'], ['C6', 'C99'], ['C7', 'C6']), 'tree', TIP)
    const { boxes, slots, levels } = layoutTree(forest.C)
    expect(boxes).toEqual([
      { id: 'C0', x: 0, y: 0 },
      { id: 'C1', x: 0, y: 1 },
      { id: 'C6', x: 1, y: 0 },
      { id: 'C7', x: 1, y: 1 },
    ])
    expect(slots).toBe(2)
    expect(levels).toBe(2)
  })
})

const MODES = ['labelled', 'compact'] as const

/** The root `<svg>`'s width and height attributes and its viewBox. */
function sizeOf(svg: string) {
  const [, w, h] = svg.match(/^<svg [^>]*?width="(\d+)" height="(\d+)"/) ?? []
  const [, vw, vh] = svg.match(/^<svg [^>]*?viewBox="0 0 (\d+) (\d+)"/) ?? []
  return { width: Number(w), height: Number(h), viewBox: `${vw} ${vh}` }
}

describe('renderMap', () => {
  test('map carries a tooltip per concept', () => {
    const m = model()
    for (const mode of MODES) {
      const svg = renderMap(m, mode).source
      expect((svg.match(/<title>/g) ?? []).length).toBe(m.C.length)
      expect(svg).toContain('prefers-color-scheme: dark')
      expect(svg).toContain('#2a78d6')
      expect(svg).toContain('#eb6834')
      expect(svg).toContain('#3987e5')
      expect(svg).toContain('#d95926')
      expect(svg).toContain(
        '<title>C6 [E] + has no hull — open\nThere exists a way to move cargo over water with no vessel at all.</title>',
      )
      expect(svg).toContain('<title>C0 [·] root concept — open\n')
      expect(svg).toContain('<title>C1 [R] + more power — refuted\n')
    }
  })

  test('labelled map shows attribute labels', () => {
    const svg = renderMap(model(), 'labelled').source
    expect(svg).toContain('>C6<')
    expect(boxOf(svg, 'C6')).toContain('>has no hull<')
    expect(svg).not.toContain('>+ has no hull<')
    expect(boxOf(svg, 'C0')).toContain('>root concept<')

    // C9's attribute is 47 characters: two lines hold 21 + 24 of them at most, so the
    // second line ends in an ellipsis.
    expect(linesOf(boxOf(svg, 'C9'))).toEqual(['nothing crosses the', 'water but the…'])
    // C12's 23 characters wrap onto a second line, whole.
    expect(linesOf(boxOf(svg, 'C12'))).toEqual(['the network never', 'stops'])
    // A label that fits is whole, on one line.
    expect(linesOf(boxOf(svg, 'C1'))).toEqual(['more power'])
  })

  test('labels wrap onto two lines', () => {
    const svg = renderMap(model(), 'labelled').source
    // C4 ✓: 154 px of room at 6.2 px a character is 24 characters a line; the first
    // line gives up the id, the ✓ (two) and a space, so 19. Its 29 characters fit whole.
    const c4 = boxOf(svg, 'C4')
    expect(linesOf(c4)).toEqual(['supported by a', 'submerged wing'])
    expect(linesOf(c4).join(' ')).toBe('supported by a submerged wing')
    expect(c4).not.toContain('…')
    // C4's box is at (420, 112), 40 tall: the lines are 15 px apart, centred on its middle
    // (132), and the second starts at the text's left edge (420 + 4 + 10).
    expect(c4).toContain('<text x="434" y="124.5" dy=".35em"><tspan class="i">C4</tspan>')
    expect(c4).toContain('<tspan class="t" x="434" dy="15">submerged wing</tspan>')
    // A one-line label is centred alone: C6's box is at (420, 287).
    expect(boxOf(svg, 'C6')).toContain('<text x="434" y="307" dy=".35em">')

    const m = model()
    const relabel = (attribute: string): string[] => {
      const changed: PaneModel = { ...m, C: m.C.map(c => (c.id === 'C6' ? { ...c, attribute } : c)) }
      return linesOf(boxOf(renderMap(changed, 'labelled').source, 'C6'))
    }
    const chars = (line: string | undefined) => Array.from(line ?? '')

    // 120 characters: the second line ends in an ellipsis, and both fit their room
    // (C6 leaves 24 - 2 - 1 = 21 beside its id).
    const long = relabel(`+ ${'lorem ipsum dolor sit amet '.repeat(5).slice(0, 118)}`)
    expect(long).toHaveLength(2)
    expect(long[1]?.endsWith('…')).toBe(true)
    expect(chars(long[0]).length).toBeLessThanOrEqual(21)
    expect(chars(long[1]).length).toBeLessThanOrEqual(24)

    // Any run of white space is one space.
    expect(relabel('+ has\tno\n  hull')).toEqual(['has no hull'])

    // A word longer than a line is cut there.
    expect(relabel(`+ ${'a'.repeat(60)}`)).toEqual(['a'.repeat(21), `${'a'.repeat(23)}…`])

    // Characters are code points: an emoji is never cut in half.
    const ships = relabel(`+ ${'🚢'.repeat(60)}`)
    expect(ships).toEqual(['🚢'.repeat(21), `${'🚢'.repeat(23)}…`])
    for (const line of ships) {
      expect(line).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/)
    }
  })

  test('compact map shows ids only', () => {
    const labelled = renderMap(model(), 'labelled')
    const compact = renderMap(model(), 'compact')
    expect(compact.source).toContain('>C6<')
    expect(compact.source).not.toContain('>has no hull<')
    expect(compact.source).not.toContain('>root concept<')
    expect(compact.width).toBeLessThan(labelled.width)
  })

  test('labelled map size', () => {
    // The hull-speed tip: 5 levels, 8 leaves. Columns are depths, rows leaf slots.
    const labelled = renderMap(model(), 'labelled')
    expect(labelled.width).toBe(12 * 2 + 4 * 204 + 176)
    expect(labelled.height).toBe(12 * 2 + 7 * 50 + 40)
    expect(labelled.width).toBe(1016)
    expect(labelled.height).toBe(414)
    expect(sizeOf(labelled.source)).toEqual({ width: 1016, height: 414, viewBox: '1016 414' })
  })

  test('map size follows the layout', () => {
    const labelled = renderMap(model(), 'labelled')
    const compact = renderMap(model(), 'compact')
    expect(compact.width).toBe(12 * 2 + 4 * 76 + 52)
    expect(compact.height).toBe(12 * 2 + 7 * 34 + 26)
    expect(compact.width).toBe(380)
    expect(compact.height).toBe(288)

    // The svg's own size is the one reported.
    for (const map of [labelled, compact]) {
      expect(sizeOf(map.source)).toEqual({
        width: map.width,
        height: map.height,
        viewBox: `${map.width} ${map.height}`,
      })
    }
  })

  test('nodes sit in columns by depth and rows by leaf slot', () => {
    const svg = renderMap(model(), 'labelled').source
    const boxAt = (id: string) => {
      const [, x, y] = boxOf(svg, id).match(/<rect class="b" x="([\d.]+)" y="([\d.]+)"/) ?? []
      return { x: Number(x), y: Number(y) }
    }
    // C0: depth 0, slot 1.875. C12: depth 4, slot 7. C1: depth 1, slot 0.
    expect(boxAt('C0')).toEqual({ x: 12, y: 12 + 1.875 * 50 })
    expect(boxAt('C12')).toEqual({ x: 12 + 4 * 204, y: 12 + 7 * 50 })
    expect(boxAt('C1')).toEqual({ x: 12 + 204, y: 12 })
  })

  test('connectors run from each parent\'s right edge to its children\'s left edges', () => {
    const svg = renderMap(model(), 'labelled').source
    const d = svg.match(/<path class="l" d="([^"]*)"/)?.[1] ?? ''
    // C10 has one child, C12, on its own row: right edge 12 + 3·204 + 176 = 800, left edge 12 + 4·204 = 828.
    const row = 12 + 7 * 50 + 20
    expect(d).toContain(`M800 ${row}H814V${row}H828`)
    // C6's four children: its stub, a bracket from the first to the last, and the two between.
    const c6 = 12 + 5.5 * 50 + 20
    expect(d).toContain(`M596 ${c6}H610`)
    expect(d).toContain(`M624 ${12 + 4 * 50 + 20}H610V${12 + 7 * 50 + 20}H624`)
    expect(d).toContain(`M610 ${12 + 5 * 50 + 20}H624`)
    expect(d).toContain(`M610 ${12 + 6 * 50 + 20}H624`)
  })

  test('the svg is drawn with no script, its boxes the mode\'s size', () => {
    for (const mode of MODES) {
      const svg = renderMap(model(), mode).source
      expect(svg.startsWith('<svg ')).toBe(true)
      expect(svg).toContain('role="img"')
      expect(svg).toContain(mode === 'labelled' ? 'width="176" height="40" rx="6"' : 'width="52" height="26" rx="6"')
      expect(svg).toContain('font-family="system-ui, -apple-system, sans-serif" font-size="12"')
      // Connectors: one path of orthogonal segments.
      expect((svg.match(/<path class="l"/g) ?? []).length).toBe(1)
      expect(svg).toMatch(/<path class="l" d="[MHV0-9. ]+"\/>/)
      expect(svg).not.toMatch(/<script|onclick|onload|href=/i)
      expect(svg.endsWith('</svg>')).toBe(true)
    }
  })

  test('partition is a class, so the dark block can swap it', () => {
    for (const mode of MODES) {
      const svg = renderMap(model(), mode).source
      expect(boxOf(svg, 'C1')).toMatch(/^<g class="r"/)
      expect(boxOf(svg, 'C6')).toMatch(/^<g class="e"/)
      expect(boxOf(svg, 'C0')).toMatch(/^<g class="o"/)
      // Every box has its partition's bar on its left edge, 4 px wide, its outer edge
      // following the box's rounded corners (radius 6) so nothing pokes past them.
      const [, bx, by, bh] = boxOf(svg, 'C6').match(/<rect class="b" x="([\d.]+)" y="([\d.]+)" width="\d+" height="(\d+)"/) ?? []
      const [x, y, h] = [bx, by, bh].map(Number) as [number, number, number]
      const inset = 6 - Math.sqrt(6 * 6 - 2 * 2) // where the corner's arc crosses x + 4
      const at = (v: number) => String(Math.round(v * 100) / 100)
      expect(boxOf(svg, 'C6')).toContain(
        `<path class="k" d="M${at(x + 4)} ${at(y + inset)}A6 6 0 0 0 ${at(x)} ${at(y + 6)}` +
          `V${at(y + h - 6)}A6 6 0 0 0 ${at(x + 4)} ${at(y + h - inset)}Z"/>`,
      )
      expect(svg).not.toMatch(/fill="/)
    }
  })

  test('status: refuted and abandoned are faded and dashed, conjunct is checked', () => {
    for (const mode of MODES) {
      const svg = renderMap(model(), mode).source
      for (const id of ['C1', 'C2']) {
        const box = boxOf(svg, id)
        // The whole node fades: its box, bar and text.
        expect(box).toMatch(/<g opacity="\.5"><rect class="b"[^>]* stroke-dasharray="3 2"\/><path class="k"[^]*<\/text>/)
      }
      for (const id of ['C4', 'C5']) {
        const box = boxOf(svg, id)
        expect(box).toContain(`>${id}</tspan><tspan class="ok"`)
        expect(box).toMatch(/<tspan class="ok"[^>]*>✓<\/tspan>/)
        expect(box).not.toMatch(/opacity|stroke-dasharray/)
      }
      const open = boxOf(svg, 'C7')
      expect(open).toContain('>C7<')
      expect(open).not.toMatch(/opacity|stroke-dasharray|✓/)
    }
  })

  test('rings: solid on the selected node, dotted on the fresh one, both when both', () => {
    for (const mode of MODES) {
      // At the tip the step touched C12, and the selection defaults to it.
      const both = renderMap(model(), mode).source
      expect(boxOf(both, 'C12')).toMatch(/<rect class="ring sel"[^>]* rx="9" stroke-width="1.5"/)
      expect(boxOf(both, 'C12')).toMatch(/<rect class="ring new"[^>]* stroke-width="1.5" stroke-dasharray="1.5 2.5"/)
      expect(boxOf(both, 'C6')).not.toContain('ring')
      expect((both.match(/class="ring sel"/g) ?? []).length).toBe(1)
      expect((both.match(/class="ring new"/g) ?? []).length).toBe(1)

      // Pick C6: the solid ring moves, the dotted one stays.
      const picked = renderMap(model({ node: 'C6' }), mode).source
      expect(boxOf(picked, 'C6')).toContain('class="ring sel"')
      expect(boxOf(picked, 'C6')).not.toContain('class="ring new"')
      expect(boxOf(picked, 'C12')).toContain('class="ring new"')
      expect(boxOf(picked, 'C12')).not.toContain('class="ring sel"')

      // The step before any event touched nothing and selected nothing.
      const start = renderMap(model({ at: 0 }), mode).source
      expect(start).not.toContain('class="ring')
    }
  })

  test('rings stand 4 px off the box, the dotted one 8 px when both', () => {
    const svg = renderMap(model(), 'labelled').source
    const rect = (cls: string) => {
      const [, x, y, w, h] =
        boxOf(svg, 'C12').match(new RegExp(`<rect class="${cls}" x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)"`)) ?? []
      return [x, y, w, h].map(Number)
    }
    const [bx, by, bw, bh] = rect('b')
    expect(rect('ring sel')).toEqual([bx! - 4, by! - 4, bw! + 8, bh! + 8])
    expect(rect('ring new')).toEqual([bx! - 8, by! - 8, bw! + 16, bh! + 16])
    // Fresh alone: 4 px.
    const picked = renderMap(model({ node: 'C6' }), 'labelled').source
    const fresh = boxOf(picked, 'C12').match(/<rect class="ring new" x="([\d.]+)"/)?.[1]
    expect(Number(fresh)).toBe(bx! - 4)

    // The dots go round a whole number of times (period 1.5 + 2.5), so none run together
    // where the ring closes: its pathLength is a multiple of 4 within 2 of its perimeter.
    const [, w, h, rx, length] =
      boxOf(svg, 'C12').match(/<rect class="ring new" [^>]*width="([\d.]+)" height="([\d.]+)" rx="([\d.]+)"[^>]* pathLength="(\d+)"/) ?? []
    const perimeter = 2 * (Number(w) + Number(h)) - (8 - 2 * Math.PI) * Number(rx)
    expect(Number(length) % 4).toBe(0)
    expect(Math.abs(Number(length) - perimeter)).toBeLessThanOrEqual(2)
    expect(boxOf(svg, 'C12').match(/<rect class="ring sel"[^>]*>/)?.[0]).not.toContain('pathLength')
  })

  test('a faded node keeps its ring at full strength', () => {
    const box = boxOf(renderMap(model({ node: 'C1' }), 'labelled').source, 'C1')
    expect(box).toContain('class="ring sel"')
    const ring = box.match(/<rect class="ring sel"[^>]*>/)?.[0] ?? ''
    expect(ring).not.toContain('opacity')
    // The ring is drawn before the faded group opens, so the fade does not reach it.
    expect(box.indexOf('class="ring sel"')).toBeLessThan(box.indexOf('<g opacity'))
  })

  test('map escapes text', () => {
    const m = model()
    const nasty: PaneModel = {
      ...m,
      C: m.C.map(c => (c.id === 'C6' ? { ...c, attribute: '+ <hull> & "keel"' } : c)),
    }
    for (const mode of MODES) {
      const svg = renderMap(nasty, mode).source
      expect(svg).toContain('&lt;hull&gt; &amp; &quot;keel&quot;')
      expect(svg).not.toContain('<hull>')
      expect(svg).not.toContain('"keel"')

      const proposition: PaneModel = {
        ...m,
        C: m.C.map(c => (c.id === 'C7' ? { ...c, id: 'C7"><b>', proposition: '</title><script>x</script>' } : c)),
      }
      const loud = renderMap(proposition, mode).source
      expect(loud).not.toMatch(/<b>|<script/)
      expect(loud).toContain('&lt;/title&gt;&lt;script&gt;')
    }
    // The label is escaped after it is cut, so no entity is split.
    const long: PaneModel = {
      ...m,
      C: m.C.map(c => (c.id === 'C6' ? { ...c, attribute: '+ wet & wild & '.repeat(4) } : c)),
    }
    expect(renderMap(long, 'labelled').source).not.toMatch(/&[a-z]*…/)
  })

  test('big tree fits', () => {
    const big = buildModel(bigTree(200), 'big', TIP)
    expect(big.C.length).toBe(200)
    for (const mode of MODES) {
      const svg = renderMap(big, mode).source
      expect((svg.match(/<title>/g) ?? []).length).toBe(200)
      expect(svg.length).toBeLessThan(131072)
    }
  })

  test('an empty fold draws an empty map', () => {
    const empty = buildModel({ ...session, branches: { ...session.branches, fresh: null }, head: 'fresh' }, SLUG, TIP)
    for (const mode of MODES) {
      const svg = renderMap(empty, mode).source
      expect(svg.startsWith('<svg ')).toBe(true)
      expect(svg).not.toContain('<title>')
    }
  })
})

describe('treeRows', () => {
  test('tree rows carry guides', () => {
    const m = model()
    const rows = treeRows(m)
    expect(rows.map(r => r.id)).toEqual(m.order)
    const guide = Object.fromEntries(rows.map(r => [r.id, r.guide]))
    expect(guide).toMatchObject({
      C0: '',
      C1: '├─ ',
      C2: '├─ ',
      C3: '└─ ',
      C4: '   ├─ ',
      C6: '   └─ ',
      C7: '      ├─ ',
      C10: '      └─ ',
      C12: '         └─ ',
    })
    const row = (id: string) => rows.find(r => r.id === id)
    expect(row('C0')?.mark).toBe('·')
    expect(row('C1')?.mark).toBe('R')
    expect(row('C6')?.mark).toBe('E')
    // The attribute as written, its `+ ` kept; the root's is `root concept`.
    expect(row('C6')?.label).toBe('+ has no hull')
    expect(row('C0')?.label).toBe('root concept')
    expect(row('C1')?.status).toBe('refuted')
    expect(row('C2')?.status).toBe('abandoned')
    expect(row('C4')?.status).toBe('conjunct')
    expect(row('C6')?.status).toBe('open')
  })

  test('a guide runs down past every ancestor with a later sibling', () => {
    // C1 has a later sibling (C2), so its descendants carry its line; so does C3 (C5).
    const tree = buildModel(
      treeOf(['C0', null], ['C1', 'C0'], ['C2', 'C0'], ['C3', 'C1'], ['C4', 'C3'], ['C5', 'C1']),
      'tree',
      TIP,
    )
    expect(treeRows(tree).map(r => [r.id, r.guide])).toEqual([
      ['C0', ''],
      ['C1', '├─ '],
      ['C3', '│  ├─ '],
      ['C4', '│  │  └─ '],
      ['C5', '│  └─ '],
      ['C2', '└─ '],
    ])
  })

  test('a concept whose parent is missing has no guide, as the root', () => {
    const forest = buildModel(treeOf(['C0', null], ['C1', 'C0'], ['C6', 'C99'], ['C7', 'C6'], ['C8', 'C6']), 'tree', TIP)
    expect(treeRows(forest).map(r => [r.id, r.guide])).toEqual([
      ['C0', ''],
      ['C1', '└─ '],
      ['C6', ''],
      ['C7', '├─ '],
      ['C8', '└─ '],
    ])
  })

  test('the selected row and the fresh row', () => {
    // At the tip the step touched C12, and it is selected.
    const tip = treeRows(model())
    expect(tip.filter(r => r.isSelected).map(r => r.id)).toEqual(['C12'])
    expect(tip.filter(r => r.isFresh).map(r => r.id)).toEqual(['C12'])

    const picked = treeRows(model({ node: 'C6' }))
    expect(picked.filter(r => r.isSelected).map(r => r.id)).toEqual(['C6'])
    expect(picked.filter(r => r.isFresh).map(r => r.id)).toEqual(['C12'])
  })

  test('rows come in tree order, not creation order', () => {
    const tree = buildModel(
      treeOf(['C0', null], ['C1', 'C0'], ['C2', 'C0'], ['C3', 'C1']),
      'tree',
      TIP,
    )
    expect(treeRows(tree).map(r => r.id)).toEqual(['C0', 'C1', 'C3', 'C2'])
  })

  test('an empty fold is no rows', () => {
    const empty = buildModel({ ...session, branches: { ...session.branches, fresh: null }, head: 'fresh' }, SLUG, TIP)
    expect(treeRows(empty)).toEqual([])
  })
})

// A session built from (id, parent) pairs, one add-c per pair, chained in order.
// Same shape as the helper in model.test.ts, with a proposition of your choosing.
function sessionOf(
  nodes: [id: string, parent: string | null][],
  proposition: (id: string) => string = id => `There exists ${id}.`,
): Session {
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
      partition: seq === 0 ? null : seq % 3 === 0 ? 'expansive' : 'restrictive',
      proposition: proposition(id),
    },
    summary: `Added ${id}.`,
  }))
  return { version: 3, head: 'main', branches: { main: events.length - 1 }, events }
}

function treeOf(...nodes: [id: string, parent: string | null][]): Session {
  return sessionOf(nodes)
}

/** The root and a 4-way tree under it, `n` concepts in all, each proposition 120 characters. */
function bigTree(n: number): Session {
  const nodes: [string, string | null][] = []
  for (let i = 0; i < n; i++) nodes.push([`C${i}`, i === 0 ? null : `C${(i - 1) >> 2}`])
  return sessionOf(nodes, id => `${id} `.padEnd(120, 'x'))
}
