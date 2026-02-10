import { describe, it, expect, vi } from 'vitest';
import {
    sanitizeInput,
    validateIndex,
    sanitizeFilename,
    stripHtml,
    sanitizeHtml,
    isAllowedSrc,
    generateUUID
} from '../sanitizer.js';

describe('sanitizer', () => {
    describe('sanitizeInput', () => {
        it('should escape HTML entities', () => {
            expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
                '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
            );
        });

        it('should escape angle brackets', () => {
            expect(sanitizeInput('<div>')).toBe('&lt;div&gt;');
        });

        it('should escape double quotes', () => {
            expect(sanitizeInput('say "hello"')).toBe('say &quot;hello&quot;');
        });

        it('should escape single quotes', () => {
            expect(sanitizeInput("it's")).toBe('it&#x27;s');
        });

        it('should escape forward slashes', () => {
            expect(sanitizeInput('path/to/file')).toBe('path&#x2F;to&#x2F;file');
        });

        it('should return empty string for non-string input', () => {
            expect(sanitizeInput(null)).toBe('');
            expect(sanitizeInput(undefined)).toBe('');
            expect(sanitizeInput(123)).toBe('');
            expect(sanitizeInput({})).toBe('');
            expect(sanitizeInput([])).toBe('');
        });

        it('should handle empty string', () => {
            expect(sanitizeInput('')).toBe('');
        });

        it('should preserve safe text', () => {
            expect(sanitizeInput('Hello World')).toBe('Hello World');
        });

        it('should handle multiple special characters', () => {
            expect(sanitizeInput('<>"\'/')).toBe('&lt;&gt;&quot;&#x27;&#x2F;');
        });
    });

    describe('validateIndex', () => {
        it('should return valid index within bounds', () => {
            expect(validateIndex(5, 10)).toBe(5);
            expect(validateIndex(0, 10)).toBe(0);
            expect(validateIndex(9, 10)).toBe(9);
        });

        it('should return 0 for negative index', () => {
            expect(validateIndex(-1, 10)).toBe(0);
            expect(validateIndex(-100, 10)).toBe(0);
        });

        it('should return 0 for index >= arrayLength', () => {
            expect(validateIndex(10, 10)).toBe(0);
            expect(validateIndex(100, 10)).toBe(0);
        });

        it('should return 0 for NaN', () => {
            expect(validateIndex(NaN, 10)).toBe(0);
            expect(validateIndex('abc', 10)).toBe(0);
        });

        it('should parse string numbers', () => {
            expect(validateIndex('5', 10)).toBe(5);
            expect(validateIndex('0', 10)).toBe(0);
        });

        it('should handle edge case of arrayLength = 0', () => {
            expect(validateIndex(0, 0)).toBe(0);
        });

        it('should handle floating point numbers', () => {
            expect(validateIndex(5.7, 10)).toBe(5);
            expect(validateIndex(5.2, 10)).toBe(5);
        });
    });

    describe('sanitizeFilename', () => {
        it('should remove dangerous characters', () => {
            expect(sanitizeFilename('file<>:"/\\|?*.txt')).toBe('file.txt');
        });

        it('should remove path traversal sequences', () => {
            expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
            expect(sanitizeFilename('..file')).toBe('file');
        });

        it('should trim whitespace', () => {
            expect(sanitizeFilename('  file.txt  ')).toBe('file.txt');
        });

        it('should return "document" for non-string input', () => {
            expect(sanitizeFilename(null)).toBe('document');
            expect(sanitizeFilename(undefined)).toBe('document');
            expect(sanitizeFilename(123)).toBe('document');
        });

        it('should return "document" for empty string', () => {
            expect(sanitizeFilename('')).toBe('document');
            expect(sanitizeFilename('   ')).toBe('document');
        });

        it('should preserve valid filenames', () => {
            expect(sanitizeFilename('my-file_name.txt')).toBe('my-file_name.txt');
            expect(sanitizeFilename('report 2024.pdf')).toBe('report 2024.pdf');
        });

        it('should handle filenames with only dangerous characters', () => {
            expect(sanitizeFilename('<>:"/\\|?*')).toBe('document');
        });
    });

    describe('stripHtml', () => {
        it('should strip HTML tags', () => {
            expect(stripHtml('<p>Hello World</p>')).toBe('Hello World');
        });

        it('should handle nested tags', () => {
            expect(stripHtml('<div><p>Hello</p><p>World</p></div>')).toBe('HelloWorld');
        });

        it('should handle tags with attributes', () => {
            expect(stripHtml('<a href="https://example.com">Link</a>')).toBe('Link');
        });

        it('should handle script tags', () => {
            expect(stripHtml('<script>alert("xss")</script>Text')).toBe('alert("xss")Text');
        });

        it('should return empty string for empty HTML', () => {
            expect(stripHtml('')).toBe('');
            expect(stripHtml('<div></div>')).toBe('');
        });

        it('should preserve plain text', () => {
            expect(stripHtml('Hello World')).toBe('Hello World');
        });

        it('should handle br tags', () => {
            expect(stripHtml('Line 1<br>Line 2')).toBe('Line 1Line 2');
        });
    });

    describe('generateUUID', () => {
        it('should generate valid UUID format', () => {
            const uuid = generateUUID();
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(uuid).toMatch(uuidRegex);
        });

        it('should generate unique UUIDs', () => {
            const uuids = new Set();
            for (let i = 0; i < 100; i++) {
                uuids.add(generateUUID());
            }
            expect(uuids.size).toBe(100);
        });

        it('should use crypto.randomUUID when available', () => {
            const mockUUID = '12345678-1234-4567-8901-123456789012';
            const originalRandomUUID = crypto.randomUUID;
            crypto.randomUUID = vi.fn(() => mockUUID);

            expect(generateUUID()).toBe(mockUUID);
            expect(crypto.randomUUID).toHaveBeenCalled();

            crypto.randomUUID = originalRandomUUID;
        });

        it('should fallback when crypto.randomUUID is unavailable', () => {
            const originalRandomUUID = crypto.randomUUID;
            crypto.randomUUID = undefined;

            const uuid = generateUUID();
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(uuid).toMatch(uuidRegex);

            crypto.randomUUID = originalRandomUUID;
        });
    });

    describe('isAllowedSrc', () => {
        it('should allow https URLs', () => {
            expect(isAllowedSrc('https://example.com/image.jpg')).toBe(true);
            expect(isAllowedSrc('https://blossom.primal.net/abc123')).toBe(true);
        });

        it('should allow blob URLs', () => {
            expect(isAllowedSrc('blob:https://localhost/abc-123')).toBe(true);
        });

        it('should reject javascript: URLs', () => {
            expect(isAllowedSrc('javascript:alert(1)')).toBe(false);
        });

        it('should reject data: URLs', () => {
            expect(isAllowedSrc('data:image/png;base64,abc')).toBe(false);
        });

        it('should reject http URLs', () => {
            expect(isAllowedSrc('http://example.com/image.jpg')).toBe(false);
        });

        it('should reject relative paths', () => {
            expect(isAllowedSrc('/images/photo.jpg')).toBe(false);
            expect(isAllowedSrc('../image.jpg')).toBe(false);
        });

        it('should reject empty/null/undefined', () => {
            expect(isAllowedSrc('')).toBe(false);
            expect(isAllowedSrc(null)).toBe(false);
            expect(isAllowedSrc(undefined)).toBe(false);
        });
    });

    describe('sanitizeHtml - media elements', () => {
        it('should preserve img with allowed attributes', () => {
            const html =
                '<img src="https://example.com/img.jpg" alt="test" data-sha256="abc123" loading="lazy">';
            const result = sanitizeHtml(html);
            expect(result).toContain('<img');
            expect(result).toContain('src="https://example.com/img.jpg"');
            expect(result).toContain('alt="test"');
            expect(result).toContain('data-sha256="abc123"');
            expect(result).toContain('loading="lazy"');
        });

        it('should preserve video with allowed attributes', () => {
            const html =
                '<video src="https://example.com/video.mp4" controls data-sha256="def456" preload="metadata"></video>';
            const result = sanitizeHtml(html);
            expect(result).toContain('<video');
            expect(result).toContain('src="https://example.com/video.mp4"');
            expect(result).toContain('data-sha256="def456"');
        });

        it('should reject img with javascript: src', () => {
            const html = '<img src="javascript:alert(1)" alt="xss">';
            const result = sanitizeHtml(html);
            expect(result).not.toContain('<img');
            expect(result).not.toContain('javascript:');
        });

        it('should reject img with data: src', () => {
            const html = '<img src="data:image/png;base64,abc" alt="test">';
            const result = sanitizeHtml(html);
            expect(result).not.toContain('<img');
        });

        it('should strip unknown attributes from img', () => {
            const html =
                '<img src="https://example.com/img.jpg" onclick="alert(1)" onerror="alert(2)">';
            const result = sanitizeHtml(html);
            expect(result).toContain('src="https://example.com/img.jpg"');
            expect(result).not.toContain('onclick');
            expect(result).not.toContain('onerror');
        });

        it('should strip unknown attributes from video', () => {
            const html = '<video src="https://example.com/v.mp4" onload="alert(1)"></video>';
            const result = sanitizeHtml(html);
            expect(result).toContain('src="https://example.com/v.mp4"');
            expect(result).not.toContain('onload');
        });

        it('should still allow text elements alongside media', () => {
            const html = '<h1>Title</h1><img src="https://example.com/img.jpg"><p>Text</p>';
            const result = sanitizeHtml(html);
            expect(result).toContain('<h1>Title</h1>');
            expect(result).toContain('<img');
            expect(result).toContain('<p>Text</p>');
        });

        it('should reject img without src', () => {
            const html = '<img alt="no source">';
            const result = sanitizeHtml(html);
            expect(result).not.toContain('<img');
        });
    });
});
