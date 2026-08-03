#!/usr/bin/env node
'use strict';
/**
 * ck-server — zero-dependency viewer server for C-K design sessions.
 *
 * Contract (deliberately dumb):
 *   - Serves the newest *.html file in <session>/content/ at GET /
 *   - Pushes a reload over SSE whenever that directory changes
 *   - Records browser interactions to <session>/state/events as JSONL
 *
 * All rendering lives in render.cjs. All reasoning lives in the skills.
 * This process only moves bytes.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------- args

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(name);

const projectDir = path.resolve(opt('--project-dir', process.cwd()));
const host = opt('--host', '127.0.0.1');
const urlHost = opt('--url-host', host === '0.0.0.0' ? 'localhost' : host);
const port = parseInt(opt('--port', '0'), 10);
const idleMinutes = parseInt(opt('--idle-timeout-minutes', '240'), 10);

const sessionDir = path.join(projectDir, '.ck', 'viewer');
const contentDir = path.join(sessionDir, 'content');
const stateDir = path.join(sessionDir, 'state');
const eventsFile = path.join(stateDir, 'events');
const infoFile = path.join(stateDir, 'server-info');
const stoppedFile = path.join(stateDir, 'server-stopped');

for (const d of [contentDir, stateDir]) fs.mkdirSync(d, { recursive: true });
if (fs.existsSync(stoppedFile)) fs.unlinkSync(stoppedFile);

const key = crypto.randomBytes(9).toString('hex');

// ---------------------------------------------------------------- helpers

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

function newestHtml() {
  let best = null;
  let bestTime = -1;
  for (const name of fs.readdirSync(contentDir)) {
    if (!name.endsWith('.html')) continue;
    const full = path.join(contentDir, name);
    const t = fs.statSync(full).mtimeMs;
    if (t > bestTime) {
      bestTime = t;
      best = full;
    }
  }
  return best;
}

/** Client-side helper injected into every served page. */
const HELPER = `
<script>
(function () {
  var qs = new URLSearchParams(location.search).get('key');
  var ck = (document.cookie.match(/(?:^|; )ck_key=([^;]+)/) || [])[1];
  var KEY = qs || ck || '';
  if (qs) document.cookie = 'ck_key=' + qs + '; path=/; SameSite=Strict';

  var pill = document.createElement('div');
  pill.id = 'ck-conn';
  pill.textContent = 'live';
  pill.style.cssText =
    'position:fixed;right:10px;bottom:10px;z-index:99999;font:11px ui-monospace,monospace;' +
    'padding:3px 9px;border-radius:99px;letter-spacing:.04em;pointer-events:none;' +
    'background:rgba(120,180,140,.16);color:#5f9e77;border:1px solid rgba(120,180,140,.35)';
  addEventListener('DOMContentLoaded', function () { document.body.appendChild(pill); });

  function status(ok) {
    pill.textContent = ok ? 'live' : 'paused';
    pill.style.background = ok ? 'rgba(120,180,140,.16)' : 'rgba(190,140,90,.16)';
    pill.style.color = ok ? '#5f9e77' : '#b08040';
    pill.style.borderColor = ok ? 'rgba(120,180,140,.35)' : 'rgba(190,140,90,.35)';
  }

  var retry = 500;
  function connect() {
    var es = new EventSource('/stream?key=' + encodeURIComponent(KEY));
    es.onopen = function () { retry = 500; status(true); };
    es.onmessage = function (e) { if (e.data === 'reload') location.reload(); };
    es.onerror = function () {
      status(false);
      es.close();
      retry = Math.min(retry * 2, 8000);
      setTimeout(connect, retry);
    };
  }
  connect();

  // Public API for pages: window.ck.send({...})
  window.ck = {
    send: function (event) {
      try {
        navigator.sendBeacon(
          '/event?key=' + encodeURIComponent(KEY),
          new Blob([JSON.stringify(event)], { type: 'application/json' })
        );
      } catch (_) {
        fetch('/event?key=' + encodeURIComponent(KEY), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(event),
        });
      }
    },
  };

  // Any element carrying data-ck='{"...":...}' reports its payload on click.
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-ck]') : null;
    if (!el) return;
    var payload;
    try { payload = JSON.parse(el.dataset.ck); } catch (_) { payload = { raw: el.dataset.ck }; }
    window.ck.send(Object.assign({ type: 'click' }, payload));
    el.classList.add('ck-fired');
    setTimeout(function () { el.classList.remove('ck-fired'); }, 700);
  });
})();
</script>
`;

// ---------------------------------------------------------------- sse

const clients = new Set();

function broadcast(msg) {
  for (const res of clients) {
    try { res.write(`data: ${msg}\n\n`); } catch (_) { clients.delete(res); }
  }
}

let debounce = null;
fs.watch(contentDir, () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => broadcast('reload'), 120);
});

// ---------------------------------------------------------------- server

let lastActivity = Date.now();

const server = http.createServer((req, res) => {
  lastActivity = Date.now();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const given =
    url.searchParams.get('key') ||
    (/(?:^|; )ck_key=([^;]+)/.exec(req.headers.cookie || '') || [])[1];

  if (given !== key) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    return res.end('forbidden: missing or bad session key');
  }

  // --- live reload channel
  if (url.pathname === '/stream') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });
    res.write('retry: 1000\n\n');
    clients.add(res);
    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); } catch (_) {}
    }, 25000);
    req.on('close', () => { clearInterval(ping); clients.delete(res); });
    return;
  }

  // --- interaction capture
  if (url.pathname === '/event' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch (_) { parsed = { type: 'raw', body }; }
      parsed.at = new Date().toISOString();
      fs.appendFileSync(eventsFile, JSON.stringify(parsed) + '\n');
      res.writeHead(204).end();
    });
    return;
  }

  // --- static assets under content/
  if (url.pathname.startsWith('/files/')) {
    const rel = decodeURIComponent(url.pathname.slice('/files/'.length));
    const full = path.join(contentDir, rel);
    if (!full.startsWith(contentDir) || !fs.existsSync(full)) {
      return res.writeHead(404).end('not found');
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(full)] || 'application/octet-stream' });
    return fs.createReadStream(full).pipe(res);
  }

  // --- the canvas itself
  const file = newestHtml();
  if (!file) {
    res.writeHead(200, { 'content-type': MIME['.html'] });
    return res.end(
      `<body style="font:14px ui-monospace,monospace;padding:3rem;color:#888">` +
      `Waiting for the first screen…${HELPER}`
    );
  }
  let html = fs.readFileSync(file, 'utf8');
  html = html.includes('</body>')
    ? html.replace('</body>', HELPER + '</body>')
    : html + HELPER;
  res.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': 'no-store' });
  res.end(html);
});

server.listen(port, host, () => {
  const actual = server.address().port;
  const info = {
    type: 'server-started',
    pid: process.pid,
    port: actual,
    url: `http://${urlHost}:${actual}/?key=${key}`,
    project_dir: projectDir,
    session_dir: sessionDir,
    screen_dir: contentDir,
    state_dir: stateDir,
  };
  fs.writeFileSync(infoFile, JSON.stringify(info, null, 2));
  process.stdout.write(JSON.stringify(info) + '\n');

  if (flag('--open')) {
    const { spawn } = require('child_process');
    const cmd = process.platform === 'darwin' ? 'open'
      : process.platform === 'win32' ? 'start' : 'xdg-open';
    try { spawn(cmd, [info.url], { detached: true, stdio: 'ignore' }).unref(); } catch (_) {}
  }
});

// ---------------------------------------------------------------- lifecycle

setInterval(() => {
  if (Date.now() - lastActivity > idleMinutes * 60 * 1000) shutdown('idle');
}, 60 * 1000).unref();

function shutdown(why) {
  try { fs.writeFileSync(stoppedFile, JSON.stringify({ why, at: new Date().toISOString() })); } catch (_) {}
  try { fs.unlinkSync(infoFile); } catch (_) {}
  process.exit(0);
}

process.on('SIGINT', () => shutdown('sigint'));
process.on('SIGTERM', () => shutdown('sigterm'));
