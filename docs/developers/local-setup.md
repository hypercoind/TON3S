# Local Setup

## Prerequisites

### Docker Path (recommended for fastest setup)

- Docker
- Docker Compose plugin

### Native Development Path

- Node.js 22+
- npm
- Rust toolchain (`cargo`)
- `wasm-pack` (required by frontend `npm run dev` and `npm run build`)

Install `wasm-pack`:

```bash
cargo install wasm-pack
```

## Run with Docker

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
docker compose up --build -d
```

Endpoints:

- Frontend: `http://localhost:3002`
- Backend health: `http://localhost:3001/health`

## Run Natively

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

Endpoint:

- Frontend dev server: `http://localhost:3000`
- Vite proxy forwards `/api` and `/ws/nostr` to backend `http://localhost:3001`

## Core Commands

### Root

- `npm test`
- `npm run test:coverage`
- `npm run lint`
- `npm run lint:fix`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

### Backend

- `npm run dev`
- `npm start`
- `npm run test`

## Smoke Test Checklist

1. Open frontend and verify notes can be created and auto-saved.
2. Confirm backend health endpoint returns OK: `curl http://localhost:3001/health`.
3. Verify `/ws/nostr` upgrades successfully through the frontend path.

## Next Step

1. Read [System Architecture](system-architecture.md).
2. Then choose [Frontend Guide](frontend-guide.md) or [Backend Guide](backend-guide.md).
