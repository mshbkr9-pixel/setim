#!/usr/bin/env bash
# Switches on voice logging for the "setim" app on srv1809211: puts the hook files next to PocketBase and restarts it.
# Run as root on the server, from a folder that holds pb_hooks/, pb_schema.py and voice_try.py (the server/ folder of the repo).
#
#   bash voice_setup.sh --try      starts a second, temporary PocketBase on 127.0.0.1:8099 with an empty data folder, creates the
#                                  collections in it, runs voice_try.py against it, and removes it. The live service is not touched.
#   bash voice_setup.sh            installs into /opt/pocketbase/pb_hooks, adds --hooksDir to the service once, restarts PocketBase.
#
# After the install, add the voice_keys collection to the live database (from any computer):
#   python -I -X utf8 pb_schema.py https://getonekeyai.com <admin email> '<admin password>'
# Rollback: rm /opt/pocketbase/pb_hooks/setim_voice.pb.js && systemctl restart pocketbase   (the app then shows the Siri part as not switched on)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/pb_hooks"
PB=/opt/pocketbase/pocketbase
FILES="setim_voice.pb.js setim_voice_lib.js voice.js exnames.json"
for f in $FILES; do test -f "$SRC/$f" || { echo "missing $SRC/$f (run python build.py on the computer first)"; exit 1; }; done
"$PB" serve --help | grep -q -- '--hooksDir' || { echo "this PocketBase build has no --hooksDir flag; stopping"; exit 1; }

if [ "${1:-}" = "--try" ]; then
  TMP="$(mktemp -d)"; PID=""
  cleanup() { [ -n "$PID" ] && kill "$PID" 2>/dev/null || true; rm -rf "$TMP"; }
  trap cleanup EXIT
  mkdir -p "$TMP/pb_hooks"; for f in $FILES; do cp "$SRC/$f" "$TMP/pb_hooks/"; done
  TRY_PW="$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20)"
  "$PB" superuser upsert try@example.test "$TRY_PW" --dir="$TMP/pb_data" >/dev/null
  "$PB" serve --http=127.0.0.1:8099 --dir="$TMP/pb_data" --hooksDir="$TMP/pb_hooks" >"$TMP/pb.log" 2>&1 &
  PID=$!
  for i in 1 2 3 4 5 6 7 8 9 10; do curl -fsS http://127.0.0.1:8099/api/health >/dev/null 2>&1 && break; sleep 1; done
  python3 -I -X utf8 "$HERE/pb_schema.py" http://127.0.0.1:8099 try@example.test "$TRY_PW"
  if python3 -I -X utf8 "$HERE/voice_try.py" http://127.0.0.1:8099; then echo "TRY: passed"; else echo "TRY: failed. PocketBase log:"; tail -n 40 "$TMP/pb.log"; exit 1; fi
  exit 0
fi

install -d -o root -g root -m 755 /opt/pocketbase/pb_hooks
for f in $FILES; do install -o root -g root -m 644 "$SRC/$f" /opt/pocketbase/pb_hooks/; done
UNIT=/etc/systemd/system/pocketbase.service
if ! grep -q -- '--hooksDir' "$UNIT"; then
  cp "$UNIT" "$UNIT.bak-$(date +%Y%m%d%H%M)"
  sed -i 's#--dir=/var/lib/pocketbase#--dir=/var/lib/pocketbase --hooksDir=/opt/pocketbase/pb_hooks#' "$UNIT"
  grep -q -- '--hooksDir=/opt/pocketbase/pb_hooks' "$UNIT" || { echo "could not add --hooksDir to $UNIT; nothing was restarted"; exit 1; }
  systemctl daemon-reload
fi
systemctl restart pocketbase
sleep 2; systemctl is-active pocketbase
curl -fsS http://127.0.0.1:8090/api/health; echo
curl -fsS http://127.0.0.1:8090/api/setim/voice; echo
systemctl is-active caddy pocketbase | tr '\n' ' '; echo
echo "done. next: pb_schema.py against the live address, then voice_try.py if you want a live check."
