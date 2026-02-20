# Testing and Quality

## Test Commands

### Root

- `npm test`
- `npm run test:coverage`
- `npm run test:e2e`

### Frontend

- Unit/integration: `npm -C frontend test`
- Coverage: `npm -C frontend run test:coverage`
- E2E: `npm -C frontend run test:e2e`

### Backend

- Unit/integration: `npm -C backend test`
- Coverage: `npm -C backend run test:coverage`

## Practical Workflow

1. Run focused tests for changed area first.
2. Run lint.
3. Run full root test suite before merge.
4. Add tests for behavior changes, not just happy path.

## Coverage Thresholds

Configured in Vitest:

- Frontend global minimums: 30% statements/branches/functions/lines
- Backend global minimums: 50% statements/branches/functions/lines

## Lint and Format

- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`

## Current Test Areas

### Frontend

- Components
- State system
- Markdown and sanitizer utils
- Nostr and storage services
- Playwright coverage for zen mode behavior

### Backend

- HTTP endpoints
- WebSocket proxy behavior
- Media upload route
- SSRF validation utilities

## PR Quality Checklist

1. Run tests for changed area.
2. Run full `npm test` before merge.
3. Add or update tests for behavioral changes.
4. Update docs when UX/API/ops behavior changes.

## Next Step

Use [Contributing Workflow](contributing.md) to package changes for review.
