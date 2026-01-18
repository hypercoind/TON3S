# Development Guide

Local setup, workflow, and code patterns for TON3S development.

## Prerequisites

- **Node.js** 22 or higher
- **npm** (included with Node.js)
- **Docker** and **Docker Compose** (optional, for container testing)
- A modern browser (Chrome, Firefox, Safari, Edge)

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
```

### 2. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend (new terminal)
cd ../backend
npm install
```

### 3. Start Development Servers

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

### 4. Open in Browser

Navigate to `http://localhost:3000`

The Vite dev server proxies `/ws/*` requests to the backend at port 3001.

## Development Commands

### Frontend (`/frontend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |

### Backend (`/backend`)

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with `--watch` for auto-reload |

### Docker (root)

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services detached |
| `docker compose up --build -d` | Rebuild and start |
| `docker compose down` | Stop all services |
| `docker compose logs -f` | Follow logs |
| `docker compose logs frontend` | View frontend logs |
| `docker compose logs backend` | View backend logs |

## Project Structure

```
frontend/
├── src/
│   ├── main.js              # App entry point
│   ├── components/          # UI components
│   │   ├── BaseComponent.js # Base class
│   │   ├── Editor.js
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   ├── SaveControls.js
│   │   ├── StatusBar.js
│   │   ├── NostrPanel.js
│   │   └── index.js         # Exports
│   ├── services/            # Business logic
│   │   ├── StorageService.js
│   │   ├── NostrService.js
│   │   ├── NostrAuthService.js
│   │   ├── ExportService.js
│   │   └── index.js
│   ├── state/               # State management
│   │   ├── AppState.js
│   │   └── StateEmitter.js
│   ├── data/                # Static data
│   │   ├── themes.js        # 72 themes
│   │   └── fonts.js         # 27 fonts
│   ├── utils/               # Utilities
│   │   ├── keyboard.js
│   │   ├── markdown.js
│   │   └── sanitizer.js
│   └── styles/              # CSS modules
│       ├── main.css         # Entry
│       ├── base.css
│       ├── layout.css
│       ├── components.css
│       ├── editor.css
│       ├── themes.css
│       ├── fonts.css
│       ├── animations.css
│       ├── zen-mode.css
│       └── responsive.css
├── public/
│   ├── favicon.svg
│   └── manifest.json        # PWA manifest
├── index.html
├── vite.config.js
├── Dockerfile
└── nginx.conf

backend/
├── src/
│   ├── index.js             # Fastify server
│   └── websocket/
│       └── NostrProxy.js    # Relay proxy
├── Dockerfile
└── package.json
```

## Code Patterns

### Creating a Component

1. Create file in `frontend/src/components/`:

```javascript
// MyComponent.js
import BaseComponent from './BaseComponent.js';
import { appState } from '../state/AppState.js';

class MyComponent extends BaseComponent {
  constructor() {
    super();
    this.container = this.$('#my-container');
  }

  init() {
    // Subscribe to state changes
    this.subscribe(appState, 'stateChange', this.handleStateChange.bind(this));
  }

  handleStateChange(state) {
    // React to state changes
    this.render(state);
  }

  render(state) {
    // Update DOM
    this.container.innerHTML = `<div>${state.someValue}</div>`;
  }

  bindEvents() {
    // Attach event listeners
    this.container.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick(event) {
    // Handle user interaction
    appState.setState({ someValue: 'clicked' });
  }
}

export default new MyComponent();
```

2. Export from `frontend/src/components/index.js`:

```javascript
export { default as myComponent } from './MyComponent.js';
```

3. Initialize in `frontend/src/main.js`:

```javascript
import { myComponent } from './components/index.js';

myComponent.init();
myComponent.bindEvents();
```

### Creating a Service

```javascript
// frontend/src/services/MyService.js

class MyService {
  constructor() {
    this.cache = new Map();
  }

  async fetchData(id) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const data = await this.loadFromStorage(id);
    this.cache.set(id, data);
    return data;
  }

  async loadFromStorage(id) {
    // Implementation
  }
}

export const myService = new MyService();
```

### Adding a Theme

1. Add to `frontend/src/data/themes.js`:

```javascript
export const themes = [
  // ... existing themes
  { class: 'theme-my-theme', name: 'MyTheme', full: 'My Custom Theme' }
];
```

2. Add CSS in `frontend/src/styles/themes.css`:

```css
.theme-my-theme {
  --bg: #1a1a2e;
  --fg: #eaeaea;
  --accent: #e94560;
  --fg-dim: #888888;
}
```

### Adding a Font

1. Add to `frontend/src/data/fonts.js`:

```javascript
export const fonts = [
  // ... existing fonts
  { class: 'font-my-font', name: 'MyFont', full: 'My Custom Font' }
];
```

2. Add CSS in `frontend/src/styles/fonts.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=My+Font&display=swap');

.font-my-font .editor {
  font-family: 'My Font', monospace;
}
```

## State Management

### Reading State

```javascript
import { appState } from '../state/AppState.js';

const { documents, currentDocumentId, settings } = appState.getState();
```

### Updating State

```javascript
// Partial update (merged with existing state)
appState.setState({ currentDocumentId: 123 });

// Nested update
appState.setState({
  settings: {
    ...appState.getState().settings,
    zenMode: true
  }
});
```

### Subscribing to Changes

```javascript
// In a component
init() {
  this.subscribe(appState, 'stateChange', (newState) => {
    this.render(newState);
  });
}

// Standalone subscription
const unsubscribe = appState.on('stateChange', (state) => {
  console.log('State changed:', state);
});

// Later: unsubscribe()
```

## Testing

### Manual Testing Checklist

**Editor:**
- [ ] Text input works
- [ ] Title style (Ctrl+1)
- [ ] Heading style (Ctrl+2)
- [ ] Body style (Ctrl+3)
- [ ] Paste strips HTML
- [ ] Auto-save indicator works

**Documents:**
- [ ] Create new document
- [ ] Switch between documents
- [ ] Delete document
- [ ] Search filters documents
- [ ] Documents persist on refresh

**Customization:**
- [ ] Theme cycling works
- [ ] Theme dropdown works
- [ ] Font cycling works
- [ ] Font dropdown works
- [ ] Settings persist on refresh

**Export:**
- [ ] Markdown export
- [ ] PDF export with theme colors

**Nostr:**
- [ ] Extension detection
- [ ] Connect/disconnect
- [ ] Publish note (kind 1)
- [ ] Publish article (kind 30023)
- [ ] Relay status indicators

**Zen Mode:**
- [ ] Hides sidebar and header
- [ ] Escape exits zen mode
- [ ] Button toggles correctly

**PWA:**
- [ ] Install prompt appears
- [ ] Works offline after install

### Browser DevTools

**IndexedDB Inspection:**
1. Open DevTools (F12)
2. Go to Application > IndexedDB > ton3s
3. Inspect documents table

**State Debugging:**
```javascript
// In browser console
import { appState } from '/src/state/AppState.js';
console.log(appState.getState());
```

**WebSocket Monitoring:**
1. Open DevTools Network tab
2. Filter by WS
3. Click the WebSocket connection
4. View Messages tab

## Debugging

### Common Issues

**Hot Reload Not Working:**
```bash
# Restart Vite server
cd frontend
npm run dev
```

**WebSocket Connection Failed:**
```bash
# Ensure backend is running
cd backend
npm run dev

# Check port 3001 is available
lsof -i :3001
```

**IndexedDB Issues:**
```javascript
// Clear database in console
indexedDB.deleteDatabase('ton3s');
location.reload();
```

**CSS Not Updating:**
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear Vite cache: Delete `frontend/node_modules/.vite`

### Logging

```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// In code
if (localStorage.getItem('debug')) {
  console.log('[MyComponent]', data);
}
```

## Code Style

### JavaScript

- ES Modules (`import`/`export`)
- Classes for components and services
- Async/await for async operations
- No semicolons (Vite handles it)
- Single quotes for strings

### CSS

- CSS custom properties for theming
- BEM-like naming for classes
- Mobile-first responsive design
- No CSS preprocessors

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `SaveControls` |
| Services | camelCase | `storageService` |
| CSS classes | kebab-case | `document-list` |
| Theme classes | `theme-*` | `theme-dracula` |
| Font classes | `font-*` | `font-jetbrains` |
| State events | camelCase | `stateChange` |

## Performance Tips

### Avoid Unnecessary Renders

```javascript
// Bad: Always re-renders
handleStateChange(state) {
  this.render(state);
}

// Good: Check if relevant state changed
handleStateChange(state) {
  if (state.currentDocumentId !== this.lastDocId) {
    this.lastDocId = state.currentDocumentId;
    this.render(state);
  }
}
```

### Throttle Expensive Operations

```javascript
// Use throttling for frequent events
let timeout;
function throttledSave() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    actualSave();
  }, 100);
}
```

### Use Event Delegation

```javascript
// Bad: Listener per item
items.forEach(item => {
  item.addEventListener('click', handleClick);
});

// Good: Single delegated listener
container.addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  if (item) handleClick(item);
});
```
