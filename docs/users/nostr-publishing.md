# Nostr Publishing

TON3S can publish notes to Nostr through a backend WebSocket proxy.

If you only want private local notes, you can skip this guide.

## Signing Options

- NIP-07 browser extension (recommended)
- In-app private key mode using local WASM signer

## What Gets Published

- Kind `1`: short notes
- Kind `30023`: long-form notes

## Default Relay Flow

1. TON3S connects to backend proxy at `/ws/nostr`.
2. Proxy connects to relays on your behalf.
3. Events are signed client-side, then forwarded through proxy.

## Privacy Model

- Relays see event content and pubkey.
- Relays do not see your client IP when using the proxy path.

## Session Behavior

- Private keys are held in WASM memory during session.
- On unload/page hide, the key is cleared.

## Publish Checklist

1. Open Nostr panel.
2. Connect extension signer or local key signer.
3. Write your note.
4. Choose Kind `1` or Kind `30023`.
5. Approve signing prompt and confirm relay status.

## Common Issues

- Extension not detected: refresh after extension install.
- Relay failures: switch or remove unreliable relays.
- Signature errors: reconnect signer and retry publish.

## Next Step

Read [Privacy and Security](privacy-and-security.md) to understand what data relays can see.
