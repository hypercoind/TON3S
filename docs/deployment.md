# Deployment Guide

> Legacy long-form guide. For modular operations docs, start at [Deployment and Operations](developers/deployment-and-operations.md).

This guide covers end-to-end deployment patterns for TON3S.

## Deployment Modes

1. Local/QA compose: `docker-compose.yml`
2. Internet-facing production: `docker-compose.yml` + `docker-compose.prod.yml`

## Local or QA Deployment

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
docker compose up -d --build
```

Open `http://localhost:3002`.

## Service Topology (Compose)

- `frontend` is published on host port `3002`.
- `backend` is internal-only (`expose: 3001`) and reached through frontend proxy paths.

Frontend forwards:

- `/api/*` -> backend
- `/ws/nostr` -> backend

## Useful Local Ops Commands

```bash
# Status
docker compose ps

# Logs
docker compose logs -f
docker compose logs -f frontend
docker compose logs -f backend

# Stop
docker compose down
```

## Health Checks

### Through frontend path

```bash
curl http://localhost:3002/api/info
```

### Directly inside backend container

```bash
docker compose exec backend wget -qO- http://127.0.0.1:3001/health
```

## Production Deployment (Caddy + TLS)

### 1. Prepare environment

```bash
cp .env.production.example .env.production
```

Set:

- `DOMAIN`
- `CADDY_EMAIL`

### 2. Deploy with overlay

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production up -d --build
```

Production overlay adds:

- `caddy` (TLS termination, cert management)
- restart policy and log rotation for app services
- backend `FRONTEND_URL=https://${DOMAIN}`

## Network and Firewall Guidance

Expose publicly only:

- `80/tcp`
- `443/tcp`
- `443/udp`

Important:

- base compose publishes `3002`,
- overlay cannot remove base `ports`,
- block public access to `3002` at firewall layer.

## Upgrade Procedure

```bash
cd TON3S
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production up -d --build
docker image prune -f
```

## Rollback Approach

1. Keep previous image layers available when possible.
2. Re-deploy previous known-good commit.
3. Verify `/api/info` and app load before reopening traffic.

## Troubleshooting

### Site is up but Nostr fails

- verify `/ws/nostr` upgrade forwarding in frontend/proxy chain,
- confirm backend process health.

### API 502/504 from proxy

- inspect backend logs,
- verify backend container health and network.

### TLS issues

- verify DNS `A` record,
- verify ports `80/443` reachable,
- inspect Caddy logs.

## Related Guides

- [Deployment and Operations](developers/deployment-and-operations.md)
- [Developer Troubleshooting](developers/troubleshooting.md)
- [Self-Hosting Guide](self-hosting.md)
