#!/usr/bin/env node
'use strict';
/**
 * migrate-v3.cjs — v2 (one file per timeline) → v3 (one file, branching DAG).
 *
 *   node lib/migrate-v3.cjs sessions/foo.ck.json [--apply]
 *
 * v2 stored a fork by copying the shared prefix into a new file. v3 stores it as a
 * name pointing at an event that already exists. So migration is: thread parent
 * pointers through the linear log, then absorb every v2 fork of this session as a
 * branch ref — verifying first that its events really are the prefix they claim to
 * be, since absorbing on a false claim would silently rewrite someone's history.
 *
 * Dry-run by default. Pass --apply to write.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const target = path.resolve(args.find((a) => !a.startsWith('--')) || '');

if (!target || !fs.existsSync(target)) {
  console.error('usage: node lib/migrate-v3.cjs <session.ck.json> [--apply]');
  process.exit(1);
}

const dir = path.dirname(target);
const S = JSON.parse(fs.readFileSync(target, 'utf8'));
if (S.version === 3) { console.log('already v3 — nothing to do'); process.exit(0); }
if (S.version !== 2) { console.error(`expected v2, found v${S.version}`); process.exit(1); }

const plan = [];

// ── 1. thread parent pointers through the existing linear log ──────────────
const events = S.events.map((e, i) => Object.assign({}, e, {
  parent: i === 0 ? null : S.events[i - 1].seq,
  branch: 'main',
}));
const branches = { main: events.length ? events[events.length - 1].seq : null };
plan.push(`main → ${events.length} events, tip seq ${branches.main}`);

/** Do two event lists describe the same history? Compare what identifies an event,
 *  not its timestamps — a copied prefix should match on substance. */
const sameEvent = (a, b) =>
  a.kind === b.kind && a.op === b.op && a.target === b.target &&
  JSON.stringify(a.node || null) === JSON.stringify(b.node || null) &&
  JSON.stringify(a.from || null) === JSON.stringify(b.from || null);

// ── 2. absorb v2 forks of this session as branch refs ──────────────────────
const base = path.basename(target);
const absorbed = [];

for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.ck.json') || name === base) continue;
  const p = path.join(dir, name);
  let F;
  try { F = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { continue; }
  if (F.version !== 2 || !F.forkedFrom || F.forkedFrom.session !== base) continue;

  const at = F.forkedFrom.at;
  const claimed = F.events;

  if (claimed.length !== at) {
    plan.push(`SKIP ${name}: claims fork @${at} but holds ${claimed.length} events`);
    continue;
  }
  const mismatch = claimed.findIndex((e, i) => !S.events[i] || !sameEvent(e, S.events[i]));
  if (mismatch !== -1) {
    plan.push(`SKIP ${name}: diverges from the parent at event ${mismatch} — not a pure prefix, ` +
              `so it holds history of its own. Convert it separately.`);
    continue;
  }

  const branchName = name.replace(/\.ck\.json$/, '');
  branches[branchName] = at === 0 ? null : events[at - 1].seq;
  absorbed.push({ name, branchName, at, file: p });
  plan.push(`${branchName} → branch ref at seq ${branches[branchName]} (was a ${claimed.length}-event copy)`);
}

// ── 3. report / write ──────────────────────────────────────────────────────
const out = {
  version: 3,
  title: S.title,
  brief: S.brief,
  createdAt: S.createdAt,
  branches,
  head: 'main',
  events,
};

console.log(plan.map((l) => '  ' + l).join('\n'));
console.log(`\n  duplicated events eliminated: ${absorbed.reduce((n, a) => n + a.at, 0)}`);

if (!apply) {
  console.log('\n(dry run — pass --apply to write)');
  process.exit(0);
}

fs.writeFileSync(target, JSON.stringify(out, null, 2) + '\n');
for (const a of absorbed) fs.unlinkSync(a.file);

console.log(`\n  wrote ${path.relative(process.cwd(), target)}` +
  (absorbed.length ? `\n  removed ${absorbed.map((a) => a.name).join(', ')} (now branches)` : ''));
