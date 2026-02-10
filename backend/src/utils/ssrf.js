/**
 * TON3S SSRF Protection Utilities
 * Shared validation for relay and media upload URLs
 */

import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

// Blocked internal hostnames
const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '[::1]',
    'metadata.google.internal',
    'metadata.google',
    '169.254.169.254'
]);

/**
 * Check if an IP address is private/internal
 */
export function isPrivateIP(ip) {
    // IPv4 private ranges
    const privateRanges = [
        /^127\./, // 127.0.0.0/8 (loopback)
        /^10\./, // 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
        /^192\.168\./, // 192.168.0.0/16
        /^169\.254\./, // 169.254.0.0/16 (link-local)
        /^0\./, // 0.0.0.0/8
        /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./ // 100.64.0.0/10 (CGNAT)
    ];

    // IPv6 private/special ranges
    const ipv6Private = [
        /^::1$/, // Loopback
        /^fe80:/i, // Link-local
        /^fc00:/i, // Unique local
        /^fd/i, // Unique local
        /^::ffff:127\./i, // IPv4-mapped loopback
        /^::ffff:10\./i, // IPv4-mapped private
        /^::ffff:192\.168\./i, // IPv4-mapped private
        /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\./i // IPv4-mapped private
    ];

    for (const range of privateRanges) {
        if (range.test(ip)) {
            return true;
        }
    }

    for (const range of ipv6Private) {
        if (range.test(ip)) {
            return true;
        }
    }

    return false;
}

/**
 * Validate a WebSocket relay URL for SSRF protection
 * @returns {{ parsed: URL, resolvedIP: string }}
 */
export async function validateRelayUrl(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('Invalid URL format');
    }

    if (!['ws:', 'wss:'].includes(parsed.protocol)) {
        throw new Error('Only WebSocket protocols (ws/wss) are allowed');
    }

    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) {
        throw new Error('Connecting to internal hosts is not allowed');
    }

    const { address } = await dnsLookup(parsed.hostname);
    if (isPrivateIP(address)) {
        throw new Error('Relay hostname resolves to a private IP address');
    }

    return { parsed, resolvedIP: address };
}

/**
 * Validate an HTTPS URL for SSRF protection (used for Blossom servers)
 * @returns {{ parsed: URL, resolvedIP: string }}
 */
export async function validateHttpsUrl(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('Invalid URL format');
    }

    if (parsed.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed');
    }

    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) {
        throw new Error('Connecting to internal hosts is not allowed');
    }

    const { address } = await dnsLookup(parsed.hostname);
    if (isPrivateIP(address)) {
        throw new Error('URL hostname resolves to a private IP address');
    }

    return { parsed, resolvedIP: address };
}

/**
 * Sanitize error message to prevent information leakage
 */
export function sanitizeErrorMessage(error) {
    const message = error?.message || 'Unknown error';

    const safePatterns = [
        /^Invalid URL/i,
        /^Only WebSocket protocols/i,
        /^Only HTTPS URLs/i,
        /^Connecting to internal hosts/i,
        /^private IP/i,
        /^connection refused/i,
        /^connection timeout/i,
        /^relay disconnected/i,
        /^already connected/i,
        /^URL hostname resolves/i,
        /^Unexpected server response: \d+/i
    ];

    for (const pattern of safePatterns) {
        if (pattern.test(message)) {
            return message;
        }
    }

    return 'Connection failed';
}
