// The $.state contract of ck-studio. Self-contained: no imports.
// Session, SessionEvent and View are the shapes the pane's hooks pass around;
// they live here so the contract is the one place they are written (hooks/model.ts
// re-exports them). SessionEvent has the shape of SCHEMA.md's event and of CkEvent
// in lib/view.d.mts, so a Session's events go straight into the fold.

/** One event of a session file: an append-only DAG node (SCHEMA.md). */
export type SessionEvent = {
  /** Globally unique, never reused. */
  seq: number
  /** The DAG edge; null at the root. */
  parent: number | null
  /** Which branch appended it. */
  branch: string
  at: string
  actor: 'claude' | 'user'
  op: 'seed' | 'C→C' | 'K→K' | 'K→C' | 'C→K' | 'prune'
  kind: 'add-c' | 'add-k' | 'set-status' | 'annotate'
  /** The provenance edge: what `c` and `k` mean depends on `kind`. */
  from: { c: string[]; k: string[] }
  /** add-c (concept fields) and add-k (knowledge fields). */
  node?: {
    id: string
    attribute?: string | null
    partition?: 'restrictive' | 'expansive' | null
    breaks?: string
    proposition?: string
    note?: string
    text?: string
    status?: 'true' | 'false' | 'uncertain'
    source?: string
  }
  /** set-status and annotate: the node id acted on. */
  target?: string
  /** set-status: the concept's new status. */
  status?: 'open' | 'conjunct' | 'refuted' | 'abandoned'
  /** set-status and annotate. */
  note?: string
  summary?: string
}

/** A parsed session file, schema v3. */
export type Session = {
  version: number
  title?: string
  brief?: string
  /** The branch mutations append to. */
  head: string
  /** Branch name to tip seq; null for a branch with no events yet. */
  branches: Record<string, number | null>
  events: SessionEvent[]
}

/** What the user is viewing; null follows head, the tip, the latest step's node. */
export type View = {
  file: string | null
  branch: string | null
  at: number | null
  node: string | null
}

/**
 * The open session file as last read: its parsed session, or why it could not
 * be shown. `mtimeMs` is the stat the read went with, so the file is re-read
 * only when it changes; 0 beside an error, so a failed read is tried again.
 */
export type Loaded =
  | { file: string; mtimeMs: number; session: Session }
  | { file: string; mtimeMs: number; error: string }

/** One `*.ck.json` in `sessions/`, by name, with its modification time. */
export type FileEntry = { file: string; mtimeMs: number }

/**
 * A press in the pane: the prompt it sent, which the turn's text matches when it starts,
 * and what the pane says while that turn runs.
 */
export type Pending = { text: string; doing: string }

declare module 'claude-code' {
  interface PluginState {
    'ck-studio': {
      /** The open session file; null when `sessions/` holds none. */
      doc: Loaded | null
      /** The `*.ck.json` files in `sessions/`, newest first. */
      files: FileEntry[]
      /** What the user picked; every null follows the live session. */
      view: View
      /** The user closed the pane this session: not reopened unasked. */
      isClosed: boolean
      /** The user hid the map: the tree view alone navigates. */
      isMapHidden: boolean
      /** The press whose turn is running, its prompt and what it asked Claude for, until the turn completes; null when none. */
      activity: Pending | null
      /** The presses whose turns have not started, oldest first. */
      pending: Pending[]
    }
  }
}
