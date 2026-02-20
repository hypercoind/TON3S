# Troubleshooting

## Quick Checks First

1. Hard refresh the page.
2. Confirm you are on the expected TON3S URL/environment.
3. Retry after temporarily disabling browser extensions that alter page behavior.

## Notes Not Saving

- Confirm browser storage is enabled.
- Check for private mode restrictions in your browser.
- Export JSON immediately if storage appears unstable.

## Nostr Connection Problems

- Verify backend is running (`/health`).
- Confirm WebSocket path `/ws/nostr` is reachable.
- In production, ensure reverse proxy supports WebSocket upgrades.

## Media Upload Failed

- Verify file type and size limits.
- Check Blossom server URL and availability.
- For proxy uploads, confirm backend can resolve external HTTPS hostnames.

## App Loads but UI Is Broken

- Hard refresh.
- Clear PWA/service worker cache.
- Restart frontend container or dev server.

## Import Fails

- Ensure extension is `.json` or `.md`.
- Keep import files under 50 MB.
- Validate that JSON payload is well formed.

## Still Stuck?

Collect this before opening an issue:

1. Browser + version
2. TON3S version/commit if self-hosted
3. Exact error text and reproduction steps
