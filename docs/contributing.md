# Contributing Guide

> Legacy long-form guide. For modular contributor docs, start at [Contributing Workflow](developers/contributing.md).

This guide describes the full contribution process for TON3S.

## What We Accept

- Bug fixes
- Security hardening
- UX/editor improvements
- Nostr and protocol improvements
- Test improvements
- Documentation updates

## Before You Start

1. Search existing issues/PRs for overlap.
2. Prefer small, focused changes.
3. Plan test coverage for behavior changes.

## Setup

Use [Development Guide](development.md) or [Local Setup](developers/local-setup.md) to get running.

## Branching

Create a topic branch from latest main:

```bash
git checkout -b docs/short-description
```

Naming suggestions:

- `fix/...`
- `feature/...`
- `docs/...`
- `refactor/...`

## Change Quality Expectations

- preserve existing architectural boundaries,
- avoid unrelated refactors in the same PR,
- keep docs synced with behavior,
- include tests for new/changed behavior.

## Validation Commands

```bash
npm run lint
npm test
```

If frontend behavior changed:

```bash
npm -C frontend run test:e2e
```

If backend behavior changed, validate endpoint/proxy behavior and relevant backend tests.

## Commit Guidance

Use clear, imperative commit messages.

Examples:

- `docs: refresh legacy user and deployment guides`
- `fix: reject invalid relay URL in proxy connect flow`
- `test: add coverage for media proxy timeout path`

## Pull Request Checklist

1. Explain problem and solution briefly.
2. Link related issue(s).
3. Include test evidence.
4. Include screenshots for UI changes.
5. Note any operational/security impact.

## Review Expectations

- Maintainers may request tighter scope or stronger tests.
- Address feedback with follow-up commits.
- Keep discussion technical and reproducible.

## Security Reporting

For security issues, follow the process in [SECURITY.md](../SECURITY.md) instead of opening a public issue first.

## Documentation Policy

When changing behavior, update at least one of:

- user docs (`docs/users/`)
- developer docs (`docs/developers/`)
- relevant legacy guide (if still referenced)

## Related Guides

- [Contributing Workflow](developers/contributing.md)
- [Testing and Quality](developers/testing-and-quality.md)
- [Developer Troubleshooting](developers/troubleshooting.md)
