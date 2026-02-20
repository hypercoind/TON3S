# Import, Export, and Backups

## Export Formats

### Markdown (`.md`)

- Exports a single note.
- Includes YAML frontmatter with title, tags, and timestamps.
- Includes Nostr metadata when available.

### JSON (`.json`)

- Export one note or all notes.
- Best format for complete restore and migration.

## Import Formats

- JSON exports from TON3S.
- Markdown files (`.md`) converted into note content.

## Import Limits

- Max import file size is 50 MB.
- Unsupported file extensions are rejected.

## Backup Recommendations (Simple Routine)

1. Export all notes as JSON weekly.
2. Keep at least one offline copy.
3. Keep one cloud copy with your own encryption policy.

## Restore Workflow

1. Open TON3S.
2. Use Import from the save/settings controls.
3. Select your JSON backup.
4. Verify notes and tags.

## Before Clearing Browser Data

Always export a fresh JSON backup before:

- clearing browser storage,
- uninstalling the browser,
- switching devices or browser profiles.

## Next Step

1. Read [Privacy and Security](privacy-and-security.md).
2. If import/export fails, go to [Troubleshooting](troubleshooting.md).
