# Architecture

System design and component overview for TON3S.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Vite)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Components  │  │  Services   │  │     State (AppState)    │  │
│  │  - Editor   │  │  - Storage  │  │  - documents            │  │
│  │  - Sidebar  │  │  - Export   │  │  - settings             │  │
│  │  - Header   │  │  - Nostr    │  │  - nostr                │  │
│  │  - NostrUI  │  │  - Auth     │  │  - ui                   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│          │              │                    │                   │
│          └──────────────┼────────────────────┘                   │
│                         │                                        │
│                    IndexedDB                                     │
└─────────────────────────│────────────────────────────────────────┘
                          │
                    WebSocket
                          │
┌─────────────────────────│────────────────────────────────────────┐
│                   Backend (Fastify)                              │
│  ┌──────────────────────┴───────────────────────────────────┐   │
│  │                    NostrProxy                             │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │   │
│  │  │ Relay 1 │ │ Relay 2 │ │ Relay 3 │ │ Relay N │         │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App
├── Header
│   ├── SidebarToggle
│   ├── ThemeButton
│   ├── FontButton
│   ├── ZenModeButton
│   ├── NostrButton
│   └── SaveControls
├── Sidebar
│   ├── NewDocButton
│   ├── DocumentList
│   │   └── DocumentItem (×n)
│   └── SearchInput
├── Editor
│   └── ContentEditable
├── StatusBar
│   ├── StyleButtons (T, H, B)
│   └── WordCount
└── NostrPanel
    ├── ConnectionStatus
    ├── PublicKey
    └── PublishButtons
```

### BaseComponent Pattern

All UI components extend `BaseComponent`:

```javascript
class BaseComponent {
  constructor() {
    this.subscriptions = [];
  }

  // DOM helpers
  $(selector) { return document.querySelector(selector); }
  $$(selector) { return document.querySelectorAll(selector); }

  // Element creation with attributes and events
  createElement(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.textContent) el.textContent = options.textContent;
    if (options.innerHTML) el.innerHTML = options.innerHTML;
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([k, v]) =>
        el.setAttribute(k, v)
      );
    }
    if (options.events) {
      Object.entries(options.events).forEach(([event, handler]) =>
        el.addEventListener(event, handler)
      );
    }
    return el;
  }

  // Event subscription with auto-cleanup
  subscribe(emitter, event, handler) {
    const unsubscribe = emitter.on(event, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  // Lifecycle methods (override in subclasses)
  init() {}
  render() {}
  bindEvents() {}

  destroy() {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }
}
```

### Lifecycle Flow

```
1. constructor()  → Set up instance variables, get DOM references
2. init()         → Subscribe to state changes
3. bindEvents()   → Attach event listeners
4. render()       → Update DOM based on state
5. destroy()      → Cleanup subscriptions and listeners
```

## State Management

### StateEmitter Base Class

```javascript
class StateEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }
}
```

### AppState Singleton

```javascript
class AppState extends StateEmitter {
  constructor() {
    super();
    this.state = {
      documents: [],
      currentDocumentId: null,
      settings: {
        themeIndex: 0,
        fontIndex: 0,
        zenMode: false,
        sidebarVisible: true
      },
      nostr: {
        connected: false,
        pubkey: null,
        extensionType: null
      },
      ui: {
        searchQuery: '',
        saveStatus: 'saved',
        loading: false
      }
    };
  }

  getState() {
    return this.state;
  }

  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.emit('stateChange', this.state);
  }
}

export const appState = new AppState();
```

### State Flow

```
User Action → Component Handler → Service Call → State Update → Re-render
     │                               │              │              │
     │                               │              │              │
     └───────────────────────────────┴──────────────┴──────────────┘
                              Event-driven updates
```

## Service Layer

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Services                              │
├─────────────────┬─────────────────┬─────────────────────────┤
│ StorageService  │  ExportService  │     NostrService        │
│                 │                 │                         │
│ - Dexie.js      │ - toMarkdown()  │ - WebSocket proxy      │
│ - IndexedDB     │ - toPDF()       │ - Relay management     │
│ - CRUD ops      │ - toJSON()      │ - Event publishing     │
│                 │                 │                         │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────────┐ │
│ │ documents   │ │ │   jsPDF     │ │ │  NostrAuthService   │ │
│ │ settings    │ │ │             │ │ │  - NIP-07 ext       │ │
│ └─────────────┘ │ └─────────────┘ │ │  - Key management   │ │
└─────────────────┴─────────────────┴─┴─────────────────────┴─┘
```

### StorageService

```javascript
class StorageService {
  constructor() {
    this.db = new Dexie('ton3s');
    this.db.version(1).stores({
      documents: '++id, title, createdAt, updatedAt, *tags'
    });
  }

  async saveDocument(doc) {
    const now = Date.now();
    if (doc.id) {
      await this.db.documents.update(doc.id, { ...doc, updatedAt: now });
    } else {
      doc.id = await this.db.documents.add({
        ...doc,
        createdAt: now,
        updatedAt: now
      });
    }
    return doc;
  }

  async getDocuments() {
    return this.db.documents.orderBy('updatedAt').reverse().toArray();
  }

  async deleteDocument(id) {
    return this.db.documents.delete(id);
  }
}
```

### NostrService

```javascript
class NostrService extends StateEmitter {
  constructor() {
    super();
    this.ws = null;
    this.relays = new Map();
    this.messageQueue = [];
  }

  connect() {
    this.ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/nostr`);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.handleMessage(msg);
    };
  }

  connectRelay(url) {
    this.send({ type: 'CONNECT', relay: url });
  }

  publish(event) {
    this.send({ type: 'BROADCAST', event });
  }

  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }
}
```

## Storage Schema

### IndexedDB Structure

```javascript
// Database: ton3s

// Table: documents
{
  id: number,           // Auto-increment primary key
  title: string,        // Document title
  content: string,      // HTML content
  plainText: string,    // Extracted for search
  tags: string[],       // Indexed array
  createdAt: number,    // Unix timestamp
  updatedAt: number,    // Unix timestamp (indexed)
  nostr: {
    published: boolean,
    eventId: string,
    publishedAt: number
  }
}

// Indexes: id (primary), updatedAt, tags (multi-entry)
```

### Migration from v1

```javascript
async migrateFromLocalStorage() {
  const oldContent = localStorage.getItem('savedContent');
  const oldTheme = localStorage.getItem('savedThemeIndex');
  const oldFont = localStorage.getItem('savedFontIndex');

  if (oldContent) {
    await this.saveDocument({
      title: 'Migrated Document',
      content: oldContent,
      plainText: this.extractText(oldContent)
    });
    localStorage.removeItem('savedContent');
  }

  // Migrate settings...
}
```

## Backend Architecture

### Fastify Server

```javascript
// src/index.js
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { NostrProxy } from './websocket/NostrProxy.js';

const fastify = Fastify({ logger: true });

await fastify.register(websocket);

// Health check endpoint
fastify.get('/health', async () => ({ status: 'ok' }));

// WebSocket endpoint for Nostr proxy
fastify.register(async (fastify) => {
  fastify.get('/ws/nostr', { websocket: true }, (socket, req) => {
    const proxy = new NostrProxy(socket);
    proxy.init();
  });
});

await fastify.listen({ port: 3001, host: '0.0.0.0' });
```

### NostrProxy

```javascript
class NostrProxy {
  constructor(clientSocket) {
    this.client = clientSocket;
    this.relays = new Map(); // url -> WebSocket
  }

  init() {
    this.client.on('message', (data) => {
      const msg = JSON.parse(data);
      this.handleClientMessage(msg);
    });

    this.client.on('close', () => {
      this.cleanup();
    });
  }

  handleClientMessage(msg) {
    switch (msg.type) {
      case 'CONNECT':
        this.connectRelay(msg.relay);
        break;
      case 'DISCONNECT':
        this.disconnectRelay(msg.relay);
        break;
      case 'SEND':
        this.sendToRelay(msg.relay, msg.data);
        break;
      case 'BROADCAST':
        this.broadcastToRelays(msg.event);
        break;
    }
  }

  connectRelay(url) {
    const ws = new WebSocket(url);

    ws.on('open', () => {
      this.relays.set(url, ws);
      this.sendToClient({ type: 'RELAY_STATUS', relay: url, status: 'connected' });
    });

    ws.on('message', (data) => {
      this.sendToClient({ type: 'RELAY_MESSAGE', relay: url, data: JSON.parse(data) });
    });

    ws.on('close', () => {
      this.relays.delete(url);
      this.sendToClient({ type: 'RELAY_STATUS', relay: url, status: 'disconnected' });
    });
  }

  cleanup() {
    this.relays.forEach(ws => ws.close());
    this.relays.clear();
  }
}
```

## Security Architecture

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' ws: wss:;
  img-src 'self' data:;
  frame-ancestors 'none';
">
```

### Input Sanitization

```javascript
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Paste handler - strip all HTML
editor.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, sanitizeInput(text));
});
```

### Security Headers (nginx)

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Performance Considerations

### Auto-save Throttling

```javascript
class Editor {
  constructor() {
    this.saveTimeout = null;
    this.THROTTLE_MS = 100;
  }

  onInput() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.save();
    }, this.THROTTLE_MS);
  }
}
```

### Lazy Loading

- Fonts loaded from Google Fonts with `display=swap`
- jsPDF loaded only when PDF export is triggered
- Documents loaded on-demand from IndexedDB

### Bundle Optimization (Vite)

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['dexie']
        }
      }
    }
  }
};
```
