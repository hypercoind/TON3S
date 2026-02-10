import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlossomService, PROXY_THRESHOLD } from '../BlossomService.js';

// Mock dependencies
vi.mock('../NostrAuthService.js', () => ({
    nostrAuthService: {
        signEvent: vi.fn(async event => ({
            ...event,
            id: 'mock-event-id',
            pubkey: 'mock-pubkey',
            sig: 'mock-sig'
        }))
    }
}));

vi.mock('../../state/AppState.js', () => ({
    appState: {
        blossomServer: 'https://blossom.example.com'
    }
}));

describe('BlossomService', () => {
    let service;

    beforeEach(() => {
        service = new BlossomService();
    });

    describe('hashFile', () => {
        it('should compute SHA-256 hash of a file', async () => {
            const content = new TextEncoder().encode('test content');
            const file = new File([content], 'test.txt', { type: 'text/plain' });

            const hash = await service.hashFile(file);

            // SHA-256 of "test content"
            expect(hash).toMatch(/^[0-9a-f]{64}$/);
            expect(hash).toBe('6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72');
        });
    });

    describe('createAuthEvent', () => {
        it('should create correct kind:24242 event structure', async () => {
            const sha256hex = 'abc123def456';
            const event = await service.createAuthEvent(sha256hex);

            expect(event.kind).toBe(24242);
            expect(event.content).toBe('');
            expect(event.id).toBe('mock-event-id');
            expect(event.sig).toBe('mock-sig');

            // Check tags
            const tags = event.tags;
            expect(tags).toContainEqual(['t', 'upload']);
            expect(tags).toContainEqual(['x', 'abc123def456']);

            // Check expiration tag exists and is in the future
            const expirationTag = tags.find(t => t[0] === 'expiration');
            expect(expirationTag).toBeDefined();
            const expiration = parseInt(expirationTag[1]);
            const now = Math.floor(Date.now() / 1000);
            expect(expiration).toBeGreaterThan(now);
            expect(expiration).toBeLessThanOrEqual(now + 300);
        });
    });

    describe('needsDirectUpload', () => {
        it('should return false for files under proxy threshold', () => {
            const file = new File(['x'.repeat(100)], 'small.jpg', { type: 'image/jpeg' });
            expect(service.needsDirectUpload(file)).toBe(false);
        });

        it('should return true for files over proxy threshold', () => {
            // Create a file object with overridden size
            const file = new File(['x'], 'large.mp4', { type: 'video/mp4' });
            Object.defineProperty(file, 'size', { value: PROXY_THRESHOLD + 1 });
            expect(service.needsDirectUpload(file)).toBe(true);
        });

        it('should return false for files exactly at threshold', () => {
            const file = new File(['x'], 'exact.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: PROXY_THRESHOLD });
            expect(service.needsDirectUpload(file)).toBe(false);
        });
    });
});
