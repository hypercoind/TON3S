# Developer Documentation

This track is for contributors and operators working on TON3S internals.

## Recommended Reading Order

1. [Local Setup](local-setup.md)
2. [System Architecture](system-architecture.md)
3. [Frontend Guide](frontend-guide.md)
4. [Backend Guide](backend-guide.md)
5. [Testing and Quality](testing-and-quality.md)
6. [Deployment and Operations](deployment-and-operations.md)
7. [Contributing Workflow](contributing.md)
8. [Troubleshooting](troubleshooting.md)

## Task-Based Entry Points

| Task | Start here |
|---|---|
| Run the app locally | [Local Setup](local-setup.md) |
| Understand architecture boundaries | [System Architecture](system-architecture.md) |
| Build UI/state changes | [Frontend Guide](frontend-guide.md) |
| Modify proxy/API behavior | [Backend Guide](backend-guide.md) |
| Validate quality gates | [Testing and Quality](testing-and-quality.md) |
| Ship to production | [Deployment and Operations](deployment-and-operations.md) |

## Repo Overview

- `frontend/`: Vite app, UI components, state, services, CSS.
- `backend/`: Fastify API, WebSocket Nostr proxy, media upload proxy.
- `docs/`: user and developer documentation.
- `k8s/`: Helm chart and Kubernetes manifests.
- `scripts/`: operational scripts such as VPS bootstrap.
