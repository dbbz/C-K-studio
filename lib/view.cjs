'use strict';
/**
 * view.cjs — pure functions shared verbatim between Node and the browser.
 *
 * Every function here is self-contained (no closure over module scope) so that
 * `SHARED` can serialise them into the page. The initial paint is produced in
 * Node; timeline scrubbing re-runs the SAME code client-side. There is no second
 * implementation to drift.
 */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Walk a branch tip back to the root through parent pointers and return the chain
 * in chronological order. Events form a DAG, not a list: a branch is just a named
 * seq to start walking from, so nothing is ever copied to create one.
 */
function chainOf(events, tip) {
  if (tip === null || tip === undefined) return [];
  var bySeq = {}, i;
  for (i = 0; i < events.length; i++) bySeq[events[i].seq] = events[i];

  var out = [], cur = bySeq[tip], guard = 0;
  while (cur && guard++ < 1e6) {
    out.push(cur);
    cur = (cur.parent === null || cur.parent === undefined) ? null : bySeq[cur.parent];
  }
  return out.reverse();
}

/** Where two branches stop sharing history — the seq of their last common event. */
function divergence(events, tipA, tipB) {
  var a = chainOf(events, tipA), b = chainOf(events, tipB), i = 0;
  while (i < a.length && i < b.length && a[i].seq === b[i].seq) i++;
  return { step: i, seq: i > 0 ? a[i - 1].seq : null };
}

/**
 * Fold a chain into {C, K} as of `upto` events. Takes an already-resolved chain
 * (see chainOf), so it stays a plain linear fold regardless of the DAG above it.
 */
function foldEvents(events, upto) {
  var n = (upto === undefined || upto === null) ? events.length : Math.min(upto, events.length);
  var C = [], K = [], cById = {}, kById = {};

  for (var i = 0; i < n; i++) {
    var e = events[i];
    var fromC = (e.from && e.from.c) || [];
    var fromK = (e.from && e.from.k) || [];

    if (e.kind === 'add-c') {
      var c = {
        id: e.node.id,
        parent: fromC[0] || null,
        attribute: e.node.attribute || null,
        partition: e.node.partition || null,
        breaks: e.node.breaks || '',
        proposition: e.node.proposition || '',
        note: e.node.note || '',
        kRefs: fromK.slice(),
        status: 'open',
        seq: e.seq,

        step: i,
        viaOp: e.op,
      };
      C.push(c); cById[c.id] = c;

    } else if (e.kind === 'add-k') {
      var k = {
        id: e.node.id,
        text: e.node.text,
        status: e.node.status || 'true',
        source: e.node.source || '',
        cRefs: fromC.slice(),
        seq: e.seq,

        step: i,
        viaOp: e.op,
      };
      K.push(k); kById[k.id] = k;
      // A C→K entry is the record of a conjunction: link it back both ways.
      for (var a = 0; a < fromC.length; a++) {
        if (cById[fromC[a]] && cById[fromC[a]].kRefs.indexOf(k.id) === -1) {
          cById[fromC[a]].kRefs.push(k.id);
        }
      }

    } else if (e.kind === 'set-status') {
      var t = cById[e.target];
      if (t) {
        t.status = e.status;
        t.statusSeq = e.seq; t.statusStep = i;
        for (var b = 0; b < fromK.length; b++) {
          if (t.kRefs.indexOf(fromK[b]) === -1) t.kRefs.push(fromK[b]);
        }
        if (e.note) t.note = e.note;
      }

    } else if (e.kind === 'annotate') {
      var o = cById[e.target] || kById[e.target];
      if (o && e.note) o.note = e.note;
    }
  }
  return { C: C, K: K };
}

/** Health signals. A smoke detector, not a score. */
function metrics(C, K) {
  var byId = {}, i;
  for (i = 0; i < C.length; i++) byId[C[i].id] = C[i];
  var kids = function (id) { return C.filter(function (n) { return n.parent === id; }); };
  var depth = function (n) { var d = 0, cur = n; while (cur && cur.parent) { d++; cur = byId[cur.parent]; } return d; };

  var parts = C.filter(function (n) { return n.partition; });
  var exp = parts.filter(function (n) { return n.partition === 'expansive'; });
  var ratio = parts.length ? exp.length / parts.length : 0;
  var open = C.filter(function (n) { return n.status === 'open' && kids(n.id).length === 0; });

  var fixated = open.filter(function (leaf) {
    var cur = leaf, steps = 0;
    while (cur && cur.parent) {
      if (cur.partition === 'expansive') return false;
      steps++; cur = byId[cur.parent];
    }
    return steps >= 3;
  });

  var warnings = [];
  if (parts.length >= 4 && ratio < 0.3) {
    warnings.push('Only ' + exp.length + ' of ' + parts.length + ' partitions are expansive — ' +
      'the tree is refining a known object rather than revising its identity.');
  }
  if (fixated.length) {
    warnings.push('No expansive step anywhere on the path to ' +
      fixated.map(function (n) { return n.id; }).join(', ') + '.');
  }
  if (C.length > 3 && !K.length) {
    warnings.push('K is empty — nothing distinguishes an expansive partition from a false one.');
  }

  var maxDepth = 0;
  for (i = 0; i < C.length; i++) maxDepth = Math.max(maxDepth, depth(C[i]));

  return {
    ratio: ratio,
    partitions: parts.length,
    expansive: exp.length,
    maxDepth: maxDepth,
    openLeaves: open.map(function (n) { return n.id; }),
    conjunctions: C.filter(function (n) { return n.status === 'conjunct'; }).length,
    refutations: C.filter(function (n) { return n.status === 'refuted'; }).length,
    warnings: warnings,
  };
}

/** The concept tree. `at` is the current timeline position, for change highlighting. */
function renderTree(C, at) {
  if (!C.length) return '<p class="empty">No concept yet — <code>/ck-frame</code> states one.</p>';

  var kids = function (id) { return C.filter(function (n) { return n.parent === id; }); };

  var node = function (n) {
    var p = n.partition || 'root';
    var fresh = (n.step === at - 1 || n.statusStep === at - 1) ? ' fresh' : '';
    var kr = n.kRefs || [];

    var trig = function (skill, text) {
      return '<button class="t" data-ck=\'' +
        JSON.stringify({ trigger: skill, node: n.id }).replace(/'/g, '&#39;') +
        '\'>' + text + '</button>';
    };

    return '<li>' +
      '<div class="n p-' + esc(p) + ' s-' + esc(n.status) + fresh + '" id="n-' + esc(n.id) + '"' +
        ' data-node="' + esc(n.id) + '" data-k="' + esc(kr.join(' ')) + '">' +
        '<div class="hd">' +
          '<i class="dot" title="' + (p === 'expansive' ? 'expansive' : p === 'restrictive' ? 'restrictive' : 'root') + '"></i>' +
          '<span class="id">' + esc(n.id) + '</span>' +
          (n.attribute ? '<span class="at">' + esc(n.attribute) + '</span>'
                       : '<span class="at root-at">root concept</span>') +
          (n.partition ? '<span class="pt">' + (p === 'expansive' ? 'E' : 'R') + '</span>' : '') +
          // C→C is the default and says nothing the R/E badge doesn't. Only the
          // interesting provenance — a partition seeded by new knowledge — is shown.
          (n.viaOp && n.viaOp !== 'seed' && n.viaOp !== 'C→C'
            ? '<span class="op">' + esc(n.viaOp) + '</span>' : '') +
          (n.status !== 'open' ? '<span class="st">' + esc(n.status) + '</span>' : '') +
        '</div>' +
        (n.proposition ? '<p class="pr">' + esc(n.proposition) + '</p>' : '') +
        (n.breaks ? '<p class="bk"><span>breaks</span> ' + esc(n.breaks) + '</p>' : '') +
        (n.note ? '<p class="nt">' + esc(n.note) + '</p>' : '') +
        (kr.length ? '<p class="kr">' + kr.map(function (k) {
          return '<a class="kchip" data-kref="' + esc(k) + '">' + esc(k) + '</a>';
        }).join('') + '</p>' : '') +
        // Operators are unavailable while rewound: an event appended now would land
        // after everything the user scrubbed past, claiming knowledge it never had.
        // The hint replaces the buttons rather than leaving them to vanish silently.
        (n.status === 'open'
          ? '<div class="acts">' + trig('ck-expand', 'partition') + trig('ck-learn', 'expand K') +
              trig('ck-conjoin', 'test status') + trig('ck-defix', 'defix') + '</div>' +
            '<div class="past">read-only here · ' +
              '<button class="t forkhere" data-fork="' + esc(n.id) + '">fork to branch from this point</button>' +
            '</div>'
          : '') +
      '</div>' +
      (kids(n.id).length ? '<ul>' + kids(n.id).map(node).join('') + '</ul>' : '') +
      '</li>';
  };

  return '<ul class="tree">' + C.filter(function (n) { return !n.parent; }).map(node).join('') + '</ul>';
}

/** The knowledge column. */
function renderK(K, at) {
  if (!K.length) return '<p class="empty">K is empty — <code>/ck-learn</code>.</p>';
  var order = { 'true': 0, uncertain: 1, 'false': 2 };
  var sorted = K.slice().sort(function (a, b) { return (order[a.status] || 0) - (order[b.status] || 0); });

  return sorted.map(function (k) {
    return '<div class="k st-' + esc(k.status) + (k.step === at - 1 ? ' fresh' : '') + '"' +
      ' data-kid="' + esc(k.id) + '" data-c="' + esc((k.cRefs || []).join(' ')) + '">' +
      '<div class="khd"><span class="id">' + esc(k.id) + '</span>' +
        (k.status !== 'true' ? '<span class="kst">' + esc(k.status) + '</span>' : '') +
        (k.viaOp && k.viaOp !== 'seed' ? '<span class="op">' + esc(k.viaOp) + '</span>' : '') +
      '</div>' +
      '<p class="kt">' + esc(k.text) + '</p>' +
      (k.source ? '<p class="ks">' + esc(k.source) + '</p>' : '') +
      '</div>';
  }).join('');
}

const SHARED = [esc, chainOf, divergence, foldEvents, metrics, renderTree, renderK]
  .map(function (f) { return f.toString(); }).join('\n\n');

module.exports = { esc, chainOf, divergence, foldEvents, metrics, renderTree, renderK, SHARED };
