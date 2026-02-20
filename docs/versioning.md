# Versioning Policy

TON3S uses two independent version tracks:

- App version (`MAJOR.MINOR.PATCH`): release version for frontend, backend, manifests, and runtime metadata.
- Export schema version (`MAJOR.MINOR.PATCH`): JSON import/export format compatibility for note backups.

## Single Source of Truth

- App version source is the root `VERSION` file.
- Do not manually edit version fields in `package.json`, `package-lock.json`, or `k8s/Chart.yaml`.

## Commands

```bash
# Verify all app-version targets are in sync
npm run version:check

# Sync all app-version targets from VERSION
npm run version:sync

# Bump VERSION (major|minor|patch) and sync targets
npm run version:bump -- patch
```

## SemVer Rules

- `PATCH`: bug fixes, dependency patches, internal improvements with no public behavior break.
- `MINOR`: backward-compatible features and non-breaking API additions.
- `MAJOR`: breaking changes to APIs, runtime behavior, or deployment contracts.

## Export Schema Rules

- Export schema constant lives in `frontend/src/constants/versions.js` as `EXPORT_SCHEMA_VERSION`.
- Bump schema `PATCH` or `MINOR` for backward-compatible format additions.
- Bump schema `MAJOR` for incompatible import/export format changes.
- Import logic should continue to accept legacy fields (`version`, `documents`) where practical.

## Release Checklist

1. Ensure changelog top entry matches current app version in `VERSION`.
2. Run `npm run version:check`.
3. Run tests and lint.
4. Create git tag `vX.Y.Z` after merge.
