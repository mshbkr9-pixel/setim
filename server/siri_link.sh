#!/usr/bin/env bash
# Sets the link of the shared Siri shortcut that the app's "הוספת Siri" button opens. Run as root on srv1809211.
#   bash siri_link.sh 'https://www.icloud.com/shortcuts/<id>'    sets it; the button starts working for everyone
#   bash siri_link.sh --clear                                   back to "not yet" (the app shows that adding opens soon)
# The link lives next to the hook, in /opt/pocketbase/pb_hooks/siri.json. PocketBase watches that folder and restarts by
# itself when a file in it changes (about two seconds), so there is nothing else to restart. The previous file is kept in /root.
set -euo pipefail
DIR=/opt/pocketbase/pb_hooks
F="$DIR/siri.json"
LINK="${1:-}"
if [ "$LINK" = "--clear" ]; then LINK=""
elif ! printf '%s' "$LINK" | grep -Eq '^https://www\.icloud\.com/shortcuts/[0-9a-zA-Z]{16,64}/?$'; then echo "not an iCloud shortcut link: '$LINK'"; exit 1; fi
test -f "$DIR/setim_voice.pb.js" || { echo "the voice hook is not installed in $DIR"; exit 1; }
if [ -f "$F" ]; then cp -a "$F" "/root/siri-link-before-$(date +%Y%m%d%H%M%S).json"; fi
printf '{"shortcut": "%s"}\n' "$LINK" > "$DIR/.siri.json.tmp"
chmod 644 "$DIR/.siri.json.tmp"; chown root:root "$DIR/.siri.json.tmp"
mv "$DIR/.siri.json.tmp" "$F"
R=""
for i in $(seq 1 20); do
  sleep 1
  R="$(curl -fsS http://127.0.0.1:8090/api/setim/voice 2>/dev/null || true)"
  case "$R" in *"\"shortcut\":\"$LINK\""*) echo "ok: $R"; exit 0;; esac
done
echo "PocketBase does not show the new link yet. Last answer: '$R'. Look at: journalctl -u pocketbase -n 30"
exit 1
