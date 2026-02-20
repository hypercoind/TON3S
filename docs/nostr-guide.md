# Nostr Guide

> Legacy long-form guide. For the modular path, start at [Nostr Publishing](users/nostr-publishing.md).

This guide explains how TON3S publishes to Nostr, what data is shared, and how to troubleshoot common issues.

## Nostr in TON3S

Nostr support is optional. You can use TON3S fully as a local writing app without ever connecting to relays.

When enabled, TON3S can publish:

- Kind `1` events (short notes)
- Kind `30023` events (long-form)

## Signing Modes

TON3S supports two signer paths:

1. NIP-07 extension signer (recommended)
2. Local private key signer in WASM memory

### Extension Signer

Pros:

- key management delegated to extension,
- better separation from app logic.

### Local Key Signer

Pros:

- no extension install required.

Tradeoff:

- key entry is your responsibility.

## Connection Model

TON3S does not connect directly from browser to relays. It uses backend proxy endpoint `/ws/nostr`.

Flow:

1. Browser connects to proxy.
2. Proxy opens relay sockets.
3. Signed events are broadcast through proxy.

This protects client IP from relay operators in normal proxy flow.

## Message Protocol (Client <-> Proxy)

Client to proxy:

- `['CONNECT', relayUrl]`
- `['DISCONNECT', relayUrl]`
- `['SEND', relayUrl, relayMessage]`
- `['BROADCAST', relayMessage]`

Proxy to client:

- `['RELAY_STATUS', relayUrl, status, optionalError]`
- `['RELAY_MESSAGE', relayUrl, message]`
- `['ERROR', message]`

## What Gets Published

### Kind 1

- Uses plain-text content from note.
- Best for short posts.

### Kind 30023

- Uses markdown-derived content for long form.
- Includes tags like title and publish timestamp.

## Relay Strategy

- TON3S connects to configured default relays.
- Defaults may evolve by release.
- Backend also exposes relay defaults at `GET /api/relays`.

Recommendation:

- keep relay list small and reliable,
- remove relays with repeated errors/timeouts.

## Privacy Boundaries

### Relays can see

- event content,
- pubkey,
- event metadata/tags.

### Relays cannot see (proxy flow)

- your browser IP address.

### Important exception

Media uploads over 10 MB use direct Blossom upload and can expose your IP to that Blossom server.

## Security Controls (Backend)

- strict WebSocket origin validation,
- relay URL validation and SSRF protections,
- per-client relay/message/queue limits.

## Troubleshooting

### Extension not detected

- install/reload extension,
- refresh page,
- reconnect from Nostr panel.

### Connected but publish fails

- verify backend availability,
- reduce relay set,
- retry with signer reconnected.

### Persistent relay errors

- check relay availability,
- remove failing relay,
- retry publish.

## Operational Verification (Self-Hosted)

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/relays
```

For browser path checks, ensure reverse proxy forwards `/ws/nostr` upgrades correctly.

## Related Guides

- [Nostr Publishing](users/nostr-publishing.md)
- [Privacy and Security](users/privacy-and-security.md)
- [Backend Guide](developers/backend-guide.md)
- [Developer Troubleshooting](developers/troubleshooting.md)
