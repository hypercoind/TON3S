# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start for AI Sessions

**Read [`docs/CHECKPOINT.md`](docs/CHECKPOINT.md) first** — it has the complete module inventory, state events (26 types), storage schema, API endpoints, WebSocket protocol, security details, and dependency versions. This file covers patterns, commands, and gotchas needed to develop effectively.

## Project Overview

TON3S is a privacy-focused writing app: Vite 6 frontend (vanilla JS + Rust WASM) with Fastify 5 backend serving as a Nostr relay WebSocket proxy. IndexedDB via Dexie for local storage, 72 themes, 27 fonts, PWA support.

## Development Commands

### Docker (primary workflow)

```bash
docker compose up --build -d     # Build and start
docker compose down              # Stop
docker compose logs -f           # Logs
docker image prune -f            # Clean old images after rebuilds
```

Ports: Frontend 3002, Backend 3001, Vite Dev 3000

### Frontend

```bash
cd frontend
npm run dev                      # Vite dev server (localhost:3000, proxies /ws/nostr and /api to backend)
npm run build                    # Production build (includes wasm:build)
npm run test                     # Run all frontend tests
npm run test:watch               # Watch mode
npm run test:coverage            # Coverage report (threshold: 30%)
npx vitest run src/utils/__tests__/sanitizer.test.js  # Single test file
```

### Backend

```bash
cd backend
npm start                        # Production (port 3001)
npm run dev                      # Dev with --watch
npm run test                     # Run all backend tests
npm run test:coverage            # Coverage report (threshold: 50%)
```

### Root (monorepo scripts)

```bash
npm test                         # All tests (frontend + backend)
npm run lint                     # ESLint
npm run lint:fix                 # Auto-fix
npm run format                   # Prettier
npm run format:check             # Check formatting
```

### WASM (Rust signing module)

```bash
cd frontend/wasm
wasm-pack build --release --target web --out-dir pkg
```

Built automatically by `npm run build` in frontend. Source: `frontend/wasm/src/lib.rs` (secp256k1 Schnorr signing via k256 crate, keys zeroed with `zeroize`).

## Architecture

### Component Pattern

All UI components extend `BaseComponent` with lifecycle: `constructor` → `init()` → `bindEvents()` → `render()` → `destroy()`.

Key helpers: `this.$()` / `this.$$()` (querySelector), `this.createElement()`, `this.subscribe()` (auto-cleanup on destroy).

Components: Editor, Header, Sidebar, StatusBar, NostrPanel, Toast.

### State Management

`AppState` singleton emits 26 typed events (`StateEvents.NOTE_CREATED`, `THEME_CHANGED`, etc.). Components subscribe via `this.subscribe(appState, eventName, callback)`. State is mutated through named methods (e.g., `appState.addNote()`, `appState.rotateTheme()`), never directly.

### Service Layer

All services are singletons exported as lowercase camelCase: `storageService`, `nostrService`, `nostrAuthService`, `exportService`, `faviconService`. WASM loader: `loadWasmModule()`, `getWasmModule()`, `isWasmAvailable()`.

### Data Flow

```
User Input → Component → AppState mutator → emit(StateEvent) → subscribed components re-render
                            ↓
                    Service (StorageService → IndexedDB, NostrService → WebSocket proxy)
```

### Nostr Architecture

Frontend → Backend WebSocket Proxy (`/ws/nostr`) → Nostr Relays. Backend provides IP privacy. NostrProxy has SSRF protection (private IP blocking, DNS pinning), rate limiting (30 msg/sec), max 10 relays/client, 64KB max message.

## Code Conventions

- **Theme classes**: `theme-{name}` on `<body>`, must define `--bg`, `--fg`, `--accent`, `--fg-dim`
- **Font classes**: `font-{name}` on `<body>`
- **State events**: `SCREAMING_SNAKE_CASE` via `StateEvents` enum
- **Components**: PascalCase classes, instantiated as singletons
- **Services**: camelCase singleton exports
- **HTML sanitization**: Whitelist-only (h1, h2, p, br tags)
- **Paste handling**: Always strips to plain text

### Adding a Theme

1. Add entry to `frontend/src/data/themes.js`: `{ class: 'theme-name', name: 'Short', full: 'Full Name' }`
2. Add CSS vars in `frontend/src/styles/themes.css`

### Adding a Font

1. Add entry to `frontend/src/data/fonts.js`
2. Add CSS in `frontend/src/styles/fonts.css` with Google Fonts import

### Adding a Component

1. Create class extending `BaseComponent` in `frontend/src/components/`
2. Export from `frontend/src/components/index.js`
3. Initialize in `frontend/src/main.js` (in `initializeComponents()`)

## Gotchas

- Auto-save is throttled to 100ms — don't expect immediate IndexedDB persistence
- Zen mode requires `PRE_ZEN_MODE` event to snapshot settings before enabling
- Max note content size: 1MB (enforced in StorageService)
- Published notes list is ephemeral — cleared on Nostr disconnect/refresh
- `data-ton3s-initialized` flag on `<body>` prevents double-init during HMR
- Frontend Dockerfile is 3-stage: Rust WASM → Node build → nginx serve
- Theme/font rotation uses `unusedIndices` array to prevent repeats
- CORS in backend allows localhost:3000/3002 + *.ton3s.app + optional `FRONTEND_URL` env var
- Editor uses `contenteditable` with `formatBlock` for h1/h2/p — Enter creates new `<p>`
- Toast notifications auto-dismiss: 3s default, 5s for errors
