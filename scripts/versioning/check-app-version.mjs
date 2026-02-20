#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const APP_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

const PACKAGE_FILES = ['package.json', 'backend/package.json', 'frontend/package.json'];
const PACKAGE_LOCK_FILES = ['package-lock.json', 'backend/package-lock.json', 'frontend/package-lock.json'];
const CHART_FILE = 'k8s/Chart.yaml';
const CHANGELOG_FILE = 'CHANGELOG.md';
const BACKEND_INFO_FILE = 'backend/src/index.js';

const readText = relativePath => readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');

const appVersion = readText('VERSION').trim();
const errors = [];

if (!APP_VERSION_PATTERN.test(appVersion)) {
    errors.push(`VERSION must use MAJOR.MINOR.PATCH format, got "${appVersion}"`);
}

for (const file of PACKAGE_FILES) {
    const json = JSON.parse(readText(file));
    if (json.version !== appVersion) {
        errors.push(`${file} version is "${json.version}" but VERSION is "${appVersion}"`);
    }
}

for (const file of PACKAGE_LOCK_FILES) {
    const json = JSON.parse(readText(file));
    if (json.version !== appVersion) {
        errors.push(`${file} top-level version is "${json.version}" but VERSION is "${appVersion}"`);
    }

    if (json.packages?.[''] && json.packages[''].version !== appVersion) {
        errors.push(
            `${file} packages[\"\"] version is "${json.packages[''].version}" but VERSION is "${appVersion}"`
        );
    }
}

const chartContent = readText(CHART_FILE);
const chartAppVersionMatch = chartContent.match(/^appVersion:\s*"([^"]+)"\s*$/m);
if (!chartAppVersionMatch) {
    errors.push(`${CHART_FILE} is missing appVersion`);
} else if (chartAppVersionMatch[1] !== appVersion) {
    errors.push(
        `${CHART_FILE} appVersion is "${chartAppVersionMatch[1]}" but VERSION is "${appVersion}"`
    );
}

const changelogContent = readText(CHANGELOG_FILE);
const firstReleaseHeading = changelogContent
    .split('\n')
    .find(line => line.startsWith('## ') && !line.startsWith('## ['));

if (!firstReleaseHeading) {
    errors.push(`${CHANGELOG_FILE} is missing a release heading`);
} else if (
    firstReleaseHeading !== '## Unreleased' &&
    !firstReleaseHeading.startsWith(`## v${appVersion} `)
) {
    errors.push(
        `${CHANGELOG_FILE} first heading is "${firstReleaseHeading}" but expected "## v${appVersion} (...)" or "## Unreleased"`
    );
}

const backendInfoContent = readText(BACKEND_INFO_FILE);
if (!backendInfoContent.includes('version: APP_VERSION')) {
    errors.push(`${BACKEND_INFO_FILE} must expose APP_VERSION in /api/info`);
}

if (errors.length > 0) {
    console.error('Version check failed:');
    for (const error of errors) {
        console.error(`- ${error}`);
    }
    console.error('\nRun: npm run version:sync');
    process.exit(1);
}

console.log(`Version check passed for ${appVersion}`);
