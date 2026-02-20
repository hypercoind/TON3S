import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const VERSION_FILE = path.resolve(CURRENT_DIR, '../../../VERSION');

export const APP_VERSION = readFileSync(VERSION_FILE, 'utf8').trim();
