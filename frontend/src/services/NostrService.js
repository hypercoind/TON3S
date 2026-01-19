/**
 * TON3S NOSTR Service
 * Relay communication through proxy for IP privacy
 */

import { appState, StateEvents } from '../state/AppState.js';
import { nostrAuthService } from './NostrAuthService.js';

class NostrService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageHandlers = new Map();
        this.pendingPublishes = new Map();
    }

    /**
     * Connect to the NOSTR proxy WebSocket
     */
    async connect() {
        const proxyUrl = appState.settings.nostr.proxyUrl;
        const wsUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${proxyUrl}`;

        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(wsUrl);

                this.socket.onopen = () => {
                    console.log('[NOSTR] Proxy connected');
                    this.connected = true;
                    this.reconnectAttempts = 0;

                    // Connect to default relays
                    this.connectToDefaultRelays();
                    resolve();
                };

                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.socket.onclose = () => {
                    console.log('[NOSTR] Proxy disconnected');
                    this.connected = false;
                    this.attemptReconnect();
                };

                this.socket.onerror = (error) => {
                    console.error('[NOSTR] Proxy error:', error);
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Disconnect from proxy
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
    }

    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[NOSTR] Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`[NOSTR] Reconnecting in ${delay}ms...`);
        setTimeout(() => this.connect(), delay);
    }

    /**
     * Connect to default relays
     */
    connectToDefaultRelays() {
        const relays = appState.settings.nostr.defaultRelays;
        for (const relay of relays) {
            this.connectToRelay(relay);
        }
    }

    /**
     * Connect to a specific relay
     */
    connectToRelay(relayUrl) {
        if (!this.socket || !this.connected) return;
        this.socket.send(JSON.stringify(['CONNECT', relayUrl]));
    }

    /**
     * Disconnect from a relay
     */
    disconnectFromRelay(relayUrl) {
        if (!this.socket || !this.connected) return;
        this.socket.send(JSON.stringify(['DISCONNECT', relayUrl]));
    }

    /**
     * Handle incoming messages from proxy
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            const [type, ...params] = message;

            switch (type) {
                case 'RELAY_STATUS':
                    this.handleRelayStatus(params[0], params[1], params[2]);
                    break;

                case 'RELAY_MESSAGE':
                    this.handleRelayMessage(params[0], params[1]);
                    break;

                case 'ERROR':
                    console.error('[NOSTR] Proxy error:', params[0]);
                    break;
            }
        } catch (error) {
            console.error('[NOSTR] Error parsing message:', error);
        }
    }

    /**
     * Handle relay status updates
     */
    handleRelayStatus(relayUrl, status, errorMessage) {
        console.log(`[NOSTR] Relay ${relayUrl}: ${status}`);

        if (status === 'error') {
            appState.setNostrError(`Relay error: ${relayUrl} - ${errorMessage}`);
        }
    }

    /**
     * Handle messages from relays
     */
    handleRelayMessage(relayUrl, message) {
        const [type, ...params] = message;

        switch (type) {
            case 'OK':
                // Event published successfully
                const [eventId, success, reason] = params;
                const handler = this.pendingPublishes.get(eventId);
                if (handler) {
                    if (success) {
                        handler.resolve({ eventId, relayUrl });
                    } else {
                        handler.reject(new Error(reason || 'Publish failed'));
                    }
                    this.pendingPublishes.delete(eventId);
                }
                appState.emit(StateEvents.NOSTR_PUBLISHED, { eventId, relayUrl, success });
                break;

            case 'NOTICE':
                console.log(`[NOSTR] ${relayUrl} notice:`, params[0]);
                break;

            case 'EVENT':
                // Handle incoming events (for future subscription support)
                break;
        }
    }

    /**
     * Publish a note as a NOSTR event
     */
    async publishNote(note) {
        if (!nostrAuthService.isConnected()) {
            throw new Error('Not connected to NOSTR. Please connect first.');
        }

        const content = note.plainText || '';
        if (!content.trim()) {
            throw new Error('Note is empty');
        }

        // Create the event (kind 1 = text note)
        const event = {
            kind: 1,
            content: content,
            tags: [],
            created_at: Math.floor(Date.now() / 1000)
        };

        // Add title as a tag if present
        if (note.title && note.title !== 'Untitled') {
            event.tags.push(['title', note.title]);
        }

        // Add note tags as hashtags
        if (note.tags && note.tags.length > 0) {
            for (const tag of note.tags) {
                event.tags.push(['t', tag]);
            }
        }

        // Sign the event with the extension
        const signedEvent = await nostrAuthService.signEvent(event);
        console.log('[NOSTR] Signed event:', signedEvent.id);

        // Publish to all connected relays
        return this.publishEvent(signedEvent);
    }

    /**
     * Publish a signed event to relays
     */
    publishEvent(signedEvent) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.connected) {
                reject(new Error('Not connected to proxy'));
                return;
            }

            // Store handler for OK response
            this.pendingPublishes.set(signedEvent.id, { resolve, reject });

            // Broadcast to all relays
            const message = ['EVENT', signedEvent];
            this.socket.send(JSON.stringify(['BROADCAST', message]));

            // Timeout after 10 seconds
            setTimeout(() => {
                if (this.pendingPublishes.has(signedEvent.id)) {
                    this.pendingPublishes.delete(signedEvent.id);
                    reject(new Error('Publish timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Create a kind 30023 long-form content event
     */
    async publishLongForm(note) {
        if (!nostrAuthService.isConnected()) {
            throw new Error('Not connected to NOSTR');
        }

        const content = note.plainText || '';
        if (!content.trim()) {
            throw new Error('Note is empty');
        }

        // Generate a unique identifier for the article
        const dTag = `ton3s-${note.id}`;

        // Create long-form event (kind 30023)
        const event = {
            kind: 30023,
            content: content,
            tags: [
                ['d', dTag],
                ['title', note.title || 'Untitled'],
                ['published_at', String(Math.floor(Date.now() / 1000))]
            ],
            created_at: Math.floor(Date.now() / 1000)
        };

        // Add note tags
        if (note.tags && note.tags.length > 0) {
            for (const tag of note.tags) {
                event.tags.push(['t', tag]);
            }
        }

        const signedEvent = await nostrAuthService.signEvent(event);
        return this.publishEvent(signedEvent);
    }

    /**
     * Check if connected to proxy
     */
    isConnected() {
        return this.connected && this.socket?.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
export const nostrService = new NostrService();
export default nostrService;
