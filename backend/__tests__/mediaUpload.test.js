import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { mediaUploadRoutes } from '../src/routes/mediaUpload.js';

describe('Media Upload Proxy', () => {
    let fastify;

    beforeAll(async () => {
        fastify = Fastify({ logger: false });

        await fastify.register(multipart, {
            limits: { fileSize: 11 * 1024 * 1024 }
        });

        await fastify.register(mediaUploadRoutes);
        await fastify.ready();
    });

    afterAll(async () => {
        await fastify.close();
    });

    it('should reject request without file', async () => {
        const response = await fastify.inject({
            method: 'POST',
            url: '/api/media/upload',
            headers: { 'content-type': 'application/json' },
            payload: '{}'
        });

        expect(response.statusCode).toBe(400);
    });

    it('should reject missing blossomServer field', async () => {
        const form = new FormData();
        form.append('file', new Blob(['test']), 'test.jpg');
        form.append('authorization', 'Nostr eyJ0ZXN0Ijp0cnVlfQ==');

        // Use raw multipart boundary construction for Fastify inject
        const boundary = '----TestBoundary123';
        const body = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="file"; filename="test.jpg"',
            'Content-Type: image/jpeg',
            '',
            'fake image data',
            `--${boundary}`,
            'Content-Disposition: form-data; name="authorization"',
            '',
            'Nostr eyJ0ZXN0Ijp0cnVlfQ==',
            `--${boundary}--`
        ].join('\r\n');

        const response = await fastify.inject({
            method: 'POST',
            url: '/api/media/upload',
            headers: {
                'content-type': `multipart/form-data; boundary=${boundary}`
            },
            payload: body
        });

        expect(response.statusCode).toBe(400);
        const data = JSON.parse(response.payload);
        expect(data.error).toContain('blossomServer');
    });

    it('should reject non-https blossom server URLs', async () => {
        const boundary = '----TestBoundary456';
        const body = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="file"; filename="test.jpg"',
            'Content-Type: image/jpeg',
            '',
            'fake image data',
            `--${boundary}`,
            'Content-Disposition: form-data; name="blossomServer"',
            '',
            'http://blossom.example.com',
            `--${boundary}`,
            'Content-Disposition: form-data; name="authorization"',
            '',
            'Nostr eyJ0ZXN0Ijp0cnVlfQ==',
            `--${boundary}--`
        ].join('\r\n');

        const response = await fastify.inject({
            method: 'POST',
            url: '/api/media/upload',
            headers: {
                'content-type': `multipart/form-data; boundary=${boundary}`
            },
            payload: body
        });

        expect(response.statusCode).toBe(400);
        const data = JSON.parse(response.payload);
        expect(data.error).toContain('HTTPS');
    });

    it('should reject blossom servers resolving to private IPs', async () => {
        const boundary = '----TestBoundary789';
        const body = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="file"; filename="test.jpg"',
            'Content-Type: image/jpeg',
            '',
            'fake image data',
            `--${boundary}`,
            'Content-Disposition: form-data; name="blossomServer"',
            '',
            'https://localhost',
            `--${boundary}`,
            'Content-Disposition: form-data; name="authorization"',
            '',
            'Nostr eyJ0ZXN0Ijp0cnVlfQ==',
            `--${boundary}--`
        ].join('\r\n');

        const response = await fastify.inject({
            method: 'POST',
            url: '/api/media/upload',
            headers: {
                'content-type': `multipart/form-data; boundary=${boundary}`
            },
            payload: body
        });

        expect(response.statusCode).toBe(400);
        const data = JSON.parse(response.payload);
        expect(data.error).toContain('Invalid Blossom server');
    });
});
