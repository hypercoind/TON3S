# User Guide

> Looking for modular user docs? Start at [User Documentation](users/README.md).

This legacy long-form guide explains the complete TON3S user experience in one place.

## What TON3S Is

TON3S is a privacy-first writing app:

- notes stay in your browser profile (IndexedDB),
- no account is required,
- Nostr publishing is optional,
- media uploads support privacy-preserving and direct modes.

## Interface Mental Model

The app has four core areas:

1. Header: notes toggle, Nostr toggle, theme and font controls.
2. Sidebar: create/select/search/tag notes.
3. Editor: write content with auto-save.
4. Status bar: counts, settings, import/export, data controls.

On mobile, these areas are presented as page views (Editor, Notes, Nostr, Donate).

## Daily Writing Workflow

1. Open or create a note.
2. Write in the editor.
3. TON3S auto-saves continuously.
4. Add tags for searchability.
5. Export JSON periodically for backup.

### Auto-Save Behavior

- Save state is tracked in the UI.
- Notes persist across refreshes in the same browser profile.
- If local storage becomes unstable, export JSON immediately.

## Notes, Search, and Tags

### Notes

- Create notes from the notes panel.
- Select notes from the list to load them.
- Delete notes from note actions.

### Search

Search matches across:

- title,
- note text,
- tags.

### Tags

- Tags are attached per note.
- Use short, consistent labels to make search effective.

## Appearance and Focus

### Themes and Fonts

- TON3S includes large built-in theme and font sets.
- Theme and font choices persist locally.

### Zen Mode

- Zen mode can activate automatically while typing.
- `Escape` exits zen mode and closes open panels/popups.
- Significant mouse movement also exits zen mode.

## Media Uploads

### Supported Types

- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Video: `video/mp4`, `video/webm`

### Size and Privacy Rules

- Max media size: 100 MB
- Files up to 10 MB: uploaded via backend proxy (`/api/media/upload`)
- Files above 10 MB: uploaded directly to Blossom server

If upload is direct, the Blossom server can see your client IP.

## Nostr Publishing (Optional)

TON3S supports:

- Kind `1` (short notes)
- Kind `30023` (long-form articles)

### Signing Options

- NIP-07 extension (recommended)
- Local private key mode (WASM signer)

### Relay Privacy Model

- Relay traffic is proxied via backend `/ws/nostr`.
- Relays see content and pubkey.
- With proxy flow, relays do not see your client IP.

## Import, Export, and Recovery

### Export Options

From Settings:

- All notes as JSON
- Current note as JSON
- Current note as Markdown (`.md`)

### Import Options

- TON3S JSON exports
- Markdown files (`.md`)
- Max import size: 50 MB

### Backup Routine

Recommended minimum:

1. Export all notes as JSON weekly.
2. Keep one offline copy.
3. Keep one cloud copy under your own encryption policy.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + N` | New note |
| `Cmd/Ctrl + K` | Focus note search |
| `Cmd/Ctrl + F` | Focus note search |
| `Cmd/Ctrl + T` | Rotate theme |
| `Cmd/Ctrl + Shift + U` | Open media picker |
| `Cmd/Ctrl + Shift + ?` | Show shortcut help |
| `Escape` | Exit zen mode and close active panels/popups |

## Privacy Notes

- Notes and settings are local by default.
- Publishing/import/export are explicit user actions.
- Shared browser profiles can expose local notes to other users of that profile.

## Common Problems and Fast Fixes

### Notes not appearing after restart

- Confirm you are in the same browser profile.
- Check storage/privacy mode restrictions.

### Nostr publish fails

- Reconnect signer.
- Confirm backend proxy path `/ws/nostr` is reachable.
- Try fewer relays.

### Upload fails

- Validate file type and size.
- Verify Blossom server URL.

## Related Guides

- [Quick Start](users/quick-start.md)
- [Writing Workflow](users/writing-workflow.md)
- [Import, Export, and Backups](users/import-export.md)
- [Privacy and Security](users/privacy-and-security.md)
- [Troubleshooting](users/troubleshooting.md)
