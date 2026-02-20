import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const VERSION_FILE = path.resolve(CURRENT_DIR, '../../../VERSION');
const PACKAGE_JSON_FILE = path.resolve(CURRENT_DIR, '../../package.json');
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

const readText = filePath => readFileSync(filePath, 'utf8');

export function loadAppVersion({ env = process.env, readTextFile = readText } = {}) {
    const envVersion = env.APP_VERSION?.trim();
    if (envVersion) {
        if (!SEMVER_PATTERN.test(envVersion)) {
            throw new Error(`Invalid APP_VERSION "${envVersion}". Expected MAJOR.MINOR.PATCH.`);
        }
        return envVersion;
    }

    try {
        const rootVersion = readTextFile(VERSION_FILE).trim();
        if (SEMVER_PATTERN.test(rootVersion)) {
            return rootVersion;
        }
    } catch {
        // Fall through to package.json fallback for container builds.
    }

    try {
        const packageJson = JSON.parse(readTextFile(PACKAGE_JSON_FILE));
        const packageVersion = `${packageJson.version ?? ''}`.trim();
        if (SEMVER_PATTERN.test(packageVersion)) {
            return packageVersion;
        }
    } catch {
        // Fall through to final error.
    }

    throw new Error(
        `Unable to resolve app version from APP_VERSION, ${VERSION_FILE}, or ${PACKAGE_JSON_FILE}`
    );
}

export const APP_VERSION = loadAppVersion();
