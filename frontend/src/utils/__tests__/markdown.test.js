import { describe, it, expect } from 'vitest';
import {
    htmlToMarkdown,
    parseContentForPDF,
    markdownToHtml,
    countWords,
    countCharacters
} from '../markdown.js';

describe('markdown', () => {
    describe('htmlToMarkdown', () => {
        it('should convert paragraphs to text with double newlines', () => {
            const html = '<p>First paragraph</p><p>Second paragraph</p>';
            expect(htmlToMarkdown(html)).toBe('First paragraph\n\nSecond paragraph');
        });

        it('should handle single paragraph', () => {
            const html = '<p>Just one paragraph</p>';
            expect(htmlToMarkdown(html)).toBe('Just one paragraph');
        });

        it('should skip empty paragraphs', () => {
            const html = '<p>Text</p><p></p><p>More text</p>';
            expect(htmlToMarkdown(html)).toBe('Text\n\nMore text');
        });

        it('should skip whitespace-only paragraphs', () => {
            const html = '<p>Text</p><p>   </p><p>More text</p>';
            expect(htmlToMarkdown(html)).toBe('Text\n\nMore text');
        });

        it('should handle empty HTML', () => {
            expect(htmlToMarkdown('')).toBe('');
        });

        it('should handle HTML with no paragraphs', () => {
            expect(htmlToMarkdown('<div>Text</div>')).toBe('');
        });

        it('should trim trailing/leading whitespace', () => {
            const html = '<p>  Hello  </p><p>  World  </p>';
            expect(htmlToMarkdown(html)).toBe('Hello\n\nWorld');
        });
    });

    describe('parseContentForPDF', () => {
        it('should parse paragraphs into content blocks', () => {
            const html = '<p>First paragraph</p><p>Second paragraph</p>';
            const blocks = parseContentForPDF(html);

            expect(blocks).toHaveLength(2);
            expect(blocks[0]).toEqual({
                type: 'body',
                text: 'First paragraph',
                fontSize: 12,
                fontStyle: 'normal'
            });
            expect(blocks[1]).toEqual({
                type: 'body',
                text: 'Second paragraph',
                fontSize: 12,
                fontStyle: 'normal'
            });
        });

        it('should skip empty paragraphs', () => {
            const html = '<p>Text</p><p></p><p>More</p>';
            const blocks = parseContentForPDF(html);

            expect(blocks).toHaveLength(2);
            expect(blocks[0].text).toBe('Text');
            expect(blocks[1].text).toBe('More');
        });

        it('should return empty array for empty HTML', () => {
            expect(parseContentForPDF('')).toHaveLength(0);
        });

        it('should return empty array for HTML with no paragraphs', () => {
            expect(parseContentForPDF('<div>Text</div>')).toHaveLength(0);
        });

        it('should set correct default properties', () => {
            const html = '<p>Test</p>';
            const blocks = parseContentForPDF(html);

            expect(blocks[0].type).toBe('body');
            expect(blocks[0].fontSize).toBe(12);
            expect(blocks[0].fontStyle).toBe('normal');
        });
    });

    describe('markdownToHtml', () => {
        it('should convert paragraphs separated by double newlines', () => {
            const markdown = 'First paragraph\n\nSecond paragraph';
            expect(markdownToHtml(markdown)).toBe('<p>First paragraph</p><p>Second paragraph</p>');
        });

        it('should handle single paragraph', () => {
            const markdown = 'Just one paragraph';
            expect(markdownToHtml(markdown)).toBe('<p>Just one paragraph</p>');
        });

        it('should escape HTML in markdown', () => {
            const markdown = '<script>alert("xss")</script>';
            const html = markdownToHtml(markdown);
            expect(html).toContain('&lt;script&gt;');
        });

        it('should return default paragraph for empty input', () => {
            expect(markdownToHtml('')).toBe('<p><br></p>');
            expect(markdownToHtml(null)).toBe('<p><br></p>');
            expect(markdownToHtml(undefined)).toBe('<p><br></p>');
        });

        it('should handle multiple blank lines', () => {
            const markdown = 'Para 1\n\n\n\nPara 2';
            expect(markdownToHtml(markdown)).toBe('<p>Para 1</p><p>Para 2</p>');
        });

        it('should trim paragraph content', () => {
            const markdown = '  Trimmed  \n\n  Content  ';
            expect(markdownToHtml(markdown)).toBe('<p>Trimmed</p><p>Content</p>');
        });
    });

    describe('countWords', () => {
        it('should count words correctly', () => {
            expect(countWords('Hello World')).toBe(2);
            expect(countWords('One two three four')).toBe(4);
        });

        it('should handle multiple spaces', () => {
            expect(countWords('Hello    World')).toBe(2);
        });

        it('should handle tabs and newlines', () => {
            expect(countWords('Hello\tWorld\nTest')).toBe(3);
        });

        it('should return 0 for empty input', () => {
            expect(countWords('')).toBe(0);
            expect(countWords('   ')).toBe(0);
        });

        it('should return 0 for non-string input', () => {
            expect(countWords(null)).toBe(0);
            expect(countWords(undefined)).toBe(0);
            expect(countWords(123)).toBe(0);
        });

        it('should count single word', () => {
            expect(countWords('Hello')).toBe(1);
        });

        it('should handle leading/trailing whitespace', () => {
            expect(countWords('  Hello World  ')).toBe(2);
        });
    });

    describe('countCharacters', () => {
        it('should count characters correctly', () => {
            expect(countCharacters('Hello')).toBe(5);
            expect(countCharacters('Hello World')).toBe(11);
        });

        it('should count whitespace', () => {
            expect(countCharacters('   ')).toBe(3);
            expect(countCharacters('\t\n')).toBe(2);
        });

        it('should return 0 for empty string', () => {
            expect(countCharacters('')).toBe(0);
        });

        it('should return 0 for non-string input', () => {
            expect(countCharacters(null)).toBe(0);
            expect(countCharacters(undefined)).toBe(0);
            expect(countCharacters(123)).toBe(0);
        });

        it('should handle unicode characters', () => {
            expect(countCharacters('café')).toBe(4);
        });

        it('should handle emojis', () => {
            // Note: emojis may count as multiple code units
            const emoji = '👋';
            expect(countCharacters(emoji)).toBe(emoji.length);
        });
    });
});
