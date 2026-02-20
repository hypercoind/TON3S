# Developer Troubleshooting

## First Response Checklist

1. Confirm frontend and backend processes are both running.
2. Verify versions for Node, npm, and `wasm-pack`.
3. Re-run with clean logs (`docker compose logs -f` or local terminals).

## Frontend Fails to Start (`wasm-pack` missing)

Symptom:

- `npm run dev` in `frontend/` exits before Vite starts.

Fix:

```bash
cargo install wasm-pack
```

Then rerun frontend dev command.

## Backend WebSocket Proxy Not Reachable

Checks:

1. Backend process is running on `3001`.
2. Frontend proxy config points `/ws/nostr` to backend.
3. Reverse proxy allows WebSocket upgrade headers.

## CORS or Origin Rejection

- Verify `FRONTEND_URL` in backend environment.
- In production, ensure browser origin exactly matches allowlist host.

## Media Proxy Upload Returns 4xx/5xx

- Confirm `blossomServer` is HTTPS and publicly reachable.
- Confirm target hostname does not resolve to private/internal IP.
- Keep proxied file size below backend limit.

## Tests Failing Due to Coverage

- Run changed test suites with coverage locally.
- Add tests in the impacted module rather than lowering thresholds.

## Docker Deployment Not Externally Reachable

- Verify Caddy container is healthy.
- Confirm DNS `A` record points to server.
- Check firewall allows inbound `80/443`.

## Escalation

If unresolved, capture command output, logs, and exact reproduction steps before opening an issue.
