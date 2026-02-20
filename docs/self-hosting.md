# Self-Hosting Guide

> Legacy long-form guide. For modular operations docs, start at [Deployment and Operations](developers/deployment-and-operations.md).

Deploy TON3S on your own VPS with HTTPS.

## Prerequisites

- Linux VPS (Debian/Ubuntu recommended)
- Docker + Compose plugin
- Domain with DNS `A` record to server IP
- Open ports `80` and `443`

## Architecture

```text
Internet
  -> Caddy (TLS, domain routing)
    -> frontend container (nginx, app)
      -> backend container (Fastify, proxy/API)
        -> Nostr relays and Blossom hosts
```

## Step 1: Clone

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
```

## Step 2: Configure Production Env

```bash
cp .env.production.example .env.production
```

Set:

```env
DOMAIN=example.com
CADDY_EMAIL=ops@example.com
```

## Step 3: Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production up -d --build
```

## Step 4: Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production ps

curl https://example.com/api/info
```

## Firewall Hardening

Allow only SSH and web traffic:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Important:

- base compose maps frontend on host `3002`,
- ensure firewall blocks public access to `3002`.

## Optional Bootstrap Script

`./scripts/vps-setup.sh` automates common VPS setup tasks:

- Docker install,
- log rotation defaults,
- UFW baseline rules,
- unattended upgrades.

Review script before running on production systems.

## Update Workflow

```bash
cd TON3S
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production up -d --build
docker image prune -f
```

## Operational Checks

```bash
# App/API reachability
curl https://example.com/api/info

# Container logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production logs -f
```

## Common Failures

### Domain resolves but HTTPS fails

- confirm DNS propagation,
- confirm ports `80/443` reachable,
- inspect Caddy logs.

### UI loads but Nostr publish fails

- verify `/ws/nostr` websocket upgrade path,
- verify backend health.

### Upload proxy failures

- verify Blossom destination is valid HTTPS,
- inspect backend logs for SSRF/validation rejection.

## Related Guides

- [Deployment and Operations](developers/deployment-and-operations.md)
- [Developer Troubleshooting](developers/troubleshooting.md)
- [Privacy and Security](users/privacy-and-security.md)
