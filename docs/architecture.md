# Architecture

> Looking for modular developer docs? Start at [System Architecture](developers/system-architecture.md).

This legacy long-form guide provides a complete architecture narrative for TON3S.

## Goals

TON3S is designed to balance:

- local-first writing,
- optional decentralized publishing,
- strong privacy defaults,
- simple deployability.

## High-Level Topology

```text
Browser (Frontend SPA)
  - Editor, notes, settings, local persistence
  - Optional Nostr signing and publishing
  - Media orchestration
        |
        | HTTP + WebSocket
        v
Backend (Fastify)
  - /health, /api/info, /api/relays
  - /api/media/upload (small-file proxy)
  - /ws/nostr (relay proxy)
        |
        +--> Nostr relays
        +--> Blossom servers
```

## Frontend Architecture

### Layering

`frontend/src/` is organized into:

- `components/`: UI rendering and DOM events
- `services/`: IO/business logic boundaries
- `state/`: centralized app state and events
- `utils/`: markdown/sanitization/keyboard utilities
- `data/`: static theme/font catalogs
- `styles/`: modular CSS

### Core Components

- `Header`: notes and Nostr panel toggles, theme/font rotation
- `Sidebar`: note list, search, tagging, note actions
- `Editor`: contenteditable writing surface and media insertion
- `StatusBar`: counts and settings modal (import/export/clear)
- `NostrPanel`: signer connection and publish actions
- `DonationPanel`: support links and QR display
- `Toast`: user notifications

### Services (Frontend)

- `StorageService`: IndexedDB persistence and settings
- `NostrAuthService`: extension/local key signing
- `NostrService`: proxy socket lifecycle + publish pipeline
- `ExportService`: JSON/Markdown import/export
- `BlossomService`: upload transport choice (proxy/direct)
- `MediaService`: file validation, upload orchestration

### State Model

`AppState` keeps normalized state for:

- notes and current note,
- settings (theme/font/zen/panel states),
- Nostr session state,
- media upload state,
- UI state (search/save/mobile page).

State updates emit events, and components reactively update.

## Backend Architecture

### Runtime

- Fastify server
- WebSocket handling via `@fastify/websocket`
- Multipart handling via `@fastify/multipart`
- CORS + request rate limiting

### HTTP Endpoints

- `GET /health`
- `GET /api/info`
- `GET /api/relays`
- `POST /api/media/upload`

### WebSocket Endpoint

- `GET /ws/nostr` (upgrade)

Used by browser client for relay management and event forwarding.

## Nostr Proxy Protocol

Client -> proxy:

- `['CONNECT', relayUrl]`
- `['DISCONNECT', relayUrl]`
- `['SEND', relayUrl, relayMessage]`
- `['BROADCAST', relayMessage]`

Proxy -> client:

- `['RELAY_STATUS', relayUrl, status, optionalError]`
- `['RELAY_MESSAGE', relayUrl, message]`
- `['ERROR', message]`

## Key Data Flows

### Local Note Flow

1. User edits in `Editor`.
2. Component updates `AppState`.
3. `StorageService` persists to IndexedDB.
4. UI subscribers update counts/list/state indicators.

### Publish Flow

1. User connects signer in `NostrPanel`.
2. `NostrService` opens proxy socket (`/ws/nostr`).
3. Client signs event locally.
4. Event is sent via proxy to relays.
5. Relay status/messages stream back to client.

### Media Flow

1. File validated in `MediaService`.
2. `BlossomService` chooses path:
   - `<= 10 MB` via backend proxy,
   - `> 10 MB` direct to Blossom.
3. Descriptor returned and embedded in note.

## Security Boundaries

### Frontend

- local-first storage,
- sanitized note HTML rendering,
- no account requirement.

### Backend

- strict WebSocket origin validation,
- SSRF-safe relay/upload URL checks,
- private IP and metadata endpoint blocking,
- per-client limits for message size/rate/queue/relay count.

### Privacy

- Nostr relay traffic is proxied to hide client IP from relays.
- Direct large-file uploads expose client IP to chosen Blossom server.

## Deployability

### Local

- Docker Compose serves frontend at `http://localhost:3002`
- Native dev uses frontend `http://localhost:3000` and backend `http://localhost:3001`

### Production

- Compose production overlay adds Caddy for TLS and domain routing
- Frontend reverse-proxies `/api` and `/ws/nostr` to backend

## Extension Points

Typical ways to extend TON3S:

1. Add UI behavior in `components/` + state events.
2. Add integrations in `services/`.
3. Add backend endpoint or proxy policy in `backend/src/`.
4. Add tests and docs with every behavior change.

## Related Guides

- [System Architecture](developers/system-architecture.md)
- [Frontend Guide](developers/frontend-guide.md)
- [Backend Guide](developers/backend-guide.md)
- [Testing and Quality](developers/testing-and-quality.md)
