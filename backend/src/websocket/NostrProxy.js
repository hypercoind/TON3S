/**
 * TON3S NOSTR Proxy
 * WebSocket proxy for NOSTR relay connections
 * Provides IP privacy by proxying all relay traffic through the server
 */

import WebSocket from 'ws';
import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

// Maximum WebSocket message size (64KB)
const MAX_MESSAGE_SIZE = 64 * 1024;

// Maximum relay connections per client
const MAX_RELAYS_PER_CLIENT = 10;

// Rate limiting: max messages per second per client
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 1000;

export class NostrProxy {
    constructor() {
        this.relayConnections = new Map(); // clientId -> Map<relayUrl, WebSocket>
        this.clientConnections = new Map(); // clientId -> WebSocket
        this.messageQueue = new Map(); // clientId -> messages[]
        this.messageTimestamps = new Map(); // clientId -> timestamp[]
    }

    /**
     * Check if an IP address is private/internal
     */
    isPrivateIP(ip) {
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
     * Validate relay URL for SSRF protection
     */
    async validateRelayUrl(url) {
        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            throw new Error('Invalid URL format');
        }

        // Only allow WebSocket protocols
        if (!['ws:', 'wss:'].includes(parsed.protocol)) {
            throw new Error('Only WebSocket protocols (ws/wss) are allowed');
        }

        // Block localhost and common internal hostnames
        const blockedHostnames = [
            'localhost',
            '127.0.0.1',
            '0.0.0.0',
            '::1',
            '[::1]',
            'metadata.google.internal',
            'metadata.google',
            '169.254.169.254'
        ];

        const hostname = parsed.hostname.toLowerCase();
        if (blockedHostnames.includes(hostname)) {
            throw new Error('Connecting to internal hosts is not allowed');
        }

        // Resolve hostname and check if it resolves to a private IP
        // Fail closed: if DNS fails, reject the connection
        const { address } = await dnsLookup(parsed.hostname);
        if (this.isPrivateIP(address)) {
            throw new Error('Relay hostname resolves to a private IP address');
        }

        // Return resolved IP for DNS pinning (prevent TOCTOU rebinding)
        return { parsed, resolvedIP: address };
    }

    /**
     * Sanitize error message to prevent information leakage
     */
    sanitizeErrorMessage(error) {
        // Only expose generic error messages to clients
        const message = error?.message || 'Unknown error';

        // List of safe error patterns to pass through
        const safePatterns = [
            /^Invalid URL/i,
            /^Only WebSocket protocols/i,
            /^Connecting to internal hosts/i,
            /^private IP/i,
            /^connection refused/i,
            /^connection timeout/i,
            /^relay disconnected/i,
            /^already connected/i,
            /^Unexpected server response: \d+/i // HTTP status errors (502, 503, etc.)
        ];

        for (const pattern of safePatterns) {
            if (pattern.test(message)) {
                return message;
            }
        }

        // Return generic error for unexpected errors
        return 'Connection failed';
    }

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
        // Rate limiting
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

        try {
            const dataStr = data.toString();

            // Validate message size
            if (dataStr.length > MAX_MESSAGE_SIZE) {
                this.sendToClient(clientId, ['ERROR', 'Message too large']);
                return;
            }

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
            ({ parsed, resolvedIP } = await this.validateRelayUrl(relayUrl));
        } catch (error) {
            console.warn(`[NostrProxy] URL validation failed for ${relayUrl}: ${error.message}`);
            this.sendToClient(clientId, [
                'RELAY_STATUS',
                relayUrl,
                'error',
                this.sanitizeErrorMessage(error)
            ]);
            return;
        }

        console.log(
            `[NostrProxy] Connecting to relay: ${relayUrl} (${resolvedIP}) for client: ${clientId}`
        );

        try {
            // Use resolved IP to prevent DNS rebinding (TOCTOU)
            const port = parsed.port || (parsed.protocol === 'wss:' ? 443 : 80);
            const pinnedUrl = `${parsed.protocol}//${resolvedIP}:${port}${parsed.pathname}${parsed.search}`;
            const relaySocket = new WebSocket(pinnedUrl, {
                maxPayload: MAX_MESSAGE_SIZE,
                headers: { Host: parsed.host },
                servername: parsed.hostname // SNI for TLS
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
                    const dataStr = data.toString();
                    // Validate message size from relay
                    if (dataStr.length > MAX_MESSAGE_SIZE) {
                        console.warn(`[NostrProxy] Relay message too large from ${relayUrl}`);
                        return;
                    }
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
                    this.sanitizeErrorMessage(error)
                ]);
            });
        } catch (error) {
            console.error(`[NostrProxy] Failed to connect to relay: ${relayUrl}`, error);
            this.sendToClient(clientId, [
                'RELAY_STATUS',
                relayUrl,
                'error',
                this.sanitizeErrorMessage(error)
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
            queue.push({ relayUrl, message });
            this.messageQueue.set(clientId, queue);
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
