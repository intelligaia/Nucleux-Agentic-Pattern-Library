#!/usr/bin/env bash
# Run the Nucleux pattern-library regression suites.
#
#   ./_tests/run.sh              all twelve suites
#   ./_tests/run.sh ms.test.js   one suite
#   ./_tests/run.sh probes/spark.js
#
# Starts its own static server on 8901 and stops it on the way out.
# The server dies easily — if a suite reports a blank page, re-run.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE="$(dirname "$HERE")"
PORT="${PORT:-8901}"

# Resolve the headless browser and playwright-core wherever this
# container happens to have put them, rather than trusting the
# version-stamped path a previous session saw.
if [ -z "${CHROME:-}" ]; then
  CHROME="$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1)"
fi
if [ -z "${PW:-}" ]; then
  for c in /opt/node-tools/node_modules/playwright-core \
           /usr/lib/node_modules/playwright-core; do
    [ -d "$c" ] && PW="$c" && break
  done
fi
export CHROME PW
if [ ! -x "${CHROME:-}" ]; then echo "no chromium found — set CHROME=" >&2; exit 2; fi
if [ ! -d "${PW:-}" ]; then echo "no playwright-core found — set PW=" >&2; exit 2; fi

# Only stop the server if this script is the one that started it —
# otherwise a single-suite run tears down the server a parallel
# session is using.
MINE=0
curl -s -o /dev/null "http://127.0.0.1:$PORT/" || {
  ( cd "$SITE" && nohup python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 & )
  MINE=1; sleep 2
}
trap '[ "$MINE" = 1 ] && pkill -f "http.server $PORT" 2>/dev/null; true' EXIT

SUITES=(ms.test.js mssim.test.js kb12.test.js kbsim3.test.js conn.js
        connsim2.test.js mcp.js disc.js toolbar.js modstate.js dline.js onb.js)

run () {
  local f="$1" path="$HERE/suites/$1"
  [ -f "$path" ] || path="$HERE/$1"
  echo "── $f"
  ( cd "$HERE" && node "$path" 2>&1 | tail -6 )
}

if [ $# -gt 0 ]; then for f in "$@"; do run "$f"; done
else for f in "${SUITES[@]}"; do run "$f"; done; fi
