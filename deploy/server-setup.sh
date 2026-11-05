#!/bin/bash
# One-time setup of the STRIPLINE Next.js site on a DirectAdmin server without CloudLinux "Setup Node.js App".
# Installs Node.js 22 and a systemd service that runs the site on 127.0.0.1:<port> as the DirectAdmin user;
# Apache then proxies stripline.co.il to it (see DEPLOY-DIRECTADMIN.md, section ג).
#
#   Run as root:   bash server-setup.sh <directadmin-user> [port]
set -euo pipefail

DA_USER="${1:?Usage: bash server-setup.sh <directadmin-user> [port]}"
PORT="${2:-3000}"
APP="/home/$DA_USER/stripline-app"

[ "$(id -u)" = 0 ] || { echo "Run as root."; exit 1; }
id "$DA_USER" >/dev/null 2>&1 || { echo "No such user: $DA_USER"; exit 1; }

# Node 22 needs glibc 2.28+ (CentOS 7 is too old).
GLIBC=$(ldd --version | head -1 | grep -oE '[0-9]+\.[0-9]+$')
if [ "$(printf '%s\n2.28\n' "$GLIBC" | sort -V | head -1)" != "2.28" ]; then
  echo "glibc $GLIBC is older than 2.28 – this OS cannot run Node 20+. Upgrade the OS first."; exit 1
fi

node_major() { command -v node >/dev/null && node -p 'process.versions.node.split(".")[0]' || echo 0; }
if [ "$(node_major)" -lt 20 ]; then
  echo "Installing Node.js 22 …"
  if command -v dnf >/dev/null || command -v yum >/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    if command -v dnf >/dev/null; then dnf -y install nodejs; else yum -y install nodejs; fi
  elif command -v apt-get >/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  else
    echo "Unknown package manager – install Node.js 22 manually and run again."; exit 1
  fi
fi
NODE=$(command -v node)
echo "Node: $($NODE -v) at $NODE"

mkdir -p "$APP"
chown "$DA_USER:$DA_USER" "$APP"

cat > /etc/systemd/system/stripline.service <<EOF
[Unit]
Description=STRIPLINE Next.js site
After=network.target

[Service]
Type=simple
User=$DA_USER
Group=$DA_USER
WorkingDirectory=$APP
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOSTNAME=127.0.0.1
ExecStart=$NODE server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable stripline >/dev/null

echo
echo "Web server: $(grep -E '^webserver=' /usr/local/directadmin/custombuild/options.conf 2>/dev/null || echo unknown)"
if command -v httpd >/dev/null; then
  httpd -M 2>/dev/null | grep -q proxy_http_module && echo "Apache mod_proxy_http: OK" || echo "WARNING: Apache mod_proxy_http is not loaded."
fi

if [ -f "$APP/server.js" ]; then
  systemctl restart stripline
  echo "Service started: systemctl status stripline"
else
  echo "Service installed. Next: upload stripline-app.tar.gz to /home/$DA_USER/ and run update-app.sh."
fi
