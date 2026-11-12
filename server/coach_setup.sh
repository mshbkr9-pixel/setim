#!/usr/bin/env bash
# Switches on the coach of the "setim" app on srv1809211: puts the hook files next to PocketBase, gives PocketBase the Claude API
# key through its environment, and restarts it. Run as root on the server, from a folder that holds pb_hooks/, pb_schema.py and
# coach_try.py (the server/ folder of the repo), after `python build_food.py && python build.py` on the computer.
#
#   bash coach_setup.sh --try      starts a second, temporary PocketBase on 127.0.0.1:8099 with an empty data folder and the hook
#                                  pointed at a stand-in for the Claude API (inside coach_try.py), creates the collections in it,
#                                  runs coach_try.py against it (twice: the second pass checks that the day's spending is still
#                                  counted after the person who spent it deleted the account), and removes it. The live service
#                                  is not touched and nothing is spent: no request leaves the server.
#   bash coach_setup.sh            installs into /opt/pocketbase/pb_hooks, adds the key file to the service once, restarts
#                                  PocketBase. If it is not healthy within 15 seconds, the hook is taken out again and PocketBase
#                                  is started without it.
#
# The key is never in this folder or in the repo. It lives in /etc/setim/coach.env on the server (root only, mode 600), one line:
#   ANTHROPIC_API_KEY=sk-ant-...
# systemd reads that file as root and hands the variable to PocketBase; the hook reads it with $os.getenv. Without the file the
# coach answers "not switched on" and the app keeps answering what it can by itself.
#
# After the install, add the coach_usage collection to the live database (from any computer), touching nothing else:
#   python -I -X utf8 pb_schema.py https://getonekeyai.com <admin email> '<admin password>' coach_usage
# Without that collection the coach refuses to call the model (it will not spend what it cannot count).
# Knobs (models, score cuts, limits per person, the daily budget): /opt/pocketbase/pb_hooks/coach.json. A later install does not
# overwrite it. Rollback: rm /opt/pocketbase/pb_hooks/setim_coach.pb.js && systemctl restart pocketbase
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/pb_hooks"
PB=/opt/pocketbase/pocketbase
FILES="setim_coach.pb.js setim_coach_lib.js coach.js coach_catalog.json coach.json"
for f in $FILES; do test -f "$SRC/$f" || { echo "missing $SRC/$f (run python build_food.py and python build.py on the computer first)"; exit 1; }; done
"$PB" serve --help | grep -q -- '--hooksDir' || { echo "this PocketBase build has no --hooksDir flag; stopping"; exit 1; }
healthy() { for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do curl -fsS "http://127.0.0.1:$1/api/health" >/dev/null 2>&1 && return 0; sleep 1; done; return 1; }

if [ "${1:-}" = "--try" ]; then
  TMP="$(mktemp -d)"; PID=""
  cleanup() { [ -n "$PID" ] && kill "$PID" 2>/dev/null || true; sleep 1; rm -rf "$TMP"; }
  trap cleanup EXIT
  mkdir -p "$TMP/pb_hooks"; for f in $FILES; do cp "$SRC/$f" "$TMP/pb_hooks/"; done
  # the try-out answers come from coach_try.py on 127.0.0.1:8098, and the limits are small so that stepping down can be seen
  printf '{"apiUrl":"http://127.0.0.1:8098/v1/messages","perUser":{"cheap":3,"smart":1,"deep":1,"img":1},"dailyUsd":3}\n' > "$TMP/pb_hooks/coach.json"
  TRY_PW="$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20)"
  "$PB" superuser upsert try@example.test "$TRY_PW" --dir="$TMP/pb_data" >/dev/null
  ANTHROPIC_API_KEY=try-key "$PB" serve --http=127.0.0.1:8099 --dir="$TMP/pb_data" --hooksDir="$TMP/pb_hooks" --hooksWatch=false >"$TMP/pb.log" 2>&1 &
  PID=$!
  healthy 8099 || { echo "TRY: the temporary PocketBase did not start. Its log:"; tail -n 40 "$TMP/pb.log"; exit 1; }
  python3 -I -X utf8 "$HERE/pb_schema.py" http://127.0.0.1:8099 try@example.test "$TRY_PW"
  if python3 -I -X utf8 "$HERE/coach_try.py" http://127.0.0.1:8099 8098; then echo "TRY: passed"; else echo "TRY: failed. PocketBase log:"; tail -n 40 "$TMP/pb.log"; exit 1; fi
  # The person who just spent has deleted the account. With a daily budget smaller than that spending, the next person must be
  # refused: the day's count has to outlive the account. The hook reads coach.json on every request, so no restart is needed.
  printf '{"apiUrl":"http://127.0.0.1:8098/v1/messages","dailyUsd":0.000001}\n' > "$TMP/pb_hooks/coach.json"
  if python3 -I -X utf8 "$HERE/coach_try.py" http://127.0.0.1:8099 8098 --spent; then echo "TRY: the daily budget outlives a deleted account"; else echo "TRY: failed. PocketBase log:"; tail -n 40 "$TMP/pb.log"; exit 1; fi
  exit 0
fi

grep -q -- '--hooksDir=/opt/pocketbase/pb_hooks' /etc/systemd/system/pocketbase.service || { echo "PocketBase does not run with --hooksDir yet: install the voice hook first (voice_setup.sh)"; exit 1; }
DROP=/etc/systemd/system/pocketbase.service.d/coach.conf
if [ ! -f "$DROP" ]; then
  install -d -o root -g root -m 755 /etc/systemd/system/pocketbase.service.d
  printf '[Service]\n# the Claude API key for the coach of the setim app; the file is optional, and without it the coach stays off\nEnvironmentFile=-/etc/setim/coach.env\n' > "$DROP"
  systemctl daemon-reload
fi
if [ -f /etc/setim/coach.env ]; then chown root:root /etc/setim/coach.env; chmod 600 /etc/setim/coach.env; else echo "note: /etc/setim/coach.env is not there yet. The coach will answer \"not switched on\" until it holds ANTHROPIC_API_KEY=..."; fi
install -d -o root -g root -m 755 /opt/pocketbase/pb_hooks
for f in $FILES; do
  # the knobs are tuned on the server; a new install must not put the repo's defaults over them
  if [ "$f" = coach.json ] && [ -f /opt/pocketbase/pb_hooks/coach.json ]; then continue; fi
  install -o root -g root -m 644 "$SRC/$f" /opt/pocketbase/pb_hooks/
done
systemctl restart pocketbase
if ! healthy 8090 || ! curl -fsS http://127.0.0.1:8090/api/setim/coach >/dev/null 2>&1 || ! curl -fsS http://127.0.0.1:8090/api/setim/voice >/dev/null 2>&1; then
  echo "PocketBase is not healthy with the coach hook. Taking it out."
  journalctl -u pocketbase -n 25 --no-pager || true
  rm -f /opt/pocketbase/pb_hooks/setim_coach.pb.js
  systemctl restart pocketbase
  healthy 8090 && echo "PocketBase is back, without the coach hook." || echo "PocketBase is still down: look at journalctl -u pocketbase"
  exit 1
fi
systemctl is-active pocketbase
curl -fsS http://127.0.0.1:8090/api/health; echo
curl -fsS http://127.0.0.1:8090/api/setim/coach; echo
systemctl is-active caddy pocketbase | tr '\n' ' '; echo
echo "done. next: pb_schema.py ... coach_usage against the live address (see the top of this file)."
