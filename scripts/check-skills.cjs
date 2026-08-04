#!/usr/bin/env node
'use strict';
/**
 * check-skills.cjs — frontmatter gate for skills/.
 *
 * `claude plugin validate` only reads the marketplace manifest when the repo root is a
 * marketplace, so a SKILL.md with unparseable frontmatter ships clean. This closes that
 * hole. Zero deps, so it runs anywhere node does.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'skills');
const LIMIT = 1024; // description budget; the harness truncates around 1536 with when_to_use
const errs = [];

for (const dir of fs.readdirSync(root).sort()) {
  const file = path.join(root, dir, 'SKILL.md');
  const bad = (m) => errs.push(`skills/${dir}/SKILL.md: ${m}`);

  if (!fs.existsSync(file)) { bad('missing'); continue; }
  const src = fs.readFileSync(file, 'utf8');

  if (!src.startsWith('---\n')) { bad('no opening --- on line 1'); continue; }
  const end = src.indexOf('\n---', 3);
  if (end === -1) { bad('frontmatter is never closed'); continue; }

  const fm = {};
  for (const line of src.slice(4, end).split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i === -1 || /^\s/.test(line)) { bad(`unparseable frontmatter line: ${line}`); continue; }
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }

  if (!fm.name) bad('no name');
  else if (fm.name !== dir) bad(`name "${fm.name}" does not match directory "${dir}"`);

  if (!fm.description) bad('no description — the model cannot route to it');
  else if (fm.description.length > LIMIT)
    bad(`description is ${fm.description.length} chars, over the ${LIMIT} budget`);

  // The body has to actually say something; a frontmatter-only skill is a silent no-op.
  if (src.slice(end + 4).trim().length < 200) bad('body is empty or near-empty');
}

if (errs.length) {
  for (const e of errs) console.error('error: ' + e);
  process.exit(1);
}
console.log(`ok — ${fs.readdirSync(root).length} skills`);
