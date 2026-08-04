#!/usr/bin/env node
'use strict';
// Builds the README figures into docs/, one file per theme.
//
// The palette is the viewer's palette (lib/render.cjs), copied here rather than
// imported because render.cjs emits CSS custom properties and an SVG served
// through GitHub cannot read the page's variables — it is an <img>, isolated
// from the document. Same reason there is no @media rule inside the output:
// GitHub picks the file via <picture>, so each file is a single fixed theme
// with plain presentation attributes and no CSS at all.
//
//   node scripts/build-diagrams.cjs

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'docs');

const THEMES = {
  light: {
    bg: '#fcfcfb', ink: '#191917', ink2: '#56554f', ink3: '#91908a',
    rule: '#191917', ruleOp: 0.14, lift: '#191917', liftOp: 0.035,
    restrictive: '#2a78d6', expansive: '#eb6834', warn: '#b07d16',
  },
  dark: {
    bg: '#141413', ink: '#f2f1ec', ink2: '#a8a79e', ink3: '#6e6d67',
    rule: '#ffffff', ruleOp: 0.14, lift: '#ffffff', liftOp: 0.045,
    restrictive: '#3987e5', expansive: '#d95926', warn: '#d4a544',
  },
};

const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrs = (o) => Object.entries(o)
  .filter(([, v]) => v !== undefined && v !== null)
  .map(([k, v]) => ` ${k}="${v}"`).join('');

// --- primitives ------------------------------------------------------------

const text = (x, y, s, o = {}) => {
  const { size = 13, weight, fill, family = SANS, anchor, opacity, spacing, style } = o;
  return `<text${attrs({
    x, y, 'font-family': family, 'font-size': size, 'font-weight': weight,
    fill, 'text-anchor': anchor, 'fill-opacity': opacity,
    'letter-spacing': spacing, 'font-style': style,
  })}>${esc(s)}</text>`;
};

const lines = (x, y, arr, o = {}) => {
  const lh = o.lh || 18;
  return arr.map((s, i) => text(x, y + i * lh, s, o)).join('');
};

const rect = (x, y, w, h, o = {}) => `<rect${attrs({
  x, y, width: w, height: h, rx: o.r === undefined ? 8 : o.r,
  fill: o.fill || 'none', 'fill-opacity': o.fillOp,
  stroke: o.stroke, 'stroke-width': o.stroke ? (o.sw || 1) : undefined,
  'stroke-opacity': o.strokeOp, 'stroke-dasharray': o.dash,
})}/>`;

const line = (x1, y1, x2, y2, o = {}) => `<line${attrs({
  x1, y1, x2, y2, stroke: o.stroke, 'stroke-width': o.sw || 1,
  'stroke-opacity': o.op, 'stroke-dasharray': o.dash, 'stroke-linecap': 'round',
})}/>`;

const pathEl = (d, o = {}) => `<path${attrs({
  d, fill: 'none', stroke: o.stroke, 'stroke-width': o.sw || 1.25,
  'stroke-opacity': o.op, 'stroke-dasharray': o.dash,
  'stroke-linecap': 'round', 'marker-end': o.arrow ? `url(#${o.arrow})` : undefined,
})}/>`;

// A section label: uppercase, tracked out, quiet. Same treatment as the canvas.
const eyebrow = (x, y, s, t, o = {}) =>
  text(x, y, s.toUpperCase(), {
    size: o.size || 10, weight: 600, family: MONO, spacing: '0.1em',
    fill: o.fill || t.ink3, anchor: o.anchor,
  });

// Arrowheads have to be declared per colour: `context-stroke` is not reliable
// in the renderers that matter here, so each marker carries its own fill.
const markers = (t) => {
  const set = { ink: t.ink, ink2: t.ink2, ink3: t.ink3, warn: t.warn, exp: t.expansive };
  return `<defs>${Object.entries(set).map(([k, v]) =>
    `<marker id="a-${k}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" ` +
    `markerHeight="6" orient="auto-start-reverse">` +
    `<path d="M0,1.2 L9,5 L0,8.8 z" fill="${v}"/></marker>`).join('')}</defs>`;
};

const doc = (w, h, t, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
  `viewBox="0 0 ${w} ${h}" font-family="${SANS}">` +
  markers(t) +
  rect(0.5, 0.5, w - 1, h - 1, { r: 12, fill: t.bg, stroke: t.rule, strokeOp: t.ruleOp }) +
  body +
  '</svg>\n';

// --- figure 1: the undecidability gate -------------------------------------

function gate(t) {
  const W = 880, H = 268;
  const rows = [
    { y: 78, q: '“Yes, those exist.”', chip: 'K', to: 'knowledge' },
    { y: 114, q: '“No, that’s impossible.”', chip: 'K', to: 'knowledge, status false' },
    { y: 150, q: '“I’d have to look it up.”', chip: 'K→K', to: 'research, then re-test', warn: true },
    { y: 228, q: '“I can’t say.”', chip: 'C', to: 'a concept', hero: true },
  ];
  let s = eyebrow(28, 32, 'the undecidability gate', t);

  // The thing being tested.
  s += rect(28, 58, 236, 130, { fill: t.lift, fillOp: t.liftOp, stroke: t.rule, strokeOp: t.ruleOp });
  s += eyebrow(48, 84, 'candidate', t, { size: 9.5 });
  s += lines(48, 110, [
    'There exists a vessel',
    'that travels far faster',
    'than the hull speed of',
    'its waterline length.',
  ], { size: 13.5, fill: t.ink, lh: 19 });

  // Into the gate, then a spine the four answers hang off.
  s += pathEl('M270,123 L302,123', { stroke: t.ink3, arrow: 'a-ink3' });
  s += line(310, 78, 310, 228, { stroke: t.rule, op: t.ruleOp * 3.2, sw: 1.25 });
  s += eyebrow(310, 46, 'ask K', t, { anchor: 'middle', size: 9.5 });

  for (const r of rows) {
    const key = r.hero ? t.ink : r.warn ? t.warn : t.ink3;
    s += line(310, r.y, 326, r.y, { stroke: key, op: r.hero ? 0.9 : 0.5 });
    s += text(338, r.y + 4.5, r.q, {
      size: r.hero ? 15 : 14,
      weight: r.hero ? 600 : 400,
      fill: r.hero ? t.ink : t.ink2,
    });
    // destination chip
    const cx = 628, cw = 56;
    s += rect(cx, r.y - 13, cw, 26, {
      r: 6,
      fill: r.hero ? t.ink : t.lift, fillOp: r.hero ? 1 : t.liftOp,
      stroke: r.hero ? undefined : key, strokeOp: r.warn ? 0.7 : t.ruleOp * 4,
    });
    s += text(cx + cw / 2, r.y + 4, r.chip, {
      size: 12, weight: 600, family: MONO, anchor: 'middle',
      fill: r.hero ? t.bg : key,
    });
    s += text(cx + cw + 16, r.y + 4, r.to, {
      size: 12.5, fill: r.hero ? t.ink2 : t.ink3, style: r.hero ? undefined : undefined,
    });
  }

  // The row that ruins sessions: uncertain K is not a concept, it is a lookup.
  s += pathEl('M620,166 C556,180 420,180 324,170', { stroke: t.warn, dash: '3 3.5', op: 0.85, arrow: 'a-warn' });
  s += text(338, 198, 'uncertain K is not a concept — it is an unanswered question', {
    size: 11.5, fill: t.warn, style: 'italic',
  });
  s += line(300, 212, 852, 212, { stroke: t.rule, op: t.ruleOp });

  return doc(W, H, t, s);
}

// --- figure 2: the loop ----------------------------------------------------

function loop(t) {
  const W = 880, H = 322;
  const C = { x: 40, y: 150, w: 290, h: 134 };
  const K = { x: 550, y: 150, w: 290, h: 134 };
  let s = eyebrow(28, 32, 'the four operators', t);

  for (const b of [C, K]) {
    s += rect(b.x, b.y, b.w, b.h, { fill: t.lift, fillOp: t.liftOp, stroke: t.rule, strokeOp: t.ruleOp, r: 10 });
  }
  s += text(C.x + 24, 186, 'C — concept space', { size: 15, weight: 600, fill: t.ink });
  s += lines(C.x + 24, 212, [
    'propositions K can neither prove',
    'nor refute. Not vagueness —',
    'the object does not exist yet.',
  ], { size: 12.5, fill: t.ink2 });
  s += text(K.x + 24, 186, 'K — knowledge space', { size: 15, weight: 600, fill: t.ink });
  s += lines(K.x + 24, 212, [
    'propositions with a definite status',
    'for this designer, now: true, false,',
    'or not yet looked up.',
  ], { size: 12.5, fill: t.ink2 });

  // Label above the arrow, plain-language caption further out — never on the
  // line itself, which is where the first pass put it.
  const op = (x, y, name, caption, colour, below) =>
    text(x, below ? y + 21 : y - 30, name,
      { size: 12, weight: 600, family: MONO, anchor: 'middle', fill: colour || t.ink }) +
    text(x, below ? y + 38 : y - 13, caption,
      { size: 11.5, anchor: 'middle', fill: t.ink3 });

  // K→C above, C→K below: the co-expansion, read as a cycle.
  s += pathEl('M546,192 L338,192', { stroke: t.ink2, arrow: 'a-ink2' });
  s += op(440, 192, 'K→C  disjunction', 'new knowledge opens a concept');
  s += pathEl('M334,246 L542,246', { stroke: t.ink2, arrow: 'a-ink2' });
  s += op(440, 246, 'C→K  conjunction', 'the concept acquires a status', null, true);

  // Self-loops: the two operators that stay inside one space.
  s += pathEl('M118,148 C130,92 240,92 252,144', { stroke: t.expansive, arrow: 'a-exp', op: 0.9 });
  s += op(185, 95, 'C→C  partition', 'add an attribute: restrictive or expansive', t.expansive);
  s += pathEl('M628,148 C640,92 750,92 762,144', { stroke: t.ink2, arrow: 'a-ink2' });
  s += op(695, 95, 'K→K  learning', 'research aimed at deciding a concept');

  return doc(W, H, t, s);
}

// --- figure 3: the worked example, at the moment it breaks open ------------

function tree(t) {
  const W = 880, H = 470;
  const L = 668; // right edge of every row
  let s = eyebrow(28, 32, 'the hydrofoil session, around event 7', t);

  // One row of the tree. `kind` drives the accent bar and the R/E badge.
  const node = (x, y, h, id, attr, kind, extra) => {
    const accent = kind === 'E' ? t.expansive : kind === 'R' ? t.restrictive : null;
    const dim = extra && extra.dim;
    let o = rect(x, y, L - x, h, {
      fill: t.lift, fillOp: dim ? t.liftOp * 0.6 : t.liftOp,
      stroke: t.rule, strokeOp: t.ruleOp,
    });
    if (accent) o += rect(x, y + 6, 2.5, h - 12, { r: 1.5, fill: accent, fillOp: dim ? 0.4 : 1 });
    o += text(x + 18, y + 24, id, { size: 11, weight: 500, family: MONO, fill: t.ink3 });
    o += text(x + 52, y + 24, attr, {
      size: 14, weight: kind ? 550 : 400, fill: dim ? t.ink3 : t.ink,
      style: kind ? undefined : 'italic',
    });
    if (kind) {
      const bw = 20;
      o += rect(L - 34, y + 12, bw, 16, { r: 4, fill: accent, fillOp: dim ? 0.35 : 0.16 });
      o += text(L - 34 + bw / 2, y + 24, kind, {
        size: 9.5, weight: 600, family: MONO, anchor: 'middle',
        fill: accent, opacity: dim ? 0.6 : 1,
      });
    }
    if (extra && extra.status) {
      o += text(L - 54, y + 24, extra.status, { size: 11.5, fill: t.ink3, anchor: 'end' });
    }
    if (extra && extra.breaks) {
      o += text(x + 52, y + 45, 'BREAKS', { size: 9, weight: 600, family: MONO, spacing: '0.08em', fill: t.expansive });
      o += text(x + 108, y + 45, extra.breaks, { size: 12.5, fill: t.ink2 });
    }
    return o;
  };

  s += node(28, 48, 46, 'C0', 'There exists a vessel that travels far faster than its hull speed.', null);
  s += node(56, 106, 36, 'C1', '+ more power', 'R', { dim: true, status: 'refuted by K1' });
  s += node(56, 150, 36, 'C2', '+ a longer waterline', 'R', { dim: true, status: 'abandoned' });

  // Event 7: the K→K that makes an expansive partition available.
  s += rect(56, 206, L - 56, 72, { fill: t.warn, fillOp: 0.07, stroke: t.warn, strokeOp: 0.45, dash: '4 4' });
  s += eyebrow(74, 228, 'event 7 · K→K', t, { size: 9.5, fill: t.warn });
  s += lines(74, 250, [
    'Wave-making resistance is a consequence of displacing water at the surface.',
    'It is not a property of “boats” as such.',
  ], { size: 12.5, fill: t.ink2, lh: 17 });

  s += pathEl('M100,278 L100,296', { stroke: t.expansive, arrow: 'a-exp' });
  s += text(114, 294, 'K→C', { size: 10.5, family: MONO, fill: t.expansive });

  s += node(56, 300, 62, 'C3', '+ does not displace water', 'E', {
    breaks: 'the definition of a boat as a body supported by buoyancy',
  });
  s += node(84, 372, 34, 'C4', '+ supported by a submerged wing', 'R');
  s += node(84, 414, 34, 'C5', '+ supported by trapped air', 'R');

  // Margin notes — the two things a reader misreads without them.
  const note = (y, arr, colour) =>
    line(686, y - 12, 686, y + (arr.length - 1) * 16 + 4, { stroke: colour, op: 0.35, sw: 1.5 }) +
    lines(700, y, arr, { size: 11.5, fill: t.ink3, lh: 16 });

  s += note(126, ['K can settle both,', 'so neither is a concept.', 'A century of', 'naval architecture.'], t.restrictive);
  s += note(326, ['Expansive, and it names', 'what it breaks — that', 'name is the gate.'], t.expansive);
  s += note(392, ['Restrictive under an', 'expansive parent. Type', 'is judged against the', 'parent, not the root.'], t.restrictive);

  return doc(W, H, t, s);
}

// --- figure 4: the architecture loop ---------------------------------------

function arch(t) {
  const W = 880, H = 300;
  let s = eyebrow(28, 32, 'one file in, one click back', t);

  const box = (x, y, w, h, label, sub, mono) =>
    rect(x, y, w, h, { fill: t.lift, fillOp: t.liftOp, stroke: t.rule, strokeOp: t.ruleOp }) +
    text(x + w / 2, sub ? y + 24 : y + h / 2 + 4.5, label, {
      size: mono ? 12 : 13.5, family: mono ? MONO : SANS,
      weight: mono ? 500 : 550, anchor: 'middle', fill: t.ink,
    }) +
    (sub ? text(x + w / 2, y + 42, sub, { size: 11.5, anchor: 'middle', fill: t.ink3 }) : '');

  const step = (x1, x2, y, label) =>
    pathEl(`M${x1},${y} L${x2},${y}`, { stroke: t.ink3, arrow: 'a-ink3' }) +
    text((x1 + x2) / 2, y - 10, label, { size: 11, family: MONO, anchor: 'middle', fill: t.ink3 });

  // Forward: the file becomes a page.
  s += box(40, 92, 180, 56, 'sessions/*.ck.json', null, true);
  s += step(228, 258, 120, 'fold');
  s += box(266, 92, 150, 56, 'render.cjs', 'via view.cjs', true);
  s += step(424, 454, 120, 'emit');
  s += box(462, 92, 200, 56, '.ck/viewer/content/', null, true);
  s += step(670, 700, 120, 'SSE');
  s += box(708, 92, 132, 56, 'browser', null, false);

  // Return: the click becomes an event.
  s += pathEl('M774,152 L774,196', { stroke: t.expansive, arrow: 'a-exp' });
  s += text(786, 178, 'click', { size: 11, family: MONO, fill: t.expansive });
  s += box(640, 200, 200, 52, 'clicks → JSONL', null, true);
  s += step(636, 590, 226, 'notify');
  s += box(400, 200, 186, 52, 'watch-events.cjs', null, true);
  s += step(396, 350, 226, 'Monitor');
  s += box(40, 200, 306, 52, 'skill → ck.cjs appends', null, true);
  s += pathEl('M193,196 L193,152', { stroke: t.expansive, arrow: 'a-exp' });
  s += text(205, 178, 'append', { size: 11, family: MONO, fill: t.expansive });

  s += text(440, 282, 'Pressing a button on the canvas wakes Claude and runs the operator — the same loop, from either end.', {
    size: 12, anchor: 'middle', fill: t.ink3,
  });

  return doc(W, H, t, s);
}

// --- figure 5: the hen's-egg fixation result -------------------------------
// Numbers from references/TECHNIQUES.md §2 (Agogué, Kazakçi, Weil & Cassotti).

function fixation(t) {
  const W = 880, H = 326;
  let s = eyebrow(28, 32, 'the hen’s egg paradigm · n=142, six populations', t);
  s += text(28, 66, '“Propose as many original solutions as possible: ensure that a hen’s egg dropped from 10 m does not break.”', {
    size: 13.5, fill: t.ink2, style: 'italic',
  });

  // Ten categories; the first three account for most of every population's answers.
  s += eyebrow(28, 118, 'ten solution categories', t, { size: 9.5 });
  for (let i = 0; i < 10; i++) {
    s += rect(28 + i * 20, 128, 14, 14, {
      r: 3, fill: i < 3 ? t.restrictive : t.expansive, fillOp: i < 3 ? 1 : 0.45,
    });
  }
  s += text(240, 140, '3 restrictive · 7 expansive', { size: 11.5, fill: t.ink3 });

  const CATS = ['damping the shock', 'protecting the egg', 'slowing the fall'];
  CATS.forEach((c, i) => {
    const y = 160 + i * 34;
    s += rect(28, y, 320, 28, { fill: t.lift, fillOp: t.liftOp, stroke: t.rule, strokeOp: t.ruleOp, r: 6 });
    s += rect(28, y + 5, 2.5, 18, { r: 1.5, fill: t.restrictive });
    s += text(46, y + 19, c, { size: 13.5, weight: 500, fill: t.ink });
  });

  // Same three categories, measured across populations.
  s += eyebrow(470, 118, 'share of all answers in those three', t, { size: 9.5 });
  const POPS = [['psychology undergrads', 81], ['engineers', 76], ['designers', 63]];
  POPS.forEach(([name, pct], i) => {
    const cy = 174 + i * 34;
    s += text(470, cy + 4, name, { size: 12.5, fill: t.ink2 });
    s += rect(636, cy - 5, 180, 10, { r: 5, fill: t.ink, fillOp: 0.09 });
    s += rect(636, cy - 5, 180 * pct / 100, 10, { r: 5, fill: t.restrictive });
    s += text(852, cy + 4, `${pct}%`, {
      size: 12.5, weight: 600, family: MONO, anchor: 'end', fill: t.ink,
    });
  });

  s += text(28, 284, 'All three silently assume a device — and an inert one.', { size: 12.5, fill: t.ink2 });
  s += text(28, 302, 'Naming that unstated attribute is what generates the other seven.', { size: 12.5, fill: t.ink3 });
  s += text(470, 284, 'Designers do best. Designers are still fixated.', { size: 12.5, fill: t.ink2 });

  return doc(W, H, t, s);
}

// --- figure 6: the ceiling on what any of this can claim -------------------
// TECHNIQUES.md §6f, Sio & Lortie-Forgues (2024).

function calibration(t) {
  const W = 880, H = 214;
  const X0 = 360, TRACK = 400, MAX = 0.7; // g = 0 .. 0.7
  let s = eyebrow(28, 32, 'creativity-training effect size (hedges’ g)', t);

  const ROWS = [
    ['as published', 0.53, '0.53', true],
    ['corrected for publication bias', 0.30, '0.29–0.32', false],
    ['highest-quality subset', 0.28, '0.28', false],
  ];
  ROWS.forEach(([name, g, label, faded], i) => {
    const cy = 80 + i * 36;
    s += text(28, cy + 4, name, { size: 12.5, fill: faded ? t.ink3 : t.ink2 });
    s += rect(X0, cy - 6, TRACK, 12, { r: 6, fill: t.ink, fillOp: 0.07 });
    s += rect(X0, cy - 6, TRACK * g / MAX, 12, {
      r: 6, fill: faded ? t.ink3 : t.ink, fillOp: faded ? 0.35 : 0.85,
    });
    s += text(X0 + TRACK + 24, cy + 4, label, {
      size: 12.5, weight: 600, family: MONO, fill: faded ? t.ink3 : t.ink,
    });
  });

  s += text(28, 186, '169 studies, 844 effect sizes, five decades. No study met all four quality indicators; one of the 169 was preregistered.', {
    size: 12, fill: t.ink3,
  });

  return doc(W, H, t, s);
}

// --- build -----------------------------------------------------------------

const FIGURES = { gate, loop, tree, arch, fixation, calibration };

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [name, build] of Object.entries(FIGURES)) {
  for (const [theme, palette] of Object.entries(THEMES)) {
    const file = path.join(OUT, `${name}-${theme}.svg`);
    fs.writeFileSync(file, build(palette));
    n++;
  }
}
console.log(`wrote ${n} files to docs/`);
