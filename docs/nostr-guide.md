# Nostr Guide

Publish your writing to the Nostr decentralized network.

## What is Nostr?

Nostr (Notes and Other Stuff Transmitted by Relays) is a decentralized protocol for social networking. Unlike traditional platforms:

- **No central authority** - Your content lives on multiple relays
- **Censorship resistant** - No single point of control
- **Portable identity** - Your keys work across all Nostr apps
- **Open protocol** - Anyone can build compatible apps

## Prerequisites

To publish to Nostr, you need a **browser extension** that manages your keys:

### Recommended Extensions

| Extension | Browser | Link |
|-----------|---------|------|
| **nos2x** | Chrome, Firefox | [GitHub](https://github.com/fiatjaf/nos2x) |
| **Alby** | Chrome, Firefox, Safari | [getalby.com](https://getalby.com) |
| **nos2x-fox** | Firefox | [Addons](https://addons.mozilla.org/addon/nos2x-fox/) |
| **Flamingo** | Chrome | [Chrome Store](https://chrome.google.com/webstore/detail/flamingo/) |

These extensions implement [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md), allowing websites to request signatures without exposing your private key.

### Installing an Extension

1. **Install the extension** from your browser's store
2. **Create or import keys**
   - New users: Create a new identity
   - Existing users: Import your private key (nsec)
3. **Secure your key** - Back up your private key safely

## Connecting to TON3S

### First-Time Setup

1. Click the **Nostr button** in the header
2. The Nostr panel opens on the right
3. Click **Connect**
4. Your extension will ask for permission - approve it
5. Your public key (npub) appears when connected

### Connection States

| State | Indicator | Meaning |
|-------|-----------|---------|
| Disconnected | Gray | Not connected to extension |
| Connecting | Pulsing | Waiting for extension |
| Connected | Green | Ready to publish |

## Publishing

### Event Types

TON3S supports two Nostr event types:

**Kind 1 - Short-form Notes**
- Best for: Short posts, updates, thoughts
- Content: Plain text version of your document
- Limit: Works best under 280 characters

**Kind 30023 - Long-form Articles**
- Best for: Blog posts, articles, essays
- Content: Full document with metadata
- Features: Title, publish date, tags

### How to Publish

1. **Connect** your Nostr extension
2. **Write** your document
3. Click **Publish** in the Nostr panel
4. Choose **Note** (kind 1) or **Article** (kind 30023)
5. Your extension will ask to sign - approve it
6. Content is sent to connected relays

### Relays

TON3S connects to these default relays:

- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.nostr.band`
- `wss://relay.snort.social`
- `wss://nostr.wine`

Your content is broadcast to all connected relays for redundancy.

## Privacy Features

### IP Address Protection

TON3S protects your IP address through a **backend proxy**:

```
Your Browser → TON3S Backend → Nostr Relays
              (Your IP hidden)    (Only sees backend IP)
```

Without the proxy, relays would see your IP address. The proxy ensures only the TON3S server's IP is visible to relays.

### What Relays Can See

| Information | Visible? |
|-------------|----------|
| Your content | Yes (it's public) |
| Your public key | Yes (identifies you) |
| Your IP address | No (proxied) |
| Your browser info | No |

### What Stays Private

- Your private key (never leaves extension)
- Your IP address (backend proxy)
- Other documents (only published ones are sent)
- Local storage content

## Managing Published Content

### Viewing Published Status

Documents show their Nostr status:
- **Published** - Event ID and timestamp shown
- **Not published** - "Publish" button available

### Updating Content

Nostr events are immutable. To "update" content:
1. Edit your document
2. Publish again as a new event
3. The new event has a new ID

For long-form articles (kind 30023), the `d` tag allows clients to show the latest version.

### Deleting Content

You can request deletion by publishing a **kind 5** event, but:
- Relays may ignore delete requests
- Content may already be cached/copied
- Deletion is not guaranteed

## Troubleshooting

### Extension Not Detected

**Symptoms:** "No Nostr extension found" message

**Solutions:**
1. Verify extension is installed
2. Refresh the page
3. Check extension is enabled for this site
4. Try a different extension

### Connection Timeout

**Symptoms:** Connecting state never resolves

**Solutions:**
1. Check extension is unlocked
2. Approve the permission request in extension
3. Disable other extensions that might conflict
4. Try in incognito mode

### Publish Failed

**Symptoms:** Error when trying to publish

**Solutions:**
1. Check backend is running (self-hosted)
2. Verify at least one relay is connected
3. Check browser console for errors
4. Try publishing a shorter document

### Relay Connection Issues

**Symptoms:** Relays show as disconnected

**Solutions:**
1. Check your internet connection
2. Some relays may be temporarily down
3. The proxy server might be unreachable
4. Firewall may be blocking WebSocket

### Signature Rejected

**Symptoms:** Extension shows error when signing

**Solutions:**
1. Ensure you're approving the correct event
2. Check extension hasn't locked/timed out
3. Restart the extension
4. Re-import your keys if needed

## Best Practices

### For Privacy

- Use a dedicated Nostr identity for TON3S if desired
- Review content before publishing (it's permanent)
- Remember: Public content is truly public

### For Reach

- Publish to multiple relays for redundancy
- Use descriptive titles for articles
- Consider your audience when choosing note vs article

### For Security

- Never share your private key (nsec)
- Use a hardware signer for high-value identities
- Keep your extension updated
- Use strong passwords for extension

## Further Reading

- [Nostr Protocol](https://github.com/nostr-protocol/nostr) - Protocol specification
- [NIPs](https://github.com/nostr-protocol/nips) - Nostr Implementation Possibilities
- [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) - Browser extension spec
- [NIP-23](https://github.com/nostr-protocol/nips/blob/master/23.md) - Long-form content spec
- [nostr.how](https://nostr.how) - Beginner's guide to Nostr
