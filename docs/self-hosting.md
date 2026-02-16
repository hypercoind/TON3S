# Self-Hosting Guide

Deploy TON3S on a VPS with Docker and Caddy for automatic HTTPS.

## Prerequisites

- A VPS (Ubuntu 22.04+ recommended) with Docker and Docker Compose installed
- A domain name pointing to your server's IP address
- Ports 80 and 443 open on your firewall

## Architecture

```
Internet → Caddy (auto-TLS, ports 80/443)
              → frontend (nginx, port 3000)
                  → backend (Fastify, port 3001)
                      → Nostr relays
```

Caddy handles TLS certificate provisioning via Let's Encrypt and reverse-proxies to the frontend nginx container, which in turn proxies `/ws/nostr` and `/api/*` requests to the backend.

## Configuration

### 1. Clone the repository

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
```

### 2. Create production environment file

```bash
cp .env.production.example .env.production
```

Edit `.env.production` with your domain and email:

```env
DOMAIN=yourdomain.com
CADDY_EMAIL=you@yourdomain.com
```

The `DOMAIN` is used by Caddy for automatic Let's Encrypt certificate provisioning. The `CADDY_EMAIL` receives certificate expiration notices.

### 3. Review the Caddyfile

The included `Caddyfile` provides:

- Automatic HTTPS via Let's Encrypt
- HSTS headers (`max-age=63072000; includeSubDomains; preload`)
- `www.` redirect to bare domain

```
{
    email {$CADDY_EMAIL}
}

{$DOMAIN} {
    reverse_proxy frontend:3000
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    }
}

www.{$DOMAIN} {
    redir https://{$DOMAIN}{uri} permanent
}
```

## Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production up -d --build
```

This starts three containers:

| Container | Role |
|-----------|------|
| `caddy` | TLS termination, reverse proxy (ports 80, 443) |
| `frontend` | nginx serving the built SPA (internal port 3000) |
| `backend` | Fastify API + WebSocket Nostr proxy (internal port 3001) |

Verify the deployment:

```bash
# Check all containers are running
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production ps

# Check backend health
curl https://yourdomain.com/health
```

## Firewall

Only ports 80 (HTTP) and 443 (HTTPS) should be exposed to the internet. The base `docker-compose.yml` also exposes port 3002 (frontend) and 3001 (backend) on the host. Block these from external access with UFW:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Updating

```bash
cd TON3S
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production up -d --build
docker image prune -f
```

## Monitoring

### View logs

```bash
# All services
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production logs -f

# Single service
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production logs -f caddy
```

### Log rotation

The production compose file configures JSON file logging with rotation:

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

Each container keeps at most 30MB of logs (3 files x 10MB).

### Health check

The backend container has a built-in health check that polls `/health` every 30 seconds. The frontend container depends on the backend being healthy before starting.

## Troubleshooting

### Certificate not provisioning

- Ensure your domain's DNS A record points to your server's IP
- Ensure ports 80 and 443 are open (Caddy needs both for ACME challenges)
- Check Caddy logs: `docker compose ... logs caddy`

### 502 Bad Gateway

- The backend may still be starting. Wait for the health check to pass.
- Check backend logs: `docker compose ... logs backend`

### WebSocket connection failed

- Verify the frontend nginx config proxies `/ws/nostr` to the backend
- Check that no external firewall is blocking WebSocket upgrades on port 443

## See Also

- [Deployment Guide](deployment.md) - Docker basics, manual setup, reverse proxy options
- [Development Guide](development.md) - Local development workflow
