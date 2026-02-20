# Deployment and Operations

## Deployment Modes

- Local compose: `docker-compose.yml`
- Production overlay: `docker-compose.prod.yml` + `.env.production`

Use local compose for dev/QA and production overlay for internet-facing deployments.

## Local Compose

```bash
docker compose up -d
```

Services:

- Frontend container exposed on host `3002`
- Backend container on internal network, port `3001`

## Production Compose with Caddy

1. Copy env template:

```bash
cp .env.production.example .env.production
```

2. Set values:

- `DOMAIN`
- `CADDY_EMAIL`

3. Deploy:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Caddy terminates TLS and reverse proxies to frontend container.

## Reverse Proxy and Security

- nginx in frontend container proxies `/api` and `/ws/nostr` to backend
- nginx sets CSP and security headers
- Caddy adds HSTS in production and manages certificates

## VPS Bootstrap Script

`scripts/vps-setup.sh` configures:

- Docker + Compose plugin
- Docker log rotation
- UFW rules (22/80/443)
- unattended upgrades

Run as root on supported Debian/Ubuntu hosts.

## Health and Logs

Health check:

```bash
curl http://localhost:3001/health
```

Logs:

```bash
docker compose logs -f
docker compose logs -f frontend
docker compose logs -f backend
```

## Kubernetes

Helm chart and templates are under `k8s/` for cluster-based deployment variants.

## Next Step

If deployments fail, continue with [Developer Troubleshooting](troubleshooting.md).
