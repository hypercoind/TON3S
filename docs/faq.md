# Frequently Asked Questions

## Where is my data stored?

All your notes, settings, and tags are stored locally in your browser using IndexedDB. Nothing is sent to any server unless you explicitly publish to Nostr. Different browsers and profiles have separate storage.

## Does TON3S work offline?

Yes. After the initial page load, TON3S works fully offline as a Progressive Web App (PWA). You can install it from your browser for a native app experience. The only feature that requires internet is Nostr publishing.

## What is Nostr and do I need it?

Nostr is a decentralized protocol for publishing content. It's completely optional. You can use TON3S as a private writing app without ever connecting to Nostr. If you want to publish, see the [Nostr Guide](nostr-guide.md).

## Why does TON3S have a backend if everything is local?

The backend serves one purpose: proxying Nostr relay connections. When you publish to Nostr, your browser connects to the TON3S backend instead of directly to relays. This hides your IP address from relay operators. If you don't use Nostr, the backend is never contacted.

## How do I back up my notes?

Use the export feature in the settings menu (gear icon in the status bar):

- **Export All (JSON)** - Exports all notes, tags, and settings as a single JSON file
- **Export Note (Markdown)** - Exports the current note as a `.md` file with YAML frontmatter

Keep these files in a safe location. You can import them back into any TON3S instance.

## How do I import notes?

Open the settings menu in the status bar and select **Import**. TON3S accepts:

- **JSON files** - TON3S export format (single notes or full exports)
- **Markdown files** - Plain `.md` files (with optional YAML frontmatter for tags)

Maximum import file size is 50MB.

## Can I export to PDF?

TON3S does not have PDF export. You can export to Markdown and use any Markdown-to-PDF tool (like Pandoc, Typora, or your browser's print-to-PDF) to convert.

## Is there a mobile app?

TON3S is a Progressive Web App (PWA). On mobile, it has a dedicated layout with bottom navigation for switching between Editor, Notes, Nostr, and Donate pages. To install it:

- **iOS Safari**: Tap Share > Add to Home Screen
- **Android Chrome**: Tap the install banner or Menu > Add to Home Screen

## How can I support TON3S?

You can donate Bitcoin via the donation button in the app:

- **Lightning**: ton3s@coinos.io (instant, low fees)
- **On-chain**: Scan the QR code in the donation panel

You can also contribute code, themes, fonts, or documentation. See the [Contributing Guide](contributing.md).

## Can I self-host TON3S?

Yes. TON3S runs with Docker Compose and can be deployed on any VPS. The production setup uses Caddy for automatic HTTPS. See the [Self-Hosting Guide](self-hosting.md) for step-by-step instructions.
