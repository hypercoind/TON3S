# User Guide

Complete documentation for using TON3S.

## Interface Overview

TON3S has a minimal interface designed for focused writing:

```
┌─────────────────────────────────────────────────────────┐
│  [Sidebar]  [Theme] [Font] [Zen] [Nostr] [Save]        │  ← Header
├───────────┬─────────────────────────────────────────────┤
│           │                                             │
│ Note      │                                             │
│ List      │              Editor Area                    │
│           │                                             │
│           │                                             │
│ [Search]  │                                             │
│           │                                             │
├───────────┴─────────────────────────────────────────────┤
│  T  H  B                               123 words  567c  │  ← Status Bar
└─────────────────────────────────────────────────────────┘
```

## Writing

### Creating Notes

- Click the **+** button in the sidebar to create a new note
- Or start typing in the editor to create your first note

### Text Styles

TON3S supports three text styles:

| Style | Tag | Usage |
|-------|-----|-------|
| **Title** | h1 | Main note title |
| **Heading** | h2 | Section headings |
| **Body** | p | Regular paragraphs |

To apply a style:
1. Place cursor in the paragraph
2. Click the style button (T, H, or B) in the status bar
3. Or use keyboard shortcuts

### Auto-save

Your work saves automatically:
- Every keystroke triggers a save (throttled to 100ms)
- The save indicator shows "Saving..." then "Saved"
- Content persists even if you close the browser

### Word and Character Count

The status bar displays live counts:
- **Words**: Total word count
- **Characters**: Total character count

## Notes

### Managing Notes

**Creating**: Click the + button in the sidebar

**Switching**: Click any note in the sidebar list

**Deleting**: Hover over a note and click the delete icon

**Searching**: Use the search box at the bottom of the sidebar

### Note List

Notes are sorted by last modified date (newest first). Each entry shows:
- Note title (or "Untitled" if empty)
- Preview of content
- Last modified date

## Customization

### Themes

TON3S includes 72 carefully curated themes:

**Popular themes:**
- Catppuccin (Latte, Frappe, Macchiato, Mocha)
- Dracula (Original, Soft)
- Gruvbox (Light, Dark, Dark Hard)
- Tokyo Night (Storm, Day)
- Nord (Dark, Light)
- Solarized (Light, Dark)
- One Dark (Default, Vivid, Darker)
- Monokai (Classic, Pro, Spectrum)

**How to change:**
- Click the theme button in the header
- Select from dropdown, or
- Click repeatedly to cycle randomly through themes

Themes are remembered between sessions.

### Fonts

27 fonts optimized for writing:

**Programming fonts:**
- JetBrains Mono
- Fira Code
- Source Code Pro
- IBM Plex Mono
- Roboto Mono

**System fonts:**
- Monaco
- Menlo
- Consolas
- DejaVu Sans Mono

**How to change:**
- Click the font button in the header
- Select from dropdown, or
- Click repeatedly to cycle randomly

### Zen Mode

Zen mode provides maximum focus:
- Hides the sidebar
- Hides the header
- Centers the editor
- Press `Esc` or click the zen button to exit

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + 1` | Apply Title style |
| `Ctrl/Cmd + 2` | Apply Heading style |
| `Ctrl/Cmd + 3` | Apply Body style |
| `Ctrl/Cmd + T` | Rotate theme |
| `Ctrl/Cmd + N` | New note |
| `Ctrl/Cmd + K` | Search notes |
| `Ctrl/Cmd + F` | Search notes |
| `Ctrl/Cmd + S` | Open save menu |
| `Ctrl/Cmd + \` | Toggle sidebar |
| `Ctrl/Cmd + Shift + U` | Upload media |
| `Ctrl/Cmd + Shift + ?` | Show keyboard shortcuts |
| `Escape` | Exit zen mode / close panels |

## Exporting

### Markdown Export

Exports the current note as a `.md` file with YAML frontmatter:
- Title, tags, and dates included in frontmatter
- Titles become `# Heading`
- Headings become `## Heading`
- Body text is preserved as-is

### JSON Export

Two JSON export options:

- **Export Note (JSON)** - Exports the current note as a structured JSON file
- **Export All (JSON)** - Exports all notes, tags, and settings for backup

### How to Export

1. Click the settings icon (gear) in the status bar
2. Select the export format from the menu
3. File downloads automatically with an appropriate filename

## Media Upload

TON3S supports uploading images and videos directly into your notes via the Blossom protocol.

### Supported Formats

| Type | Formats |
|------|---------|
| Images | JPEG, PNG, GIF, WebP |
| Video | MP4, WebM |

Maximum file size: 100MB.

### How to Upload

- **Drag and drop** a file onto the editor
- **Paste** an image from your clipboard
- **Keyboard shortcut**: `Ctrl/Cmd + Shift + U` to open the file picker

Uploaded media is inserted inline in the editor at the cursor position.

### Privacy

Files 10MB or smaller are uploaded through the backend proxy, keeping your IP address hidden from the Blossom server. Files larger than 10MB upload directly to the Blossom server.

## Tags

Tags help you organize and find your notes.

### Adding Tags

1. Open the sidebar and select a note
2. Click the tag area below the note title in the sidebar
3. Type a tag name and press Enter

### Using Tags

- Tags are searchable from the sidebar search box
- Tags are included in JSON and Markdown exports (as YAML frontmatter)
- Tags are indexed in the database for fast filtering

## Importing

You can import notes from JSON and Markdown files.

### How to Import

1. Click the settings icon (gear) in the status bar
2. Select **Import**
3. Choose a `.json` or `.md` file (max 50MB)

### Import Formats

- **JSON** - TON3S export format. Supports single notes or full exports with settings.
- **Markdown** - Plain `.md` files. YAML frontmatter (title, tags) is parsed if present.

## Donations

TON3S is free and open source. You can support development with Bitcoin.

### How to Donate

1. Click the donation button in the header (or navigate to the Donate page on mobile)
2. Choose **Lightning** or **On-chain**
3. Select a preset amount or enter a custom amount
4. Scan the QR code with your Bitcoin wallet

**Lightning**: Instant payments via ton3s@coinos.io
**On-chain**: Standard Bitcoin transaction to a rotating address

## Mobile Navigation

On mobile devices, TON3S uses a bottom navigation bar with four pages:

| Page | Purpose |
|------|---------|
| **Editor** | Write and edit your notes |
| **Notes** | Browse and search your note list |
| **Nostr** | Connect and publish to Nostr |
| **Donate** | Support TON3S with Bitcoin |

Tap the navigation icons to switch between pages.

## Nostr Publishing

TON3S can publish your writing to the Nostr decentralized network. See [Nostr Guide](nostr-guide.md) for complete instructions.

## Privacy

### Data Storage

All your data is stored locally in your browser:
- Notes stored in IndexedDB
- Settings stored in localStorage
- Nothing is sent to external servers (except optional Nostr publishing)

### IP Privacy

When publishing to Nostr:
- All relay traffic goes through the backend proxy
- Your IP address is never exposed to relays
- Only the backend server's IP is visible

### Clearing Data

To delete all stored data:
1. Click the settings icon (gear) in the status bar
2. Select **Clear All Data**
3. Confirm the action in the dialog

This removes all notes, tags, and settings from your browser. This action cannot be undone.

### Shared Computers

If using a shared computer:
- Your content may be visible to other users
- Consider using private/incognito mode
- Clear data when finished

## Offline Use

TON3S works offline after initial load:
- All features work without internet
- Notes are stored locally
- Changes sync when back online (Nostr only)

### Installing as PWA

TON3S can be installed as a Progressive Web App:

**Chrome/Edge:**
1. Click the install icon in the address bar
2. Click "Install"

**Safari (iOS):**
1. Tap the Share button
2. Tap "Add to Home Screen"

## Troubleshooting

### Content Not Saving

1. Check if storage is full (browser limit)
2. Try in a regular (non-private) window
3. Clear old notes to free space

### Theme/Font Not Applying

1. Hard refresh the page (Ctrl/Cmd + Shift + R)
2. Clear browser cache
3. Try a different browser

### Export Not Working

- Ensure the note is not empty
- Check your browser's download folder permissions
- Try a different browser if downloads are blocked

### Nostr Issues

See [Nostr Guide - Troubleshooting](nostr-guide.md#troubleshooting).

## Browser Support

TON3S works best in modern browsers:

| Browser | Support |
|---------|---------|
| Chrome 90+ | Full |
| Firefox 90+ | Full |
| Safari 15+ | Full |
| Edge 90+ | Full |

Older browsers may have limited functionality.
