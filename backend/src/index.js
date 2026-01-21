/**
 * TON3S Backend Server
 * Fastify server with WebSocket NOSTR proxy
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { NostrProxy } from './websocket/NostrProxy.js';
import { randomUUID } from 'crypto';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3002',
    process.env.FRONTEND_URL
].filter(Boolean);

// Initialize Fastify
const fastify = Fastify({
    logger: true
});

// Initialize NOSTR proxy
const nostrProxy = new NostrProxy();

// Register CORS plugin with origin validation
await fastify.register(cors, {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is allowed
        if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.ton3s.app')) {
            return callback(null, true);
        }

        // In development, allow localhost with any port
        if (
            process.env.NODE_ENV !== 'production' &&
            origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)
        ) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
});

// Register rate limiting plugin
await fastify.register(rateLimit, {
    max: 100, // Maximum 100 requests
    timeWindow: '1 minute',
    // Custom error response
    errorResponseBuilder: () => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
    })
});

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
    fastify.get('/ws/nostr', { websocket: true }, (socket, _req) => {
        const clientId = randomUUID();
        nostrProxy.handleConnection(socket, clientId);
    });
});

// Security headers
fastify.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
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
