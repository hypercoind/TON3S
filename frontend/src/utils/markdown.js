/**
 * TON3S Markdown Utilities
 * Convert HTML content to Markdown format
 */

/**
 * Convert HTML content to Markdown
 */
export function htmlToMarkdown(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    let markdown = '';

    // Process each paragraph element
    const blocks = tempDiv.querySelectorAll('p');
    blocks.forEach(block => {
        const text = block.textContent.trim();
        if (!text) return;
        markdown += text + '\n\n';
    });

    return markdown.trim();
}

/**
 * Parse HTML content into blocks for PDF generation
 */
export function parseContentForPDF(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const contentBlocks = [];

    const blocks = tempDiv.querySelectorAll('p');
    blocks.forEach(block => {
        const text = block.textContent.trim();
        if (!text) return;

        contentBlocks.push({
            type: 'body',
            text: text,
            fontSize: 12,
            fontStyle: 'normal'
        });
    });

    return contentBlocks;
}

/**
 * Convert Markdown to HTML (basic)
 */
export function markdownToHtml(markdown) {
    if (!markdown) return '<p><br></p>';

    // Split into paragraphs
    const paragraphs = markdown.split(/\n\n+/);

    return paragraphs
        .map(p => `<p>${escapeHtml(p.trim())}</p>`)
        .join('');
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
    if (!text || typeof text !== 'string') return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
}

/**
 * Count characters in text
 */
export function countCharacters(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.length;
}

export default {
    htmlToMarkdown,
    parseContentForPDF,
    markdownToHtml,
    countWords,
    countCharacters
};
