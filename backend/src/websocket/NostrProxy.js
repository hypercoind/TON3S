/**
 * TON3S NOSTR Proxy
 * WebSocket proxy for NOSTR relay connections
 * Provides IP privacy by proxying all relay traffic through the server
 */

import WebSocket from 'ws';

export class NostrProxy {
    constructor() {
        this.relayConnections = new Map(); // clientId -> Map<relayUrl, WebSocket>
        this.clientConnections = new Map(); // clientId -> WebSocket
        this.messageQueue = new Map(); // clientId -> messages[]
    }

    /**
     * Handle a new client connection
     */
    handleConnection(clientSocket, clientId) {
        console.log(`[NostrProxy] Client connected: ${clientId}`);

        this.clientConnections.set(clientId, clientSocket);
        this.relayConnections.set(clientId, new Map());
        this.messageQueue.set(clientId, []);

        clientSocket.on('message', (data) => {
            this.handleClientMessage(clientId, data);
        });

        clientSocket.on('close', () => {
            this.handleClientDisconnect(clientId);
        });

        clientSocket.on('error', (error) => {
            console.error(`[NostrProxy] Client error: ${clientId}`, error);
        });
    }

    /**
     * Handle message from client
     */
    handleClientMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            const [type, ...params] = message;

            switch (type) {
                case 'CONNECT':
                    // Connect to a relay
                    const relayUrl = params[0];
                    this.connectToRelay(clientId, relayUrl);
                    break;

                case 'DISCONNECT':
                    // Disconnect from a relay
                    const disconnectUrl = params[0];
                    this.disconnectFromRelay(clientId, disconnectUrl);
                    break;

                case 'SEND':
                    // Send message to a specific relay
                    const [targetUrl, relayMessage] = params;
                    this.sendToRelay(clientId, targetUrl, relayMessage);
                    break;

                case 'BROADCAST':
                    // Send message to all connected relays
                    const broadcastMessage = params[0];
                    this.broadcastToRelays(clientId, broadcastMessage);
                    break;

                default:
                    console.warn(`[NostrProxy] Unknown message type: ${type}`);
            }
        } catch (error) {
            console.error(`[NostrProxy] Error parsing client message:`, error);
            this.sendToClient(clientId, ['ERROR', 'Invalid message format']);
        }
    }

    /**
     * Connect to a NOSTR relay
     */
    connectToRelay(clientId, relayUrl) {
        const relays = this.relayConnections.get(clientId);
        if (!relays) return;

        // Check if already connected
        if (relays.has(relayUrl)) {
            this.sendToClient(clientId, ['RELAY_STATUS', relayUrl, 'already_connected']);
            return;
        }

        console.log(`[NostrProxy] Connecting to relay: ${relayUrl} for client: ${clientId}`);

        try {
            const relaySocket = new WebSocket(relayUrl);

            relaySocket.on('open', () => {
                console.log(`[NostrProxy] Connected to relay: ${relayUrl}`);
                relays.set(relayUrl, relaySocket);
                this.sendToClient(clientId, ['RELAY_STATUS', relayUrl, 'connected']);

                // Send any queued messages
                this.flushQueuedMessages(clientId, relayUrl);
            });

            relaySocket.on('message', (data) => {
                // Forward relay message to client
                try {
                    const message = JSON.parse(data.toString());
                    this.sendToClient(clientId, ['RELAY_MESSAGE', relayUrl, message]);
                } catch (error) {
                    console.error(`[NostrProxy] Error parsing relay message:`, error);
                }
            });

            relaySocket.on('close', () => {
                console.log(`[NostrProxy] Relay disconnected: ${relayUrl}`);
                relays.delete(relayUrl);
                this.sendToClient(clientId, ['RELAY_STATUS', relayUrl, 'disconnected']);
            });

            relaySocket.on('error', (error) => {
                console.error(`[NostrProxy] Relay error: ${relayUrl}`, error.message);
                relays.delete(relayUrl);
                this.sendToClient(clientId, ['RELAY_STATUS', relayUrl, 'error', error.message]);
            });
        } catch (error) {
            console.error(`[NostrProxy] Failed to connect to relay: ${relayUrl}`, error);
            this.sendToClient(clientId, ['RELAY_STATUS', relayUrl, 'error', error.message]);
        }
    }

    /**
     * Disconnect from a relay
     */
    disconnectFromRelay(clientId, relayUrl) {
        const relays = this.relayConnections.get(clientId);
        if (!relays) return;

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
        if (!relays) return;

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
        if (!relays) return;

        for (const [relayUrl, relaySocket] of relays) {
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
            for (const [relayUrl, relaySocket] of relays) {
                relaySocket.close();
            }
        }

        // Cleanup
        this.clientConnections.delete(clientId);
        this.relayConnections.delete(clientId);
        this.messageQueue.delete(clientId);
    }

    /**
     * Get connected relays for a client
     */
    getConnectedRelays(clientId) {
        const relays = this.relayConnections.get(clientId);
        if (!relays) return [];

        return Array.from(relays.keys()).filter(url => {
            const socket = relays.get(url);
            return socket && socket.readyState === WebSocket.OPEN;
        });
    }
}

export default NostrProxy;
