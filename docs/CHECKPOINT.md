# CHECKPOINT.md

> Auto-generated project checkpoint for AI-assisted development sessions.
> Last updated: 2026-01-26

---

## Quick Reference

| Attribute | Value |
|-----------|-------|
| Project | TON3S v2.0.0 |
| Type | Full-stack JavaScript (Vite + Fastify) |
| Purpose | Privacy-focused writing app with NOSTR integration |
| Frontend | Vite 6.0 + Dexie (IndexedDB) |
| Backend | Fastify 5.0 + WebSocket proxy |
| Test Framework | Vitest |
| Container | Docker Compose (nginx + Node 22) |
| Ports | Frontend: 3002, Backend: 3001, Dev: 3000 |

---

## Directory Structure

```
TON3S/
├── frontend/                    # Vite SPA
│   ├── src/
│   │   ├── main.js              # Application bootstrap
│   │   ├── components/          # 8 UI components (BaseComponent pattern)
│   │   │   ├── BaseComponent.js # Abstract base with lifecycle
│   │   │   ├── Editor.js        # ContentEditable rich text
│   │   │   ├── Header.js        # Logo, theme/font controls
│   │   │   ├── Sidebar.js       # Note list, search, resize
│   │   │   ├── StatusBar.js     # Word count, settings popup
│   │   │   ├── NostrPanel.js    # NOSTR publishing UI
│   │   │   ├── Toast.js         # Notification manager
│   │   │   └── index.js         # Component exports
│   │   ├── services/            # 5 business logic services
│   │   │   ├── StorageService.js    # IndexedDB via Dexie
│   │   │   ├── NostrService.js      # Relay WebSocket proxy
│   │   │   ├── NostrAuthService.js  # NIP-07 authentication
│   │   │   ├── ExportService.js     # JSON/Markdown/PDF export
│   │   │   ├── FaviconService.js    # Dynamic favicon
│   │   │   └── index.js
│   │   ├── state/               # Reactive state management
│   │   │   ├── AppState.js      # Singleton with 39 event types
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
│   │       ├── base.css         # Reset, typography
│   │       ├── layout.css       # Grid/flexbox
│   │       ├── components.css   # UI components
│   │       ├── editor.css       # Editor styles
│   │       ├── themes.css       # All 72 themes
│   │       ├── fonts.css        # Google Fonts imports
│   │       ├── animations.css   # Transitions
│   │       ├── zen-mode.css     # Distraction-free mode
│   │       └── responsive.css   # Mobile/tablet
│   ├── public/
│   │   └── manifest.json        # PWA manifest
│   ├── index.html               # Entry with CSP headers
│   ├── vite.config.js           # Vite + PWA plugin config
│   ├── vitest.config.js         # Test config (30% coverage)
│   ├── Dockerfile               # Multi-stage: Node → nginx
│   └── nginx.conf               # Security headers, gzip, proxy
│
├── backend/                     # Fastify server
│   ├── src/
│   │   ├── index.js             # Server entry, routes, middleware
│   │   └── websocket/
│   │       └── NostrProxy.js    # Relay proxy with SSRF protection
│   ├── Dockerfile               # Node 22 Alpine, health check
│   ├── vitest.config.js         # Test config (50% coverage)
│   └── package.json
│
├── docs/                        # Documentation
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
// State structure
{
  notes: [],                    // Array of note objects
  currentNoteId: null,          // Active note ID
  settings: {
    theme: { currentIndex, unusedIndices },
    font: { currentIndex, unusedIndices },
    zenMode: false,
    sidebarVisible: true
  },
  nostr: {
    connected: false,
    pubkey: null,
    extension: null,
    publishedNotes: []
  },
  ui: {
    searchQuery: '',
    saveStatus: 'saved',
    loading: false
  }
}
```

**39 event types** for granular state subscriptions.

### Data Flow

```
User Action → Component → Service → Storage/API
                ↓
            AppState.setState()
                ↓
            emit('stateChange')
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

| Component | File | Purpose |
|-----------|------|---------|
| BaseComponent | `BaseComponent.js` | Abstract base with lifecycle, subscriptions, DOM helpers |
| Editor | `Editor.js` | ContentEditable with h1/h2/p styles, auto-zen, paste handling |
| Header | `Header.js` | Logo, theme rotation button, font rotation button |
| Sidebar | `Sidebar.js` | Note list, search with debounce, resize handles (200-500px) |
| StatusBar | `StatusBar.js` | Word/char count, settings popup with export buttons |
| NostrPanel | `NostrPanel.js` | Extension detection, pubkey display, publish Kind 1/30023 |
| Toast | `Toast.js` | Singleton notifications: success/error/info/warning |

### Frontend Services

| Service | File | Purpose |
|---------|------|---------|
| StorageService | `StorageService.js` | Dexie wrapper, CRUD notes, 100ms throttle, 1MB max |
| NostrService | `NostrService.js` | WebSocket to `/ws/nostr`, reconnect logic, relay management |
| NostrAuthService | `NostrAuthService.js` | NIP-07 detection, WASM schnorr signing |
| ExportService | `ExportService.js` | JSON/Markdown/PDF export, YAML frontmatter |
| FaviconService | `FaviconService.js` | Dynamic favicon from theme --accent color |

### Backend Modules

| Module | File | Purpose |
|--------|------|---------|
| Server | `index.js` | Fastify entry, routes, CORS, rate limiting |
| NostrProxy | `websocket/NostrProxy.js` | Relay proxy, SSRF protection, 10 connections max |

### State Modules

| Module | File | Purpose |
|--------|------|---------|
| AppState | `AppState.js` | Reactive singleton, 39 event types, persistence |
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
| vitest | ^4.0.17 | Unit testing framework |
| @vitest/coverage-v8 | ^4.0.17 | Code coverage |
| @testing-library/dom | ^10.4.1 | DOM testing utilities |
| happy-dom | ^20.3.4 | Lightweight DOM for tests |
| sharp | ^0.34.5 | Image processing for icons |

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

### Default NOSTR Relays

```
wss://relay.damus.io
wss://nos.lol
wss://relay.nostr.band
wss://relay.snort.social
wss://nostr.wine
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

**WebSocket Protocol**:
- Max connections per client: 10
- Max message size: 64KB
- SSRF protection: blocks private IPs/hostnames

---

## Critical Paths

### Note Lifecycle

```
Create → StorageService.saveNote() → IndexedDB
       → AppState.emit('note:created')
       → Sidebar.render() + Editor.render()

Update → Editor input event → throttle 100ms
       → StorageService.saveNote() → IndexedDB
       → AppState.emit('note:updated')

Delete → StorageService.deleteNote() → IndexedDB
       → AppState.emit('note:deleted')
       → Select next note or create new
```

### NOSTR Publish Flow

```
User clicks Publish → NostrPanel.publishNote()
  → NostrAuthService.signEvent() (NIP-07 or private key)
  → NostrService.publishEvent()
  → WebSocket BROADCAST to proxy
  → Backend fans out to all relays
  → RELAY_MESSAGE responses collected
  → AppState.emit('nostr:published')
```

### Storage Schema

```javascript
// IndexedDB: TON3SDatabase
notes: {
  id: number,           // Auto-increment primary key
  title: string,
  content: string,      // HTML (h1, h2, p tags)
  plainText: string,    // Extracted for search
  tags: string[],
  createdAt: number,    // Unix timestamp
  updatedAt: number,
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

## Verification & Testing

### Test Thresholds

| Scope | Coverage |
|-------|----------|
| Frontend | 30% (statements, branches, functions, lines) |
| Backend | 50% (statements, branches, functions, lines) |

### Manual Test Checklist

1. **Editor**: Title/Heading/Body styles, paste strips to plain text, auto-save
2. **Notes**: Create, switch, delete, search with debounce
3. **Zen mode**: Activates after 3s typing, exits on mouse movement
4. **Themes/Fonts**: Cycle through, verify CSS variables applied
5. **Export**: Markdown (with frontmatter), JSON, PDF
6. **NOSTR**: Connect extension (nos2x/Alby), publish Kind 1 and Kind 30023
7. **Persistence**: Refresh page, verify IndexedDB data persists
8. **PWA**: Install prompt, offline functionality

### Test Files

```
frontend/src/components/__tests__/
frontend/src/services/__tests__/
frontend/src/utils/__tests__/
backend/src/__tests__/
backend/src/websocket/__tests__/
```

---

## Security Features

### Frontend

- **CSP headers** in index.html meta tag
- **Input sanitization** via sanitizer.js
- **Paste handling** strips to plain text
- **eval() disabled** at runtime
- **HTTPS warning** in console if not secure

### Backend

- **CORS** restricted to localhost + *.ton3s.app
- **Rate limiting** 100 req/min per IP
- **Security headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **SSRF protection** in NostrProxy (blocks private IPs)

### nginx

- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Disabled geolocation, microphone, camera

---

## Notes for AI Sessions

### Key Files to Read First

1. `CLAUDE.md` - Project conventions and patterns
2. `frontend/src/state/AppState.js` - State structure and events
3. `frontend/src/components/BaseComponent.js` - Component pattern
4. `frontend/src/services/StorageService.js` - Data persistence

### Common Patterns

- Components use `this.$()` and `this.$$()` for DOM queries
- Services are singleton exports (lowercase camelCase)
- State updates via `appState.setState()` emit `stateChange`
- CSS custom properties: `--bg`, `--fg`, `--accent`, `--fg-dim`
- Theme classes: `theme-{name}`, Font classes: `font-{name}`

### Gotchas

- Auto-save has 100ms throttle - don't expect immediate persistence
- Zen mode needs `preZenMode` state to restore settings
- IndexedDB max content size is 1MB per note
- Toast notifications auto-dismiss (3s default, 5s errors)
