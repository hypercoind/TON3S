/**
 * TON3S Markdown Utilities
 * Convert HTML content to Markdown format
 */

/**
 * Convert HTML content to Markdown (XSS-safe using DOMParser)
 */
export function htmlToMarkdown(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let markdown = '';

    // Process all block elements (h1, h2, p)
    const blocks = doc.body.querySelectorAll('h1, h2, p');
    blocks.forEach(block => {
        const text = block.textContent.trim();
        if (!text) {
            return;
        }

        if (block.tagName === 'H1') {
            markdown += `# ${text}\n\n`;
        } else if (block.tagName === 'H2') {
            markdown += `## ${text}\n\n`;
        } else {
            markdown += `${text}\n\n`;
        }
    });

    return markdown.trim();
}

/**
 * Parse HTML content into blocks for PDF generation (XSS-safe using DOMParser)
 */
export function parseContentForPDF(html) {
    if (!html || typeof html !== 'string') {
        return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const contentBlocks = [];

    const blocks = doc.body.querySelectorAll('h1, h2, p');
    blocks.forEach(block => {
        const text = block.textContent.trim();
        if (!text) {
            return;
        }

        if (block.tagName === 'H1') {
            contentBlocks.push({
                type: 'title',
                text: text,
                fontSize: 24,
                fontStyle: 'bold'
            });
        } else if (block.tagName === 'H2') {
            contentBlocks.push({
                type: 'heading',
                text: text,
                fontSize: 18,
                fontStyle: 'bold'
            });
        } else {
            contentBlocks.push({
                type: 'body',
                text: text,
                fontSize: 12,
                fontStyle: 'normal'
            });
        }
    });

    return contentBlocks;
}

/**
 * Convert Markdown to HTML (basic)
 */
export function markdownToHtml(markdown) {
    if (!markdown) {
        return '<p><br></p>';
    }

    // Split into paragraphs
    const paragraphs = markdown.split(/\n\n+/);

    return paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('');
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Count words in text
 */
export function countWords(text) {
    if (!text || typeof text !== 'string') {
        return 0;
    }
    const trimmed = text.trim();
    if (!trimmed) {
        return 0;
    }
    return trimmed.split(/\s+/).length;
}

/**
 * Count characters in text
 */
export function countCharacters(text) {
    if (!text || typeof text !== 'string') {
        return 0;
    }
    return text.length;
}

export default {
    htmlToMarkdown,
    parseContentForPDF,
    markdownToHtml,
    countWords,
    countCharacters
};
