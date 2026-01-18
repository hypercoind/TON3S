/**
 * TON3S Backend Server
 * Fastify server with WebSocket NOSTR proxy
 */

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { NostrProxy } from './websocket/NostrProxy.js';
import { randomUUID } from 'crypto';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Fastify
const fastify = Fastify({
    logger: true
});

// Initialize NOSTR proxy
const nostrProxy = new NostrProxy();

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

// WebSocket endpoint for NOSTR proxy
fastify.register(async function (fastify) {
    fastify.get('/ws/nostr', { websocket: true }, (socket, req) => {
        const clientId = randomUUID();
        nostrProxy.handleConnection(socket, clientId);
    });
});

// CORS headers for API routes
fastify.addHook('onSend', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
});

// Start server
const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: HOST });
        console.log(`TON3S Backend running on http://${HOST}:${PORT}`);
        console.log(`NOSTR Proxy available at ws://${HOST}:${PORT}/ws/nostr`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
