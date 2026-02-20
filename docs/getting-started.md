# Getting Started

> Looking for the modular docs experience? Start at [Documentation Hub](README.md).

This legacy long-form guide gives a full onboarding path for both users and developers.

## Choose Your Path

| Goal | Best path |
|---|---|
| Start writing immediately | [Use TON3S Online](#use-ton3s-online) |
| Run your own instance quickly | [Self-Host with Docker](#self-host-with-docker) |
| Contribute code locally | [Developer Setup](#developer-setup) |

## Use TON3S Online

1. Open [https://ton3s.com](https://ton3s.com).
2. Start typing in the editor.
3. Notes auto-save in your browser profile.

If this is your first session, export a JSON backup after creating notes.

## Self-Host with Docker

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
docker compose up -d
```

Open `http://localhost:3002`.

Stop services:

```bash
docker compose down
```

## Developer Setup

### Prerequisites

- Node.js 22+
- npm
- Docker + Docker Compose plugin (recommended path)
- Rust + `wasm-pack` (required for native frontend dev)

Install `wasm-pack` if you use native frontend workflow:

```bash
cargo install wasm-pack
```

### Option A: Docker Dev Stack (fastest start)

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
docker compose up --build -d
```

Open `http://localhost:3002`.

View logs:

```bash
docker compose logs -f
```

### Option B: Native Dev (best edit loop)

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

Open `http://localhost:3000`.

## Verify Your Setup

1. Create a note and confirm it remains after refresh.
2. Open settings and export JSON.
3. If backend is running, check health:

```bash
curl http://localhost:3001/health
```

Expected response includes `status: "ok"`.

## First 15-Minute Checklist

1. Create and rename notes.
2. Try search (`Cmd/Ctrl + K` or `Cmd/Ctrl + F`).
3. Rotate theme (`Cmd/Ctrl + T`).
4. Upload one small media file (`Cmd/Ctrl + Shift + U`).
5. Export JSON backup.

## Where to Go Next

- Users: [User Documentation](users/README.md)
- Developers: [Developer Documentation](developers/README.md)
- Deployment operators: [Deployment and Operations](developers/deployment-and-operations.md)
