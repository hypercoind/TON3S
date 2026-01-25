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
 * Handles headings (#, ##) and paragraphs
 */
export function markdownToHtml(markdown) {
    if (!markdown) {
        return '<p><br></p>';
    }

    // Split into blocks (paragraphs/headings)
    const blocks = markdown.split(/\n\n+/);

    return (
        blocks
            .map(block => {
                const trimmed = block.trim();
                if (!trimmed) {
                    return '';
                }

                // Check for headings
                if (trimmed.startsWith('## ')) {
                    const text = trimmed.substring(3).trim();
                    return `<h2>${escapeHtml(text)}</h2>`;
                }
                if (trimmed.startsWith('# ')) {
                    const text = trimmed.substring(2).trim();
                    return `<h1>${escapeHtml(text)}</h1>`;
                }

                // Handle multi-line paragraphs (convert single newlines to spaces)
                const lines = trimmed.split('\n');
                const processedLines = lines.map(line => {
                    const lineTrimmed = line.trim();
                    // Check if line itself is a heading
                    if (lineTrimmed.startsWith('## ')) {
                        return `</p><h2>${escapeHtml(lineTrimmed.substring(3).trim())}</h2><p>`;
                    }
                    if (lineTrimmed.startsWith('# ')) {
                        return `</p><h1>${escapeHtml(lineTrimmed.substring(2).trim())}</h1><p>`;
                    }
                    return escapeHtml(lineTrimmed);
                });

                const content = processedLines
                    .join(' ')
                    .replace(/<\/p><p>/g, '')
                    .trim();

                // Clean up empty paragraph tags
                if (content === '' || content === '</p><p>') {
                    return '';
                }

                // If content contains heading tags, don't wrap in p
                if (content.includes('<h1>') || content.includes('<h2>')) {
                    return content.replace(/^<\/p>|<p>$/g, '');
                }

                return `<p>${content}</p>`;
            })
            .filter(block => block)
            .join('') || '<p><br></p>'
    );
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
 * Convert HTML content to plain text with preserved newlines between blocks
 * Used for Nostr publishing where block structure should be maintained
 * Empty paragraphs (<p><br></p>) are preserved as blank lines
 */
export function htmlToPlainText(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const lines = [];
    const blocks = doc.body.querySelectorAll('h1, h2, p');

    blocks.forEach(block => {
        // Trim text content - empty blocks become empty strings (blank lines)
        lines.push(block.textContent.trim());
    });

    return lines.join('\n').trim();
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
    htmlToPlainText,
    parseContentForPDF,
    markdownToHtml,
    countWords,
    countCharacters
};
