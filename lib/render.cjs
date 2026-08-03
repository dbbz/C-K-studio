#!/usr/bin/env node
'use strict';
/**
 * render.cjs — event DAG → canvas.
 *
 *   node lib/render.cjs sessions/foo.ck.json [--label expand] [--branch main] [--at 12]
 *
 * Every branch ships inside the page, so switching timelines is a local re-chain
 * and repaint — no server round trip. The initial paint is produced by the shared
 * functions in view.cjs; the same source is embedded for scrubbing and switching,
 * so there is no second implementation to drift.
 */

const fs = require('fs');
const path = require('path');
const V = require('./view.cjs');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const FLAGS = ['--label', '--at', '--branch'];

const sessionPath = path.resolve(
  args.find((a, i) => !a.startsWith('--') && !FLAGS.includes(args[i - 1])) || '');
const label = opt('--label', 'canvas');

if (!sessionPath || !fs.existsSync(sessionPath)) {
  console.error('usage: node lib/render.cjs <session.ck.json> [--label n] [--branch b] [--at n]');
  process.exit(1);
}

const S = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
if (S.version !== 3) {
  console.error(`error: ${path.basename(sessionPath)} is schema v${S.version || 1}; this renderer needs v3.\n` +
    `  Convert it:  node lib/migrate-v3.cjs ${path.basename(sessionPath)}`);
  process.exit(1);
}

const events = S.events || [];
const branches = S.branches || { main: null };
const branch = opt('--branch', S.head || 'main');
if (!(branch in branches)) {
  console.error(`error: unknown branch "${branch}" — have: ${Object.keys(branches).join(', ')}`);
  process.exit(1);
}

const chain = V.chainOf(events, branches[branch]);
const at = Math.min(parseInt(opt('--at', String(chain.length)), 10), chain.length);
const { C, K } = V.foldEvents(chain, at);
const M = V.metrics(C, K);

const projectDir = process.cwd();
const contentDir = path.join(projectDir, '.ck', 'viewer', 'content');
fs.mkdirSync(contentDir, { recursive: true });
const esc = V.esc;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(S.title || 'C-K session')}</title>
<style>
:root {
  color-scheme: light;
  --bg: #fcfcfb; --ink: #191917; --ink-2: #56554f; --ink-3: #91908a;
  --rule: rgba(25,25,23,.10); --lift: rgba(25,25,23,.035);
  --restrictive: #2a78d6; --expansive: #eb6834; --good: #0ca30c; --warn: #b07d16;
}
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) {
    color-scheme: dark;
    --bg: #141413; --ink: #f2f1ec; --ink-2: #a8a79e; --ink-3: #6e6d67;
    --rule: rgba(255,255,255,.11); --lift: rgba(255,255,255,.045);
    --restrictive: #3987e5; --expansive: #d95926; --warn: #d4a544;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #141413; --ink: #f2f1ec; --ink-2: #a8a79e; --ink-3: #6e6d67;
  --rule: rgba(255,255,255,.11); --lift: rgba(255,255,255,.045);
  --restrictive: #3987e5; --expansive: #d95926; --warn: #d4a544;
}

* { box-sizing: border-box; }
html { -webkit-font-smoothing: antialiased; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font: 13.5px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif;
  padding-bottom: 68px;
}
.wrap { max-width: 1180px; margin: 0 auto; padding: 44px 32px 40px; }
button { font: inherit; cursor: pointer; }

/* ── header ─────────────────────────────────────── */
h1 { font-size: 17px; font-weight: 600; margin: 0; letter-spacing: -.01em; }
.brief { color: var(--ink-2); margin: 5px 0 0; max-width: 66ch; }
.status {
  margin: 14px 0 0; color: var(--ink-3); font-size: 12px;
  display: flex; gap: 14px; flex-wrap: wrap; align-items: center;
}
.status b { font-weight: 600; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.flag { color: var(--warn); }

/* ── branch picker ──────────────────────────────── */
.brs { margin: 13px 0 0; display: flex; gap: 3px; flex-wrap: wrap; align-items: baseline; }
.br {
  background: none; border: 0; padding: 3px 8px; border-radius: 4px;
  font: 11.5px ui-monospace, "SF Mono", monospace; color: var(--ink-3);
}
.br:hover { color: var(--ink); background: var(--lift); }
.br.on { color: var(--ink); background: var(--lift); font-weight: 600; }
.br .n { display: inline; padding: 0; margin: 0; }
.brs .div { font-size: 11px; color: var(--ink-3); margin-left: 6px; }

/* ── layout ─────────────────────────────────────── */
main { display: grid; grid-template-columns: minmax(0,1fr) 268px; gap: 44px; margin-top: 30px; align-items: start; }
@media (max-width: 860px) { main { grid-template-columns: 1fr; gap: 30px; } }
.lbl {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: .1em;
  color: var(--ink-3); font-weight: 600; margin: 0 0 14px;
}

/* ── tree ───────────────────────────────────────── */
ul.tree, ul.tree ul { list-style: none; margin: 0; padding: 0; }
ul.tree ul { margin-left: 5px; padding-left: 19px; border-left: 1px solid var(--rule); }
ul.tree li { margin: 2px 0; }
.n { padding: 7px 10px 7px 9px; margin-left: -9px; border-radius: 5px; transition: background .12s; }
.n:hover { background: var(--lift); }
.n.sel { background: var(--lift); box-shadow: inset 2px 0 0 var(--ink-3); }
.n.lit { background: var(--lift); }
.n.fresh .id { color: var(--expansive); }
.n.s-abandoned, .n.s-refuted { opacity: .5; }
.n.s-refuted .pr { text-decoration: line-through; }

.hd { display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap; }
.dot { width: 5px; height: 5px; border-radius: 50%; flex: none; align-self: center; background: var(--ink-3); }
.p-expansive .dot { background: var(--expansive); }
.p-restrictive .dot { background: var(--restrictive); }
.id { font: 500 11px ui-monospace, "SF Mono", monospace; color: var(--ink-3); }
.at { font-weight: 550; }
.root-at { font-weight: 400; color: var(--ink-3); font-style: italic; }
.pt {
  font: 600 9.5px ui-monospace, monospace; letter-spacing: .06em;
  color: var(--ink-3); border: 1px solid var(--rule); border-radius: 3px; padding: 0 4px;
}
.p-expansive .pt { color: var(--expansive); border-color: color-mix(in srgb, var(--expansive) 40%, transparent); }
.p-restrictive .pt { color: var(--restrictive); border-color: color-mix(in srgb, var(--restrictive) 40%, transparent); }
.op { font: 10.5px ui-monospace, monospace; color: var(--ink-3); }
.st { font-size: 11px; color: var(--ink-3); margin-left: auto; }
.s-conjunct .st { color: var(--good); }

.pr { margin: 4px 0 0; color: var(--ink-2); }
.bk { margin: 4px 0 0; font-size: 12.5px; color: var(--ink-2); }
.bk span {
  font: 600 9.5px ui-monospace, monospace; text-transform: uppercase; letter-spacing: .08em;
  color: var(--expansive); margin-right: 5px;
}
.nt { margin: 4px 0 0; font-size: 12.5px; color: var(--ink-3); }
.kr { margin: 6px 0 0; display: flex; gap: 4px; flex-wrap: wrap; }
.kchip {
  font: 10.5px ui-monospace, monospace; color: var(--ink-3); cursor: pointer;
  border-bottom: 1px solid var(--rule); line-height: 1.3;
}
.kchip:hover { color: var(--ink); }

.acts { display: flex; gap: 12px; margin: 8px 0 1px; opacity: 0; transition: opacity .12s; }
.n:hover .acts, .n:focus-within .acts, .n.sel .acts { opacity: 1; }
@media (hover: none) { .acts { opacity: 1; } }
.t {
  background: none; border: 0; padding: 0; color: var(--ink-3); font-size: 11.5px;
  border-bottom: 1px solid transparent;
}
.t:hover { color: var(--ink); border-bottom-color: var(--rule); }
.t.ck-fired { color: var(--expansive); }

/* ── K column ───────────────────────────────────── */
.k { padding: 9px 0; border-top: 1px solid var(--rule); }
.k:first-of-type { border-top: 0; }
.k.lit { background: var(--lift); box-shadow: 0 0 0 6px var(--lift); border-radius: 2px; }
.k.fresh .id { color: var(--expansive); }
.khd { display: flex; gap: 7px; align-items: baseline; }
.kst { font-size: 10.5px; color: var(--warn); }
.k.st-false .kst { color: var(--ink-3); }
.k.st-false .kt { text-decoration: line-through; opacity: .6; }
.kt { margin: 2px 0 0; color: var(--ink-2); font-size: 12.5px; }
.ks { margin: 3px 0 0; color: var(--ink-3); font-size: 11px; }
.empty { color: var(--ink-3); font-style: italic; }
code { font: 11.5px ui-monospace, monospace; color: var(--ink-2); }

/* ── timeline ───────────────────────────────────── */
.tl {
  position: fixed; left: 0; right: 0; bottom: 0; background: var(--bg);
  border-top: 1px solid var(--rule); padding: 11px 32px 12px; z-index: 50;
}
.tl-in { max-width: 1180px; margin: 0 auto; display: flex; align-items: center; gap: 16px; }
#slider { -webkit-appearance: none; appearance: none; flex: 1; height: 15px; background: none; cursor: pointer; min-width: 90px; }
#slider::-webkit-slider-runnable-track { height: 1px; background: var(--rule); }
#slider::-moz-range-track { height: 1px; background: var(--rule); }
#slider::-webkit-slider-thumb { -webkit-appearance: none; width: 9px; height: 9px; border-radius: 50%; background: var(--ink); margin-top: -4px; }
#slider::-moz-range-thumb { width: 9px; height: 9px; border: 0; border-radius: 50%; background: var(--ink); }
.seq { font: 11px ui-monospace, monospace; color: var(--ink-3); font-variant-numeric: tabular-nums; flex: none; }
.now {
  font: 11px ui-monospace, monospace; color: var(--ink-2); flex: none;
  min-width: 28ch; max-width: 44ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.now b { color: var(--ink); font-weight: 600; }
.tl .t { flex: none; }
.pill-gap { flex: none; width: 46px; }

/* Rewound = read-only. The hint takes the place of the operator buttons so the
   rule is legible at the moment the user reaches for them. */
.past { display: none; }
body.rewound .acts { display: none; }
body.rewound .n .past {
  display: block; margin: 8px 0 1px; font-size: 11.5px; color: var(--warn);
  opacity: 0; transition: opacity .12s;
}
body.rewound .n:hover .past, body.rewound .n:focus-within .past { opacity: 1; }
@media (hover: none) { body.rewound .n .past { opacity: 1; } }
.past .t { color: var(--warn); border-bottom-color: color-mix(in srgb, var(--warn) 45%, transparent); }
.past .t:hover { color: var(--ink); }
.tl .past { display: none; }
body.rewound .tl .past { display: inline; flex: none; }
</style>
</head>
<body>
<div class="wrap">

<header>
  <h1>${esc(S.title || 'Untitled session')}</h1>
  ${S.brief ? `<p class="brief">${esc(S.brief)}</p>` : ''}
  <div class="brs" id="brs"></div>
  <p class="status" id="status"></p>
</header>

<main>
  <section>
    <p class="lbl">C — concept space</p>
    <div id="tree">${V.renderTree(C, at)}</div>
  </section>
  <aside>
    <p class="lbl">K — knowledge space</p>
    <div id="kbase">${V.renderK(K, at)}</div>
  </aside>
</main>

</div>

<div class="tl">
  <div class="tl-in">
    <span class="seq" id="seq"></span>
    <input type="range" id="slider" min="0" max="${chain.length}" value="${at}" step="1" aria-label="timeline position">
    <span class="now" id="now"></span>
    <span class="past">read-only</span>
    <button class="t" id="jump-now">now</button>
    <button class="t" id="branch">branch here</button>
    <span class="pill-gap" aria-hidden="true"></span>
  </div>
</div>

<script>
${V.SHARED}

var EVENTS   = ${JSON.stringify(events)};
var BRANCHES = ${JSON.stringify(branches)};
var SESSION  = ${JSON.stringify(path.basename(sessionPath))};
var BASE     = ${JSON.stringify('main' in branches ? 'main' : Object.keys(branches)[0])};

var HEAD  = ${JSON.stringify(branch)};
var CHAIN = chainOf(EVENTS, BRANCHES[HEAD]);
var LIVE  = CHAIN.length;

var $tree = document.getElementById('tree');
var $k = document.getElementById('kbase');
var $status = document.getElementById('status');
var $brs = document.getElementById('brs');
var $seq = document.getElementById('seq');
var $now = document.getElementById('now');
var $slider = document.getElementById('slider');

function paintBranches() {
  $brs.innerHTML = Object.keys(BRANCHES).map(function (name) {
    var on = name === HEAD;
    var d = name === BASE ? null : divergence(EVENTS, BRANCHES[BASE], BRANCHES[name]);
    var ahead = d ? chainOf(EVENTS, BRANCHES[name]).length - d.step : 0;
    return '<button class="br' + (on ? ' on' : '') + '" data-branch="' + esc(name) + '">' +
      esc(name) +
      (d ? '<span class="div"> @' + d.step + (ahead ? ' +' + ahead : '') + '</span>' : '') +
      '</button>';
  }).join('');
}

function paint(at) {
  var s = foldEvents(CHAIN, at);
  var m = metrics(s.C, s.K);

  $tree.innerHTML = renderTree(s.C, at);
  $k.innerHTML = renderK(s.K, at);

  $status.innerHTML =
    '<span><b>' + Math.round(m.ratio * 100) + '%</b> expansive</span>' +
    '<span><b>' + s.C.length + '</b> concepts</span>' +
    '<span><b>' + s.K.length + '</b> knowledge</span>' +
    '<span><b>' + m.openLeaves.length + '</b> open</span>' +
    (m.conjunctions ? '<span><b>' + m.conjunctions + '</b> conjunct</span>' : '') +
    (m.refutations ? '<span><b>' + m.refutations + '</b> refuted</span>' : '') +
    m.warnings.map(function (w) { return '<span class="flag">' + esc(w) + '</span>'; }).join('');

  $seq.textContent = at + ' / ' + LIVE;
  var e = at > 0 ? CHAIN[at - 1] : null;
  $now.innerHTML = e ? '<b>' + esc(e.op) + '</b> · ' + esc(e.summary || e.kind)
                     : '<span style="color:var(--ink-3)">before the first operation</span>';
  document.body.classList.toggle('rewound', at < LIVE);
}

/** Switching a timeline is a local re-chain — every branch is already in the page. */
function switchBranch(name) {
  if (!(name in BRANCHES) || name === HEAD) return;
  HEAD = name;
  CHAIN = chainOf(EVENTS, BRANCHES[HEAD]);
  LIVE = CHAIN.length;
  $slider.max = LIVE;
  $slider.value = LIVE;
  paintBranches();
  paint(LIVE);
  if (window.ck) window.ck.send({ type: 'switch-branch', branch: name, of: SESSION });
}

$brs.addEventListener('click', function (e) {
  var b = e.target.closest ? e.target.closest('.br') : null;
  if (b) switchBranch(b.dataset.branch);
});

$slider.addEventListener('input', function () { paint(+$slider.value); });
document.getElementById('jump-now').addEventListener('click', function () {
  $slider.value = LIVE; paint(LIVE);
});

document.addEventListener('keydown', function (ev) {
  if (ev.target.tagName === 'INPUT') return;
  if (ev.key === 'ArrowLeft') { $slider.value = Math.max(0, +$slider.value - 1); paint(+$slider.value); }
  if (ev.key === 'ArrowRight') { $slider.value = Math.min(LIVE, +$slider.value + 1); paint(+$slider.value); }
});

function askBranch(node) {
  if (window.ck) {
    window.ck.send({ trigger: 'ck-branch', atEvent: +$slider.value, from: HEAD,
                     of: SESSION, node: node || undefined });
  }
}
document.getElementById('branch').addEventListener('click', function (e) {
  e.currentTarget.classList.add('ck-fired');
  setTimeout(function () { e.target.classList.remove('ck-fired'); }, 700);
  askBranch(null);
});
document.addEventListener('click', function (e) {
  var b = e.target.closest ? e.target.closest('.forkhere') : null;
  if (!b) return;
  b.classList.add('ck-fired');
  setTimeout(function () { b.classList.remove('ck-fired'); }, 700);
  askBranch(b.dataset.fork);
});

// ── provenance: hovering either space lights the other ──
function lit(on, ids, sel) {
  ids.forEach(function (id) {
    var el = document.querySelector(sel.replace('%', id));
    if (el) el.classList.toggle('lit', on);
  });
}
function wire(ev, on) {
  var n = ev.target.closest ? ev.target.closest('.n') : null;
  if (n && n.dataset.node) { lit(on, (n.dataset.k || '').split(' ').filter(Boolean), '.k[data-kid="%"]'); return; }
  var k = ev.target.closest ? ev.target.closest('.k') : null;
  if (k) lit(on, (k.dataset.c || '').split(' ').filter(Boolean), '.n[data-node="%"]');
}
document.addEventListener('mouseover', function (e) { wire(e, true); });
document.addEventListener('mouseout', function (e) { wire(e, false); });

document.addEventListener('click', function (e) {
  var chip = e.target.closest ? e.target.closest('.kchip') : null;
  if (!chip) return;
  var el = document.querySelector('.k[data-kid="' + chip.dataset.kref + '"]');
  if (el) {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('lit');
    setTimeout(function () { el.classList.remove('lit'); }, 1400);
  }
});

document.addEventListener('click', function (e) {
  var n = e.target.closest ? e.target.closest('.n') : null;
  if (!n || !n.dataset.node || e.target.closest('button') || e.target.closest('.kchip')) return;
  document.querySelectorAll('.n.sel').forEach(function (x) { x.classList.remove('sel'); });
  n.classList.add('sel');
  if (window.ck) window.ck.send({ type: 'select', node: n.dataset.node, branch: HEAD });
});

paintBranches();
paint(${at});
</script>
</body>
</html>`;

let n = 1;
while (fs.existsSync(path.join(contentDir, `${label}-${n}.html`))) n++;
const out = path.join(contentDir, `${label}-${n}.html`);
fs.writeFileSync(out, html);

console.log(JSON.stringify({
  rendered: path.relative(projectDir, out),
  branch,
  branches: Object.keys(branches),
  steps: chain.length,
  at,
  concepts: C.length,
  knowledge: K.length,
  expansive_ratio: Number(M.ratio.toFixed(2)),
  open_leaves: M.openLeaves,
  warnings: M.warnings,
}, null, 2));
