import { describe, it, expect, vi } from 'vitest';
import { storageService } from '../StorageService.js';

describe('StorageService', () => {
    describe('extractPlainText', () => {
        it('should extract text from HTML', () => {
            const html = '<p>Hello <strong>World</strong></p>';
            const result = storageService.extractPlainText(html);
            expect(result).toBe('Hello World');
        });

        it('should handle empty HTML', () => {
            const result = storageService.extractPlainText('');
            expect(result).toBe('');
        });

        it('should preserve line breaks from block elements', () => {
            const html = '<p>Line 1</p><p>Line 2</p>';
            const result = storageService.extractPlainText(html);
            expect(result).toContain('Line 1');
            expect(result).toContain('Line 2');
        });

        it('should handle nested elements', () => {
            const html = '<div><p>Nested <span>text</span></p></div>';
            const result = storageService.extractPlainText(html);
            expect(result).toBe('Nested text');
        });
    });

    describe('extractTitle', () => {
        it('should extract first line as title', () => {
            const text = 'First Line\nSecond Line';
            const result = storageService.extractTitle(text);
            expect(result).toBe('First Line');
        });

        it('should truncate long titles at 50 characters', () => {
            const longTitle = 'A'.repeat(60);
            const result = storageService.extractTitle(longTitle);
            expect(result).toBe(`${'A'.repeat(47)}...`);
            expect(result.length).toBe(50);
        });

        it('should return null for empty text', () => {
            expect(storageService.extractTitle('')).toBeNull();
        });

        it('should trim whitespace', () => {
            const text = '   Trimmed Title   \nSecond Line';
            const result = storageService.extractTitle(text);
            expect(result).toBe('Trimmed Title');
        });

        it('should handle single-line text', () => {
            const text = 'Only Line';
            const result = storageService.extractTitle(text);
            expect(result).toBe('Only Line');
        });

        it('should return short titles as-is', () => {
            const text = 'Short Title';
            const result = storageService.extractTitle(text);
            expect(result).toBe('Short Title');
        });
    });

    describe('content size limits', () => {
        it('should have a max content size defined', () => {
            expect(storageService.maxContentSize).toBeDefined();
            expect(storageService.maxContentSize).toBeGreaterThan(0);
            expect(storageService.maxContentSize).toBe(1000000); // 1MB
        });

        it('should have a save throttle defined', () => {
            expect(storageService.saveThrottleMs).toBeDefined();
            expect(storageService.saveThrottleMs).toBeGreaterThan(0);
            expect(storageService.saveThrottleMs).toBe(100);
        });
    });

    describe('service state', () => {
        it('should track initialized state', () => {
            expect(typeof storageService.initialized).toBe('boolean');
        });

        it('should track last save time', () => {
            expect(typeof storageService.lastSaveTime).toBe('number');
        });

        it('should have a database instance', () => {
            expect(storageService.db).toBeDefined();
        });
    });

    describe('data export format', () => {
        it('should use version 2.0 format', async () => {
            // Mock the database calls for this test
            const originalDb = storageService.db;
            storageService.db = {
                notes: {
                    orderBy: () => ({
                        reverse: () => ({
                            toArray: () => Promise.resolve([])
                        })
                    })
                },
                settings: {
                    get: () => Promise.resolve({ value: { theme: 1 } })
                }
            };

            const result = await storageService.exportData();

            expect(result.version).toBe('2.0');
            expect(result.exportedAt).toBeDefined();
            expect(result.notes).toBeDefined();
            expect(Array.isArray(result.notes)).toBe(true);

            // Restore original db
            storageService.db = originalDb;
        });
    });

    describe('import data validation', () => {
        it('should handle data with notes array', async () => {
            const originalDb = storageService.db;
            const addFn = vi.fn().mockResolvedValue(1);

            storageService.db = {
                notes: {
                    add: addFn
                },
                settings: {
                    put: vi.fn()
                }
            };

            await storageService.importData({
                notes: [{ title: 'Test', content: '<p>Content</p>' }]
            });

            expect(addFn).toHaveBeenCalled();

            storageService.db = originalDb;
        });

        it('should handle data with documents array (legacy)', async () => {
            const originalDb = storageService.db;
            const addFn = vi.fn().mockResolvedValue(1);

            storageService.db = {
                notes: {
                    add: addFn
                },
                settings: {
                    put: vi.fn()
                }
            };

            await storageService.importData({
                documents: [{ title: 'Legacy', content: '<p>Content</p>' }]
            });

            expect(addFn).toHaveBeenCalled();

            storageService.db = originalDb;
        });

        it('should handle data with settings', async () => {
            const originalDb = storageService.db;
            const putFn = vi.fn().mockResolvedValue(undefined);

            storageService.db = {
                notes: {
                    add: vi.fn().mockResolvedValue(1)
                },
                settings: {
                    put: putFn
                }
            };

            await storageService.importData({
                settings: { theme: { currentIndex: 2 } }
            });

            expect(putFn).toHaveBeenCalled();

            storageService.db = originalDb;
        });
    });
});
