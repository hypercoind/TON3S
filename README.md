# TON3S

**Write to Inspire** | [ton3s.com](https://ton3s.com)

A privacy-focused, distraction-free writing app. All data stays in your browser. Publish to Nostr with IP privacy through a backend proxy.

## Features

**Writing** - Distraction-free editor with auto-save, zen mode, and multi-note support with sidebar search

**Customization** - 72 themes (Catppuccin, Dracula, Gruvbox, Tokyo Night, Nord, and more) and 27 fonts

**Privacy** - 100% local storage (IndexedDB), no cookies or tracking, IP-masking Nostr proxy

**Publishing** - Publish notes (Kind 1) and long-form articles (Kind 30023) to Nostr relays

**Import/Export** - Export to JSON and Markdown (with YAML frontmatter), import JSON and Markdown files

**Media** - Drag-drop, paste, or keyboard upload images and video via Blossom protocol

**Mobile/Offline** - PWA with offline support, mobile-optimized layout with bottom navigation

## Quick Start

### Use Online

Visit [ton3s.com](https://ton3s.com) to start writing immediately.

### Self-Host with Docker

```bash
git clone https://github.com/hypercoind/TON3S.git
cd TON3S
docker compose up -d
```

Open `http://localhost:3002`

### Develop Locally

```bash
# Frontend (terminal 1)
cd frontend && npm install && npm run dev

# Backend (terminal 2)
cd backend && npm install && npm run dev
```

Open `http://localhost:3000`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS, Vite 6, Dexie.js (IndexedDB), PWA |
| Backend | Node.js 22, Fastify 5, WebSocket |
| Signing | Rust WASM (k256 secp256k1 Schnorr) |
| Deployment | Docker, nginx, Caddy (production) |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + 1` | Title style |
| `Cmd/Ctrl + 2` | Heading style |
| `Cmd/Ctrl + 3` | Body style |
| `Cmd/Ctrl + T` | Rotate theme |
| `Cmd/Ctrl + N` | New note |
| `Cmd/Ctrl + K` | Search notes |
| `Cmd/Ctrl + S` | Open save menu |
| `Cmd/Ctrl + \` | Toggle sidebar |
| `Cmd/Ctrl + Shift + U` | Upload media |
| `Cmd/Ctrl + Shift + ?` | Show shortcuts |
| `Escape` | Exit zen mode / close panels |

## Documentation

| Guide | Audience | Description |
|-------|----------|-------------|
| [Getting Started](docs/getting-started.md) | Everyone | Quick setup for users and developers |
| [User Guide](docs/user-guide.md) | End users | Complete feature documentation |
| [Nostr Guide](docs/nostr-guide.md) | End users | Publishing to Nostr network |
| [FAQ](docs/faq.md) | Everyone | Common questions answered |
| [Self-Hosting](docs/self-hosting.md) | Operators | Production deployment with Caddy |
| [Architecture](docs/architecture.md) | Developers | System design and components |
| [Development](docs/development.md) | Developers | Local setup and workflow |
| [Deployment](docs/deployment.md) | Developers | Docker deployment guide |
| [Contributing](docs/contributing.md) | Developers | How to contribute |
| [Changelog](CHANGELOG.md) | Everyone | Version history |

## Privacy

All data is stored locally in your browser using IndexedDB. Nothing is sent to external servers unless you choose to publish to Nostr. When publishing, all relay traffic goes through a backend WebSocket proxy so your IP address is never exposed to relays.

> **Shared Computer Warning**: Other users of the same browser profile may be able to see your stored content. Use private/incognito mode or clear data when finished.

## Support TON3S

TON3S is free and open source. If you find it useful, consider a Bitcoin donation:

- **Lightning**: ton3s@coinos.io
- **On-chain**: Available in the app via the donation button

## Contributing

Contributions are welcome! See the [Contributing Guide](docs/contributing.md) for details.

## License

[MIT](LICENSE)
