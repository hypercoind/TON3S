/**
 * TON3S NOSTR Proxy
 * WebSocket proxy for NOSTR relay connections
 * Provides IP privacy by proxying all relay traffic through the server
 */

import WebSocket from 'ws';
import { validateRelayUrl, sanitizeErrorMessage } from '../utils/ssrf.js';

// Maximum WebSocket message size (64KB)
const MAX_MESSAGE_SIZE = 64 * 1024;

// Maximum relay connections per client
const MAX_RELAYS_PER_CLIENT = 10;

// Rate limiting: max messages per second per client
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 1000;

// Maximum queued messages per client (prevents memory exhaustion)
const MAX_QUEUE_SIZE = 100;

// WebSocket handshake timeout (prevents stalled connections consuming relay slots)
const HANDSHAKE_TIMEOUT_MS = 10000;

// Message types exempt from rate limiting (control messages, not relay-bound)
const RATE_LIMIT_EXEMPT = new Set(['CONNECT', 'DISCONNECT']);

export class NostrProxy {
    constructor() {
        this.relayConnections = new Map(); // clientId -> Map<relayUrl, WebSocket>
        this.clientConnections = new Map(); // clientId -> WebSocket
        this.messageQueue = new Map(); // clientId -> messages[]
        this.messageTimestamps = new Map(); // clientId -> timestamp[]
    }

    // SSRF utilities delegated to shared module (../utils/ssrf.js)

    /**
     * Handle a new client connection
     */
    handleConnection(clientSocket, clientId) {
        console.log(`[NostrProxy] Client connected: ${clientId}`);

        this.clientConnections.set(clientId, clientSocket);
        this.relayConnections.set(clientId, new Map());
        this.messageQueue.set(clientId, []);

        clientSocket.on('message', data => {
            this.handleClientMessage(clientId, data);
        });

        clientSocket.on('close', () => {
            this.handleClientDisconnect(clientId);
        });

        clientSocket.on('error', error => {
            console.error(`[NostrProxy] Client error: ${clientId}`, error);
        });
    }

    /**
     * Handle message from client
     */
    handleClientMessage(clientId, data) {
        try {
            const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

            // Validate message size in bytes (UTF-8 safe)
            if (dataBuffer.length > MAX_MESSAGE_SIZE) {
                this.sendToClient(clientId, ['ERROR', 'Message too large']);
                return;
            }

            const dataStr = dataBuffer.toString('utf8');
            const message = JSON.parse(dataStr);

            // Validate message structure
            if (!Array.isArray(message) || message.length === 0) {
                this.sendToClient(clientId, ['ERROR', 'Invalid message format']);
                return;
            }

            const [type, ...params] = message;

            // Validate type is a string
            if (typeof type !== 'string') {
                this.sendToClient(clientId, ['ERROR', 'Invalid message type']);
                return;
            }

            // Rate limiting (exempt control messages like CONNECT/DISCONNECT)
            if (!RATE_LIMIT_EXEMPT.has(type)) {
                const now = Date.now();
                let timestamps = this.messageTimestamps.get(clientId) || [];
                timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
                timestamps.push(now);
                this.messageTimestamps.set(clientId, timestamps);

                if (timestamps.length > RATE_LIMIT_MAX) {
                    console.warn(`[NostrProxy] Rate limit exceeded for client: ${clientId}`);
                    this.sendToClient(clientId, ['ERROR', 'Rate limit exceeded']);
                    const clientSocket = this.clientConnections.get(clientId);
                    if (clientSocket) {
                        clientSocket.close(4008, 'Rate limit exceeded');
                    }
                    return;
                }
            }

            switch (type) {
                case 'CONNECT': {
                    // Connect to a relay
                    const relayUrl = params[0];
                    if (typeof relayUrl !== 'string') {
                        this.sendToClient(clientId, ['ERROR', 'Invalid relay URL']);
                        return;
                    }
                    this.connectToRelay(clientId, relayUrl);
                    break;
                }

                case 'DISCONNECT': {
                    // Disconnect from a relay
                    const disconnectUrl = params[0];
                    if (typeof disconnectUrl !== 'string') {
                        this.sendToClient(clientId, ['ERROR', 'Invalid relay URL']);
                        return;
                    }
                    this.disconnectFromRelay(clientId, disconnectUrl);
                    break;
                }

                case 'SEND': {
                    // Send message to a specific relay
                    const [targetUrl, relayMessage] = params;
                    if (typeof targetUrl !== 'string' || !Array.isArray(relayMessage)) {
                        this.sendToClient(clientId, ['ERROR', 'Invalid message parameters']);
                        return;
                    }
                    this.sendToRelay(clientId, targetUrl, relayMessage);
                    break;
                }

                case 'BROADCAST': {
                    // Send message to all connected relays
                    const broadcastMessage = params[0];
                    if (!Array.isArray(broadcastMessage)) {
                        this.sendToClient(clientId, ['ERROR', 'Invalid broadcast message']);
                        return;
                    }
                    this.broadcastToRelays(clientId, broadcastMessage);
                    break;
                }

                default:
                    console.warn(`[NostrProxy] Unknown message type: ${type}`);
                    this.sendToClient(clientId, ['ERROR', 'Unknown message type']);
            }
        } catch (error) {
            console.error('[NostrProxy] Error parsing client message:', error);
            this.sendToClient(clientId, ['ERROR', 'Invalid message format']);
        }
    }

    /**
     * Connect to a NOSTR relay
     */
    async connectToRelay(clientId, relayUrl) {
        const relays = this.relayConnections.get(clientId);
        if (!relays) {
            return;
        }

        // Check if already connected
        if (relays.has(relayUrl)) {
            this.sendToClient(clientId, ['RELAY_STATUS', relayUrl, 'already_connected']);
            return;
        }

        // Enforce maximum relay connections per client
        if (relays.size >= MAX_RELAYS_PER_CLIENT) {
            this.sendToClient(clientId, [
                'RELAY_STATUS',
                relayUrl,
                'error',
                'Maximum relay connections reached'
            ]);
            return;
        }

        // Validate relay URL for SSRF protection
        let parsed, resolvedIP;
        try {
            ({ parsed, resolvedIP } = await validateRelayUrl(relayUrl));
        } catch (error) {
            console.warn(`[NostrProxy] URL validation failed for ${relayUrl}: ${error.message}`);
            this.sendToClient(clientId, [
                'RELAY_STATUS',
                relayUrl,
                'error',
                sanitizeErrorMessage(error)
            ]);
            return;
        }

        // Strip query params from relay URL before logging to prevent leaking auth tokens
        const logSafeUrl = relayUrl.split('?')[0];
        console.log(
            `[NostrProxy] Connecting to relay: ${logSafeUrl} (${resolvedIP}) for client: ${clientId}`
        );

        try {
            // Use resolved IP to prevent DNS rebinding (TOCTOU)
            const port = parsed.port || (parsed.protocol === 'wss:' ? 443 : 80);
            const pinnedUrl = `${parsed.protocol}//${resolvedIP}:${port}${parsed.pathname}${parsed.search}`;
            const relaySocket = new WebSocket(pinnedUrl, {
                maxPayload: MAX_MESSAGE_SIZE,
                headers: { Host: parsed.host },
                servername: parsed.hostname, // SNI for TLS
                handshakeTimeout: HANDSHAKE_TIMEOUT_MS
            });

            relaySocket.on('open', () => {
                console.log(`[NostrProxy] Connected to relay: ${relayUrl}`);
                relays.set(relayUrl, relaySocket);
                this.sendToClient(clientId, ['RELAY_STATUS', relayUrl, 'connected']);

                // Send any queued messages
                this.flushQueuedMessages(clientId, relayUrl);
            });

            relaySocket.on('message', data => {
                // Forward relay message to client
                try {
                    const relayBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
                    // Validate message size from relay in bytes
                    if (relayBuffer.length > MAX_MESSAGE_SIZE) {
                        console.warn(`[NostrProxy] Relay message too large from ${relayUrl}`);
                        return;
                    }
                    const dataStr = relayBuffer.toString('utf8');
                    const message = JSON.parse(dataStr);
                    this.sendToClient(clientId, ['RELAY_MESSAGE', relayUrl, message]);
                } catch (error) {
                    console.error('[NostrProxy] Error parsing relay message:', error);
                }
            });

            relaySocket.on('close', () => {
                console.log(`[NostrProxy] Relay disconnected: ${relayUrl}`);
                relays.delete(relayUrl);
                this.sendToClient(clientId, ['RELAY_STATUS', relayUrl, 'disconnected']);
            });

            relaySocket.on('error', error => {
                console.error(`[NostrProxy] Relay error: ${relayUrl}`, error.message);
                relays.delete(relayUrl);
                this.sendToClient(clientId, [
                    'RELAY_STATUS',
                    relayUrl,
                    'error',
                    sanitizeErrorMessage(error)
                ]);
            });
        } catch (error) {
            console.error(`[NostrProxy] Failed to connect to relay: ${relayUrl}`, error);
            this.sendToClient(clientId, [
                'RELAY_STATUS',
                relayUrl,
                'error',
                sanitizeErrorMessage(error)
            ]);
        }
    }

    /**
     * Disconnect from a relay
     */
    disconnectFromRelay(clientId, relayUrl) {
        const relays = this.relayConnections.get(clientId);
        if (!relays) {
            return;
        }

        const relaySocket = relays.get(relayUrl);
        if (relaySocket) {
            relaySocket.close();
            relays.delete(relayUrl);
            this.sendToClient(clientId, ['RELAY_STATUS', relayUrl, 'disconnected']);
        }
    }

    /**
     * Send message to a specific relay
     */
    sendToRelay(clientId, relayUrl, message) {
        const relays = this.relayConnections.get(clientId);
        if (!relays) {
            return;
        }

        const relaySocket = relays.get(relayUrl);
        if (relaySocket && relaySocket.readyState === WebSocket.OPEN) {
            relaySocket.send(JSON.stringify(message));
        } else {
            // Queue message for when relay connects
            const queue = this.messageQueue.get(clientId) || [];
            if (queue.length < MAX_QUEUE_SIZE) {
                queue.push({ relayUrl, message });
                this.messageQueue.set(clientId, queue);
            }
        }
    }

    /**
     * Broadcast message to all connected relays
     */
    broadcastToRelays(clientId, message) {
        const relays = this.relayConnections.get(clientId);
        if (!relays) {
            return;
        }

        for (const relaySocket of relays.values()) {
            if (relaySocket.readyState === WebSocket.OPEN) {
                relaySocket.send(JSON.stringify(message));
            }
        }
    }

    /**
     * Send queued messages after relay connects
     */
    flushQueuedMessages(clientId, relayUrl) {
        const queue = this.messageQueue.get(clientId) || [];
        const remaining = [];

        for (const item of queue) {
            if (item.relayUrl === relayUrl) {
                this.sendToRelay(clientId, relayUrl, item.message);
            } else {
                remaining.push(item);
            }
        }

        this.messageQueue.set(clientId, remaining);
    }

    /**
     * Send message to client
     */
    sendToClient(clientId, message) {
        const clientSocket = this.clientConnections.get(clientId);
        if (clientSocket && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify(message));
        }
    }

    /**
     * Handle client disconnect
     */
    handleClientDisconnect(clientId) {
        console.log(`[NostrProxy] Client disconnected: ${clientId}`);

        // Close all relay connections for this client
        const relays = this.relayConnections.get(clientId);
        if (relays) {
            for (const relaySocket of relays.values()) {
                relaySocket.close();
            }
        }

        // Cleanup
        this.clientConnections.delete(clientId);
        this.relayConnections.delete(clientId);
        this.messageQueue.delete(clientId);
        this.messageTimestamps.delete(clientId);
    }

    /**
     * Get connected relays for a client
     */
    getConnectedRelays(clientId) {
        const relays = this.relayConnections.get(clientId);
        if (!relays) {
            return [];
        }

        return Array.from(relays.keys()).filter(url => {
            const socket = relays.get(url);
            return socket && socket.readyState === WebSocket.OPEN;
        });
    }
}

export default NostrProxy;
