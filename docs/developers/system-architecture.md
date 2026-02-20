# System Architecture

## High-Level Design

TON3S is split into two runtime layers:

1. Frontend SPA (`frontend/`) for editing, local storage, signing, and UX.
2. Backend (`backend/`) for privacy-preserving proxy features.

## Frontend Responsibilities

- Rich text editing and note management
- IndexedDB persistence via Dexie
- Theme/font/zen-mode UX state
- Nostr signing via extension or WASM signer
- Export/import, media orchestration, keyboard workflows

## Backend Responsibilities

- `GET /health`, `GET /api/info`, `GET /api/relays`
- `POST /api/media/upload` proxy for small Blossom uploads
- `GET /ws/nostr` WebSocket proxy for relay traffic
- CORS allowlist, rate limiting, multipart limits, security headers

## Data Flow: Note Lifecycle

1. User edits content in `Editor`.
2. State updates in `appState`.
3. Persistence happens through `StorageService` into IndexedDB.
4. Export/publish workflows read from state and storage.

## Data Flow: Nostr Publish Lifecycle

1. Client connects to backend proxy (`/ws/nostr`).
2. Backend validates origin, issues client session.
3. Proxy validates relay URLs (SSRF checks) before connecting.
4. Signed events are forwarded to selected relays.
5. Relay responses are returned to frontend as proxy messages.

## Security Boundaries

- Client-side signing keeps private key operations local.
- Backend blocks internal/private targets for relay and upload URLs.
- Message, queue, and relay connection limits protect proxy resources.
- nginx + backend set defensive headers.
