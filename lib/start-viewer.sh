#!/usr/bin/env bash
# Start the C-K viewer for a project, or report the one already running.
# Prints the server-info JSON on stdout either way.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(pwd)"
EXTRA=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    *) EXTRA+=("$1"); shift ;;
  esac
done

STATE_DIR="$PROJECT_DIR/.ck/viewer/state"
INFO="$STATE_DIR/server-info"

# Already up? Reuse it — the user's tab stays valid.
if [[ -f "$INFO" ]]; then
  # Read it as JSON, not as a module: the file has no extension, so require() would
  # hand it to the .js loader and throw on the first colon.
  PID="$(node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).pid))" "$INFO" 2>/dev/null || echo "")"
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    cat "$INFO"
    exit 0
  fi
  rm -f "$INFO"
fi

mkdir -p "$STATE_DIR"
LOG="$STATE_DIR/server.log"

nohup node "$HERE/ck-server.cjs" --project-dir "$PROJECT_DIR" "${EXTRA[@]+"${EXTRA[@]}"}" \
  >"$LOG" 2>&1 &

# Wait for the server to announce itself.
for _ in $(seq 1 50); do
  [[ -f "$INFO" ]] && { cat "$INFO"; exit 0; }
  sleep 0.1
done

echo "ck-server failed to start; log follows:" >&2
cat "$LOG" >&2
exit 1
