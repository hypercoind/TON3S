import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the ws module before importing NostrProxy
vi.mock('ws', () => ({
    default: class MockWebSocket {
        static OPEN = 1;
        static CLOSED = 3;
        constructor() {
            this.readyState = 1;
        }
        on() {}
        send() {}
        close() {}
    }
}));

import { NostrProxy } from '../src/websocket/NostrProxy.js';

/**
 * NostrProxy unit tests
 * Tests internal logic without requiring actual WebSocket connections
 */
describe('NostrProxy', () => {
    let proxy;
    let mockClientSocket;

    beforeEach(() => {
        // Suppress console output during tests
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        proxy = new NostrProxy();

        // Create mock client socket
        mockClientSocket = {
            on: vi.fn(),
            send: vi.fn(),
            close: vi.fn(),
            readyState: 1
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('handleConnection', () => {
        it('should store client connection', () => {
            proxy.handleConnection(mockClientSocket, 'client-1');
            expect(proxy.clientConnections.get('client-1')).toBe(mockClientSocket);
        });

        it('should initialize relay connections map for client', () => {
            proxy.handleConnection(mockClientSocket, 'client-1');
            expect(proxy.relayConnections.has('client-1')).toBe(true);
            expect(proxy.relayConnections.get('client-1')).toBeInstanceOf(Map);
        });

        it('should initialize message queue for client', () => {
            proxy.handleConnection(mockClientSocket, 'client-1');
            expect(proxy.messageQueue.has('client-1')).toBe(true);
            expect(proxy.messageQueue.get('client-1')).toEqual([]);
        });

        it('should set up event handlers', () => {
            proxy.handleConnection(mockClientSocket, 'client-1');
            expect(mockClientSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
            expect(mockClientSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockClientSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
        });
    });

    describe('handleClientMessage', () => {
        beforeEach(() => {
            proxy.handleConnection(mockClientSocket, 'client-1');
        });

        it('should handle DISCONNECT message', () => {
            const disconnectSpy = vi.spyOn(proxy, 'disconnectFromRelay');
            proxy.handleClientMessage('client-1', JSON.stringify(['DISCONNECT', 'wss://relay.example.com']));
            expect(disconnectSpy).toHaveBeenCalledWith('client-1', 'wss://relay.example.com');
        });

        it('should handle SEND message', () => {
            const sendSpy = vi.spyOn(proxy, 'sendToRelay');
            const message = { type: 'EVENT' };
            proxy.handleClientMessage('client-1', JSON.stringify(['SEND', 'wss://relay.example.com', message]));
            expect(sendSpy).toHaveBeenCalledWith('client-1', 'wss://relay.example.com', message);
        });

        it('should handle BROADCAST message', () => {
            const broadcastSpy = vi.spyOn(proxy, 'broadcastToRelays');
            const message = { type: 'EVENT' };
            proxy.handleClientMessage('client-1', JSON.stringify(['BROADCAST', message]));
            expect(broadcastSpy).toHaveBeenCalledWith('client-1', message);
        });

        it('should send error for invalid JSON', () => {
            const sendToClientSpy = vi.spyOn(proxy, 'sendToClient');
            proxy.handleClientMessage('client-1', 'not json');
            expect(sendToClientSpy).toHaveBeenCalledWith('client-1', ['ERROR', 'Invalid message format']);
        });

        it('should log warning for unknown message type', () => {
            const warnSpy = vi.spyOn(console, 'warn');
            proxy.handleClientMessage('client-1', JSON.stringify(['UNKNOWN']));
            expect(warnSpy).toHaveBeenCalled();
        });
    });

    describe('disconnectFromRelay', () => {
        beforeEach(() => {
            proxy.handleConnection(mockClientSocket, 'client-1');
        });

        it('should close relay connection and notify client', () => {
            const mockRelaySocket = { close: vi.fn() };
            proxy.relayConnections.get('client-1').set('wss://relay.example.com', mockRelaySocket);
            const sendToClientSpy = vi.spyOn(proxy, 'sendToClient');

            proxy.disconnectFromRelay('client-1', 'wss://relay.example.com');

            expect(mockRelaySocket.close).toHaveBeenCalled();
            expect(proxy.relayConnections.get('client-1').has('wss://relay.example.com')).toBe(false);
            expect(sendToClientSpy).toHaveBeenCalledWith('client-1', ['RELAY_STATUS', 'wss://relay.example.com', 'disconnected']);
        });

        it('should handle non-existent relay', () => {
            expect(() => {
                proxy.disconnectFromRelay('client-1', 'wss://nonexistent.relay');
            }).not.toThrow();
        });
    });

    describe('sendToRelay', () => {
        beforeEach(() => {
            proxy.handleConnection(mockClientSocket, 'client-1');
        });

        it('should send message to open relay', () => {
            const mockRelaySocket = { send: vi.fn(), readyState: 1 };
            proxy.relayConnections.get('client-1').set('wss://relay.example.com', mockRelaySocket);

            const message = { type: 'EVENT' };
            proxy.sendToRelay('client-1', 'wss://relay.example.com', message);

            expect(mockRelaySocket.send).toHaveBeenCalledWith(JSON.stringify(message));
        });

        it('should queue message if relay not open', () => {
            const mockRelaySocket = { send: vi.fn(), readyState: 3 };
            proxy.relayConnections.get('client-1').set('wss://relay.example.com', mockRelaySocket);

            const message = { type: 'EVENT' };
            proxy.sendToRelay('client-1', 'wss://relay.example.com', message);

            expect(mockRelaySocket.send).not.toHaveBeenCalled();
            expect(proxy.messageQueue.get('client-1')).toContainEqual({ relayUrl: 'wss://relay.example.com', message });
        });

        it('should queue message if relay does not exist', () => {
            const message = { type: 'EVENT' };
            proxy.sendToRelay('client-1', 'wss://relay.example.com', message);
            expect(proxy.messageQueue.get('client-1')).toContainEqual({ relayUrl: 'wss://relay.example.com', message });
        });
    });

    describe('broadcastToRelays', () => {
        beforeEach(() => {
            proxy.handleConnection(mockClientSocket, 'client-1');
        });

        it('should send message to all open relays', () => {
            const relay1 = { send: vi.fn(), readyState: 1 };
            const relay2 = { send: vi.fn(), readyState: 1 };
            const relay3 = { send: vi.fn(), readyState: 3 };

            proxy.relayConnections.get('client-1').set('wss://relay1.example.com', relay1);
            proxy.relayConnections.get('client-1').set('wss://relay2.example.com', relay2);
            proxy.relayConnections.get('client-1').set('wss://relay3.example.com', relay3);

            const message = { type: 'EVENT' };
            proxy.broadcastToRelays('client-1', message);

            expect(relay1.send).toHaveBeenCalledWith(JSON.stringify(message));
            expect(relay2.send).toHaveBeenCalledWith(JSON.stringify(message));
            expect(relay3.send).not.toHaveBeenCalled();
        });
    });

    describe('sendToClient', () => {
        it('should send JSON message to client', () => {
            proxy.handleConnection(mockClientSocket, 'client-1');
            proxy.sendToClient('client-1', ['RELAY_STATUS', 'wss://relay.example.com', 'connected']);
            expect(mockClientSocket.send).toHaveBeenCalledWith(JSON.stringify(['RELAY_STATUS', 'wss://relay.example.com', 'connected']));
        });

        it('should not send if client socket not open', () => {
            mockClientSocket.readyState = 3;
            proxy.handleConnection(mockClientSocket, 'client-1');
            proxy.sendToClient('client-1', ['TEST']);
            expect(mockClientSocket.send).not.toHaveBeenCalled();
        });

        it('should not send if client does not exist', () => {
            expect(() => proxy.sendToClient('nonexistent', ['TEST'])).not.toThrow();
        });
    });

    describe('handleClientDisconnect', () => {
        it('should close all relay connections for client', () => {
            proxy.handleConnection(mockClientSocket, 'client-1');
            const relay1 = { close: vi.fn() };
            const relay2 = { close: vi.fn() };

            proxy.relayConnections.get('client-1').set('wss://relay1.example.com', relay1);
            proxy.relayConnections.get('client-1').set('wss://relay2.example.com', relay2);

            proxy.handleClientDisconnect('client-1');

            expect(relay1.close).toHaveBeenCalled();
            expect(relay2.close).toHaveBeenCalled();
        });

        it('should clean up all client data', () => {
            proxy.handleConnection(mockClientSocket, 'client-1');
            proxy.handleClientDisconnect('client-1');

            expect(proxy.clientConnections.has('client-1')).toBe(false);
            expect(proxy.relayConnections.has('client-1')).toBe(false);
            expect(proxy.messageQueue.has('client-1')).toBe(false);
        });
    });

    describe('getConnectedRelays', () => {
        it('should return empty array if client has no relays', () => {
            expect(proxy.getConnectedRelays('nonexistent')).toEqual([]);
        });

        it('should return only open relay URLs', () => {
            proxy.handleConnection(mockClientSocket, 'client-1');
            proxy.relayConnections.get('client-1').set('wss://relay1.example.com', { readyState: 1 });
            proxy.relayConnections.get('client-1').set('wss://relay2.example.com', { readyState: 3 });
            proxy.relayConnections.get('client-1').set('wss://relay3.example.com', { readyState: 1 });

            const connected = proxy.getConnectedRelays('client-1');

            expect(connected).toContain('wss://relay1.example.com');
            expect(connected).toContain('wss://relay3.example.com');
            expect(connected).not.toContain('wss://relay2.example.com');
        });
    });
});
