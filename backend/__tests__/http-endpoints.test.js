import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';

describe('HTTP Endpoints', () => {
    let fastify;

    beforeAll(async () => {
        // Create a test instance of Fastify
        fastify = Fastify({ logger: false });

        // Register WebSocket plugin
        await fastify.register(websocket);

        // Health check endpoint
        fastify.get('/health', async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
        });

        // API info endpoint
        fastify.get('/api/info', async () => {
            return {
                name: 'TON3S Backend',
                version: '2.0.0',
                features: ['nostr-proxy'],
                timestamp: new Date().toISOString()
            };
        });

        // Default relays endpoint
        fastify.get('/api/relays', async () => {
            return {
                relays: [
                    'wss://relay.damus.io',
                    'wss://nos.lol',
                    'wss://relay.nostr.band',
                    'wss://relay.snort.social',
                    'wss://nostr.wine'
                ]
            };
        });

        // CORS headers hook
        fastify.addHook('onSend', async (request, reply) => {
            reply.header('Access-Control-Allow-Origin', '*');
            reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            reply.header('Access-Control-Allow-Headers', 'Content-Type');
        });

        await fastify.ready();
    });

    afterAll(async () => {
        await fastify.close();
    });

    describe('GET /health', () => {
        it('should return status ok', async () => {
            const response = await fastify.inject({
                method: 'GET',
                url: '/health'
            });

            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.status).toBe('ok');
            expect(body.timestamp).toBeDefined();
        });

        it('should return valid ISO timestamp', async () => {
            const response = await fastify.inject({
                method: 'GET',
                url: '/health'
            });

            const body = JSON.parse(response.body);
            const date = new Date(body.timestamp);
            expect(date.toISOString()).toBe(body.timestamp);
        });
    });

    describe('GET /api/info', () => {
        it('should return API info', async () => {
            const response = await fastify.inject({
                method: 'GET',
                url: '/api/info'
            });

            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.name).toBe('TON3S Backend');
            expect(body.version).toBe('2.0.0');
            expect(body.features).toContain('nostr-proxy');
            expect(body.timestamp).toBeDefined();
        });
    });

    describe('GET /api/relays', () => {
        it('should return list of default relays', async () => {
            const response = await fastify.inject({
                method: 'GET',
                url: '/api/relays'
            });

            expect(response.statusCode).toBe(200);

            const body = JSON.parse(response.body);
            expect(body.relays).toBeDefined();
            expect(Array.isArray(body.relays)).toBe(true);
            expect(body.relays.length).toBeGreaterThan(0);
        });

        it('should return valid WebSocket URLs', async () => {
            const response = await fastify.inject({
                method: 'GET',
                url: '/api/relays'
            });

            const body = JSON.parse(response.body);
            for (const relay of body.relays) {
                expect(relay).toMatch(/^wss?:\/\//);
            }
        });

        it('should include common relays', async () => {
            const response = await fastify.inject({
                method: 'GET',
                url: '/api/relays'
            });

            const body = JSON.parse(response.body);
            expect(body.relays).toContain('wss://relay.damus.io');
            expect(body.relays).toContain('wss://nos.lol');
        });
    });

    describe('CORS Headers', () => {
        it('should include CORS headers on health endpoint', async () => {
            const response = await fastify.inject({
                method: 'GET',
                url: '/health'
            });

            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toBe('GET, POST, OPTIONS');
            expect(response.headers['access-control-allow-headers']).toBe('Content-Type');
        });

        it('should include CORS headers on API endpoints', async () => {
            const response = await fastify.inject({
                method: 'GET',
                url: '/api/info'
            });

            expect(response.headers['access-control-allow-origin']).toBe('*');
        });
    });

    describe('404 handling', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await fastify.inject({
                method: 'GET',
                url: '/unknown-route'
            });

            expect(response.statusCode).toBe(404);
        });
    });
});
