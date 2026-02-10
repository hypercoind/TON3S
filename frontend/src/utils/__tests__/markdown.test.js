import { describe, it, expect } from 'vitest';
import {
    htmlToMarkdown,
    htmlToPlainText,
    parseContentForPDF,
    markdownToHtml,
    extractMediaMetadata,
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

    describe('htmlToMarkdown - media', () => {
        it('should convert img to markdown image syntax', () => {
            const html =
                '<img src="https://example.com/img.jpg" alt="test photo" data-blossom-url="https://example.com/img.jpg">';
            expect(htmlToMarkdown(html)).toBe('![test photo](https://example.com/img.jpg)');
        });

        it('should convert video to plain URL', () => {
            const html =
                '<video src="https://example.com/vid.mp4" data-blossom-url="https://example.com/vid.mp4"></video>';
            expect(htmlToMarkdown(html)).toBe('https://example.com/vid.mp4');
        });

        it('should prefer data-blossom-url over src', () => {
            const html =
                '<img src="https://cdn.example.com/img.jpg" data-blossom-url="https://blossom.example.com/img.jpg" alt="">';
            expect(htmlToMarkdown(html)).toContain('https://blossom.example.com/img.jpg');
        });

        it('should handle mixed text and media', () => {
            const html =
                '<h1>Title</h1><img src="https://example.com/img.jpg" data-blossom-url="https://example.com/img.jpg" alt=""><p>Caption text</p>';
            const md = htmlToMarkdown(html);
            expect(md).toContain('# Title');
            expect(md).toContain('![](https://example.com/img.jpg)');
            expect(md).toContain('Caption text');
        });
    });

    describe('htmlToPlainText - media', () => {
        it('should convert img to URL line', () => {
            const html =
                '<p>Before</p><img src="https://example.com/img.jpg" data-blossom-url="https://example.com/img.jpg"><p>After</p>';
            const result = htmlToPlainText(html);
            expect(result).toContain('https://example.com/img.jpg');
            expect(result).toContain('Before');
            expect(result).toContain('After');
        });

        it('should convert video to URL line', () => {
            const html =
                '<video src="https://example.com/vid.mp4" data-blossom-url="https://example.com/vid.mp4"></video>';
            expect(htmlToPlainText(html)).toBe('https://example.com/vid.mp4');
        });
    });

    describe('extractMediaMetadata', () => {
        it('should extract metadata from img elements', () => {
            const html =
                '<img src="https://example.com/img.jpg" data-blossom-url="https://example.com/img.jpg" data-mime="image/jpeg" data-sha256="abc123" data-dim="800x600">';
            const metadata = extractMediaMetadata(html);
            expect(metadata).toHaveLength(1);
            expect(metadata[0]).toEqual({
                url: 'https://example.com/img.jpg',
                type: 'image/jpeg',
                sha256: 'abc123',
                dim: '800x600'
            });
        });

        it('should extract metadata from video elements', () => {
            const html =
                '<video src="https://example.com/vid.mp4" data-blossom-url="https://example.com/vid.mp4" data-mime="video/mp4" data-sha256="def456" data-dim="1920x1080"></video>';
            const metadata = extractMediaMetadata(html);
            expect(metadata).toHaveLength(1);
            expect(metadata[0].url).toBe('https://example.com/vid.mp4');
            expect(metadata[0].type).toBe('video/mp4');
        });

        it('should return empty array for content without media', () => {
            const html = '<p>Just text</p>';
            expect(extractMediaMetadata(html)).toEqual([]);
        });

        it('should return empty array for null/empty input', () => {
            expect(extractMediaMetadata(null)).toEqual([]);
            expect(extractMediaMetadata('')).toEqual([]);
        });

        it('should handle multiple media elements', () => {
            const html =
                '<img data-blossom-url="https://a.com/1.jpg" data-mime="image/jpeg" data-sha256="a" data-dim="100x100"><img data-blossom-url="https://b.com/2.png" data-mime="image/png" data-sha256="b" data-dim="200x200">';
            const metadata = extractMediaMetadata(html);
            expect(metadata).toHaveLength(2);
            expect(metadata[0].url).toBe('https://a.com/1.jpg');
            expect(metadata[1].url).toBe('https://b.com/2.png');
        });

        it('should skip media without data-blossom-url', () => {
            const html = '<img src="https://example.com/img.jpg">';
            expect(extractMediaMetadata(html)).toEqual([]);
        });
    });

    describe('parseContentForPDF - media', () => {
        it('should include image blocks', () => {
            const html =
                '<p>Text</p><img src="https://example.com/img.jpg" data-blossom-url="https://example.com/img.jpg" data-dim="800x600">';
            const blocks = parseContentForPDF(html);
            expect(blocks).toContainEqual({
                type: 'image',
                url: 'https://example.com/img.jpg',
                dim: '800x600'
            });
        });
    });
});
