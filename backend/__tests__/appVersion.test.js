import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { loadAppVersion } from '../src/config/appVersion.js';

const mockReadText = mapping => {
    return filePath => {
        const normalized = filePath.split(path.sep).join('/');
        for (const [suffix, value] of Object.entries(mapping)) {
            if (normalized.endsWith(suffix)) {
                if (value instanceof Error) {
                    throw value;
                }
                return value;
            }
        }
        throw new Error(`Unexpected read: ${normalized}`);
    };
};

describe('loadAppVersion', () => {
    it('prefers APP_VERSION env when set', () => {
        const readTextFile = vi.fn(() => '1.0.0');
        const result = loadAppVersion({
            env: { APP_VERSION: '2.3.4' },
            readTextFile
        });

        expect(result).toBe('2.3.4');
        expect(readTextFile).not.toHaveBeenCalled();
    });

    it('rejects invalid APP_VERSION env value', () => {
        expect(() =>
            loadAppVersion({
                env: { APP_VERSION: '2.3' },
                readTextFile: vi.fn()
            })
        ).toThrow('Invalid APP_VERSION');
    });

    it('uses root VERSION when APP_VERSION is not set', () => {
        const readTextFile = mockReadText({
            '/VERSION': '1.2.3\n',
            '/backend/package.json': JSON.stringify({ version: '9.9.9' })
        });

        const result = loadAppVersion({ env: {}, readTextFile });
        expect(result).toBe('1.2.3');
    });

    it('falls back to backend/package.json when VERSION is unavailable', () => {
        const readTextFile = mockReadText({
            '/VERSION': new Error('ENOENT'),
            '/backend/package.json': JSON.stringify({ version: '1.4.5' })
        });

        const result = loadAppVersion({ env: {}, readTextFile });
        expect(result).toBe('1.4.5');
    });

    it('throws when no valid source is available', () => {
        const readTextFile = mockReadText({
            '/VERSION': new Error('ENOENT'),
            '/backend/package.json': JSON.stringify({ version: 'invalid' })
        });

        expect(() => loadAppVersion({ env: {}, readTextFile })).toThrow(
            'Unable to resolve app version'
        );
    });
});
