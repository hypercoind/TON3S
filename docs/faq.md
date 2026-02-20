# Frequently Asked Questions

> Legacy long-form guide. For modular docs, start at [Documentation Hub](README.md).

## Where is my data stored?

Notes and settings are stored locally in your browser profile (IndexedDB). TON3S does not require an account.

## Does TON3S work offline?

Yes. After initial load, core writing workflow works offline as a PWA. Network is needed for Nostr publishing and external uploads.

## Do I need Nostr to use TON3S?

No. Nostr is optional.

## Why is there a backend if notes are local?

The backend is used for privacy and networking features:

- WebSocket Nostr relay proxy (`/ws/nostr`)
- proxy media uploads for small files (`/api/media/upload`)

## What are the import/export limits?

- Import accepts `.json` and `.md`.
- Max import size is 50 MB.
- Media upload max is 100 MB.
- Media at or below 10 MB uses proxy upload; larger files upload direct.

## Can I export to PDF?

Not directly. Export Markdown and convert with your preferred Markdown-to-PDF workflow.

## Is there a mobile app?

TON3S is a Progressive Web App. Install from browser home-screen/install UI.

## Is my IP hidden when publishing to Nostr?

With normal proxy flow, relays see backend IP rather than your client IP.

## Are my notes safe on a shared computer?

Only as safe as the browser profile. Anyone with access to that profile can access local notes.

## How do I back up safely?

Export all notes as JSON regularly. Keep at least one offline backup copy.

## Can I self-host?

Yes. Start with Docker Compose and, for production, use Caddy overlay with HTTPS.

## Where should I report bugs?

Use the GitHub issue tracker with:

- reproduction steps,
- expected vs actual behavior,
- browser/OS/version,
- logs or screenshots where possible.

## Related Guides

- [User Documentation](users/README.md)
- [Developer Documentation](developers/README.md)
- [Self-Hosting Guide](self-hosting.md)
- [Contributing Guide](contributing.md)
