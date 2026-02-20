# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: Vite-based SPA (UI in `src/components/`, state in `src/state/`, integrations in `src/services/`, styles in `src/styles/`).
- `backend/`: Fastify API and WebSocket proxy (`src/routes/`, `src/utils/`, `src/websocket/`).
- `docs/`: user and developer documentation; update when behavior changes.
- `scripts/`: operational/versioning scripts.
- `k8s/` and `docker-compose*.yml`: deployment manifests.
- `security-tests/`: focused security validation assets.

## Build, Test, and Development Commands
```bash
# root (recommended pre-PR checks)
npm run lint            # ESLint for frontend/backend JS
npm test                # frontend + backend Vitest suites
npm run test:coverage   # both packages with coverage thresholds
npm run test:e2e        # Playwright E2E (frontend)

# local development
npm -C frontend run dev   # Vite dev server on :3000
npm -C backend run dev    # Fastify with watch on :3001
npm -C frontend run build # production frontend build (+ wasm build)
```

## Coding Style & Naming Conventions
- Language/runtime: ESM JavaScript (Node 22+), plus Rust WASM under `frontend/wasm/`.
- Formatting: Prettier (`.prettierrc`) with 4-space indentation, single quotes, semicolons, no trailing commas.
- Linting: ESLint (`.eslintrc.json`); run `npm run lint:fix` before committing.
- Naming: follow existing patterns.
- Examples: `Editor.js`, `AppState.js`, `NostrService.js` for classes/components; `markdown.js`, `sanitizer.js` for utility modules.

## Testing Guidelines
- Frameworks: Vitest (unit/integration) in both packages, Playwright for frontend E2E (`frontend/e2e/`).
- Test file conventions: `*.test.js` and `__tests__/`.
- Coverage minimums: frontend 30% global and backend 50% global (statements/branches/functions/lines).
- Add tests for behavior changes, including failure/edge paths (not only happy paths).

## Commit & Pull Request Guidelines
- Commit style in history favors short, imperative messages, commonly prefixed (`fix:`, `docs:`, `test:`), plus release commits like `release v1.0.2`.
- Keep commits focused; avoid mixing refactors with behavior changes.
- Suggested branch names: `fix/...`, `feature/...`, `docs/...`, `refactor/...`.
- PRs should include: concise problem/solution summary, linked issue(s), test evidence, UI screenshots when relevant, and any security/operational impact notes.
