# Privacy and Security

## Data Storage Model

- Notes and settings are stored locally in IndexedDB.
- TON3S does not require an account.
- No analytics or tracking is required for core use.

## Nostr Privacy

- Event signing happens client-side.
- Relay traffic is proxied through backend `/ws/nostr`.
- The proxy includes input limits and relay URL validation to reduce abuse.

## Media Upload Privacy

- Files 10 MB and below use backend proxy upload route `/api/media/upload`.
- Files above 10 MB are direct uploads to Blossom servers.

## Shared Device Warning

Anyone using the same browser profile may access stored notes.

Use one of these on shared systems:

1. Private/incognito browsing
2. Separate browser profile
3. Manual data clearing after use

## Transport Security

- Production setup uses Caddy for HTTPS and HSTS.
- Frontend sends strict security headers via nginx.

## Privacy Summary

- Local writing stays local unless you explicitly import, export, or publish.
- Nostr relays can see published content and pubkey, but proxy mode hides your client IP from relays.
- Large media uploads (over 10 MB) are direct and expose your IP to the selected Blossom server.

## Next Step

If something looks wrong in behavior, continue to [Troubleshooting](troubleshooting.md).
