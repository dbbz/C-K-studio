#!/usr/bin/env node
'use strict';
/**
 * watch-events.cjs — turn canvas button clicks into Claude notifications.
 *
 * Run under the Monitor tool with persistent: true. Each line printed becomes a
 * notification, so Claude is woken by a click without the user typing anything.
 * That is the return half of the bidirectional loop.
 *
 * Only skill triggers are emitted. Plain node selections are recorded to the same
 * file but stay quiet — read them with `ck inbox` when you need to know where the
 * user is looking.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i !== -1 && args[i + 1] ? args[i + 1] : d; };

// The user's project, which is not where this script lives once C-K Studio is
// installed as a plugin. Same default as ck-server.cjs.
const projectDir = path.resolve(opt('--project-dir', process.cwd()));
const file = path.join(projectDir, '.ck', 'viewer', 'state', 'events');
fs.mkdirSync(path.dirname(file), { recursive: true });
if (!fs.existsSync(file)) fs.writeFileSync(file, '');

// Start at the end: pre-existing clicks are already handled history.
let offset = fs.statSync(file).size;
let carry = '';

function drain() {
  let size;
  try { size = fs.statSync(file).size; } catch (_) { return; }

  // `ck.cjs inbox` truncates the file; follow it back to the start.
  if (size < offset) { offset = 0; carry = ''; }
  if (size === offset) return;

  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(size - offset);
  fs.readSync(fd, buf, 0, buf.length, offset);
  fs.closeSync(fd);
  offset = size;

  const lines = (carry + buf.toString('utf8')).split('\n');
  carry = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch (_) { continue; }
    if (!e.trigger) continue;
    // Everything needed to act must be on this line — a notification that sends the
    // reader back to the inbox for the one field that matters is not a notification.
    const parts = [`TRIGGER ${e.trigger}`];
    if (e.node) parts.push(e.node);
    if (e.from) parts.push(`on ${e.from}`);
    if (typeof e.atEvent === 'number') parts.push(`@step ${e.atEvent}`);
    if (e.of) parts.push(`in ${e.of}`);
    process.stdout.write(parts.join('  ') + '\n');
  }
}

fs.watchFile(file, { interval: 400 }, drain);
process.stdout.write('watching canvas for skill triggers\n');
