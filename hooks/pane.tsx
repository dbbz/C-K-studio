// The pane: spec §"What the pane shows", laid out as a panel. Top to bottom: the
// header, what Claude is working on for a press, the timeline bar, the rewound banner,
// warnings, the concept map (a read-only overview the user can hide), then the tree
// view, one clickable row per concept, beside the selected concept's card and the
// knowledge (a wide dock) or above them. Everything it draws comes from $.state (doc,
// files, view, isMapHidden, activity) folded with model.ts, so a hot reload keeps what
// the user picked. Presses write state or submit Claude's next turn; nothing here
// writes while drawing.
import type { EngineInterface, Frozen, RenderElement, RenderInput, RenderNode, SelectOption } from 'claude-code'
import type { Knowledge } from '../lib/view.mjs'
import type { View } from '../types'
import { isBusy, trackSubmit } from './busy'
import { refresh, slugOf } from './load'
import { renderMap, treeRows } from './map'
import type { MapMode, TreeRow } from './map'
import { branchText, buildModel, OPERATORS, pressText, START_TEXT } from './model'
import type { PaneModel } from './model'
import {
  addPending,
  changeView,
  dropPending,
  readActivity,
  readDoc,
  readFiles,
  readIsMapHidden,
  readView,
  toggleIsMapHidden,
} from './state'

/**
 * CSS px per `bodyColumns` cell on the desktop. A 129-column dock measured ~1,060 CSS px
 * (~8.2 px per column); 8 errs toward a map that fits.
 */
const PX_PER_COLUMN = 8

/** From this many columns the tree sits beside the card and the knowledge. */
const WIDE_COLUMNS = 100

/** What the keys do, told where the surface has them (not on mobile). */
const KEYS_CAPTION = 'Keys: j/k concept · h/l step · g latest'

/** The README's validated palette, light: the R and E letters and bars and the K marks carry it. */
const RESTRICTIVE = '#2a78d6'
const EXPANSIVE = '#eb6834'

/** An `Svg` refuses a longer source; past it the map section says the tree is too large. */
const SVG_LIMIT = 131_072

/** A Select holds 1 to 64 options: the engine refuses the whole tree past that. */
const SELECT_MAX = 64

type PaneEvent = Frozen<RenderInput<'Pane'>>

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * A Select's options and value: every option while they fit, else the SELECT_MAX
 * around the current one, so picking near an end moves the window. Its label says
 * how many are shown when not all are; otherwise it is `label`, or none when a
 * caption drawn before the Select already names it.
 */
function picker(label: string, options: SelectOption[], value: string, isCaptioned = false) {
  const at = Math.max(0, options.findIndex(o => o.value === value))
  const start = Math.min(Math.max(0, at - SELECT_MAX / 2), Math.max(0, options.length - SELECT_MAX))
  const shown = options.slice(start, start + SELECT_MAX)
  const named =
    options.length > SELECT_MAX
      ? { label: `${label} (${shown.length} of ${options.length})` }
      : isCaptioned
        ? {}
        : { label }
  return {
    ...named,
    options: shown,
    value: shown.some(o => o.value === value) ? value : (shown[0]?.value ?? value),
  }
}

/**
 * The map for `available` CSS px: labelled when it fits, else compact; scaled down,
 * keeping its proportions, when even that is wider than the room.
 */
function fitMap(m: PaneModel, available: number) {
  const labelled = renderMap(m, 'labelled')
  const mode: MapMode = labelled.width <= available ? 'labelled' : 'compact'
  const map = mode === 'labelled' ? labelled : renderMap(m, 'compact')
  const scale = map.width > available ? available / map.width : 1
  return { mode, source: map.source, width: Math.round(map.width * scale), height: Math.round(map.height * scale) }
}

export async function drawPane($: EngineInterface, e: PaneEvent): Promise<RenderElement> {
  const { Box, Text, Button } = $.ui.resolve(e)
  // Mobile draws no Select and has no keys, the terminal no Svg.
  const Select = e.surface === 'mobile' ? undefined : $.ui.resolve(e).Select
  const Svg = e.surface === 'terminal' ? undefined : $.ui.resolve(e).Svg
  const hasKeys = e.surface !== 'mobile'
  const columns = e.props.bodyColumns

  const loaded = await readDoc($)
  const listed = await readFiles($)
  const picked = await readView($)
  const isMapHidden = await readIsMapHidden($)
  const activity = await readActivity($)

  // `doing` is what the pane says Claude is working on once the press's turn starts. The
  // press is noted as pending before its prompt goes, so its turn is known by its text when
  // it starts (register.tsx), however long it waits; a prompt that does not enter starts no
  // turn, so its entry alone is taken back. While a turn runs a press waits behind it, and
  // the toast says so in `queued` (by default `doing`; null for a press that never queues).
  // A prompt that cannot be sent is said too, never lost silently.
  const submit = async (text: string, doing: string, queued: string | null = doing) => {
    if (queued !== null && isBusy()) $.ui.toast(`Queued: ${queued}`)
    const entry = { text, doing }
    await addPending($, entry)
    try {
      const sent = await trackSubmit(() => $.prompt.submit({ text, asUser: true }))
      if (sent.drop !== undefined) await dropPending($, entry)
    } catch {
      $.ui.toast("Couldn't send that to Claude.")
      await dropPending($, entry)
    }
  }
  const setView = (change: (v: View) => View) => changeView($, change)

  /** A section's name, above it. */
  const sectionLabel = (text: string) => (
    <Text size="caption" weight="medium" dimColor>
      {text}
    </Text>
  )

  /** The header: title and caption on the left, the pickers on the right. */
  const header = (title: string, caption: string | null, pickers: RenderElement | null) => (
    <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start" gap="md">
      <Box flexDirection="column">
        <Text size="heading" weight="semibold">
          {title}
        </Text>
        {caption === null ? null : (
          <Text size="caption" dimColor>
            {caption}
          </Text>
        )}
      </Box>
      {pickers}
    </Box>
  )

  /** What Claude is working on for a press, under the header while it lasts. */
  const working =
    activity === null ? null : (
      <Box key="activity" flexDirection="row" gap="sm" alignItems="center">
        <Text color="claude">●</Text>
        <Text>{`Claude is working on: ${activity}`}</Text>
      </Box>
    )

  /** The card's frame: the selected concept, or what stands in for one. */
  const cardFrame = (children: (RenderElement | null)[]) => (
    <Box key="card" flexDirection="column" gap="xs" borderStyle="round" paddingX="md" paddingY="sm">
      {children}
    </Box>
  )

  if (loaded === null) {
    return (
      <Box flexDirection="column" gap="md" width={columns}>
        {header('C-K Studio', null, null)}
        {working}
        {cardFrame([
          <Text>No C-K session in sessions/ yet.</Text>,
          <Box>
            <Button key="start-session" variant="primary" onPress={() => submit(START_TEXT, 'start a session', null)}>
              Start a session
            </Button>
          </Box>,
        ])}
      </Box>
    )
  }

  // A new file starts its view afresh: head, tip, latest node.
  const pickFile = async (file: string) => {
    await changeView($, () => ({ file, branch: null, at: null, node: null }))
    await refresh($, { list: false })
  }
  const filePicker =
    Select && listed.length > 1 ? (
      <Select
        key="file"
        {...picker(
          'Session',
          listed.map(f => ({ value: f.file, label: slugOf(f.file) })),
          loaded.file,
        )}
        onSelect={file => void pickFile(file)}
      />
    ) : null

  if ('error' in loaded) {
    return (
      <Box flexDirection="column" gap="md" width={columns}>
        {header(
          slugOf(loaded.file),
          null,
          filePicker ? (
            <Box flexDirection="row" gap="sm" alignItems="center">
              {filePicker}
            </Box>
          ) : null,
        )}
        {working}
        {cardFrame([<Text color="warning">{`${loaded.file}: ${loaded.error}`}</Text>])}
      </Box>
    )
  }

  const slug = slugOf(loaded.file)
  const m = buildModel(loaded.session, slug, picked)
  const c = m.selected
  const steps = m.steps
  const isWide = columns >= WIDE_COLUMNS

  // 1. Header: title and counts; the session picker when there are several, the branch picker.
  const branchLabel = m.branches.find(b => b.name === m.branch)?.label ?? m.branch
  const top = header(
    m.title,
    `${slug} · ${plural(m.C.length, 'concept', 'concepts')} · ${m.K.length} K`,
    <Box flexDirection="row" gap="sm" alignItems="center">
      {filePicker}
      <Text size="caption" dimColor>
        Branch
      </Text>
      {Select ? (
        <Select
          key="branch"
          {...picker(
            'Branch',
            m.branches.map(b => ({ value: b.name, label: b.label })),
            m.branch,
            true,
          )}
          onSelect={branch => void setView(v => ({ ...v, branch }))}
        />
      ) : (
        <Text>{branchLabel}</Text>
      )}
    </Box>,
  )

  // 2. Timeline bar. Forward from the step before the tip writes null: the tip follows live again.
  const stepBack = () =>
    void setView(v => ({ ...v, at: Math.max(0, Math.min(v.at ?? steps, steps) - 1) }))
  const stepForward = () =>
    void setView(v => {
      if (v.at === null) return v
      const at = Math.max(0, v.at) + 1
      return { ...v, at: at >= steps ? null : at }
    })
  const timeline = (
    <Box
      flexDirection="row"
      borderStyle="round"
      borderDimColor
      paddingX="md"
      paddingY="xs"
      alignItems="center"
      gap="sm"
      flexWrap="wrap"
    >
      <Button key="step-back" label="Step back" hotkey="h" dimColor={m.step === 0} onPress={stepBack}>
        ◀
      </Button>
      <Text weight="semibold" tabular>{`Step ${m.step} of ${m.steps}`}</Text>
      <Button key="step-forward" label="Step forward" hotkey="l" dimColor={m.isAtTip} onPress={stepForward}>
        ▶
      </Button>
      <Box flexGrow={1}>{m.caption ? <Text dimColor>{m.caption}</Text> : null}</Box>
      {m.health.split(' · ').map(part => (
        <Box borderStyle="round" borderDimColor paddingX="xs">
          <Text size="caption">{part}</Text>
        </Box>
      ))}
    </Box>
  )

  // 3. Rewound: the past is read-only. The banner says so, and holds the way back to the tip
  // and the way to branch from the step shown. No hotkey starts a Claude turn.
  const rewound = m.isAtTip ? null : (
    <Box
      key="rewound"
      flexDirection="row"
      borderStyle="round"
      borderColor="warning"
      paddingX="md"
      paddingY="xs"
      alignItems="center"
      gap="sm"
      flexWrap="wrap"
    >
      <Box flexGrow={1}>
        <Text>{`Viewing step ${m.step} of ${m.steps}. The past is read-only.`}</Text>
      </Box>
      <Button
        key="to-tip"
        label="Back to latest"
        variant="primary"
        hotkey="g"
        onPress={() => void setView(v => ({ ...v, at: null }))}
      />
      {c ? (
        <Button
          key="branch-here"
          label="Branch from here"
          onPress={() =>
            submit(
              branchText(c.id, slug, m.branch, m.step),
              `branch from ${c.id} at step ${m.step}`,
              `branch from ${c.id}`,
            )
          }
        />
      ) : null}
    </Box>
  )

  // 4. Warnings, when any.
  const warnings =
    m.warnings.length > 0 ? (
      <Box flexDirection="column" borderStyle="round" borderColor="warning" paddingX="md">
        {m.warnings.map(w => (
          <Text color="warning">{w}</Text>
        ))}
      </Box>
    ) : null

  // 5. The map: an overview, read-only (the Svg takes no clicks; the tree view picks), drawn
  // where the surface has an Svg and there is a concept to show. The user can hide it.
  let mapSection: RenderElement | null = null
  if (Svg && m.C.length > 0) {
    let overview: RenderElement | null = null
    if (!isMapHidden) {
      const fitted = fitMap(m, columns * PX_PER_COLUMN)
      // The Box carries the key `map`: an Svg element takes no key of its own. The legend is a
      // list, not a fragment: a fragment is a Box, which a Text cannot hold.
      overview =
        fitted.source.length <= SVG_LIMIT ? (
          <Box key="map" flexDirection="column" gap="xs">
            <Svg
              source={fitted.source}
              alt={`Concept tree of ${m.title}, ${plural(m.C.length, 'concept', 'concepts')}`}
              isInteractive
              width={fitted.width}
              height={fitted.height}
            />
            <Text size="caption" dimColor>
              {[
                <Text color={RESTRICTIVE}>▌</Text>,
                ' restrictive   ',
                <Text color={EXPANSIVE}>▌</Text>,
                ' expansive   ',
                'dashed: refuted or abandoned   ✓ conjunct   ring: selected',
              ]}
            </Text>
          </Box>
        ) : (
          <Text size="caption" dimColor>
            This tree is too large to draw as a map.
          </Text>
        )
    }
    mapSection = (
      <Box key="map-section" flexDirection="column" gap="xs">
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          {sectionLabel('Map')}
          <Button
            key="map-toggle"
            label={isMapHidden ? 'Show' : 'Hide'}
            plain
            onPress={() => void toggleIsMapHidden($)}
          />
        </Box>
        {overview}
      </Box>
    )
  }

  // 6. Lower: the tree beside the card and the knowledge in a wide dock (flex shares the
  // room from a width of 0), else all three one above the other.
  const share = (grow: number) => (isWide ? { flexGrow: grow, flexShrink: 1, width: 0 } : {})

  // The previous or next concept in tree order, wrapping round at both ends. From the view
  // as it stands when written, so two quick presses both land.
  const stepConcept = (by: 1 | -1) =>
    void setView(v => {
      const from = v.node !== null && m.order.includes(v.node) ? v.node : c?.id
      const at = from === undefined ? -1 : m.order.indexOf(from)
      if (at < 0) return v
      const node = m.order[(at + by + m.order.length) % m.order.length]
      return node === undefined ? v : { ...v, node }
    })

  // The tree view: one row per concept, its guide lines, then one Button holding the
  // partition letter (so partition is never colour alone), the id, the label and the
  // status, named for a screen reader. The selected row is led by ▸ and drawn heavier, and
  // its Button keeps the surface's own chrome; the rest are plain, led by two spaces so the
  // labels line up. The node the step touched ends in a dot.
  const markOf = (row: TreeRow) =>
    row.mark === 'R' ? (
      <Text color={RESTRICTIVE} weight="semibold">
        R
      </Text>
    ) : row.mark === 'E' ? (
      <Text color={EXPANSIVE} weight="semibold">
        E
      </Text>
    ) : (
      <Text dimColor>·</Text>
    )
  const partitionName = { R: 'restrictive', E: 'expansive' } as const
  const nameOf = (row: TreeRow) =>
    row.mark === '·'
      ? `${row.id}, root concept, ${row.status}`
      : `${row.id}, ${partitionName[row.mark]}, ${row.label}, ${row.status}`
  const treeRow = (row: TreeRow) => {
    const faded = row.status === 'refuted' || row.status === 'abandoned' ? { dimColor: true } : {}
    // A list of strings and Text runs, the only children a Button holds.
    const runs: RenderNode[] = [
      row.isSelected ? <Text color="claude">{'▸ '}</Text> : '  ',
      markOf(row),
      ' ',
      <Text weight="semibold" {...faded}>
        {row.id}
      </Text>,
      ...(row.status === 'conjunct' ? [<Text color="success">{' ✓'}</Text>] : []),
      '  ',
      <Text wrap="truncate-end" weight={row.isSelected ? 'semibold' : 'regular'} {...faded}>
        {row.label}
      </Text>,
      ...(row.status === 'open'
        ? []
        : [
            <Text size="caption" dimColor>
              {`  ${row.status}`}
            </Text>,
          ]),
      ...(row.isFresh ? [<Text color="claude">{' •'}</Text>] : []),
    ]
    // The guide's spaces unbreakable, so a surface that collapses white space keeps the indent.
    return (
      <Box flexDirection="row" alignItems="center">
        {row.guide ? (
          <Text mono dimColor>
            {row.guide.replace(/ /g, '\u00a0')}
          </Text>
        ) : null}
        <Button
          key={`node-${row.id}`}
          label={nameOf(row)}
          {...(row.isSelected ? {} : { plain: true as const })}
          onPress={() => void setView(v => ({ ...v, node: row.id }))}
        >
          {runs}
        </Button>
      </Box>
    )
  }
  const rows = treeRows(m)
  const tree = (
    <Box key="tree" flexDirection="column" gap="xs" {...share(9)}>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        {sectionLabel('Concepts')}
        {rows.length > 0 ? (
          <Box flexDirection="row" gap="xs" alignItems="center">
            <Button key="concept-prev" label="Previous concept" hotkey="k" onPress={() => stepConcept(-1)}>
              ‹
            </Button>
            <Button key="concept-next" label="Next concept" hotkey="j" onPress={() => stepConcept(1)}>
              ›
            </Button>
          </Box>
        ) : null}
      </Box>
      {rows.length > 0 ? (
        // No gap between the rows, so each guide line meets the next.
        <Box flexDirection="column">{rows.map(treeRow)}</Box>
      ) : (
        <Text dimColor>{`No concepts at step ${m.step}.`}</Text>
      )}
      {rows.length > 0 ? (
        <Text size="caption" dimColor>
          {[
            <Text color={RESTRICTIVE}>R</Text>,
            ' restrictive · ',
            <Text color={EXPANSIVE}>E</Text>,
            ' expansive · ✓ conjunct · • latest step',
          ]}
        </Text>
      ) : null}
      {hasKeys ? (
        <Text size="caption" dimColor>
          {KEYS_CAPTION}
        </Text>
      ) : null}
    </Box>
  )

  let card: RenderElement | null = null
  if (c) {
    // Operators act on an open concept at the tip. Rewound, the banner holds the branch button.
    const operators = m.canOperate ? (
      <Box flexDirection="row" gap="sm" flexWrap="wrap">
        {OPERATORS.map(o => (
          <Button
            key={`op-${o.op}`}
            label={o.label}
            {...(o.op === 'ck-expand' ? { variant: 'primary' as const } : {})}
            onPress={() => submit(pressText(o.op, c.id, slug, m.branch), `${o.verb} ${c.id}`)}
          />
        ))}
      </Box>
    ) : (
      <Text size="caption" dimColor>
        {m.isAtTip ? `${c.id} is ${c.status}: the operators act on open concepts.` : 'Operators act at the latest step.'}
      </Text>
    )
    card = (
      <Box flexDirection="column" gap="xs">
        {sectionLabel('Selected concept')}
        {cardFrame([
          <Box flexDirection="row" gap="sm" alignItems="center">
            <Text mono weight="semibold">
              {c.id}
            </Text>
            {c.partition === 'restrictive' ? (
              <Text color={RESTRICTIVE} weight="medium">
                R restrictive
              </Text>
            ) : c.partition === 'expansive' ? (
              <Text color={EXPANSIVE} weight="medium">
                E expansive
              </Text>
            ) : null}
            <Text size="caption" dimColor>
              {c.status}
            </Text>
          </Box>,
          <Text size="heading" weight="semibold">
            {c.attribute ?? 'Root concept'}
          </Text>,
          <Text>{c.proposition}</Text>,
          c.breaks ? (
            <Box flexDirection="column">
              <Text size="caption" dimColor>
                Breaks
              </Text>
              <Text>{c.breaks}</Text>
            </Box>
          ) : null,
          c.note ? <Text dimColor>{c.note}</Text> : null,
          <Text size="caption" dimColor>
            {c.kRefs.length > 0 ? `Rests on ${c.kRefs.join(', ')}` : 'Rests on no K yet'}
          </Text>,
          operators,
        ])}
      </Box>
    )
  }

  // One K entry; those the selected concept rests on take the restrictive blue.
  const kEntry = (k: Knowledge, isRestedOn: boolean) => (
    <Box
      flexDirection="column"
      borderStyle="round"
      paddingX="sm"
      {...(isRestedOn ? { borderColor: RESTRICTIVE } : { borderDimColor: true })}
    >
      <Box flexDirection="row" gap="sm" alignItems="center">
        <Text mono weight="semibold" size="footnote">
          {k.id}
        </Text>
        {k.status === 'true' ? null : (
          <Text size="caption" color={k.status === 'uncertain' ? 'warning' : 'error'}>
            {k.status}
          </Text>
        )}
      </Box>
      <Text>{k.text}</Text>
      {k.source ? (
        <Text size="caption" dimColor>
          {k.source}
        </Text>
      ) : null}
    </Box>
  )

  // What the selected concept rests on comes first, in its own order, then the rest in
  // fold order; resting on nothing in K, every entry in fold order.
  const kById = new Map(m.K.map(k => [k.id, k]))
  const restsOn = [...new Set(c?.kRefs ?? [])].flatMap(id => kById.get(id) ?? [])
  const others = m.K.filter(k => !restsOn.includes(k))
  const knowledge = (
    <Box key="knowledge" flexDirection="column" gap="xs">
      {restsOn.length > 0
        ? [
            sectionLabel('Rests on'),
            ...restsOn.map(k => kEntry(k, true)),
            ...(others.length > 0 ? [sectionLabel('Other knowledge'), ...others.map(k => kEntry(k, false))] : []),
          ]
        : [
            sectionLabel('Knowledge'),
            m.K.length === 0 ? <Text dimColor>K is empty.</Text> : null,
            ...m.K.map(k => kEntry(k, false)),
          ]}
    </Box>
  )

  const lower = isWide ? (
    <Box key="lower" flexDirection="row" gap="lg" alignItems="flex-start">
      {tree}
      <Box flexDirection="column" gap="md" {...share(11)}>
        {card}
        {knowledge}
      </Box>
    </Box>
  ) : (
    <Box key="lower" flexDirection="column" gap="md">
      {tree}
      {card}
      {knowledge}
    </Box>
  )

  return (
    <Box flexDirection="column" gap="md" width={columns}>
      {top}
      {working}
      {timeline}
      {rewound}
      {warnings}
      {mapSection}
      {lower}
    </Box>
  )
}
