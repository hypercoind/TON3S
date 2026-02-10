/**
 * TON3S Markdown Utilities
 * Convert HTML content to Markdown format
 */

/**
 * Get the media URL from an IMG or VIDEO element (prefer data-blossom-url)
 */
function getMediaUrl(el) {
    return el.getAttribute('data-blossom-url') || el.getAttribute('src') || '';
}

/**
 * Convert HTML content to Markdown (XSS-safe using DOMParser)
 * Handles h1, h2, p, img, video elements
 */
export function htmlToMarkdown(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let markdown = '';

    // Process all block-level and media elements in document order
    const elements = doc.body.querySelectorAll('h1, h2, p, img, video');
    elements.forEach(el => {
        if (el.tagName === 'IMG') {
            const url = getMediaUrl(el);
            if (url) {
                const alt = el.getAttribute('alt') || '';
                markdown += `![${alt}](${url})\n\n`;
            }
            return;
        }

        if (el.tagName === 'VIDEO') {
            const url = getMediaUrl(el);
            if (url) {
                markdown += `${url}\n\n`;
            }
            return;
        }

        // Check for images nested inside p tags
        const nestedImg = el.querySelector('img');
        if (nestedImg) {
            const url = getMediaUrl(nestedImg);
            if (url) {
                const alt = nestedImg.getAttribute('alt') || '';
                markdown += `![${alt}](${url})\n\n`;
            }
            // Also include any text in the paragraph
            const text = el.textContent.trim();
            if (text) {
                markdown += `${text}\n\n`;
            }
            return;
        }

        const text = el.textContent.trim();
        if (!text) {
            return;
        }

        if (el.tagName === 'H1') {
            markdown += `# ${text}\n\n`;
        } else if (el.tagName === 'H2') {
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

    const elements = doc.body.querySelectorAll('h1, h2, p, img');
    elements.forEach(el => {
        if (el.tagName === 'IMG') {
            const url = getMediaUrl(el);
            if (url) {
                contentBlocks.push({
                    type: 'image',
                    url: url,
                    dim: el.getAttribute('data-dim') || ''
                });
            }
            return;
        }

        // Check for nested images in paragraphs
        const nestedImg = el.querySelector('img');
        if (nestedImg) {
            const url = getMediaUrl(nestedImg);
            if (url) {
                contentBlocks.push({
                    type: 'image',
                    url: url,
                    dim: nestedImg.getAttribute('data-dim') || ''
                });
            }
        }

        const text = el.textContent.trim();
        if (!text) {
            return;
        }

        if (el.tagName === 'H1') {
            contentBlocks.push({
                type: 'title',
                text: text,
                fontSize: 24,
                fontStyle: 'bold'
            });
        } else if (el.tagName === 'H2') {
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
 * IMG/VIDEO elements emit their URL on its own line
 */
export function htmlToPlainText(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const lines = [];
    const elements = doc.body.querySelectorAll('h1, h2, p, img, video');

    elements.forEach(el => {
        if (el.tagName === 'IMG' || el.tagName === 'VIDEO') {
            const url = getMediaUrl(el);
            if (url) {
                lines.push(url);
            }
            return;
        }

        // Check for images nested inside p tags
        const nestedMedia = el.querySelector('img, video');
        if (nestedMedia) {
            const url = getMediaUrl(nestedMedia);
            if (url) {
                lines.push(url);
            }
            const text = el.textContent.trim();
            if (text) {
                lines.push(text);
            }
            return;
        }

        lines.push(el.textContent.trim());
    });

    return lines.join('\n').trim();
}

/**
 * Extract media metadata from HTML content for NIP-92 imeta tags
 * @returns {Array<{url: string, type: string, sha256: string, dim: string}>}
 */
export function extractMediaMetadata(html) {
    if (!html || typeof html !== 'string') {
        return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const metadata = [];
    const mediaElements = doc.body.querySelectorAll(
        'img[data-blossom-url], video[data-blossom-url]'
    );

    mediaElements.forEach(el => {
        const url = el.getAttribute('data-blossom-url') || el.getAttribute('src');
        if (!url) {
            return;
        }

        metadata.push({
            url: url,
            type: el.getAttribute('data-mime') || '',
            sha256: el.getAttribute('data-sha256') || '',
            dim: el.getAttribute('data-dim') || ''
        });
    });

    return metadata;
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
    extractMediaMetadata,
    countWords,
    countCharacters
};
