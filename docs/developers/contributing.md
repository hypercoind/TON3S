# Contributing Workflow

## Workflow Summary

1. Create a branch.
2. Implement focused changes.
3. Run lint and tests.
4. Update docs for behavior changes.
5. Open a PR with context and test evidence.

## Recommended Pre-PR Commands

```bash
npm run lint
npm test
```

If frontend behavior changed:

```bash
npm -C frontend run test:e2e
```

## Contribution Areas

- Bug fixes
- UX and editor improvements
- Nostr integration and protocol support
- Security hardening
- Documentation and test coverage

## Code Style

- ESM modules
- Clear service/component boundaries
- Event-driven state updates via `AppState`

## Reference Guides

- [Local Setup](local-setup.md)
- [Frontend Guide](frontend-guide.md)
- [Backend Guide](backend-guide.md)
- [Testing and Quality](testing-and-quality.md)
- Existing long-form guide: [../contributing.md](../contributing.md)

## Next Step

Use [Developer Troubleshooting](troubleshooting.md) when local setup, tests, or deployments fail.
