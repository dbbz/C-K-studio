#!/usr/bin/env bash
# Stop the C-K viewer. Rendered screens and session state are left in place.
set -euo pipefail

PROJECT_DIR="$(pwd)"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    *) PROJECT_DIR="$1"; shift ;;
  esac
done

INFO="$PROJECT_DIR/.ck/viewer/state/server-info"

if [[ ! -f "$INFO" ]]; then
  echo "no viewer running for $PROJECT_DIR"
  exit 0
fi

PID="$(node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).pid))" "$INFO")"
kill "$PID" 2>/dev/null || true

for _ in $(seq 1 20); do
  kill -0 "$PID" 2>/dev/null || { echo "viewer stopped (pid $PID)"; exit 0; }
  sleep 0.1
done

kill -9 "$PID" 2>/dev/null || true
echo "viewer force-stopped (pid $PID)"
