# Deployment Guide

Deploy TON3S using Docker or manual setup.

## Quick Start (Docker)

The fastest way to deploy TON3S:

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
docker compose up -d
```

Access the app at `http://localhost:3002`

## Docker Compose Setup

### Default Configuration

The `docker-compose.yml` includes:

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3002:3000"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - ton3s

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ton3s

networks:
  ton3s:
    driver: bridge
```

### Port Configuration

| Service | Container Port | Host Port |
|---------|---------------|-----------|
| Frontend (nginx) | 3000 | 3002 |
| Backend (Fastify) | 3001 | 3001 |

To change host ports, modify the `ports` mapping:

```yaml
frontend:
  ports:
    - "8080:3000"  # Access at http://localhost:8080
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | production | Node environment |

## Docker Commands

### Basic Operations

```bash
# Start services (detached)
docker compose up -d

# Start with rebuild
docker compose up --build -d

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f frontend
docker compose logs -f backend

# Restart a service
docker compose restart frontend
```

### Health Checks

```bash
# Check service status
docker compose ps

# Check backend health
curl http://localhost:3001/health
```

### Debugging

```bash
# Shell into frontend container
docker compose exec frontend sh

# Shell into backend container
docker compose exec backend sh

# View nginx config
docker compose exec frontend cat /etc/nginx/conf.d/default.conf
```

## Manual Deployment

### Frontend (Static Files)

Build the frontend:

```bash
cd frontend
npm install
npm run build
```

The `dist/` folder contains static files that can be served by any web server.

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/ton3s;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # WebSocket proxy to backend
    location /ws/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/ton3s

    # Security headers
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"

    # SPA routing
    <Directory /var/www/ton3s>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # WebSocket proxy
    ProxyPass /ws/ ws://localhost:3001/ws/
    ProxyPassReverse /ws/ ws://localhost:3001/ws/
</VirtualHost>
```

### Backend (Node.js)

```bash
cd backend
npm install
npm start
```

For production, use a process manager:

#### Using PM2

```bash
npm install -g pm2

cd backend
pm2 start src/index.js --name ton3s-backend
pm2 save
pm2 startup
```

#### Using systemd

Create `/etc/systemd/system/ton3s-backend.service`:

```ini
[Unit]
Description=TON3S Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ton3s/backend
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ton3s-backend
sudo systemctl start ton3s-backend
```

## Reverse Proxy Setup

### Nginx (External)

If you have an external nginx handling SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name ton3s.example.com;

    ssl_certificate /etc/letsencrypt/live/ton3s.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ton3s.example.com/privkey.pem;

    # Proxy to Docker frontend
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ton3s.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Traefik

Add labels to `docker-compose.yml`:

```yaml
services:
  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ton3s.rule=Host(`ton3s.example.com`)"
      - "traefik.http.routers.ton3s.entrypoints=websecure"
      - "traefik.http.routers.ton3s.tls.certresolver=letsencrypt"
      - "traefik.http.services.ton3s.loadbalancer.server.port=3000"
```

### Caddy

```
ton3s.example.com {
    reverse_proxy localhost:3002
}
```

## SSL/TLS Setup

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d ton3s.example.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Self-Signed (Development)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/ton3s.key \
  -out /etc/ssl/certs/ton3s.crt
```

## Production Checklist

### Security

- [ ] HTTPS enabled with valid certificate
- [ ] Security headers configured
- [ ] Firewall rules in place (only 80/443 exposed)
- [ ] Docker containers run as non-root

### Performance

- [ ] Gzip compression enabled
- [ ] Static assets cached
- [ ] CDN configured (optional)

### Reliability

- [ ] Health checks configured
- [ ] Auto-restart on failure
- [ ] Logging configured
- [ ] Backups scheduled (if applicable)

### Monitoring

- [ ] Uptime monitoring
- [ ] Error logging
- [ ] Resource monitoring

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs frontend
docker compose logs backend

# Check if ports are in use
lsof -i :3001
lsof -i :3002
```

### Backend Unhealthy

```bash
# Test health endpoint
curl http://localhost:3001/health

# Check backend logs
docker compose logs backend

# Shell into container
docker compose exec backend sh
```

### WebSocket Connection Failed

1. Check backend is running and healthy
2. Verify WebSocket proxy configuration
3. Check firewall allows WebSocket connections
4. Ensure SSL termination handles WebSocket upgrade

### 502 Bad Gateway

1. Backend service may be down
2. Check nginx upstream configuration
3. Verify network connectivity between services

### Static Files Not Loading

1. Check nginx root directory
2. Verify build output exists
3. Check file permissions
4. Clear browser cache
