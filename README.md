# TON3S

**Write to Inspire**

TON3S is a minimalist, privacy-focused writing application. Whether you're crafting articles, writing books, composing social posts, or jotting down ideas, TON3S provides a distraction-free environment to help you focus on what matters most—your words.

## Features

- **Distraction-free editor** with clean, minimal interface
- **72 beautiful themes** including Catppuccin, Dracula, Gruvbox, Tokyo Night, Nord, and more
- **27 fonts** optimized for writing and reading
- **Zen mode** for focused writing sessions
- **Multi-note support** with sidebar navigation and search
- **Export to Markdown and PDF**
- **Publish to Nostr** decentralized network with IP privacy protection
- **PWA support** for offline use and installation
- **100% local storage** - your data never leaves your device

## Quick Start

### Using Docker (Recommended)

```bash
docker compose up -d
```

Access the app at `http://localhost:3002`

### Local Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (separate terminal)
cd backend && npm install && npm run dev
```

Access the app at `http://localhost:3000`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS, Vite, Dexie.js (IndexedDB), PWA |
| Backend | Node.js, Fastify, WebSocket |
| Deployment | Docker, nginx |

## Project Structure

```
TON3S/
├── frontend/           # Vite-based frontend application
│   ├── src/
│   │   ├── components/ # UI components (Editor, Sidebar, etc.)
│   │   ├── services/   # Business logic (Storage, Nostr, Export)
│   │   ├── state/      # Reactive state management
│   │   ├── data/       # Theme and font definitions
│   │   ├── utils/      # Utilities (keyboard, markdown, sanitizer)
│   │   └── styles/     # Modular CSS
│   └── public/         # Static assets and PWA manifest
├── backend/            # Fastify backend server
│   └── src/
│       └── websocket/  # Nostr relay proxy
├── docs/               # Documentation
└── docker-compose.yml  # Container orchestration
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Quick start for users and developers |
| [User Guide](docs/user-guide.md) | Complete user documentation |
| [Nostr Guide](docs/nostr-guide.md) | Publishing to Nostr network |
| [Architecture](docs/architecture.md) | System design and components |
| [Development](docs/development.md) | Local setup and workflow |
| [Deployment](docs/deployment.md) | Docker deployment guide |
| [Contributing](docs/contributing.md) | How to contribute |

## Privacy

TON3S is designed with privacy as a core principle:

- **Local-only storage** using IndexedDB in your browser
- **No external data transmission** except for optional Nostr publishing
- **IP privacy** for Nostr via backend proxy
- **No cookies, tracking, or analytics**
- **Content Security Policy** headers for enhanced security

> **Shared Computer Warning**: If using a shared computer, other users may be able to see your stored content. Consider using private/incognito mode or clearing data when finished.

## Contributing

Contributions are welcome! See [Contributing Guide](docs/contributing.md) for details.

- Report issues and suggest features
- Submit pull requests
- Add new themes or fonts
- Improve documentation

## Links

- **Website**: [ton3s.com](https://ton3s.com)
- **GitHub**: [github.com/hypercoind/TON3S](https://github.com/hypercoind/TON3S)

## License

This project is open source. See the repository for license details.

---

*Start writing today. Your words matter.*
