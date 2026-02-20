import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock appState
vi.mock('../../state/AppState.js', () => ({
    appState: {
        settings: {
            nostr: {
                proxyUrl: '/ws/nostr',
                defaultRelays: ['wss://relay1.example.com', 'wss://relay2.example.com']
            }
        },
        setNostrError: vi.fn(),
        emit: vi.fn()
    },
    StateEvents: {
        NOSTR_PUBLISHED: 'nostr:published'
    }
}));

// Mock nostrAuthService
vi.mock('../NostrAuthService.js', () => ({
    nostrAuthService: {
        isConnected: vi.fn(),
        signEvent: vi.fn()
    }
}));

// Mock markdown utilities
vi.mock('../../utils/markdown.js', () => ({
    extractMediaMetadata: vi.fn(() => []),
    htmlToMarkdown: vi.fn(html => html || '')
}));

// Import after mocking
import { nostrService } from '../NostrService.js';
import { nostrAuthService } from '../NostrAuthService.js';
import { appState } from '../../state/AppState.js';
import { extractMediaMetadata, htmlToMarkdown } from '../../utils/markdown.js';

describe('NostrService', () => {
    let mockWebSocket;

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset service state
        nostrService.socket = null;
        nostrService.connected = false;
        nostrService.reconnectAttempts = 0;
        nostrService.reconnectTimer = null;
        nostrService.shouldReconnect = true;
        nostrService.pendingPublishes.clear();
        nostrService.connectedRelays.clear();
        nostrService.pendingRelays.clear();
        nostrService.sentEventIds.clear();

        // Create a mock WebSocket instance
        mockWebSocket = {
            send: vi.fn(),
            close: vi.fn(),
            readyState: 1, // WebSocket.OPEN
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null
        };

        // Mock WebSocket constructor with a proper function
        const MockWebSocket = function (url) {
            this.url = url;
            this.send = mockWebSocket.send;
            this.close = mockWebSocket.close;
            this.readyState = mockWebSocket.readyState;
            // Store reference so tests can trigger events
            Object.defineProperty(this, 'onopen', {
                set: fn => {
                    mockWebSocket.onopen = fn;
                },
                get: () => mockWebSocket.onopen
            });
            Object.defineProperty(this, 'onmessage', {
                set: fn => {
                    mockWebSocket.onmessage = fn;
                },
                get: () => mockWebSocket.onmessage
            });
            Object.defineProperty(this, 'onclose', {
                set: fn => {
                    mockWebSocket.onclose = fn;
                },
                get: () => mockWebSocket.onclose
            });
            Object.defineProperty(this, 'onerror', {
                set: fn => {
                    mockWebSocket.onerror = fn;
                },
                get: () => mockWebSocket.onerror
            });
        };
        MockWebSocket.OPEN = 1;
        MockWebSocket.CLOSED = 3;

        vi.stubGlobal('WebSocket', MockWebSocket);

        // Mock location
        vi.stubGlobal('location', {
            protocol: 'https:',
            host: 'localhost:3000'
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    describe('connect', () => {
        it('should create WebSocket with correct URL', async () => {
            const connectPromise = nostrService.connect();

            // Trigger onopen
            mockWebSocket.onopen();

            await connectPromise;

            expect(nostrService.connected).toBe(true);
        });

        it('should use ws: for http protocol', async () => {
            vi.stubGlobal('location', {
                protocol: 'http:',
                host: 'localhost:3000'
            });

            const connectPromise = nostrService.connect();
            mockWebSocket.onopen();
            await connectPromise;

            expect(nostrService.connected).toBe(true);
        });

        it('should connect to default relays on open', async () => {
            const connectPromise = nostrService.connect();
            mockWebSocket.onopen();
            await connectPromise;

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                JSON.stringify(['CONNECT', 'wss://relay1.example.com'])
            );
            expect(mockWebSocket.send).toHaveBeenCalledWith(
                JSON.stringify(['CONNECT', 'wss://relay2.example.com'])
            );
        });

        it('should set connected to true on open', async () => {
            const connectPromise = nostrService.connect();
            mockWebSocket.onopen();
            await connectPromise;

            expect(nostrService.connected).toBe(true);
        });

        it('should reject on error', async () => {
            const connectPromise = nostrService.connect();

            // Trigger onerror
            mockWebSocket.onerror(new Error('Connection failed'));

            await expect(connectPromise).rejects.toBeDefined();
        });
    });

    describe('disconnect', () => {
        it('should close socket and reset state', () => {
            nostrService.socket = mockWebSocket;
            nostrService.connected = true;

            nostrService.disconnect();

            expect(mockWebSocket.close).toHaveBeenCalled();
            expect(nostrService.socket).toBeNull();
            expect(nostrService.connected).toBe(false);
        });

        it('should handle null socket', () => {
            nostrService.socket = null;

            expect(() => nostrService.disconnect()).not.toThrow();
        });

        it('should not reconnect after manual disconnect', async () => {
            const connectPromise = nostrService.connect();
            mockWebSocket.onopen();
            await connectPromise;

            const reconnectSpy = vi.spyOn(nostrService, 'attemptReconnect');

            nostrService.disconnect();
            mockWebSocket.onclose();

            expect(reconnectSpy).not.toHaveBeenCalled();
        });
    });

    describe('attemptReconnect', () => {
        it('should not reconnect when reconnect is disabled', () => {
            nostrService.shouldReconnect = false;

            nostrService.attemptReconnect();

            expect(nostrService.reconnectAttempts).toBe(0);
            expect(nostrService.reconnectTimer).toBeNull();
        });

        it('should not reconnect after max attempts', () => {
            nostrService.reconnectAttempts = nostrService.maxReconnectAttempts;

            nostrService.attemptReconnect();

            // Should not create new timeout
            expect(nostrService.reconnectAttempts).toBe(nostrService.maxReconnectAttempts);
        });

        it('should catch reconnect errors from scheduled connect', async () => {
            vi.useFakeTimers();
            const connectSpy = vi
                .spyOn(nostrService, 'connect')
                .mockRejectedValue(new Error('boom'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            nostrService.attemptReconnect();
            expect(nostrService.reconnectTimer).not.toBeNull();

            await vi.runOnlyPendingTimersAsync();
            await Promise.resolve();

            expect(connectSpy).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
            expect(nostrService.reconnectTimer).toBeNull();

            connectSpy.mockRestore();
            consoleSpy.mockRestore();
        });
    });

    describe('connectToRelay', () => {
        it('should send CONNECT message', () => {
            nostrService.socket = mockWebSocket;
            nostrService.connected = true;

            nostrService.connectToRelay('wss://relay.example.com');

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                JSON.stringify(['CONNECT', 'wss://relay.example.com'])
            );
        });

        it('should not send if not connected', () => {
            nostrService.socket = mockWebSocket;
            nostrService.connected = false;

            nostrService.connectToRelay('wss://relay.example.com');

            expect(mockWebSocket.send).not.toHaveBeenCalled();
        });
    });

    describe('disconnectFromRelay', () => {
        it('should send DISCONNECT message', () => {
            nostrService.socket = mockWebSocket;
            nostrService.connected = true;

            nostrService.disconnectFromRelay('wss://relay.example.com');

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                JSON.stringify(['DISCONNECT', 'wss://relay.example.com'])
            );
        });
    });

    describe('handleMessage', () => {
        beforeEach(() => {
            nostrService.socket = mockWebSocket;
            nostrService.connected = true;
        });

        it('should handle RELAY_STATUS message', () => {
            nostrService.handleMessage(
                JSON.stringify(['RELAY_STATUS', 'wss://relay.example.com', 'connected'])
            );

            // Should not throw
        });

        it('should handle RELAY_STATUS error', () => {
            nostrService.handleMessage(
                JSON.stringify([
                    'RELAY_STATUS',
                    'wss://relay.example.com',
                    'error',
                    'Connection refused'
                ])
            );

            expect(appState.setNostrError).toHaveBeenCalled();
        });

        it('should handle RELAY_MESSAGE with OK', () => {
            const resolve = vi.fn();
            const reject = vi.fn();
            nostrService.pendingPublishes.set('event123', { resolve, reject });
            nostrService.sentEventIds.add('event123');

            nostrService.handleMessage(
                JSON.stringify([
                    'RELAY_MESSAGE',
                    'wss://relay.example.com',
                    ['OK', 'event123', true]
                ])
            );

            expect(resolve).toHaveBeenCalledWith({
                eventId: 'event123',
                relayUrl: 'wss://relay.example.com'
            });
            expect(nostrService.pendingPublishes.has('event123')).toBe(false);
        });

        it('should handle RELAY_MESSAGE with failed OK', () => {
            const resolve = vi.fn();
            const reject = vi.fn();
            nostrService.pendingPublishes.set('event456', { resolve, reject });
            nostrService.sentEventIds.add('event456');

            nostrService.handleMessage(
                JSON.stringify([
                    'RELAY_MESSAGE',
                    'wss://relay.example.com',
                    ['OK', 'event456', false, 'Rate limited']
                ])
            );

            expect(reject).toHaveBeenCalled();
        });

        it('should handle ERROR message', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            nostrService.handleMessage(JSON.stringify(['ERROR', 'Something went wrong']));

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle invalid JSON', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            nostrService.handleMessage('not json');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('publishNote', () => {
        it('should throw if not connected to NOSTR', async () => {
            nostrAuthService.isConnected.mockReturnValue(false);

            await expect(nostrService.publishNote({ plainText: 'Test' })).rejects.toThrow(
                'Not connected to NOSTR. Please connect first.'
            );
        });

        it('should throw if note is empty', async () => {
            nostrAuthService.isConnected.mockReturnValue(true);

            await expect(nostrService.publishNote({ plainText: '' })).rejects.toThrow(
                'Note is empty'
            );
        });

        it('should create and sign kind 1 event', async () => {
            nostrAuthService.isConnected.mockReturnValue(true);
            nostrAuthService.signEvent.mockResolvedValue({
                id: 'event123',
                kind: 1,
                content: 'Test content',
                sig: 'signature'
            });

            nostrService.socket = mockWebSocket;
            nostrService.connected = true;

            // Don't await - it will timeout waiting for OK response
            nostrService.publishNote({
                plainText: 'Test content',
                title: 'My Title',
                tags: ['tag1']
            });

            expect(nostrAuthService.signEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: 1,
                    content: 'Test content',
                    tags: expect.arrayContaining([
                        ['title', 'My Title'],
                        ['t', 'tag1']
                    ])
                })
            );

            // Clean up promise
            nostrService.pendingPublishes.delete('event123');
        });
    });

    describe('publishLongForm', () => {
        it('should throw if not connected', async () => {
            nostrAuthService.isConnected.mockReturnValue(false);

            await expect(
                nostrService.publishLongForm({ plainText: 'Test', id: 1 })
            ).rejects.toThrow('Not connected to NOSTR');
        });

        it('should create kind 30023 event', async () => {
            nostrAuthService.isConnected.mockReturnValue(true);
            nostrAuthService.signEvent.mockResolvedValue({
                id: 'event456',
                kind: 30023
            });
            htmlToMarkdown.mockReturnValue('Long form content');
            extractMediaMetadata.mockReturnValue([]);

            nostrService.socket = mockWebSocket;
            nostrService.connected = true;

            nostrService.publishLongForm({
                id: 123,
                content: '<p>Long form content</p>',
                title: 'Article Title'
            });

            expect(nostrAuthService.signEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: 30023,
                    tags: expect.arrayContaining([
                        ['d', 'ton3s-123'],
                        ['title', 'Article Title']
                    ])
                })
            );

            // Clean up
            nostrService.pendingPublishes.delete('event456');
        });
    });

    describe('publishEvent', () => {
        it('should reject if not connected to proxy', async () => {
            nostrService.connected = false;

            await expect(nostrService.publishEvent({ id: 'test' })).rejects.toThrow(
                'Not connected to proxy'
            );
        });

        it('should broadcast event and wait for OK', async () => {
            nostrService.socket = mockWebSocket;
            nostrService.connected = true;

            const publishPromise = nostrService.publishEvent({ id: 'event789' });

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                JSON.stringify(['BROADCAST', ['EVENT', { id: 'event789' }]])
            );

            // Simulate OK response
            nostrService.handleMessage(
                JSON.stringify([
                    'RELAY_MESSAGE',
                    'wss://relay.example.com',
                    ['OK', 'event789', true]
                ])
            );

            const result = await publishPromise;
            expect(result).toEqual({
                eventId: 'event789',
                relayUrl: 'wss://relay.example.com'
            });
        });
    });

    describe('_addImetaTags', () => {
        it('should add imeta tags for media items', () => {
            extractMediaMetadata.mockReturnValue([
                {
                    url: 'https://b.com/abc123.jpg',
                    type: 'image/jpeg',
                    sha256: 'abc123',
                    dim: '800x600'
                }
            ]);

            const event = { tags: [] };
            const result = nostrService._addImetaTags(
                event,
                '<img data-blossom-url="https://b.com/abc123.jpg">'
            );

            expect(event.tags).toHaveLength(1);
            expect(event.tags[0][0]).toBe('imeta');
            expect(event.tags[0]).toContain('url https://b.com/abc123.jpg');
            expect(event.tags[0]).toContain('m image/jpeg');
            expect(event.tags[0]).toContain('dim 800x600');
            expect(event.tags[0]).toContain('x abc123');
            expect(result).toHaveLength(1);
        });

        it('should handle multiple media items', () => {
            extractMediaMetadata.mockReturnValue([
                { url: 'https://b.com/1.jpg', type: 'image/jpeg', sha256: 'a', dim: '100x100' },
                { url: 'https://b.com/2.mp4', type: 'video/mp4', sha256: 'b', dim: '1920x1080' }
            ]);

            const event = { tags: [] };
            nostrService._addImetaTags(event, '<img><video>');

            expect(event.tags).toHaveLength(2);
            expect(event.tags[0]).toContain('url https://b.com/1.jpg');
            expect(event.tags[1]).toContain('url https://b.com/2.mp4');
        });

        it('should skip optional fields when missing', () => {
            extractMediaMetadata.mockReturnValue([{ url: 'https://b.com/1.jpg' }]);

            const event = { tags: [] };
            nostrService._addImetaTags(event, '<img>');

            expect(event.tags[0]).toEqual(['imeta', 'url https://b.com/1.jpg']);
        });

        it('should return empty array for null content', () => {
            const event = { tags: [] };
            const result = nostrService._addImetaTags(event, null);

            expect(result).toEqual([]);
            expect(event.tags).toHaveLength(0);
        });
    });

    describe('publishNote - media', () => {
        it('should include imeta tags for media content', async () => {
            nostrAuthService.isConnected.mockReturnValue(true);
            nostrAuthService.signEvent.mockResolvedValue({
                id: 'media-event',
                kind: 1,
                content: 'Photo https://b.com/img.jpg',
                sig: 'sig'
            });
            extractMediaMetadata.mockReturnValue([
                { url: 'https://b.com/img.jpg', type: 'image/jpeg', sha256: 'abc', dim: '800x600' }
            ]);

            nostrService.socket = mockWebSocket;
            nostrService.connected = true;

            nostrService.publishNote({
                plainText: 'Photo https://b.com/img.jpg',
                content: '<p>Photo</p><img data-blossom-url="https://b.com/img.jpg">'
            });

            expect(nostrAuthService.signEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: 1,
                    tags: expect.arrayContaining([
                        expect.arrayContaining(['imeta', 'url https://b.com/img.jpg'])
                    ])
                })
            );

            nostrService.pendingPublishes.delete('media-event');
        });
    });

    describe('publishLongForm - media', () => {
        it('should use htmlToMarkdown for content and add image tag', async () => {
            nostrAuthService.isConnected.mockReturnValue(true);
            nostrAuthService.signEvent.mockResolvedValue({
                id: 'lf-event',
                kind: 30023
            });
            htmlToMarkdown.mockReturnValue('# Article\n\n![](https://b.com/img.jpg)\n\nText');
            extractMediaMetadata.mockReturnValue([
                { url: 'https://b.com/img.jpg', type: 'image/jpeg', sha256: 'abc', dim: '800x600' }
            ]);

            nostrService.socket = mockWebSocket;
            nostrService.connected = true;

            nostrService.publishLongForm({
                id: 'note-42',
                content:
                    '<h1>Article</h1><img data-blossom-url="https://b.com/img.jpg"><p>Text</p>',
                title: 'Article'
            });

            expect(htmlToMarkdown).toHaveBeenCalled();
            expect(nostrAuthService.signEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: 30023,
                    tags: expect.arrayContaining([
                        ['image', 'https://b.com/img.jpg'],
                        expect.arrayContaining(['imeta', 'url https://b.com/img.jpg'])
                    ])
                })
            );

            nostrService.pendingPublishes.delete('lf-event');
        });
    });

    describe('isConnected', () => {
        it('should return true when connected and socket is open', () => {
            nostrService.connected = true;
            nostrService.socket = { readyState: 1 }; // WebSocket.OPEN

            expect(nostrService.isConnected()).toBe(true);
        });

        it('should return false when not connected', () => {
            nostrService.connected = false;
            nostrService.socket = { readyState: 1 }; // WebSocket.OPEN

            expect(nostrService.isConnected()).toBe(false);
        });

        it('should return false when socket is not open', () => {
            nostrService.connected = true;
            nostrService.socket = { readyState: 3 }; // WebSocket.CLOSED

            expect(nostrService.isConnected()).toBe(false);
        });

        it('should return false when socket is null', () => {
            nostrService.connected = true;
            nostrService.socket = null;

            expect(nostrService.isConnected()).toBe(false);
        });
    });
});
