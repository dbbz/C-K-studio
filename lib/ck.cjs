#!/usr/bin/env node
'use strict';
/**
 * ck.cjs — the only sanctioned way to mutate a session.
 *
 * A session is an append-only event log. Nothing is ever edited or deleted; the
 * tree and the knowledge base are folded from the log (lib/view.cjs). That is what
 * makes the timeline possible and what makes provenance structural rather than
 * bookkeeping: every event records the C and K it derived from.
 *
 *   ck new <slug> --title T [--brief B]
 *   ck show <session> [--at N]
 *   ck add-c <session> --parent C0 --attribute "+ x" --partition expansive
 *                      --breaks "..." --proposition "..." [--k K1,K2] [--op K→C]
 *                      [--note "..."] [--summary "..."]
 *   ck add-k <session> --text "..." [--status true|false|uncertain] [--source S]
 *                      [--op K→K|C→K|seed] [--for C4] [--summary "..."]
 *   ck set <session> <C-id> --status open|conjunct|refuted|abandoned
 *                      [--k K1,K2] [--note N] [--summary "..."]
 *   ck fork <session> --at N --as <slug>
 *   ck inbox [--keep]          # browser interactions since last read
 *
 * Mutating commands re-render the canvas (suppress with --no-render).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const V = require('./view.cjs');

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const cmd = argv.shift();

const positional = [];
const opts = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) opts[key] = true;
    else { opts[key] = next; i++; }
  } else positional.push(argv[i]);
}

const die = (m) => { console.error('error: ' + m); process.exit(1); };
const str = (v) => (typeof v === 'string' && v ? v : '');
const csv = (v) => (str(v) ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const today = () => new Date().toISOString().slice(0, 10);

function resolveSession(arg) {
  if (!arg) die('missing <session>');
  const tries = [arg, path.join(ROOT, arg), path.join(ROOT, 'sessions', arg),
                 path.join(ROOT, 'sessions', arg + '.ck.json')];
  const hit = tries.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!hit) die(`no session file for "${arg}"`);
  return path.resolve(hit);
}

function load(p) {
  const S = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (S.version !== 2) die(`${path.basename(p)} is schema v${S.version || 1}; this tool needs v2.`);
  S.events = S.events || [];
  return S;
}

function save(p, S, render = true) {
  fs.writeFileSync(p, JSON.stringify(S, null, 2) + '\n');
  if (render && !opts['no-render']) {
    try {
      process.stdout.write(execFileSync('node',
        [path.join(__dirname, 'render.cjs'), p, '--label', String(opts.label || cmd)],
        { encoding: 'utf8' }));
    } catch (e) {
      console.error('(render skipped: ' + String(e.message).split('\n')[0] + ')');
    }
  }
}

/** Next free id, scanning the folded state rather than the raw log. */
function nextId(list, prefix) {
  return prefix + (list.reduce((m, x) => {
    const n = parseInt(String(x.id).replace(prefix, ''), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, -1) + 1);
}

function append(S, e) {
  e.seq = S.events.length;
  e.at = new Date().toISOString();
  e.actor = str(opts.actor) || 'claude';
  if (str(opts.summary)) e.summary = opts.summary;
  S.events.push(e);
  return e;
}

// ---------------------------------------------------------------- commands

if (cmd === 'new') {
  const slug = positional[0] || die('usage: ck new <slug> --title "..."');
  const file = path.join(ROOT, 'sessions', `${slug}.ck.json`);
  if (fs.existsSync(file)) die(`${file} already exists`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({
    version: 2,
    title: str(opts.title) || slug,
    brief: str(opts.brief),
    createdAt: today(),
    events: [],
  }, null, 2) + '\n');
  console.log(JSON.stringify({ created: path.relative(ROOT, file) }, null, 2));

} else if (cmd === 'show') {
  const file = resolveSession(positional[0]);
  const S = load(file);
  const at = opts.at && opts.at !== true ? parseInt(opts.at, 10) : S.events.length;
  const { C, K } = V.foldEvents(S.events, at);
  const M = V.metrics(C, K);
  const kids = (id) => C.filter((n) => n.parent === id);

  const out = [`# ${S.title}`];
  if (S.brief) out.push(S.brief);
  out.push('', `file: ${path.relative(ROOT, file)}   events: ${at}/${S.events.length}`, '', '## C');

  const walk = (n, d) => {
    const tag = n.partition === 'expansive' ? 'E' : n.partition === 'restrictive' ? 'R' : '·';
    const pad = '  '.repeat(d);
    out.push(`${pad}${n.id} [${tag}] ${n.attribute || '(root)'} — ${n.status}${n.viaOp && n.viaOp !== 'seed' ? `  via ${n.viaOp}` : ''}`);
    if (n.proposition) out.push(`${pad}   "${n.proposition}"`);
    if (n.breaks) out.push(`${pad}   breaks: ${n.breaks}`);
    if (n.kRefs.length) out.push(`${pad}   K: ${n.kRefs.join(', ')}`);
    kids(n.id).forEach((c) => walk(c, d + 1));
  };
  C.filter((n) => !n.parent).forEach((r) => walk(r, 0));

  out.push('', '## K');
  for (const k of K) {
    out.push(`${k.id} [${k.status}] ${k.text}${k.source ? `  (${k.source})` : ''}` +
      `${k.cRefs.length ? `  ← ${k.cRefs.join(', ')}` : ''}`);
  }

  out.push('', '## operations');
  for (const e of S.events.slice(0, at)) {
    const tgt = e.kind === 'set-status' ? e.target : (e.node && e.node.id) || '';
    out.push(`${String(e.seq).padStart(2)}  ${e.op.padEnd(4)}  ${e.kind.padEnd(10)} ${tgt.padEnd(4)} ${e.summary || ''}`);
  }

  out.push('', '## state',
    `expansive ratio: ${Math.round(M.ratio * 100)}%  (${M.expansive}/${M.partitions})`,
    `open leaves: ${M.openLeaves.join(', ') || 'none'}`,
    `conjunctions: ${M.conjunctions}   refutations: ${M.refutations}`);
  if (M.warnings.length) out.push('', ...M.warnings.map((w) => `!! ${w}`));
  console.log(out.join('\n'));

} else if (cmd === 'add-c') {
  const file = resolveSession(positional[0]);
  const S = load(file);
  const { C, K } = V.foldEvents(S.events);
  const parent = str(opts.parent) || null;
  const isRoot = !parent;

  if (!isRoot && !C.some((n) => n.id === parent)) die(`unknown parent "${parent}"`);
  if (isRoot && C.some((n) => !n.parent)) die('a root concept already exists; pass --parent');
  if (!str(opts.proposition)) die('--proposition is required');

  if (!isRoot) {
    if (!str(opts.attribute)) die('--attribute is required for a non-root node');
    if (!['expansive', 'restrictive'].includes(opts.partition)) {
      die('--partition must be "expansive" or "restrictive" (invariant 2)');
    }
    if (opts.partition === 'expansive' && !str(opts.breaks)) {
      die('an expansive partition must state --breaks: which property of the object\'s identity ' +
          'it violates. If you cannot name one, the partition is restrictive. (invariant 3)');
    }
  }

  const kRefs = csv(opts.k);
  const unknown = kRefs.filter((k) => !K.some((x) => x.id === k));
  if (unknown.length) die(`unknown K refs: ${unknown.join(', ')}`);

  const id = nextId(C, 'C');
  const e = append(S, {
    op: str(opts.op) || (isRoot ? 'seed' : 'C→C'),
    kind: 'add-c',
    from: { c: isRoot ? [] : [parent], k: kRefs },
    node: {
      id,
      attribute: isRoot ? null : opts.attribute,
      partition: isRoot ? null : opts.partition,
      breaks: str(opts.breaks),
      proposition: opts.proposition,
      note: str(opts.note),
    },
  });
  if (!e.summary) {
    e.summary = isRoot ? `Framed ${id}.`
      : `${id} = ${parent} ${opts.attribute} (${opts.partition})`;
  }
  save(file, S);
  console.log(JSON.stringify({ added: id, op: e.op, seq: e.seq }, null, 2));

} else if (cmd === 'add-k') {
  const file = resolveSession(positional[0]);
  const S = load(file);
  const { C, K } = V.foldEvents(S.events);
  if (!str(opts.text)) die('--text is required');

  const status = str(opts.status) || 'true';
  if (!['true', 'false', 'uncertain'].includes(status)) die('--status must be true, false, or uncertain');

  const forC = csv(opts.for);
  const unknown = forC.filter((c) => !C.some((x) => x.id === c));
  if (unknown.length) die(`unknown concept refs: ${unknown.join(', ')}`);

  const op = str(opts.op) || str(opts.via) || 'K→K';
  if (op === 'C→K' && !forC.length) {
    die('a C→K entry records a conjunction — pass --for <C-id> so the link is recorded.');
  }

  const id = nextId(K, 'K');
  const e = append(S, {
    op, kind: 'add-k',
    from: { c: forC, k: [] },
    node: { id, text: opts.text, status, source: str(opts.source) },
  });
  if (!e.summary) e.summary = `${id} — ${String(opts.text).slice(0, 60)}`;
  save(file, S);
  console.log(JSON.stringify({ added: id, op, seq: e.seq }, null, 2));

} else if (cmd === 'set') {
  const file = resolveSession(positional[0]);
  const S = load(file);
  const { C, K } = V.foldEvents(S.events);
  const node = C.find((n) => n.id === positional[1]);
  if (!node) die(`unknown node "${positional[1]}"`);

  const status = str(opts.status);
  if (!status) die('--status is required');
  if (!['open', 'conjunct', 'refuted', 'abandoned'].includes(status)) {
    die('--status must be open, conjunct, refuted, or abandoned');
  }
  if (status === 'conjunct') {
    const backing = K.some((k) => k.viaOp === 'C→K' && (k.cRefs || []).includes(node.id));
    if (!backing) {
      die(`conjunction of ${node.id} requires a C→K entry recording what became known.\n` +
          `  Run first:  node lib/ck.cjs add-k ${path.basename(file)} --op "C→K" ` +
          `--for ${node.id} --text "..." --source "<evidence>"   (invariant 4)`);
    }
  }

  const kRefs = csv(opts.k);
  const unknown = kRefs.filter((k) => !K.some((x) => x.id === k));
  if (unknown.length) die(`unknown K refs: ${unknown.join(', ')}`);

  const e = append(S, {
    op: status === 'conjunct' ? 'C→K' : 'prune',
    kind: 'set-status',
    target: node.id,
    status,
    from: { c: [], k: kRefs },
    note: str(opts.note) || undefined,
  });
  if (!e.summary) e.summary = `${node.id} → ${status}`;
  save(file, S);
  console.log(JSON.stringify({ updated: node.id, status, seq: e.seq }, null, 2));

} else if (cmd === 'fork') {
  const file = resolveSession(positional[0]);
  const S = load(file);
  const at = opts.at && opts.at !== true ? parseInt(opts.at, 10) : die('--at N is required');
  const slug = str(opts.as) || die('--as <slug> is required');
  const out = path.join(ROOT, 'sessions', `${slug}.ck.json`);
  if (fs.existsSync(out)) die(`${out} already exists`);
  if (at < 0 || at > S.events.length) die(`--at must be between 0 and ${S.events.length}`);

  fs.writeFileSync(out, JSON.stringify({
    version: 2,
    title: str(opts.title) || `${S.title} (fork @${at})`,
    brief: S.brief,
    createdAt: today(),
    forkedFrom: { session: path.basename(file), at },
    events: S.events.slice(0, at),
  }, null, 2) + '\n');
  console.log(JSON.stringify({
    created: path.relative(ROOT, out), events: at,
    dropped: S.events.length - at,
  }, null, 2));

} else if (cmd === 'inbox') {
  const f = path.join(ROOT, '.ck', 'viewer', 'state', 'events');
  if (!fs.existsSync(f)) { console.log('(no browser interactions)'); process.exit(0); }
  const body = fs.readFileSync(f, 'utf8').trim();
  console.log(body || '(no browser interactions)');
  if (!opts.keep) fs.writeFileSync(f, '');

} else {
  console.error(fs.readFileSync(__filename, 'utf8').split('\n').slice(3, 26).join('\n')
    .replace(/^ \* ?/gm, '').replace(/^ \*$/gm, ''));
  process.exit(1);
}
