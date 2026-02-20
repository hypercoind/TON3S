import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promisify } from 'util';

// dns.lookup uses an internal Symbol(customPromisifyArgs) that promisify respects.
// We replicate this using util.promisify.custom on our mock function.
let mockAddress = '8.8.8.8';

vi.mock('dns', async () => {
    const { promisify: _promisify } = await import('util');

    const lookupFn = vi.fn((hostname, callback) => {
        callback(null, mockAddress, 4);
    });

    // Use the official promisify.custom symbol so promisify returns { address, family }
    lookupFn[_promisify.custom] = async (hostname) => ({
        address: mockAddress,
        family: 4
    });

    return {
        default: { lookup: lookupFn },
        lookup: lookupFn
    };
});

import { isPrivateIP, validateRelayUrl, validateHttpsUrl, sanitizeErrorMessage } from '../src/utils/ssrf.js';

describe('SSRF Utilities', () => {
    beforeEach(() => {
        mockAddress = '8.8.8.8';
    });

    describe('isPrivateIP', () => {
        it('should detect loopback addresses', () => {
            expect(isPrivateIP('127.0.0.1')).toBe(true);
            expect(isPrivateIP('127.0.0.2')).toBe(true);
            expect(isPrivateIP('127.255.255.255')).toBe(true);
        });

        it('should detect 10.x.x.x range', () => {
            expect(isPrivateIP('10.0.0.1')).toBe(true);
            expect(isPrivateIP('10.255.255.255')).toBe(true);
        });

        it('should detect 172.16-31.x.x range', () => {
            expect(isPrivateIP('172.16.0.1')).toBe(true);
            expect(isPrivateIP('172.31.255.255')).toBe(true);
            expect(isPrivateIP('172.15.0.1')).toBe(false);
            expect(isPrivateIP('172.32.0.1')).toBe(false);
        });

        it('should detect 192.168.x.x range', () => {
            expect(isPrivateIP('192.168.0.1')).toBe(true);
            expect(isPrivateIP('192.168.1.1')).toBe(true);
        });

        it('should detect link-local addresses', () => {
            expect(isPrivateIP('169.254.1.1')).toBe(true);
        });

        it('should detect CGNAT range', () => {
            expect(isPrivateIP('100.64.0.1')).toBe(true);
            expect(isPrivateIP('100.127.255.255')).toBe(true);
            expect(isPrivateIP('100.128.0.1')).toBe(false);
        });

        it('should detect IPv6 loopback', () => {
            expect(isPrivateIP('::1')).toBe(true);
        });

        it('should detect IPv6 link-local', () => {
            expect(isPrivateIP('fe80::1')).toBe(true);
        });

        it('should detect IPv6 unique local', () => {
            expect(isPrivateIP('fc00::1')).toBe(true);
            expect(isPrivateIP('fd12::1')).toBe(true);
        });

        it('should detect IPv4-mapped private ranges', () => {
            expect(isPrivateIP('::ffff:0.1.2.3')).toBe(true);
            expect(isPrivateIP('::ffff:169.254.1.1')).toBe(true);
            expect(isPrivateIP('::ffff:100.64.0.1')).toBe(true);
        });

        it('should allow public IPs', () => {
            expect(isPrivateIP('8.8.8.8')).toBe(false);
            expect(isPrivateIP('1.1.1.1')).toBe(false);
            expect(isPrivateIP('203.0.113.1')).toBe(false);
        });
    });

    describe('validateRelayUrl', () => {
        it('should accept valid wss:// URL with public IP', async () => {
            mockAddress = '8.8.8.8';
            const result = await validateRelayUrl('wss://relay.example.com');
            expect(result.parsed.protocol).toBe('wss:');
            expect(result.resolvedIP).toBe('8.8.8.8');
        });

        it('should accept valid ws:// URL', async () => {
            mockAddress = '1.1.1.1';
            const result = await validateRelayUrl('ws://relay.example.com');
            expect(result.parsed.protocol).toBe('ws:');
        });

        it('should reject non-WebSocket protocols', async () => {
            await expect(validateRelayUrl('https://relay.example.com')).rejects.toThrow('WebSocket');
            await expect(validateRelayUrl('http://relay.example.com')).rejects.toThrow('WebSocket');
        });

        it('should reject invalid URL format', async () => {
            await expect(validateRelayUrl('not a url')).rejects.toThrow('Invalid URL');
        });

        it('should reject blocked hostnames', async () => {
            await expect(validateRelayUrl('wss://localhost')).rejects.toThrow('internal hosts');
            await expect(validateRelayUrl('wss://127.0.0.1')).rejects.toThrow('internal hosts');
            await expect(validateRelayUrl('wss://metadata.google.internal')).rejects.toThrow('internal hosts');
        });

        it('should reject private IP resolution', async () => {
            mockAddress = '192.168.1.1';
            await expect(validateRelayUrl('wss://relay.example.com')).rejects.toThrow('private IP');
        });

        it('should reject IPv4-mapped private IP resolution', async () => {
            mockAddress = '::ffff:169.254.169.254';
            await expect(validateRelayUrl('wss://relay.example.com')).rejects.toThrow('private IP');
        });
    });

    describe('validateHttpsUrl', () => {
        it('should accept valid https:// URL with public IP', async () => {
            mockAddress = '8.8.8.8';
            const result = await validateHttpsUrl('https://blossom.example.com');
            expect(result.parsed.protocol).toBe('https:');
            expect(result.resolvedIP).toBe('8.8.8.8');
        });

        it('should reject non-HTTPS protocols', async () => {
            await expect(validateHttpsUrl('http://blossom.example.com')).rejects.toThrow('HTTPS');
            await expect(validateHttpsUrl('wss://blossom.example.com')).rejects.toThrow('HTTPS');
        });

        it('should reject invalid URL format', async () => {
            await expect(validateHttpsUrl('not a url')).rejects.toThrow('Invalid URL');
        });

        it('should reject blocked hostnames', async () => {
            await expect(validateHttpsUrl('https://localhost')).rejects.toThrow('internal hosts');
            await expect(validateHttpsUrl('https://169.254.169.254')).rejects.toThrow('internal hosts');
        });

        it('should reject private IP resolution', async () => {
            mockAddress = '10.0.0.1';
            await expect(validateHttpsUrl('https://blossom.example.com')).rejects.toThrow('private IP');
        });

        it('should reject IPv4-mapped private IP resolution', async () => {
            mockAddress = '::ffff:100.64.0.1';
            await expect(validateHttpsUrl('https://blossom.example.com')).rejects.toThrow('private IP');
        });
    });

    describe('sanitizeErrorMessage', () => {
        it('should pass through safe error messages', () => {
            expect(sanitizeErrorMessage(new Error('Invalid URL format'))).toBe('Invalid URL format');
            expect(sanitizeErrorMessage(new Error('Only HTTPS URLs are allowed'))).toBe('Only HTTPS URLs are allowed');
            expect(sanitizeErrorMessage(new Error('Connecting to internal hosts is not allowed'))).toBe('Connecting to internal hosts is not allowed');
            expect(sanitizeErrorMessage(new Error('connection refused'))).toBe('connection refused');
            expect(sanitizeErrorMessage(new Error('Unexpected server response: 403'))).toBe('Unexpected server response: 403');
        });

        it('should sanitize unknown error messages', () => {
            expect(sanitizeErrorMessage(new Error('ECONNREFUSED 192.168.1.1:443'))).toBe('Connection failed');
            expect(sanitizeErrorMessage(new Error('getaddrinfo ENOTFOUND secret.internal'))).toBe('Connection failed');
        });

        it('should handle null/undefined errors', () => {
            expect(sanitizeErrorMessage(null)).toBe('Connection failed');
            expect(sanitizeErrorMessage(undefined)).toBe('Connection failed');
        });
    });
});
