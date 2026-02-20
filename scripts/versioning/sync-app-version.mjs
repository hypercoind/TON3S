#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const APP_VERSION_FILE = path.join(REPO_ROOT, 'VERSION');
const APP_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

const PACKAGE_FILES = ['package.json', 'backend/package.json', 'frontend/package.json'];
const PACKAGE_LOCK_FILES = ['package-lock.json', 'backend/package-lock.json', 'frontend/package-lock.json'];
const CHART_FILE = 'k8s/Chart.yaml';

const readText = relativePath => readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
const writeText = (relativePath, content) => writeFileSync(path.join(REPO_ROOT, relativePath), content);

const readAppVersion = () => {
    const version = readText('VERSION').trim();
    if (!APP_VERSION_PATTERN.test(version)) {
        throw new Error(
            `Invalid app version "${version}" in VERSION. Expected MAJOR.MINOR.PATCH format.`
        );
    }
    return version;
};

const updatePackageJsonVersion = (relativePath, appVersion) => {
    const json = JSON.parse(readText(relativePath));
    const previousVersion = json.version;
    if (previousVersion === appVersion) {
        return false;
    }

    json.version = appVersion;
    writeText(relativePath, `${JSON.stringify(json, null, 2)}\n`);
    return true;
};

const updatePackageLockVersion = (relativePath, appVersion) => {
    const json = JSON.parse(readText(relativePath));
    let changed = false;

    if (json.version !== appVersion) {
        json.version = appVersion;
        changed = true;
    }

    if (json.packages?.[''] && json.packages[''].version !== appVersion) {
        json.packages[''].version = appVersion;
        changed = true;
    }

    if (changed) {
        writeText(relativePath, `${JSON.stringify(json, null, 2)}\n`);
    }

    return changed;
};

const updateChartAppVersion = (relativePath, appVersion) => {
    const content = readText(relativePath);
    const nextContent = content.replace(/^appVersion:\s*"?[^"\n]+"?\s*$/m, `appVersion: "${appVersion}"`);

    if (nextContent === content) {
        return false;
    }

    writeText(relativePath, nextContent);
    return true;
};

const main = () => {
    // Ensures file existence before any write attempts.
    readFileSync(APP_VERSION_FILE, 'utf8');

    const appVersion = readAppVersion();
    const changedFiles = [];

    for (const file of PACKAGE_FILES) {
        if (updatePackageJsonVersion(file, appVersion)) {
            changedFiles.push(file);
        }
    }

    for (const file of PACKAGE_LOCK_FILES) {
        if (updatePackageLockVersion(file, appVersion)) {
            changedFiles.push(file);
        }
    }

    if (updateChartAppVersion(CHART_FILE, appVersion)) {
        changedFiles.push(CHART_FILE);
    }

    if (changedFiles.length === 0) {
        console.log(`Version sync complete: all targets already at ${appVersion}`);
        return;
    }

    console.log(`Version sync complete: set app version to ${appVersion}`);
    for (const file of changedFiles) {
        console.log(`- ${file}`);
    }
};

main();
