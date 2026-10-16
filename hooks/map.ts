// The map: the concept tree laid out, drawn as an SVG string for the desktop
// surface's `Svg` (isInteractive: <title> tooltips and CSS work, scripts do not),
// labelled or compact as the room allows; and the tree's rows, one per concept with
// its guide lines, for the pane's tree view, which every surface draws. Pure
// functions of the model: no drawing, no $ calls.
import { esc } from '../lib/view.mjs'
import type { Concept } from '../lib/view.mjs'
import { treeOrder } from './model'
import type { PaneModel } from './model'

/** `x` is in leaf slots (a parent sits between its first and last child), `y` in depth levels. */
export type Box = { id: string; x: number; y: number }

/**
 * Walk the tree in preorder (model.ts's treeOrder, the order the tree view lists):
 * each leaf takes the next integer slot, a parent's x is the midpoint of its first
 * and last child's x, y is depth. A concept whose parent is not in the fold roots
 * a tree of its own, laid out beside the others.
 */
export function layoutTree(C: Concept[]): { boxes: Box[]; slots: number; levels: number } {
  const { order, depth } = treeOrder(C)
  const parentOf = new Map(C.map(c => [c.id, c.parent]))

  // Children in preorder. Anything below the top level was reached through its parent.
  const kids = new Map<string, string[]>()
  for (const id of order) {
    const parent = parentOf.get(id)
    if ((depth[id] ?? 0) === 0 || parent == null) continue
    const list = kids.get(parent)
    if (list) list.push(id)
    else kids.set(parent, [id])
  }

  const x = new Map<string, number>()
  let slots = 0
  for (const id of order) if (!kids.has(id)) x.set(id, slots++)
  // Reverse preorder reaches every descendant before its ancestor.
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i]!
    const list = kids.get(id)
    if (list) x.set(id, (x.get(list[0]!)! + x.get(list[list.length - 1]!)!) / 2)
  }

  let levels = 0
  const boxes = order.map((id): Box => {
    const y = depth[id]!
    levels = Math.max(levels, y + 1)
    return { id, x: x.get(id)!, y }
  })
  return { boxes, slots, levels }
}

const letter = (c: Concept) => (c.partition === 'restrictive' ? 'R' : c.partition === 'expansive' ? 'E' : '·')
const attributeOf = (c: Concept) => c.attribute ?? 'root concept'

export type MapMode = 'labelled' | 'compact'

/** A mode's box and its steps: a column per depth level, a row per leaf slot. */
type Geometry = {
  boxW: number
  boxH: number
  /** Left edge to left edge. */
  colStep: number
  /** Centre to centre. */
  rowStep: number
}

const GEOMETRY: Record<MapMode, Geometry> = {
  labelled: { boxW: 176, boxH: 40, colStep: 204, rowStep: 50 },
  compact: { boxW: 52, boxH: 26, colStep: 76, rowStep: 34 },
}
const MARGIN = 12
const RX = 6
/** The partition bar on a box's left edge, and the room either side of the text. */
const BAR = 4
const PAD_LEFT = 10
const PAD_RIGHT = 8
/** How far below the box's top its corner's arc crosses the bar's inner edge. */
const BAR_INSET = RX - Math.sqrt(RX * RX - (RX - BAR) * (RX - BAR))
/** A 12 px character's advance, estimated: labels are wrapped and cut by it. */
const CHAR_PX = 6.2
/** A labelled box's label runs to two lines, this far apart. */
const LINE_PX = 15
/** How far a ring stands off its box; a dotted ring beside a solid one steps out again. */
const RING = 4

// Colours are rules, not attributes, so the dark block can swap them. The partition
// colours are the README's validated palette; the inks and the surface are the app's.
const STYLE =
  '.l{fill:none;stroke:#b4b2a9}' +
  '.b{fill:#ffffff}' +
  '.r .b{stroke:#2a78d6}.r .k{fill:#2a78d6}' +
  '.e .b{stroke:#eb6834}.e .k{fill:#eb6834}' +
  '.o .b{stroke:#b4b2a9}.o .k{fill:#b4b2a9}' +
  '.i{fill:#191917;font-weight:600}.t{fill:#56554f;font-weight:400}.ok{fill:#0ca30c;font-weight:600}' +
  '.ring{fill:none}.sel{stroke:#191917}.new{stroke:#56554f}' +
  '@media (prefers-color-scheme: dark){' +
  '.l{stroke:#5f5e5a}' +
  '.b{fill:#262624}' +
  '.r .b{stroke:#3987e5}.r .k{fill:#3987e5}' +
  '.e .b{stroke:#d95926}.e .k{fill:#d95926}' +
  '.o .b{stroke:#5f5e5a}.o .k{fill:#5f5e5a}' +
  '.i{fill:#f2f1ec}.t{fill:#a8a79e}.ok{fill:#3fb950}' +
  '.sel{stroke:#f2f1ec}.new{stroke:#a8a79e}' +
  '}'

/** Two decimals at most: a parent between two rows sits at a quarter or an eighth. */
const num = (v: number) => String(Math.round(v * 100) / 100)

/** What a box says after its id: the attribute without its `+ `, or `root concept`. */
const labelOf = (c: Concept) => (c.attribute == null ? 'root concept' : c.attribute.replace(/^\+ /, ''))

/** `chars` without the spaces at its end. */
function trimEnd(chars: string[]): string[] {
  let end = chars.length
  while (end > 0 && chars[end - 1] === ' ') end--
  return chars.slice(0, end)
}

/**
 * `label` wrapped greedily at spaces (any run of white space is one) onto one line per
 * room, each room a count of characters (code points, so an emoji or a CJK character is
 * never split). A word
 * longer than its line is cut there. Text left after the last line ends that line in
 * an ellipsis, the line trimmed so it still fits. A line may come out empty.
 */
function wrap(label: string, rooms: number[]): string[] {
  let rest = Array.from(label.replace(/\s+/g, ' ').trim())
  const lines: string[] = []
  for (const [i, room] of rooms.entries()) {
    while (rest[0] === ' ') rest = rest.slice(1)
    if (rest.length === 0) break
    const fits = Math.max(0, Math.min(room, rest.length))
    // Everything, or up to a space; else back to the last space in the line; else
    // (one word longer than the line) the line's worth of it.
    const space = rest.lastIndexOf(' ', fits)
    const take = fits === rest.length || rest[fits] === ' ' ? fits : space > 0 ? space : fits
    let line = trimEnd(rest.slice(0, take))
    rest = rest.slice(take)
    while (rest[0] === ' ') rest = rest.slice(1)
    if (i === rooms.length - 1 && rest.length > 0) line = [...trimEnd(line.slice(0, Math.max(0, room - 1))), '…']
    lines.push(line.join(''))
  }
  return lines
}

/**
 * The tree as one SVG, left to right: a concept's column is its depth, its row its
 * leaf slot (layoutTree, transposed). `labelled` boxes carry the id and the attribute,
 * `compact` ones the id alone. A box is outlined and barred in its partition's colour
 * (blue restrictive, orange expansive, neutral root), with its tooltip: the id, the
 * R/E letter (so partition is never colour alone), attribute, status and proposition.
 * Refuted and abandoned nodes fade and dash, conjunct ones carry a green check. A
 * solid ring marks the selected node, a dotted one the node the current step touched;
 * they are separate rects, outside the fade, so a node that is both shows both.
 * Width and height are the SVG's own size in CSS px, as its attributes say.
 */
export function renderMap(model: PaneModel, mode: MapMode): { source: string; width: number; height: number } {
  const { boxW, boxH, colStep, rowStep } = GEOMETRY[mode]
  const { boxes, slots, levels } = layoutTree(model.C)
  const byId = new Map(model.C.map(c => [c.id, c]))
  const at = new Map(boxes.map(b => [b.id, b]))
  const selected = model.selected?.id ?? null

  const left = (b: Box) => MARGIN + b.y * colStep
  const top = (b: Box) => MARGIN + b.x * rowStep
  const middle = (b: Box) => top(b) + boxH / 2

  // Elbows from the parent's right edge to each child's left edge: across to the middle
  // of the gap, along it, across. An only child's is one stroke. Of several, the first
  // and last child's are one stroke, so their corners join, and the parent's stub and
  // the children between meet it. One path for the lot.
  const kids = new Map<string, Box[]>()
  for (const b of boxes) {
    const parent = byId.get(b.id)?.parent
    const from = parent == null ? undefined : at.get(parent)
    if (!from || b.y === 0) continue
    const list = kids.get(from.id)
    if (list) list.push(b)
    else kids.set(from.id, [b])
  }
  let d = ''
  for (const [id, list] of kids) {
    const parent = at.get(id)!
    const right = left(parent) + boxW
    const gap = right + (colStep - boxW) / 2
    const first = list[0]!
    const last = list[list.length - 1]!
    if (list.length === 1) {
      d += `M${num(right)} ${num(middle(parent))}H${num(gap)}V${num(middle(first))}H${num(left(first))}`
      continue
    }
    d += `M${num(left(first))} ${num(middle(first))}H${num(gap)}V${num(middle(last))}H${num(left(last))}`
    d += `M${num(right)} ${num(middle(parent))}H${num(gap)}`
    for (const kid of list.slice(1, -1)) d += `M${num(gap)} ${num(middle(kid))}H${num(left(kid))}`
  }

  // A line's room after the bar and its padding, in estimated characters.
  const room = Math.floor((boxW - BAR - PAD_LEFT - PAD_RIGHT) / CHAR_PX)
  const textLeft = (b: Box) => left(b) + BAR + PAD_LEFT
  const parts: string[] = []
  for (const b of boxes) {
    const c = byId.get(b.id)
    if (!c) continue
    const x = left(b)
    const y = top(b)
    const isFaded = c.status === 'refuted' || c.status === 'abandoned'
    const isConjunct = c.status === 'conjunct'
    const cls = c.partition === 'restrictive' ? 'r' : c.partition === 'expansive' ? 'e' : 'o'

    let g = `<g class="${cls}"><title>${esc(`${c.id} [${letter(c)}] ${attributeOf(c)} — ${c.status}\n${c.proposition}`)}</title>`
    const ring = (kind: 'sel' | 'new', outset: number) => {
      const w = boxW + 2 * outset
      const h = boxH + 2 * outset
      const rx = outset + RX - 1
      // The dots go round a whole number of times, so none run together where the ring closes.
      const perimeter = 2 * (w + h) - (8 - 2 * Math.PI) * rx
      const dots = kind === 'new' ? ` stroke-dasharray="1.5 2.5" pathLength="${4 * Math.round(perimeter / 4)}"` : ''
      return (
        `<rect class="ring ${kind}" x="${num(x - outset)}" y="${num(y - outset)}" width="${w}" height="${h}" ` +
        `rx="${rx}" stroke-width="1.5"${dots}/>`
      )
    }
    if (c.id === selected) g += ring('sel', RING)
    if (c.id === model.fresh) g += ring('new', c.id === selected ? 2 * RING : RING)
    if (isFaded) g += '<g opacity=".5">'
    g += `<rect class="b" x="${num(x)}" y="${num(y)}" width="${boxW}" height="${boxH}" rx="${RX}"`
    g += isFaded ? ' stroke-dasharray="3 2"/>' : '/>'
    // The bar's outer edge is the box's own corner arcs, so it sits flush with the outline.
    g += `<path class="k" d="M${num(x + BAR)} ${num(y + BAR_INSET)}A${RX} ${RX} 0 0 0 ${num(x)} ${num(y + RX)}`
    g += `V${num(y + boxH - RX)}A${RX} ${RX} 0 0 0 ${num(x + BAR)} ${num(y + boxH - BAR_INSET)}Z"/>`

    const check = isConjunct ? `<tspan class="ok" dx="${mode === 'labelled' ? 4 : 3}">✓</tspan>` : ''
    const id = `<tspan class="i">${esc(c.id)}</tspan>${check}`
    if (mode === 'labelled') {
      // The label on up to two lines: the first after the id, ` ✓` when conjunct (two
      // characters) and a space; the second from the text's left edge. Cut, then escaped.
      const id1 = Array.from(c.id).length
      const [first = '', second] = wrap(labelOf(c), [room - id1 - (isConjunct ? 2 : 0) - 1, room])
      const tx = num(textLeft(b))
      // One line sits on the box's middle; two sit a line apart, centred on it.
      const ty = num(second === undefined ? middle(b) : middle(b) - LINE_PX / 2)
      g += `<text x="${tx}" y="${ty}" dy=".35em">${id}`
      if (first) g += `<tspan class="t" dx="6">${esc(first)}</tspan>`
      if (second !== undefined) g += `<tspan class="t" x="${tx}" dy="${LINE_PX}">${esc(second)}</tspan>`
      g += '</text>'
    } else {
      // The id alone, centred in the room right of the bar.
      g += `<text x="${num(x + BAR + (boxW - BAR) / 2)}" y="${num(middle(b))}" dy=".35em" text-anchor="middle">${id}</text>`
    }
    if (isFaded) g += '</g>'
    parts.push(`${g}</g>`)
  }

  const width = levels === 0 ? MARGIN * 2 : MARGIN * 2 + (levels - 1) * colStep + boxW
  const height = slots === 0 ? MARGIN * 2 : MARGIN * 2 + (slots - 1) * rowStep + boxH
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" ` +
    `role="img" aria-label="${esc(`Concept tree, ${boxes.length} concepts`)}" ` +
    `font-family="system-ui, -apple-system, sans-serif" font-size="12">` +
    `<style>${STYLE}</style>` +
    (d ? `<path class="l" d="${d}"/>` : '') +
    parts.join('') +
    '</svg>'
  return { source, width, height }
}

/** One row of the tree view: a concept in tree order, with what its line draws. */
export type TreeRow = {
  id: string
  /** How deep it hangs in the walk: 0 for a root, one more per ancestor. A guide is three characters per level. */
  depth: number
  /** The guide lines before it: `│  ` or three spaces per ancestor below the root, then `├─ ` or `└─ `. */
  guide: string
  mark: 'R' | 'E' | '·'
  /** The attribute as written, its `+ ` kept; the root's is `root concept`. */
  label: string
  status: Concept['status']
  isSelected: boolean
  /** The node the event at the current step added or changed. */
  isFresh: boolean
}

/**
 * One row per id of `model.order`. A row's guide has, for each ancestor from depth 1
 * down to its parent, `│  ` where that ancestor has a later sibling (its line runs on
 * past this row) and three spaces where it has none, then `├─ ` or `└─ ` as the
 * concept itself has a later sibling or not. Siblings come in `model.order`'s order. A
 * root, and a concept whose parent is not in the fold (a root to treeOrder), has none.
 */
export function treeRows(model: PaneModel): TreeRow[] {
  const byId = new Map(model.C.map(c => [c.id, c]))
  // The parent each row hangs from in the walk: none at depth 0, even where `parent` names one.
  const parentOf = (id: string) => ((model.depth[id] ?? 0) > 0 ? (byId.get(id)?.parent ?? null) : null)
  const lastKid = new Map<string, string>()
  for (const id of model.order) {
    const parent = parentOf(id)
    if (parent !== null) lastKid.set(parent, id)
  }
  const hasLaterSibling = (id: string) => {
    const parent = parentOf(id)
    return parent !== null && lastKid.get(parent) !== id
  }

  const rows: TreeRow[] = []
  for (const id of model.order) {
    const c = byId.get(id)
    if (!c) continue
    // The ancestors at depths depth - 1 down to 1, walked up from the parent, read from the top.
    const lines: string[] = []
    let up = parentOf(id)
    for (let d = (model.depth[id] ?? 0) - 1; d >= 1 && up !== null; d--) {
      lines.unshift(hasLaterSibling(up) ? '│  ' : '   ')
      up = parentOf(up)
    }
    const guide = parentOf(id) === null ? '' : `${lines.join('')}${hasLaterSibling(id) ? '├─ ' : '└─ '}`
    rows.push({
      id,
      depth: model.depth[id] ?? 0,
      guide,
      mark: letter(c),
      label: attributeOf(c),
      status: c.status,
      isSelected: model.selected?.id === id,
      isFresh: model.fresh === id,
    })
  }
  return rows
}
