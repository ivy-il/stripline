#!/bin/bash
# Installs a new site version (dist-hosting/stripline-app.tar.gz) and restarts the service.
#
#   Run as root:   bash update-app.sh <directadmin-user> [path to stripline-app.tar.gz]
#   (default archive: /home/<user>/stripline-app.tar.gz)
set -euo pipefail

DA_USER="${1:?Usage: bash update-app.sh <directadmin-user> [archive]}"
ARCHIVE="${2:-/home/$DA_USER/stripline-app.tar.gz}"
APP="/home/$DA_USER/stripline-app"

[ "$(id -u)" = 0 ] || { echo "Run as root."; exit 1; }
[ -f "$ARCHIVE" ] || { echo "Archive not found: $ARCHIVE"; exit 1; }

systemctl stop stripline || true
# Keep the ISR cache (pages already regenerated from WordPress); replace everything else.
find "$APP" -mindepth 1 -maxdepth 1 ! -name .next -exec rm -rf {} +
if [ -d "$APP/.next" ]; then find "$APP/.next" -mindepth 1 -maxdepth 1 ! -name cache -exec rm -rf {} +; fi
tar -xzf "$ARCHIVE" -C "$APP"
chown -R "$DA_USER:$DA_USER" "$APP"
systemctl start stripline

sleep 3
if curl -fsS -o /dev/null "http://127.0.0.1:$(systemctl show stripline -p Environment | grep -oE 'PORT=[0-9]+' | cut -d= -f2)/"; then
  echo "OK – the site answers. You can delete $ARCHIVE."
else
  echo "The site does not answer yet. Log: journalctl -u stripline -n 50"
fi
