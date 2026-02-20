# Changelog

All notable changes to TON3S are documented here.

## v1.0.1 (2026-02-20)

Patch release for backend hardening and deployment compatibility.

### Fixed

- Backend app version resolution now falls back safely for container builds.
- Media upload proxy now pins upstream upload connection to resolved IP to prevent DNS rebinding.
- SSRF IP classifier now blocks additional IPv4-mapped private ranges.
- Added backend regression tests for app version loading, upload pinning, and mapped-IP SSRF coverage.

## v1.0.0 (2026-02-18)

Initial public release.

### Added

- **Multi-note support** with sidebar navigation, search, and tag editing
- **72 themes** including Catppuccin, Dracula, Gruvbox, Tokyo Night, Nord, Solarized, One Dark, Monokai, and more
- **27 self-hosted fonts** with `@font-face` declarations (no external requests)
- **Nostr publishing** for short notes (Kind 1) and long-form articles (Kind 30023) via backend WebSocket proxy
- **WASM signing** using Rust k256 crate for offline Schnorr key management
- **Media upload** via Blossom protocol with drag-drop, paste, and keyboard shortcut (`Cmd+Shift+U`)
- **Bitcoin donations** panel with Lightning (coinos.io) and on-chain QR codes
- **Import/export** in JSON and Markdown formats with YAML frontmatter
- **PWA support** with offline capability and service worker
- **Zen mode** for distraction-free writing (auto-activates after 3s of continuous typing)
- **Mobile layout** with bottom navigation (Editor, Notes, Nostr, Donate pages)
- **Production deployment** with `docker-compose.prod.yml` and Caddy auto-TLS
- **SSRF protection** in NostrProxy with private IP blocking and DNS pinning
- **Dynamic favicon** that reflects the current theme accent color
- **Toast notifications** for user feedback (success, error, info, warning)
- **Clear all data** option in settings menu
- **Content Security Policy** headers for enhanced security
- **Keyboard shortcuts** help modal (`Cmd+Shift+?`)

### Security

- All relay traffic proxied through backend for IP privacy
- WASM keys stored in Rust memory, never exposed to JavaScript heap
- Input sanitization with HTML tag whitelist (h1, h2, p, br only)
- Paste handler strips all HTML to plain text
- Rate limiting: 100 req/min (HTTP), 30 msg/sec (WebSocket)
- Max 10 relay connections per client, 64KB max message size
