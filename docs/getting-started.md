# Getting Started

This guide covers quick setup for both users and developers.

## For Users

### Using TON3S Online

Visit [ton3s.com](https://ton3s.com) to start writing immediately. No installation required.

### Self-Hosting with Docker

If you prefer to run your own instance:

```bash
# Clone the repository
git clone https://github.com/hypercoind/TON3S.git
cd TON3S

# Start the application
docker compose up -d
```

Access the app at `http://localhost:3002`

To stop:
```bash
docker compose down
```

## For Developers

### Option 1: Docker (Recommended)

The easiest way to run the full stack for development and testing:

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
docker compose up --build -d
```

Access the app at `http://localhost:3002`

To rebuild after changes:
```bash
docker compose up --build -d
```

To view logs:
```bash
docker compose logs -f
```

### Option 2: Local Node.js

For faster hot-reload during active development:

**Prerequisites:** Node.js 22+

1. **Clone the repository**
   ```bash
   git clone https://github.com/hypercoind/TON3S.git
   cd TON3S
   ```

2. **Start servers**

   Frontend (terminal 1):
   ```bash
   cd frontend && npm install && npm run dev
   ```

   Backend (terminal 2):
   ```bash
   cd backend && npm install && npm run dev
   ```

3. **Open in browser**

   Navigate to `http://localhost:3000`

   The Vite dev server proxies API requests to the backend automatically.

### Project Structure Overview

```
TON3S/
├── frontend/           # Vite-based frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── services/   # Business logic
│   │   ├── state/      # State management
│   │   └── styles/     # CSS modules
│   └── public/         # Static assets
├── backend/            # Fastify API server
│   └── src/
│       └── websocket/  # Nostr relay proxy
└── docs/               # Documentation
```

### Key Commands

| Command | Location | Purpose |
|---------|----------|---------|
| `npm run dev` | frontend/ | Start Vite dev server |
| `npm run build` | frontend/ | Build for production |
| `npm run dev` | backend/ | Start backend with hot reload |
| `npm start` | backend/ | Start production server |
| `docker compose up -d` | root | Start all services |

## First Steps

### Writing Your First Note

1. Open TON3S in your browser
2. Click in the editor area
3. Start typing - your content auto-saves

### Formatting Text

Use the toolbar buttons:
- **T** - Title (large heading)
- **H** - Heading (section heading)
- **B** - Body (regular paragraph)

Or use keyboard shortcuts:
- `Ctrl/Cmd + 1` - Title
- `Ctrl/Cmd + 2` - Heading
- `Ctrl/Cmd + 3` - Body

### Customizing Appearance

- Click the **theme button** to cycle through 72 themes
- Click the **font button** to change fonts
- Click the **zen mode** button for distraction-free writing

### Saving Your Work

Click the settings icon (gear) in the status bar to:
- **Export Note (Markdown)** - `.md` file with YAML frontmatter
- **Export Note (JSON)** - Structured data for single note
- **Export All (JSON)** - Full backup of all notes and settings

### Importing Notes

Click the settings icon and select **Import** to load JSON or Markdown files.

### Uploading Media

Drag and drop images/video into the editor, paste from clipboard, or press `Ctrl/Cmd + Shift + U` to open the file picker.

## Next Steps

- [User Guide](user-guide.md) - Complete feature documentation
- [Nostr Guide](nostr-guide.md) - Publishing to Nostr network
- [FAQ](faq.md) - Common questions answered
- [Development Guide](development.md) - Deep dive into codebase
- [Architecture](architecture.md) - System design overview
