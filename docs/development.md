# Development Guide

> Looking for modular developer docs? Start at [Developer Documentation](developers/README.md).

This legacy long-form guide covers local setup, workflow, testing, and debugging in one place.

## Prerequisites

### Recommended path (Docker)

- Docker
- Docker Compose plugin

### Native path (for fastest edit loop)

- Node.js 22+
- npm
- Rust toolchain (`cargo`)
- `wasm-pack` (required for frontend dev/build)

Install `wasm-pack`:

```bash
cargo install wasm-pack
```

## Local Run Modes

### Option A: Docker (full stack quickly)

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
docker compose up --build -d
```

Frontend is available at `http://localhost:3002`.

Logs:

```bash
docker compose logs -f
docker compose logs -f frontend
docker compose logs -f backend
```

Stop:

```bash
docker compose down
```

### Option B: Native (best DX)

Terminal 1:

```bash
cd frontend
npm install
npm run dev
```

Terminal 2:

```bash
cd backend
npm install
npm run dev
```

Frontend dev URL: `http://localhost:3000`

Backend dev URL: `http://localhost:3001`

## Core Commands

### Root

- `npm test`
- `npm run test:coverage`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

### Backend

- `npm run dev`
- `npm start`
- `npm run test`

## Project Layout

```text
frontend/
  src/
    components/
    services/
    state/
    utils/
    data/
    styles/
backend/
  src/
    routes/
    websocket/
    utils/
docs/
  users/
  developers/
k8s/
```

## Recommended Development Workflow

1. Create a focused branch.
2. Make minimal changes in the affected layer.
3. Run targeted tests first.
4. Run lint and full test suite.
5. Update docs for behavior/API/ops changes.

## Practical Verification Checklist

### Frontend changes

- note creation/edit/delete,
- search behavior,
- settings open/close,
- keyboard shortcuts,
- mobile layout sanity.

### Nostr changes

- connect/disconnect,
- publish kind 1 and kind 30023,
- relay status/error behavior.

### Media changes

- type validation,
- small file proxy upload,
- large file direct upload warning path.

### Backend changes

When running backend natively:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/info
curl http://localhost:3001/api/relays
```

When running via Docker Compose, use:

```bash
curl http://localhost:3002/api/info
docker compose exec backend wget -qO- http://127.0.0.1:3001/health
```

## Debugging Guide

### Frontend fails before Vite starts

- usually missing `wasm-pack`.

### Proxy connection issues

- confirm `/ws/nostr` path is reachable,
- verify reverse proxy websocket upgrade headers.

### CORS/origin failures

- check backend `FRONTEND_URL` and exact origin host.

### Upload proxy failures

- confirm Blossom URL is HTTPS and publicly reachable,
- confirm file is <= proxy limit for proxy path.

## Architecture Pointers

- Frontend state/events: `frontend/src/state/AppState.js`
- Frontend keyboard handling: `frontend/src/utils/keyboard.js`
- Nostr proxy backend: `backend/src/websocket/NostrProxy.js`
- SSRF validation: `backend/src/utils/ssrf.js`

## Related Guides

- [Local Setup](developers/local-setup.md)
- [System Architecture](developers/system-architecture.md)
- [Frontend Guide](developers/frontend-guide.md)
- [Backend Guide](developers/backend-guide.md)
- [Testing and Quality](developers/testing-and-quality.md)
