# Media Uploads

TON3S supports media embedding through Blossom-compatible servers.

## Supported Types

- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Video: `video/mp4`, `video/webm`

## Size Rules

- Maximum accepted media size: 100 MB.
- Files up to 10 MB are uploaded through TON3S backend proxy (IP privacy preserved).
- Files above 10 MB are uploaded directly to the Blossom server (your IP is visible to that server).

## Upload Methods

- Drag and drop
- Paste from clipboard
- `Cmd/Ctrl + Shift + U` file picker

## Security and Validation

- Empty files are rejected.
- Unsupported MIME types are rejected.
- The backend proxy restricts upstream uploads and validates destination URLs.

## Privacy Guidance

If IP privacy is critical, keep media uploads at or below 10 MB or use your own trusted Blossom server.

## Quick Decision Guide

- Use files at or below 10 MB when privacy is the priority.
- Use larger files only when you trust the Blossom server operator.
- If you see a privacy warning prompt, review file size and confirm intentionally.

## Next Step

Continue to [Nostr Publishing](nostr-publishing.md) if you also want to publish notes.
