#!/usr/bin/env bash
# vps-setup.sh — Idempotent VPS bootstrap for TON3S production deployment
# Tested on: Ubuntu 22.04 / Debian 12
#
# Usage: curl -sSL <raw-url> | sudo bash
#   or:  sudo bash scripts/vps-setup.sh

set -euo pipefail

# --- Helpers ---
info()  { printf '\033[1;34m[INFO]\033[0m  %s\n' "$*"; }
ok()    { printf '\033[1;32m[OK]\033[0m    %s\n' "$*"; }
warn()  { printf '\033[1;33m[WARN]\033[0m  %s\n' "$*"; }

if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root (sudo)." >&2
    exit 1
fi

# --- 1. Docker ---
if command -v docker &>/dev/null; then
    ok "Docker already installed: $(docker --version)"
else
    info "Installing Docker..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    ok "Docker installed: $(docker --version)"
fi

# Compose plugin check
if docker compose version &>/dev/null; then
    ok "Docker Compose plugin: $(docker compose version --short)"
else
    warn "Docker Compose plugin not found — install manually"
fi

# --- 2. Docker daemon log rotation ---
DAEMON_JSON="/etc/docker/daemon.json"
if [[ -f "$DAEMON_JSON" ]] && grep -q '"max-size"' "$DAEMON_JSON"; then
    ok "Docker daemon log rotation already configured"
else
    info "Configuring Docker daemon log rotation..."
    cat > "$DAEMON_JSON" <<'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF
    systemctl restart docker
    ok "Docker daemon log rotation configured"
fi

# --- 3. UFW Firewall ---
if command -v ufw &>/dev/null; then
    info "Configuring UFW firewall..."
    ufw allow 22/tcp comment "SSH"
    ufw allow 80/tcp comment "HTTP"
    ufw allow 443/tcp comment "HTTPS"
    ufw --force enable
    ok "UFW enabled: SSH(22), HTTP(80), HTTPS(443) only"
else
    info "Installing UFW..."
    apt-get install -y -qq ufw
    ufw allow 22/tcp comment "SSH"
    ufw allow 80/tcp comment "HTTP"
    ufw allow 443/tcp comment "HTTPS"
    ufw --force enable
    ok "UFW installed and enabled"
fi

# --- 4. Unattended upgrades ---
if dpkg -l unattended-upgrades &>/dev/null 2>&1; then
    ok "Unattended upgrades already installed"
else
    info "Installing unattended-upgrades..."
    apt-get install -y -qq unattended-upgrades
    dpkg-reconfigure -f noninteractive unattended-upgrades
    ok "Unattended upgrades enabled"
fi

# --- Done ---
echo
info "========================================="
info "  VPS setup complete!"
info "========================================="
echo
info "Next steps:"
info "  1. Clone the repo:      git clone <repo-url> && cd TON3S"
info "  2. Configure env:       cp .env.production.example .env.production"
info "  3. Edit .env.production: set DOMAIN and CADDY_EMAIL"
info "  4. Deploy:"
info "     docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build"
echo
info "Caddy will auto-provision a Let's Encrypt certificate for your domain."
info "Ensure DNS A record points to this server's IP before deploying."
