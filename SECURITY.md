# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly via
[GitHub Private Security Advisory](https://github.com/hypercoind/TON3S/security/advisories/new).

Do **not** open a public issue for security vulnerabilities.

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Security Architecture

### Nostr Key Handling

- Private keys entered in-app are held **only in WASM memory** (Rust/k256 crate).
- Keys are zeroed on disconnect using the `zeroize` crate.
- Keys are **never** written to disk, IndexedDB, or transmitted to any server.
- We recommend using a NIP-07 browser extension (e.g., Alby, nos2x) for key management.

### Data Privacy

- All note data is stored locally in the browser via IndexedDB.
- The backend serves only as a WebSocket proxy for Nostr relays, providing IP privacy.
- No analytics, cookies, tracking, or telemetry of any kind.

### Backend Proxy

- SSRF protection: private IP ranges and loopback addresses are blocked.
- DNS pinning prevents DNS rebinding attacks.
- Rate limiting: 30 messages/second per client, max 10 relay connections.
- Maximum WebSocket message size: 64 KB.

## Supported Versions

Only the latest release on `main` receives security updates.
