# CHECKPOINT.md

> Auto-generated project checkpoint for AI-assisted development sessions.
> Last updated: 2026-02-01

---

## Quick Reference

| Attribute | Value |
|-----------|-------|
| Project | TON3S v2.0.0 |
| Type | Full-stack JavaScript + Rust WASM (Vite + Fastify) |
| Purpose | Privacy-focused writing app with NOSTR integration |
| Frontend | Vite 6.0 + Dexie (IndexedDB) + Rust WASM signing |
| Backend | Fastify 5.0 + WebSocket relay proxy |
| Test Framework | Vitest 4.0 |
| Container | Docker Compose (nginx + Node 22) |
| Ports | Frontend: 3002, Backend: 3001, Dev: 3000 |
| Languages | JavaScript, Rust (WASM), CSS, HTML |

---

## Directory Structure

```
TON3S/
├── frontend/                    # Vite SPA
│   ├── src/
│   │   ├── main.js              # Application bootstrap (TON3SApp class)
│   │   ├── components/          # 8 UI components (BaseComponent pattern)
│   │   │   ├── BaseComponent.js # Abstract base with lifecycle
│   │   │   ├── Editor.js        # ContentEditable rich text
│   │   │   ├── Header.js        # Logo, theme/font controls
│   │   │   ├── Sidebar.js       # Note list, search, tag editing
│   │   │   ├── StatusBar.js     # Word count, settings popup
│   │   │   ├── NostrPanel.js    # NOSTR publishing UI
│   │   │   ├── Toast.js         # Notification manager
│   │   │   └── index.js         # Component exports
│   │   ├── services/            # 6 business logic services
│   │   │   ├── StorageService.js    # IndexedDB via Dexie
│   │   │   ├── NostrService.js      # Relay WebSocket proxy
│   │   │   ├── NostrAuthService.js  # NIP-07 + WASM signing
│   │   │   ├── ExportService.js     # JSON/Markdown/PDF export
│   │   │   ├── FaviconService.js    # Dynamic favicon
│   │   │   ├── wasm-loader.js       # WASM module loader
│   │   │   └── index.js
│   │   ├── state/               # Reactive state management
│   │   │   ├── AppState.js      # Singleton with 26 event types
│   │   │   └── StateEmitter.js  # Event emitter base class
│   │   ├── utils/               # Utility functions
│   │   │   ├── markdown.js      # HTML↔Markdown, word count
│   │   │   ├── keyboard.js      # Keyboard shortcuts
│   │   │   └── sanitizer.js     # Input sanitization
│   │   ├── data/                # Static data
│   │   │   ├── themes.js        # 72 theme definitions
│   │   │   └── fonts.js         # 27 font definitions
│   │   └── styles/              # 10 modular CSS files
│   │       ├── main.css         # Entry point
│   │       ├── base.css         # Reset, typography, Google Fonts
│   │       ├── layout.css       # Grid/flexbox
│   │       ├── components.css   # UI components
│   │       ├── editor.css       # Editor styles
│   │       ├── themes.css       # All 72 themes
│   │       ├── fonts.css        # Font application rules
│   │       ├── animations.css   # Transitions
│   │       ├── zen-mode.css     # Distraction-free mode
│   │       └── responsive.css   # Mobile/tablet
│   ├── wasm/                    # Rust WASM signing module
│   │   ├── src/lib.rs           # secp256k1 Schnorr signing
│   │   ├── Cargo.toml           # k256, wasm-bindgen, zeroize
│   │   └── pkg/                 # Built WASM output
│   ├── public/
│   │   └── manifest.json        # PWA manifest
│   ├── index.html               # Entry with CSP headers
│   ├── vite.config.js           # Vite + PWA + WASM plugins
│   ├── vitest.config.js         # Test config (30% coverage)
│   ├── Dockerfile               # Multi-stage: Rust → Node → nginx
│   └── nginx.conf               # Security headers, gzip, proxy
│
├── backend/                     # Fastify server
│   ├── src/
│   │   ├── index.js             # Server entry, routes, middleware
│   │   └── websocket/
│   │       └── NostrProxy.js    # Relay proxy with SSRF/DNS pinning
│   ├── Dockerfile               # Node 22 Alpine, health check
│   ├── vitest.config.js         # Test config (50% coverage)
│   └── package.json
│
├── docs/                        # Documentation
│   ├── CHECKPOINT.md            # This file
│   ├── getting-started.md
│   ├── user-guide.md
│   ├── nostr-guide.md
│   ├── architecture.md
│   ├── development.md
│   ├── deployment.md
│   └── contributing.md
│
├── docker-compose.yml           # Multi-container orchestration
├── package.json                 # Root workspaces, lint/test scripts
├── .eslintrc.json               # ESLint config
├── .prettierrc                  # Prettier config
├── CLAUDE.md                    # AI development guidance
└── README.md                    # User documentation
```

---

## Project Overview

TON3S is a minimalist, privacy-focused writing application with:

- **Multi-note support** with IndexedDB persistence via Dexie
- **NOSTR integration** for decentralized publishing (Kind 1 + Kind 30023)
- **72 themes** and **27 fonts** with random rotation
- **Zen mode** that activates after 3 seconds of typing
- **Export formats**: Markdown (with YAML frontmatter), JSON, PDF
- **PWA support** with offline capability via service worker
- **Privacy-first**: IP masking through WebSocket relay proxy
- **WASM signing**: Rust-based secp256k1 Schnorr signing for offline key management

### Core Philosophy

> Privacy-first, distraction-free writing with extensive customization and optional decentralized publishing.

---

## Architecture

### Component Pattern

All UI components extend `BaseComponent`:

```javascript
class MyComponent extends BaseComponent {
  constructor() {
    super();
    this.container = this.$('#my-container');
  }

  init() {
    this.subscribe(appState, 'stateChange', this.render.bind(this));
  }

  render(state) { /* Update DOM */ }
  bindEvents() { /* Attach listeners */ }
  destroy() { /* Auto-cleanup via super.destroy() */ }
}
```

**Lifecycle**: `constructor` → `init()` → `bindEvents()` → `render()` → `destroy()`

**Helper Methods**: `$()`, `$$()`, `createElement()`, `subscribe()`

### State Management

Centralized reactive state via `AppState` singleton:

```javascript
{
  _notes: [],                    // Array of note objects
  _currentNoteId: null,          // Active note ID
  _settings: {
    theme: { currentIndex, unusedIndices },
    font: { currentIndex, unusedIndices },
    zenMode: false,
    sidebarOpen: true,
    nostrPanelOpen: false,
    nostr: {
      enabled: true,
      defaultRelays: [...],      // 6 default relays
      proxyUrl: '/ws/nostr'
    }
  },
  _nostr: {
    connected: false,
    pubkey: null,
    extension: null,
    error: null
  },
  _publishedNotes: [],           // Ephemeral, cleared on disconnect
  _ui: {
    searchQuery: '',
    saveStatus: 'saving' | 'saved' | 'error',
    lastSaveTime: number,
    loading: false,
    activeMobilePage: 'editor' | 'notes' | 'nostr'
  }
}
```

### State Events (26 types)

| Category | Events |
|----------|--------|
| Note (5) | `NOTE_CREATED`, `NOTE_UPDATED`, `NOTE_DELETED`, `NOTE_SELECTED`, `NOTES_LOADED` |
| Settings (6) | `THEME_CHANGED`, `FONT_CHANGED`, `PRE_ZEN_MODE`, `ZEN_MODE_TOGGLED`, `SIDEBAR_TOGGLED`, `NOSTR_PANEL_TOGGLED` |
| Nostr (6) | `NOSTR_CONNECTED`, `NOSTR_DISCONNECTED`, `NOSTR_PUBLISHED`, `NOSTR_ERROR`, `NOSTR_PUBLISHED_NOTE_ADDED`, `NOSTR_PUBLISHED_NOTES_CLEARED` |
| UI (4) | `SEARCH_CHANGED`, `SAVE_STATUS_CHANGED`, `LOADING_CHANGED`, `ACTIVE_PAGE_CHANGED` |

### Data Flow

```
User Action → Component → Service → Storage/API
                ↓
            AppState mutator method
                ↓
            emit(StateEvent)
                ↓
            All subscribed components re-render
```

### NOSTR Architecture

```
Frontend ←→ Backend WebSocket Proxy ←→ NOSTR Relays
           (IP privacy layer)
```

**Protocol Messages**:
| Message | Direction | Purpose |
|---------|-----------|---------|
| CONNECT | Client → Server | Connect to relay |
| DISCONNECT | Client → Server | Disconnect from relay |
| SEND | Client → Server | Send to specific relay |
| BROADCAST | Client → Server | Send to all relays |
| RELAY_STATUS | Server → Client | Relay connection state |
| RELAY_MESSAGE | Server → Client | Messages from relays |
| ERROR | Server → Client | Error notifications |

---

## Modules

### Frontend Components

| Component | File | LOC | Purpose |
|-----------|------|-----|---------|
| BaseComponent | `BaseComponent.js` | 111 | Abstract base with lifecycle, subscriptions, DOM helpers |
| Editor | `Editor.js` | 380 | ContentEditable with h1/h2/p styles, auto-zen, paste handling |
| Header | `Header.js` | 151 | Logo, theme rotation button, font rotation button |
| Sidebar | `Sidebar.js` | 828 | Note list, search with debounce, tag editing, note management |
| StatusBar | `StatusBar.js` | 542 | Word/char count, settings popup with export/import |
| NostrPanel | `NostrPanel.js` | 556 | Extension detection, pubkey display, publish Kind 1/30023 |
| Toast | `Toast.js` | 171 | Singleton notifications: success/error/info/warning |

### Frontend Services

| Service | File | Purpose |
|---------|------|---------|
| StorageService | `StorageService.js` | Dexie wrapper, CRUD notes, 100ms throttle, 1MB max |
| NostrService | `NostrService.js` | WebSocket to `/ws/nostr`, reconnect logic, relay management |
| NostrAuthService | `NostrAuthService.js` | NIP-07 detection, WASM Schnorr signing, bech32 keys |
| ExportService | `ExportService.js` | JSON/Markdown/PDF export, YAML frontmatter, file import |
| FaviconService | `FaviconService.js` | Dynamic favicon from theme --accent color |
| wasm-loader | `wasm-loader.js` | WASM signing module loader (`loadWasmModule`, `getWasmModule`, `isWasmAvailable`) |

### WASM Module (Rust)

| File | Purpose |
|------|---------|
| `frontend/wasm/src/lib.rs` | secp256k1 Schnorr signing for NOSTR events |
| `frontend/wasm/Cargo.toml` | Dependencies: k256, wasm-bindgen, zeroize, getrandom |

Keys stored exclusively in WASM memory, never exposed to JavaScript.

### Backend Modules

| Module | File | Purpose |
|--------|------|---------|
| Server | `index.js` | Fastify entry, routes, CORS, rate limiting, security headers |
| NostrProxy | `websocket/NostrProxy.js` | Relay proxy, SSRF protection, DNS pinning, 10 connections max |

### Utilities

| Module | File | Key Exports |
|--------|------|-------------|
| markdown | `markdown.js` | `htmlToMarkdown`, `markdownToHtml`, `htmlToPlainText`, `parseContentForPDF`, `countWords`, `countCharacters` |
| sanitizer | `sanitizer.js` | `sanitizeInput`, `sanitizeHtml`, `sanitizeFilename`, `stripHtml`, `validateIndex`, `generateUUID` |
| keyboard | `keyboard.js` | `KeyboardManager` with defaults: Cmd+T, Cmd+N, Cmd+K, Cmd+F, Cmd+Shift+?, Escape |

### State Modules

| Module | File | Purpose |
|--------|------|---------|
| AppState | `AppState.js` | Reactive singleton, 26 event types, persistence |
| StateEmitter | `StateEmitter.js` | Event emitter base: on/off/emit/once |

---

## External Dependencies

### Frontend Production

| Package | Version | Purpose |
|---------|---------|---------|
| @scure/base | ^1.1.1 | Bech32 encoding for NOSTR keys |
| dexie | ^4.0.10 | IndexedDB wrapper for note storage |

### Frontend Dev

| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^6.0.0 | Build tool and dev server |
| vite-plugin-pwa | ^0.21.0 | PWA/service worker generation |
| vite-plugin-wasm | ^3.5.0 | WASM module loading |
| vite-plugin-top-level-await | ^1.6.0 | Async WASM init support |
| vitest | ^4.0.17 | Unit testing framework |
| @vitest/coverage-v8 | ^4.0.17 | Code coverage |
| @testing-library/dom | ^10.4.1 | DOM testing utilities |
| happy-dom | ^20.3.4 | Lightweight DOM for tests |
| sharp | ^0.34.5 | Image processing for icons |

### Rust WASM

| Crate | Version | Purpose |
|-------|---------|---------|
| wasm-bindgen | 0.2 | JS ↔ Rust FFI |
| k256 | 0.13 | secp256k1 + Schnorr signatures |
| getrandom | 0.2 | Random number generation (JS feature) |
| zeroize | 1.x | Secure memory wiping |

### Backend Production

| Package | Version | Purpose |
|---------|---------|---------|
| fastify | ^5.0.0 | Web framework |
| @fastify/cors | ^10.0.0 | CORS middleware |
| @fastify/rate-limit | ^10.0.0 | Rate limiting (100/min) |
| @fastify/websocket | ^11.0.0 | WebSocket support |
| ws | ^8.18.0 | WebSocket library |

### Backend Dev

| Package | Version | Purpose |
|---------|---------|---------|
| vitest | ^4.0.17 | Unit testing |
| @vitest/coverage-v8 | ^4.0.17 | Code coverage |

### Root Dev

| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^8.57.0 | Code linting |
| eslint-plugin-vitest-globals | ^1.5.0 | Vitest globals |
| prettier | ^3.4.0 | Code formatting |
| husky | ^9.1.0 | Git hooks |
| lint-staged | ^15.2.0 | Pre-commit linting |

---

## External Services

| Integration | Type | Purpose | Privacy Impact |
|-------------|------|---------|----------------|
| Nostr Relays (6 default) | WebSocket | Decentralized publishing | IP hidden behind proxy |
| Google Fonts (17 families) | CDN | Typography | IP + font usage tracking |
| NIP-07 Extensions | Browser API | Cryptographic signing | Local extension only |
| WASM Signing | Local compute | Offline Schnorr signing | Entirely client-side |

---

## Environment Variables

### Docker Compose

| Variable | Service | Value |
|----------|---------|-------|
| NODE_ENV | both | production |
| PORT | backend | 3001 |
| HOST | backend | 0.0.0.0 |

### Optional

| Variable | Purpose | Default |
|----------|---------|---------|
| FRONTEND_URL | CORS origin | localhost:3000/3002 |

### Hardcoded Defaults

| Setting | Value | Location |
|---------|-------|----------|
| Theme | Catppuccin Mocha (index 1) | AppState.js |
| Font | JetBrains Mono (index 1) | AppState.js |
| NOSTR Proxy | `/ws/nostr` | AppState.js |
| Auto-save throttle | 100ms | StorageService.js |
| Max content size | 1MB | StorageService.js |
| Max relays/client | 10 | NostrProxy.js |
| Max message size | 64KB | NostrProxy.js |
| Rate limit (Nostr) | 30 msg/sec | NostrProxy.js |

### Default NOSTR Relays

```
wss://relay.damus.io
wss://nos.lol
wss://relay.primal.net
wss://relay.snort.social
wss://nostr.mom
wss://relay.nostr.band
```

---

## API Endpoints

### REST

| Method | Path | Response |
|--------|------|----------|
| GET | `/health` | `{ status: 'OK', timestamp }` |
| GET | `/api/info` | `{ name, version, features, timestamp }` |
| GET | `/api/relays` | `{ relays: [...] }` |

### WebSocket

| Path | Purpose |
|------|---------|
| `/ws/nostr` | NOSTR relay proxy |

**WebSocket Limits**: 10 relays/client, 64KB max message, 30 msg/sec rate limit

---

## Storage Schema

```javascript
// IndexedDB database: "ton3s"
// Version 2 (migrated from v1 "documents" table)

notes: {
  id: number,           // ++id auto-increment primary key
  title: string,        // Auto-generated from first line
  content: string,      // HTML (h1, h2, p tags only)
  plainText: string,    // Extracted for search
  tags: string[],       // Multi-value index (*tags)
  createdAt: number,    // Unix timestamp (indexed)
  updatedAt: number,    // Unix timestamp (indexed)
  nostr: {
    published: boolean,
    eventId: string,
    publishedAt: number
  }
}

settings: {
  key: string,          // Primary key
  value: any
}
```

---

## Critical Paths

### Note Lifecycle

```
Create → StorageService.saveNote() → IndexedDB
       → appState.addNote() → emit(NOTE_CREATED)
       → Sidebar.render() + Editor.render()

Edit   → Editor input event → throttle 100ms
       → StorageService.updateNote() → IndexedDB
       → appState.updateNote() → emit(NOTE_UPDATED)

Delete → StorageService.deleteNote() → IndexedDB
       → appState.deleteNote() → emit(NOTE_DELETED)
       → Select next note or create new
```

### NOSTR Publish Flow

```
User clicks Publish → NostrPanel.publishNote()
  → NostrAuthService.signEvent() (NIP-07 or WASM private key)
  → NostrService.publishEvent()
  → WebSocket BROADCAST to proxy
  → NostrProxy validates URLs (SSRF + DNS pinning)
  → Backend fans out to all connected relays
  → RELAY_MESSAGE responses collected
  → appState.addPublishedNote() → emit(NOSTR_PUBLISHED_NOTE_ADDED)
```

### Theme/Font Rotation

```
Cmd+T / Cmd+K → rotateTheme() / rotateFont()
  → unusedIndices array prevents repeats
  → emit(THEME_CHANGED / FONT_CHANGED)
  → Components apply CSS class to <body>
  → FaviconService updates favicon color
```

### App Bootstrap (main.js)

```
1. Initialize WASM signing module (non-blocking)
2. Initialize StorageService + migrate legacy data
3. Load/apply settings (theme, font, zen mode)
4. Initialize FaviconService
5. Initialize UI components (Header, Sidebar, Editor, StatusBar, NostrPanel)
6. Load notes from database
7. Setup keyboard shortcuts (KeyboardManager)
8. Initialize security measures (eval disabled, HTTPS warning)
```

---

## Development Commands

### Docker (Primary)

```bash
docker compose up -d              # Start all services
docker compose up --build -d      # Rebuild and start
docker compose down               # Stop all services
docker compose logs -f            # View logs
docker image prune -f             # Clean old images
```

### Frontend

```bash
cd frontend
npm install                       # Install dependencies
npm run dev                       # Vite dev server (localhost:3000)
npm run build                     # Production build (dist/)
npm run preview                   # Preview production build
npm run test                      # Run tests
npm run test:watch                # Watch mode
npm run test:coverage             # Coverage report
```

### Backend

```bash
cd backend
npm install
npm start                         # Production server (port 3001)
npm run dev                       # Dev with --watch
npm run test
npm run test:watch
npm run test:coverage
```

### Root

```bash
npm test                          # All tests
npm run test:frontend             # Frontend only
npm run test:backend              # Backend only
npm run test:coverage             # Coverage reports
npm run lint                      # Lint all
npm run lint:fix                  # Auto-fix
npm run format                    # Prettier format
npm run format:check              # Check formatting
```

---

## Testing

### Test Thresholds

| Scope | Coverage |
|-------|----------|
| Frontend | 30% (statements, branches, functions, lines) |
| Backend | 50% (statements, branches, functions, lines) |

### Test Files

```
frontend/src/components/__tests__/BaseComponent.test.js
frontend/src/components/__tests__/StatusBar.test.js
frontend/src/state/__tests__/StateEmitter.test.js
frontend/src/state/__tests__/AppState.test.js
frontend/src/utils/__tests__/sanitizer.test.js
frontend/src/utils/__tests__/markdown.test.js
frontend/src/services/__tests__/StorageService.test.js
frontend/src/services/__tests__/NostrAuthService.test.js
frontend/src/services/__tests__/NostrService.test.js
backend/__tests__/http-endpoints.test.js
backend/__tests__/websocket-proxy.test.js
```

---

## Security Features

### Frontend

- **CSP headers** in index.html meta tag
- **Input sanitization** via sanitizer.js (whitelist h1/h2/p/br only)
- **Paste handling** strips to plain text
- **eval() disabled** at runtime
- **HTTPS warning** in console if not secure
- **WASM key isolation** — private keys never enter JS heap

### Backend

- **CORS** restricted to localhost + *.ton3s.app + optional FRONTEND_URL
- **Rate limiting** 100 req/min per IP
- **Security headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **SSRF protection** in NostrProxy:
  - Blocks private IPs (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8)
  - Blocks IPv6 private ranges (fe80::/10, fc00::/7, ::1)
  - Blocks metadata endpoints (169.254.169.254, metadata.google.internal)
  - DNS pinning prevents TOCTOU rebinding attacks
- **Message validation**: structure, size (64KB), type checking
- **Event ID tracking**: only accepts OK for events client actually sent

### nginx

- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Disabled geolocation, microphone, camera, payment

---

## Notes for AI Sessions

### Key Files to Read First

1. `CLAUDE.md` — Project conventions and patterns
2. `frontend/src/state/AppState.js` — State structure and 26 events
3. `frontend/src/components/BaseComponent.js` — Component pattern
4. `frontend/src/services/StorageService.js` — Data persistence
5. `backend/src/websocket/NostrProxy.js` — Security-critical proxy

### Common Patterns

- Components use `this.$()` and `this.$$()` for DOM queries
- Services are singleton exports (lowercase camelCase)
- State updates via `appState.mutatorMethod()` emit specific `StateEvents`
- CSS custom properties: `--bg`, `--fg`, `--accent`, `--fg-dim`
- Theme classes: `theme-{name}`, Font classes: `font-{name}`
- WASM loaded non-blocking at startup, checked via `isWasmAvailable()`

### Gotchas

- Auto-save has 100ms throttle — don't expect immediate persistence
- Zen mode needs `PRE_ZEN_MODE` event to snapshot settings before enabling
- IndexedDB max content size is 1MB per note
- Toast notifications auto-dismiss (3s default, 5s errors)
- Published notes list is ephemeral — cleared on disconnect/refresh
- Frontend Dockerfile is 3-stage: Rust WASM build → Node build → nginx serve
- `data-ton3s-initialized` flag on body prevents double-init during HMR
