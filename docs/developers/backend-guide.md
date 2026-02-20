# Backend Guide

## Runtime Stack

- Fastify 5
- `@fastify/websocket`
- `@fastify/multipart`
- `@fastify/cors`
- `@fastify/rate-limit`
- `ws` relay client

## HTTP Endpoints

- `GET /health`: service health payload
- `GET /api/info`: service metadata
- `GET /api/relays`: default relay list
- `POST /api/media/upload`: Blossom upload proxy for smaller files

## WebSocket Endpoint

- `GET /ws/nostr` (upgrade)

Origin is strictly validated before client sessions are accepted.

## Proxy Message Protocol

Client to proxy:

- `['CONNECT', relayUrl]`
- `['DISCONNECT', relayUrl]`
- `['SEND', relayUrl, relayMessage]`
- `['BROADCAST', relayMessage]`

Proxy to client:

- `['RELAY_STATUS', relayUrl, status, optionalError]`
- `['RELAY_MESSAGE', relayUrl, message]`
- `['ERROR', message]`

## Limits and Safeguards

- HTTP rate limit: 100 requests/minute/client
- Max inbound message size: 64 KB
- Max relay connections/client: 10
- Rate limit: 30 messages/second/client
- Max queued messages/client: 100
- Relay handshake timeout: 10 seconds
- Multipart file limit: 11 MB on backend route

## SSRF Protection

Shared utilities in `backend/src/utils/ssrf.js` enforce:

- Allowed schemes (`ws`, `wss`, `https` depending on route)
- Blocked hostnames (`localhost`, metadata endpoints, loopback)
- DNS resolution and private IP rejection

## Environment Variables

- `PORT` (default `3001`)
- `HOST` (default `0.0.0.0`)
- `FRONTEND_URL` (added to CORS allowlist)
- `NODE_ENV` (affects localhost origin allowance)

## Quick Validation Commands

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/info
curl http://localhost:3001/api/relays
```

## Next Step

1. Continue with [Testing and Quality](testing-and-quality.md).
2. For production behavior, use [Deployment and Operations](deployment-and-operations.md).
