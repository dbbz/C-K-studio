// Types for view.mjs, for the TypeScript hooks module. view.mjs stays plain JS
// (its functions are serialised into the viewer page), so the shapes live here.
// Event fields follow SCHEMA.md; Concept and Knowledge are exactly what
// foldEvents builds.

export type CkOp = 'seed' | 'C→C' | 'K→K' | 'K→C' | 'C→K' | 'prune';
export type CkKind = 'add-c' | 'add-k' | 'set-status' | 'annotate';
export type Partition = 'restrictive' | 'expansive';
export type ConceptStatus = 'open' | 'conjunct' | 'refuted' | 'abandoned';
export type KnowledgeStatus = 'true' | 'false' | 'uncertain';

/** `node` on an add-c event carries the concept fields, on an add-k event the
 *  knowledge fields; the fold defaults whatever is absent. */
export interface CkEventNode {
  id: string;
  attribute?: string | null;
  partition?: Partition | null;
  breaks?: string;
  proposition?: string;
  note?: string;
  text?: string;
  status?: KnowledgeStatus;
  source?: string;
}

export interface CkEvent {
  /** Globally unique, never reused. */
  seq: number;
  /** The DAG edge; null at the root. */
  parent: number | null;
  /** Which branch appended it. */
  branch: string;
  at: string;
  actor: 'claude' | 'user';
  op: CkOp;
  kind: CkKind;
  /** The provenance edge: what `c` and `k` mean depends on `kind` (SCHEMA.md). */
  from: { c: string[]; k: string[] };
  /** add-c and add-k. */
  node?: CkEventNode;
  /** set-status and annotate: the node id acted on. */
  target?: string;
  /** set-status: the concept's new status. */
  status?: ConceptStatus;
  /** set-status and annotate. */
  note?: string;
  summary?: string;
}

export interface Concept {
  id: string;
  parent: string | null;
  attribute: string | null;
  partition: Partition | null;
  breaks: string;
  proposition: string;
  note: string;
  kRefs: string[];
  status: ConceptStatus;
  seq: number;
  step: number;
  viaOp: CkOp;
  /** Set once a set-status event has touched the concept. */
  statusSeq?: number;
  statusStep?: number;
}

export interface Knowledge {
  id: string;
  text: string;
  status: KnowledgeStatus;
  source: string;
  cRefs: string[];
  seq: number;
  step: number;
  viaOp: CkOp;
}

export interface Metrics {
  ratio: number;
  partitions: number;
  expansive: number;
  maxDepth: number;
  openLeaves: string[];
  conjunctions: number;
  refutations: number;
  warnings: string[];
}

export function esc(s: unknown): string;
export function chainOf(events: CkEvent[], tip: number | null | undefined): CkEvent[];
export function divergence(
  events: CkEvent[],
  tipA: number | null | undefined,
  tipB: number | null | undefined,
): { step: number; seq: number | null };
export function foldEvents(
  chain: CkEvent[],
  upto?: number | null,
): { C: Concept[]; K: Knowledge[] };
export function metrics(C: Concept[], K: Knowledge[]): Metrics;
export function renderTree(C: Concept[], at: number): string;
export function renderK(K: Knowledge[], at: number): string;
