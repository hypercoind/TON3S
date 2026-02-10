/**
 * TON3S Input Sanitization
 * Security utilities for input validation
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
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
    if (typeof filename !== 'string') {
        return 'document';
    }
    return (
        filename
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\.\./g, '')
            .trim() || 'document'
    );
}

/**
 * Strip HTML tags from content (XSS-safe using DOMParser)
 */
export function stripHtml(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}

/**
 * Validate that a src URL is safe (https: or blob: only)
 */
export function isAllowedSrc(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    const trimmed = url.trim();
    return trimmed.startsWith('https://') || trimmed.startsWith('blob:');
}

// Allowed attributes per media tag
const MEDIA_ALLOWED_ATTRS = {
    IMG: new Set([
        'src',
        'alt',
        'data-sha256',
        'data-mime',
        'data-dim',
        'data-blossom-url',
        'loading'
    ]),
    VIDEO: new Set([
        'src',
        'controls',
        'data-sha256',
        'data-mime',
        'data-dim',
        'data-blossom-url',
        'preload'
    ])
};

/**
 * Sanitize HTML to only allow safe tags (h1, h2, p, br, img, video)
 * Removes all attributes from text tags, allows whitelisted attributes on media tags
 */
export function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') {
        return '<p><br></p>';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const allowedTags = new Set(['H1', 'H2', 'P', 'BR', 'IMG', 'VIDEO']);

    function sanitizeNode(node) {
        const fragment = document.createDocumentFragment();

        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
                fragment.appendChild(document.createTextNode(child.textContent));
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                if (allowedTags.has(child.tagName)) {
                    const tagName = child.tagName;
                    const cleanElement = document.createElement(tagName.toLowerCase());

                    // Copy allowed attributes for media elements
                    const allowedAttrs = MEDIA_ALLOWED_ATTRS[tagName];
                    if (allowedAttrs) {
                        for (const attr of allowedAttrs) {
                            if (child.hasAttribute(attr)) {
                                const value = child.getAttribute(attr);
                                // Validate src attribute
                                if (attr === 'src') {
                                    if (!isAllowedSrc(value)) {
                                        continue; // Skip element entirely if src is unsafe
                                    }
                                }
                                cleanElement.setAttribute(attr, value);
                            }
                        }
                        // If src was required but missing or rejected, skip the element
                        if (!cleanElement.hasAttribute('src')) {
                            continue;
                        }
                    }

                    // Recursively sanitize children (for non-void elements)
                    if (tagName !== 'IMG' && tagName !== 'BR') {
                        cleanElement.appendChild(sanitizeNode(child));
                    }
                    fragment.appendChild(cleanElement);
                } else {
                    // For disallowed tags, keep text content wrapped in <p>
                    const text = child.textContent?.trim();
                    if (text) {
                        const p = document.createElement('p');
                        p.textContent = text;
                        fragment.appendChild(p);
                    }
                }
            }
        }

        return fragment;
    }

    const sanitized = document.createElement('div');
    sanitized.appendChild(sanitizeNode(doc.body));

    // Ensure there's at least one paragraph
    if (!sanitized.innerHTML.trim()) {
        return '<p><br></p>';
    }

    return sanitized.innerHTML;
}

/**
 * Generate a UUID using cryptographically secure random values
 */
export function generateUUID() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback using crypto.getRandomValues (cryptographically secure)
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version 4 bits (0100xxxx)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant bits (10xxxxxx)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default {
    sanitizeInput,
    validateIndex,
    sanitizeFilename,
    stripHtml,
    sanitizeHtml,
    isAllowedSrc,
    generateUUID
};
