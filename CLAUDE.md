# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TON3S is a minimalist, privacy-focused writing application with a modular frontend/backend architecture. Version 2.0 introduces multi-note support, Nostr integration for decentralized publishing, and Docker deployment.

**Core Philosophy**: Privacy-first, distraction-free writing with extensive customization and optional decentralized publishing.

## Project Structure

```
TON3S/
├── frontend/                    # Vite-based frontend application
│   ├── src/
│   │   ├── main.js              # Application bootstrap
│   │   ├── components/          # UI components (BaseComponent pattern)
│   │   │   ├── BaseComponent.js # Base class with lifecycle methods
│   │   │   ├── Editor.js        # ContentEditable editor
│   │   │   ├── Header.js        # Top toolbar
│   │   │   ├── Sidebar.js       # Note list and search
│   │   │   ├── SaveControls.js  # Export dropdown
│   │   │   ├── StatusBar.js     # Word/character count
│   │   │   ├── NostrPanel.js    # Nostr publishing UI
│   │   │   └── index.js         # Component exports
│   │   ├── services/            # Business logic layer
│   │   │   ├── StorageService.js    # IndexedDB (Dexie) management
│   │   │   ├── NostrService.js      # Relay proxy communication
│   │   │   ├── NostrAuthService.js  # NIP-07 authentication
│   │   │   ├── ExportService.js     # Markdown/PDF export
│   │   │   └── index.js             # Service exports
│   │   ├── state/               # State management
│   │   │   ├── AppState.js      # Reactive singleton state
│   │   │   └── StateEmitter.js  # Event emitter base class
│   │   ├── data/                # Static data
│   │   │   ├── themes.js        # 72 theme definitions
│   │   │   └── fonts.js         # 27 font definitions
│   │   ├── utils/               # Utility functions
│   │   │   ├── keyboard.js      # Keyboard shortcuts
│   │   │   ├── markdown.js      # HTML↔Markdown conversion
│   │   │   └── sanitizer.js     # Input sanitization
│   │   └── styles/              # Modular CSS
│   │       ├── main.css         # Entry point
│   │       ├── base.css         # Reset and typography
│   │       ├── layout.css       # Grid/flexbox layout
│   │       ├── components.css   # UI component styles
│   │       ├── editor.css       # Editor-specific styles
│   │       ├── themes.css       # All theme definitions
│   │       ├── fonts.css        # Font imports/application
│   │       ├── animations.css   # Transitions/animations
│   │       ├── zen-mode.css     # Zen mode styling
│   │       └── responsive.css   # Mobile/tablet styles
│   ├── public/                  # Static assets
│   │   └── manifest.json        # PWA manifest
│   ├── index.html               # Main entry point
│   ├── vite.config.js           # Vite configuration with PWA plugin
│   ├── Dockerfile               # Multi-stage build (Node → nginx)
│   └── nginx.conf               # Security headers, gzip, routing
│
├── backend/                     # Fastify backend server
│   ├── src/
│   │   ├── index.js             # Fastify server entry point
│   │   └── websocket/
│   │       └── NostrProxy.js    # Nostr relay proxy
│   ├── Dockerfile               # Node 22 Alpine with health check
│   └── package.json             # v2.0.0, Fastify + WebSocket
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
├── README.md                    # User-facing documentation
├── CLAUDE.md                    # This file
│
└── [Legacy v1 files]            # Standalone single-file version
    ├── index.html
    ├── script.js
    ├── styles.css
    └── .htaccess
```

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
    // Subscribe to state changes
    this.subscribe(appState, 'stateChange', (state) => {
      this.render(state);
    });
  }

  render(state) {
    // Update DOM based on state
  }

  bindEvents() {
    // Attach event listeners
    this.container.addEventListener('click', this.handleClick.bind(this));
  }

  destroy() {
    // Cleanup (subscriptions auto-cleaned by super.destroy())
  }
}
```

**Lifecycle**: `constructor` → `init()` → `bindEvents()` → `render()` → `destroy()`

**Helper Methods**:
- `this.$()` - querySelector shorthand
- `this.$$()` - querySelectorAll shorthand
- `this.createElement()` - Create element with attributes and events
- `this.subscribe()` - Subscribe to events with auto-cleanup

### State Management

Centralized reactive state via `AppState` singleton:

```javascript
import { appState } from './state/AppState.js';

// Get current state
const { notes, currentNoteId, settings } = appState.getState();

// Update state (emits 'stateChange' event)
appState.setState({ currentNoteId: 123 });

// Subscribe to changes
appState.on('stateChange', (newState) => { ... });
```

**State Structure**:
```javascript
{
  notes: [],              // Array of note objects
  currentNoteId: null,    // Active note ID
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
}
```

### Service Layer

Services encapsulate business logic separate from UI:

| Service | Purpose |
|---------|---------|
| `StorageService` | IndexedDB operations via Dexie.js |
| `NostrService` | WebSocket communication with relay proxy |
| `NostrAuthService` | NIP-07 extension detection and authentication |
| `ExportService` | Markdown/PDF generation |

```javascript
import { storageService, exportService } from './services/index.js';

// All services are singleton instances
await storageService.saveNote(note);
const markdown = exportService.toMarkdown(html);
```

### Storage Schema (IndexedDB)

```javascript
// Note schema
{
  id: number,                  // Auto-generated primary key
  title: string,               // Note title
  content: string,             // HTML content (h1, h2, p tags)
  plainText: string,           // Extracted text for search
  tags: string[],              // Note tags
  createdAt: number,           // Unix timestamp
  updatedAt: number,           // Unix timestamp
  nostr: {
    published: boolean,
    eventId: string,
    publishedAt: number
  }
}
```

### Nostr Integration

**Architecture**: Frontend → Backend WebSocket Proxy → Nostr Relays

This provides IP privacy by routing all relay traffic through the backend.

**Protocol Messages**:
| Message | Direction | Purpose |
|---------|-----------|---------|
| `CONNECT` | Client → Server | Connect to a relay |
| `DISCONNECT` | Client → Server | Disconnect from a relay |
| `SEND` | Client → Server | Send to specific relay |
| `BROADCAST` | Client → Server | Send to all relays |
| `RELAY_STATUS` | Server → Client | Relay connection state |
| `RELAY_MESSAGE` | Server → Client | Messages from relays |
| `ERROR` | Server → Client | Error notifications |

**Event Types**:
- Kind 1: Short-form notes
- Kind 30023: Long-form articles (NIP-23)

## Development Commands

### Frontend

```bash
cd frontend

npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:3000)
npm run build        # Build for production (dist/)
npm run preview      # Preview production build
```

### Backend

```bash
cd backend

npm install          # Install dependencies
npm start            # Run production server (port 3001)
npm run dev          # Run with --watch for hot reload
```

### Docker

```bash
# Start all services
docker compose up -d

# Rebuild and start
docker compose up --build -d

# Stop all services
docker compose down

# View logs
docker compose logs -f
```

**Ports**:
- Frontend: 3002 (mapped to nginx on 3000)
- Backend: 3001
- Vite Dev: 3000 (with proxy to backend)

## Key Implementation Details

### Text Styling

The editor uses `contenteditable` with three text styles:
- **Title** (h1): Main note title
- **Heading** (h2): Section headings
- **Body** (p): Regular paragraphs

```javascript
// Apply style to current block
editor.execCommand('formatBlock', false, 'h1');
```

Enter key creates new `<p>` tag and resets to body style.

### Theme/Font System

Themes and fonts use CSS custom properties:

```css
.theme-catppuccin-mocha {
  --bg: #1e1e2e;
  --fg: #cdd6f4;
  --accent: #89b4fa;
  --fg-dim: #6c7086;
}
```

Classes applied to `<body>` element. Random rotation prevents immediate repetition using an `unusedIndices` array pattern.

### Auto-save

- Triggered on every input event
- Throttled to 100ms minimum between saves
- Updates `updatedAt` timestamp
- Extracts and stores `plainText` for search

### Security Features

- **Input sanitization**: Escapes HTML entities
- **Paste handling**: Strips to plain text only
- **CSP headers**: Strict content security policy
- **Eval disabled**: Runtime override of `eval()`
- **HTTPS warning**: Console warning if not HTTPS

## Code Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Theme classes | `theme-{name}` | `theme-catppuccin-mocha` |
| Font classes | `font-{name}` | `font-jetbrains` |
| Components | PascalCase | `SaveControls` |
| Services | camelCase + Service | `storageService` |
| State events | camelCase | `stateChange` |

### CSS Custom Properties

Every theme must define:
```css
--bg: background color
--fg: foreground/text color
--accent: accent color for highlights
--fg-dim: dimmed text color
```

### Event Handling

- Components bind events in `bindEvents()` method
- Use event delegation for dynamic elements
- Clean up in `destroy()` method (subscriptions auto-cleaned)

## Adding New Features

### Adding a Theme

1. Add to `frontend/src/data/themes.js`:
   ```javascript
   { class: 'theme-name', name: 'Short', full: 'Full Name' }
   ```

2. Add CSS in `frontend/src/styles/themes.css`:
   ```css
   .theme-name {
     --bg: #hexcolor;
     --fg: #hexcolor;
     --accent: #hexcolor;
     --fg-dim: #hexcolor;
   }
   ```

### Adding a Font

1. Add to `frontend/src/data/fonts.js`:
   ```javascript
   { class: 'font-name', name: 'Short', full: 'Full Name' }
   ```

2. Add CSS in `frontend/src/styles/fonts.css`:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Font+Name&display=swap');

   .font-name .editor {
     font-family: 'Font Name', monospace;
   }
   ```

### Adding a Component

1. Create `frontend/src/components/MyComponent.js`:
   ```javascript
   import BaseComponent from './BaseComponent.js';
   import { appState } from '../state/AppState.js';

   class MyComponent extends BaseComponent {
     constructor() {
       super();
       this.container = this.$('#my-container');
     }

     init() {
       this.subscribe(appState, 'stateChange', this.render.bind(this));
     }

     render(state) {
       // Update DOM
     }

     bindEvents() {
       // Attach listeners
     }
   }

   export default new MyComponent();
   ```

2. Export from `frontend/src/components/index.js`

3. Initialize in `frontend/src/main.js`

### Adding a Service

1. Create `frontend/src/services/MyService.js`:
   ```javascript
   class MyService {
     async doSomething() {
       // Business logic
     }
   }

   export const myService = new MyService();
   ```

2. Export from `frontend/src/services/index.js`

## Troubleshooting

### Storage Issues

- **IndexedDB blocked**: Check browser privacy settings
- **Quota exceeded**: Large notes may hit limits
- **Private mode**: IndexedDB may be restricted; fallback is available

### Nostr Connection

- **Extension not detected**: Install nos2x, Alby, or compatible NIP-07 extension
- **Connection failed**: Check backend is running and WebSocket proxy active
- **Relay errors**: Individual relays may be down; check relay status

### Build/Dev Issues

- **Port conflict**: Change port in vite.config.js or docker-compose.yml
- **Hot reload not working**: Ensure Vite dev server is running, not production build
- **CSS not updating**: Clear browser cache or hard refresh

### Docker Issues

- **Container won't start**: Check logs with `docker compose logs`
- **Backend unhealthy**: Verify health endpoint at `/health`
- **Network issues**: Ensure `ton3s` network exists

## Testing

### Recommended Testing Workflow

Build and run using Docker:

```bash
docker compose up --build -d
```

Access at `http://localhost:3002` and test:

1. **Editor**: Title/Heading/Body styles, paste handling, auto-save
2. **Notes**: Create, switch, delete, search
3. **Zen mode**: Activates after 3s of typing, exits on mouse movement
4. **Themes/Fonts**: Cycle through multiple themes/fonts
5. **Export**: Save as Markdown and PDF
6. **Nostr**: Connect extension, publish note and article
7. **Persistence**: Refresh page, verify data persists

Stop containers:

```bash
docker compose down
```
