/**
 * TON3S Input Sanitization
 * Security utilities for input validation
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate array index is within bounds
 */
export function validateIndex(index, arrayLength) {
    const parsed = parseInt(index);
    if (isNaN(parsed) || parsed < 0 || parsed >= arrayLength) {
        return 0;
    }
    return parsed;
}

/**
 * Validate filename (remove dangerous characters)
 */
export function sanitizeFilename(filename) {
    if (typeof filename !== 'string') return 'document';
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\.\./g, '')
        .trim() || 'document';
}

/**
 * Strip HTML tags from content
 */
export function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

/**
 * Generate a UUID
 */
export function generateUUID() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default {
    sanitizeInput,
    validateIndex,
    sanitizeFilename,
    stripHtml,
    generateUUID
};
