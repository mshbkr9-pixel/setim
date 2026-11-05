#!/usr/bin/env bash
# Second copy of PocketBase's nightly backups (optional safety layer).
# PocketBase itself already creates a backup every night at 03:30 UTC (settings.backups.cron, keeps 14) in
# /var/lib/pocketbase/backups. This installs a systemd timer (04:10 UTC) that copies those zips to /var/backups/pocketbase
# and keeps the newest 14 there, so a wipe of /var/lib/pocketbase does not take the backups with it. Same disk: not off-site.
# Run as root on srv1809211:  bash pb_backup_copy_setup.sh
set -euo pipefail
mkdir -p /var/backups/pocketbase; chmod 700 /var/backups/pocketbase
cat > /usr/local/bin/pocketbase-backup-copy.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
SRC=/var/lib/pocketbase/backups; DST=/var/backups/pocketbase
mkdir -p "$DST"
n=0; for f in "$SRC"/*.zip; do [ -e "$f" ] || continue; if [ ! -e "$DST/$(basename "$f")" ]; then cp -p "$f" "$DST/"; n=$((n+1)); fi; done
ls -1t "$DST"/*.zip 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "copied $n new; kept $(ls -1 "$DST"/*.zip 2>/dev/null | wc -l) in $DST ($(du -sh "$DST" | cut -f1))"
SH
chmod 755 /usr/local/bin/pocketbase-backup-copy.sh
cat > /etc/systemd/system/pocketbase-backup.service <<'UNIT'
[Unit]
Description=Copy PocketBase nightly backups to /var/backups/pocketbase (keep 14)
After=pocketbase.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/pocketbase-backup-copy.sh
UNIT
cat > /etc/systemd/system/pocketbase-backup.timer <<'UNIT'
[Unit]
Description=Nightly copy of PocketBase backups (04:10 UTC, after PocketBase's own 03:30 backup)

[Timer]
OnCalendar=*-*-* 04:10:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
UNIT
systemd-analyze verify /etc/systemd/system/pocketbase-backup.service /etc/systemd/system/pocketbase-backup.timer
systemctl daemon-reload
systemctl enable --now pocketbase-backup.timer
systemctl start pocketbase-backup.service
systemctl is-active pocketbase-backup.timer
ls -la /var/backups/pocketbase/
echo "next run: $(systemctl show pocketbase-backup.timer -p NextElapseUSecRealtime --value)"
# Restore (if ever needed): systemctl stop pocketbase; unzip -o <backup.zip> -d /var/lib/pocketbase/ ; chown -R pocketbase:pocketbase /var/lib/pocketbase; systemctl start pocketbase
