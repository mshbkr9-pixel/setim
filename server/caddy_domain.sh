#!/usr/bin/env bash
# Adds the getonekeyai.com site to Caddy: static app from /opt/setim/app, PocketBase API + admin proxied on the same host.
# Run as root on srv1809211:  bash caddy_domain.sh
set -euo pipefail
mkdir -p /opt/setim/app
if ! grep -q "^getonekeyai.com" /etc/caddy/Caddyfile; then
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak-$(date +%Y%m%d%H%M)"
  cat >> /etc/caddy/Caddyfile <<'CADDY'

# "setim" gym app on the user's own domain: static files from /opt/setim/app, PocketBase (127.0.0.1:8090) on the same
# host under /api/* and /_/* (admin UI). DNS-only records at Cloudflare, so the certificate is issued here (TLS-ALPN).
www.getonekeyai.com {
	tls {
		issuer acme {
			disable_http_challenge
		}
	}
	redir https://getonekeyai.com{uri} permanent
}
getonekeyai.com {
	tls {
		issuer acme {
			disable_http_challenge
		}
	}
	encode zstd gzip
	handle /api/* {
		reverse_proxy 127.0.0.1:8090
	}
	handle /_/* {
		reverse_proxy 127.0.0.1:8090
	}
	handle {
		root * /opt/setim/app
		file_server
	}
	@fresh path / /index.html /sw.js /manifest.json
	header @fresh Cache-Control "no-cache"
	header /data/* Cache-Control "public, max-age=86400"
	header /icons/* Cache-Control "public, max-age=604800"
	header {
		Strict-Transport-Security "max-age=31536000"
		X-Content-Type-Options nosniff
		Referrer-Policy no-referrer
		-Server
	}
	log {
		output file /var/log/caddy/getonekeyai.log {
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
chown -R root:root /opt/setim
systemctl is-active caddy pocketbase | tr '\n' ' '; echo
