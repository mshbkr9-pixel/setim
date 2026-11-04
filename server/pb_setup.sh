#!/usr/bin/env bash
# Installs PocketBase (auth + per-user data for the "setim" gym app) on srv1809211 behind the existing Caddy.
# Run as root on the server:   PB_ADMIN_PASSWORD='...' bash pb_setup.sh
# What it does: system user `pocketbase`, binary in /opt/pocketbase, data in /var/lib/pocketbase,
# systemd service on 127.0.0.1:8090, one Caddy site block for https://setim.2-24-161-2.sslip.io (443, already open).
# Nothing of the trading robot, Algogo, nq1-tv-webhook (:80) or fail2ban is touched.
set -euo pipefail
: "${PB_ADMIN_PASSWORD:?set PB_ADMIN_PASSWORD}"
PB_ADMIN_EMAIL="${PB_ADMIN_EMAIL:-mshbkr9@gmail.com}"
HOST="setim.2-24-161-2.sslip.io"
VER="0.40.6"

id pocketbase >/dev/null 2>&1 || useradd --system --home /var/lib/pocketbase --shell /usr/sbin/nologin pocketbase
mkdir -p /opt/pocketbase /var/lib/pocketbase
cd /opt/pocketbase
if [ ! -x pocketbase ]; then
  curl -fsSL -o pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${VER}/pocketbase_${VER}_linux_amd64.zip"
  unzip -oq pb.zip pocketbase && rm -f pb.zip && chmod 755 pocketbase
fi
chown -R root:root /opt/pocketbase
chown -R pocketbase:pocketbase /var/lib/pocketbase

cat > /etc/systemd/system/pocketbase.service <<'UNIT'
[Unit]
Description=PocketBase (auth + data for the "setim" gym app)
After=network-online.target
Wants=network-online.target

[Service]
User=pocketbase
Group=pocketbase
WorkingDirectory=/var/lib/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=127.0.0.1:8090 --dir=/var/lib/pocketbase
Restart=always
RestartSec=3
LimitNOFILE=8192
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/pocketbase
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

su -s /bin/bash pocketbase -c "/opt/pocketbase/pocketbase superuser upsert '$PB_ADMIN_EMAIL' '$PB_ADMIN_PASSWORD' --dir=/var/lib/pocketbase" >/dev/null
systemctl daemon-reload
systemctl enable --now pocketbase
sleep 2; systemctl is-active pocketbase
curl -fsS http://127.0.0.1:8090/api/health; echo

if ! grep -q "$HOST" /etc/caddy/Caddyfile; then
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak-$(date +%Y%m%d%H%M)"
  cat >> /etc/caddy/Caddyfile <<'CADDY'

# "setim" gym app backend (PocketBase on 127.0.0.1:8090, user pocketbase, data in /var/lib/pocketbase).
# Public API: users sign up / sign in here from the app on GitHub Pages. No site password: PocketBase does its own auth.
setim.2-24-161-2.sslip.io {
	tls {
		issuer acme {
			disable_http_challenge
		}
	}
	encode zstd gzip
	reverse_proxy 127.0.0.1:8090
	header {
		Strict-Transport-Security "max-age=31536000"
		X-Content-Type-Options nosniff
		Referrer-Policy no-referrer
		-Server
	}
	log {
		output file /var/log/caddy/setim.log {
			roll_size 10MiB
			roll_keep 5
		}
	}
}
CADDY
  caddy validate --config /etc/caddy/Caddyfile >/dev/null
  systemctl reload caddy
  echo "caddy reloaded"
fi
sleep 8
curl -fsS "https://$HOST/api/health"; echo
systemctl is-active caddy pocketbase nq1-tv-webhook algogo | tr '\n' ' '; echo
echo "done. next: python -I -X utf8 pb_schema.py https://$HOST $PB_ADMIN_EMAIL '<password>'"
