#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const APP_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

const bumpType = process.argv[2];
const validBumpTypes = new Set(['major', 'minor', 'patch']);

if (!validBumpTypes.has(bumpType)) {
    console.error('Usage: npm run version:bump -- <major|minor|patch>');
    process.exit(1);
}

const versionPath = path.join(REPO_ROOT, 'VERSION');
const currentVersion = readFileSync(versionPath, 'utf8').trim();

if (!APP_VERSION_PATTERN.test(currentVersion)) {
    console.error(`Invalid VERSION value "${currentVersion}". Expected MAJOR.MINOR.PATCH.`);
    process.exit(1);
}

const [major, minor, patch] = currentVersion.split('.').map(Number);
let nextVersion;

if (bumpType === 'major') {
    nextVersion = `${major + 1}.0.0`;
} else if (bumpType === 'minor') {
    nextVersion = `${major}.${minor + 1}.0`;
} else {
    nextVersion = `${major}.${minor}.${patch + 1}`;
}

writeFileSync(versionPath, `${nextVersion}\n`);
console.log(`Bumped VERSION: ${currentVersion} -> ${nextVersion}`);

const syncResult = spawnSync('node', ['scripts/versioning/sync-app-version.mjs'], {
    cwd: REPO_ROOT,
    stdio: 'inherit'
});

if (syncResult.status !== 0) {
    process.exit(syncResult.status ?? 1);
}
