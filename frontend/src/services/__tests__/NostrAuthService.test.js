import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock appState
vi.mock('../../state/AppState.js', () => ({
    appState: {
        nostr: {
            connected: false
        },
        setNostrConnected: vi.fn(),
        setNostrDisconnected: vi.fn(),
        setNostrError: vi.fn()
    }
}));

// Mock wasm-loader
const mockWasmModule = {
    is_key_loaded: vi.fn(() => false),
    import_nsec: vi.fn(),
    import_hex: vi.fn(),
    import_key: vi.fn(),
    derive_pubkey: vi.fn(() => new Uint8Array(32)),
    clear_key: vi.fn(),
    sha256_hash: vi.fn(() => {
        // Simple mock: return 32 zero bytes (tests check behavior, not crypto correctness)
        return new Uint8Array(32);
    })
};

vi.mock('../wasm-loader.js', () => ({
    loadWasmModule: vi.fn(),
    getWasmModule: vi.fn(() => mockWasmModule),
    isWasmAvailable: vi.fn(() => false)
}));

// Import after mocking
const { nostrAuthService } = await import('../NostrAuthService.js');
const { appState } = await import('../../state/AppState.js');
const { isWasmAvailable } = await import('../wasm-loader.js');

describe('NostrAuthService', () => {
    let originalNostr;
    let originalAlby;

    beforeEach(() => {
        // Store originals
        originalNostr = window.nostr;
        originalAlby = window.alby;

        // Reset mocks
        vi.clearAllMocks();

        // Reset service state
        nostrAuthService.pubkey = null;
        nostrAuthService.extension = null;

        // Reset window.nostr
        delete window.nostr;
        delete window.alby;
    });

    afterEach(() => {
        // Restore originals
        if (originalNostr) {
            window.nostr = originalNostr;
        }
        if (originalAlby) {
            window.alby = originalAlby;
        }
    });

    describe('hasExtension', () => {
        it('should return true when window.nostr exists', () => {
            window.nostr = {};
            expect(nostrAuthService.hasExtension()).toBe(true);
        });

        it('should return false when window.nostr is undefined', () => {
            delete window.nostr;
            expect(nostrAuthService.hasExtension()).toBe(false);
        });
    });

    describe('waitForExtension', () => {
        it('should resolve immediately if extension exists', async () => {
            window.nostr = {};

            const result = await nostrAuthService.waitForExtension(1000);

            expect(result).toBe(true);
        });

        it('should resolve when extension becomes available', async () => {
            // Extension not available initially
            delete window.nostr;

            // Add extension after 50ms
            setTimeout(() => {
                window.nostr = {};
            }, 50);

            const result = await nostrAuthService.waitForExtension(1000);

            expect(result).toBe(true);
        });

        it('should resolve false after timeout if no extension', async () => {
            delete window.nostr;

            const result = await nostrAuthService.waitForExtension(200);

            expect(result).toBe(false);
        }, 1000);
    });

    describe('connect', () => {
        it('should connect and get public key from extension', async () => {
            const mockPubkey = 'abc123pubkey';
            window.nostr = {
                getPublicKey: vi.fn().mockResolvedValue(mockPubkey),
                signEvent: vi.fn()
            };

            const result = await nostrAuthService.connect();

            expect(result.pubkey).toBe(mockPubkey);
            expect(nostrAuthService.pubkey).toBe(mockPubkey);
            expect(appState.setNostrConnected).toHaveBeenCalledWith(mockPubkey, 'nos2x');
        });

        it('should detect Alby extension', async () => {
            const mockPubkey = 'abc123pubkey';
            window.nostr = {
                getPublicKey: vi.fn().mockResolvedValue(mockPubkey),
                signEvent: vi.fn()
            };
            window.alby = {};

            const result = await nostrAuthService.connect();

            expect(result.extension).toBe('Alby');
        });

        it('should throw error when no extension found', async () => {
            delete window.nostr;

            await expect(nostrAuthService.connect()).rejects.toThrow(
                'No NOSTR extension found. Install nos2x or Alby.'
            );
            expect(appState.setNostrError).toHaveBeenCalled();
        });

        it('should throw error when getPublicKey fails', async () => {
            window.nostr = {
                getPublicKey: vi.fn().mockRejectedValue(new Error('User denied')),
                signEvent: vi.fn()
            };

            await expect(nostrAuthService.connect()).rejects.toThrow('User denied');
            expect(appState.setNostrError).toHaveBeenCalledWith('User denied');
        });
    });

    describe('connectWithPrivateKey', () => {
        beforeEach(() => {
            nostrAuthService._wasmReady = true;
            isWasmAvailable.mockReturnValue(true);
        });

        afterEach(() => {
            nostrAuthService._wasmReady = false;
            isWasmAvailable.mockReturnValue(false);
        });

        it('should call import_nsec for nsec keys', async () => {
            const nsecKey = 'nsec1vl029mgpspedva04g90vltkh6fvh240zqtv9k0t9af8935ke9laqsnlfe5';

            const result = await nostrAuthService.connectWithPrivateKey(nsecKey);

            expect(mockWasmModule.import_nsec).toHaveBeenCalledWith(nsecKey);
            expect(mockWasmModule.import_hex).not.toHaveBeenCalled();
            expect(result.pubkey).toMatch(/^[0-9a-f]{64}$/);
            expect(result.extension).toBe('Private Key');
            expect(appState.setNostrConnected).toHaveBeenCalled();
        });

        it('should call import_hex for hex keys', async () => {
            const hexKey = 'a'.repeat(64);

            const result = await nostrAuthService.connectWithPrivateKey(hexKey);

            expect(mockWasmModule.import_hex).toHaveBeenCalledWith(hexKey);
            expect(mockWasmModule.import_nsec).not.toHaveBeenCalled();
            expect(result.pubkey).toMatch(/^[0-9a-f]{64}$/);
            expect(result.extension).toBe('Private Key');
        });

        it('should trim whitespace before passing to WASM', async () => {
            const hexKey = 'b'.repeat(64);

            await nostrAuthService.connectWithPrivateKey(`  ${hexKey}  `);

            expect(mockWasmModule.import_hex).toHaveBeenCalledWith(hexKey);
        });

        it('should throw when WASM is not ready', async () => {
            nostrAuthService._wasmReady = false;
            isWasmAvailable.mockReturnValue(false);

            await expect(nostrAuthService.connectWithPrivateKey('a'.repeat(64))).rejects.toThrow(
                'WASM signing module not available'
            );
            expect(appState.setNostrError).toHaveBeenCalled();
        });

        it('should propagate WASM import errors', async () => {
            mockWasmModule.import_hex.mockImplementationOnce(() => {
                throw new Error('Invalid hex private key (expected 64 hex chars)');
            });

            await expect(nostrAuthService.connectWithPrivateKey('not-valid-hex')).rejects.toThrow(
                'Invalid hex private key (expected 64 hex chars)'
            );
        });
    });

    describe('disconnect', () => {
        it('should reset state and call appState.setNostrDisconnected', () => {
            nostrAuthService.pubkey = 'test';
            nostrAuthService.extension = window.nostr;

            nostrAuthService.disconnect();

            expect(nostrAuthService.pubkey).toBeNull();
            expect(nostrAuthService.extension).toBeNull();
            expect(appState.setNostrDisconnected).toHaveBeenCalled();
        });
    });

    describe('detectExtensionType', () => {
        it('should return "unknown" when no extension', () => {
            delete window.nostr;
            expect(nostrAuthService.detectExtensionType()).toBe('unknown');
        });

        it('should detect Alby', () => {
            window.nostr = {};
            window.alby = {};
            expect(nostrAuthService.detectExtensionType()).toBe('Alby');
        });

        it('should detect nos2x', () => {
            window.nostr = {
                getPublicKey: vi.fn(),
                signEvent: vi.fn()
            };
            expect(nostrAuthService.detectExtensionType()).toBe('nos2x');
        });
    });

    describe('getPublicKey', () => {
        it('should return cached pubkey if available', async () => {
            nostrAuthService.pubkey = 'cached';
            const result = await nostrAuthService.getPublicKey();
            expect(result).toBe('cached');
        });

        it('should fetch pubkey from extension if not cached', async () => {
            window.nostr = {
                getPublicKey: vi.fn().mockResolvedValue('newpubkey')
            };

            const result = await nostrAuthService.getPublicKey();

            expect(result).toBe('newpubkey');
            expect(window.nostr.getPublicKey).toHaveBeenCalled();
        });

        it('should throw if no extension available', async () => {
            delete window.nostr;
            nostrAuthService.pubkey = null;

            await expect(nostrAuthService.getPublicKey()).rejects.toThrow(
                'No NOSTR extension available'
            );
        });
    });

    describe('signEvent', () => {
        it('should sign event using extension', async () => {
            const mockEvent = { kind: 1, content: 'test' };
            const mockSignedEvent = { ...mockEvent, sig: 'signature' };

            window.nostr = {
                signEvent: vi.fn().mockResolvedValue(mockSignedEvent)
            };

            const result = await nostrAuthService.signEvent(mockEvent);

            expect(result).toEqual(mockSignedEvent);
            expect(window.nostr.signEvent).toHaveBeenCalledWith(mockEvent);
        });

        it('should throw if no extension available', async () => {
            delete window.nostr;

            await expect(nostrAuthService.signEvent({})).rejects.toThrow(
                'No NOSTR extension available'
            );
        });
    });

    describe('getRelays', () => {
        it('should return null if no extension', async () => {
            delete window.nostr;
            const result = await nostrAuthService.getRelays();
            expect(result).toBeNull();
        });

        it('should return relays from extension if supported', async () => {
            const mockRelays = { 'wss://relay.example.com': { read: true, write: true } };
            window.nostr = {
                getRelays: vi.fn().mockResolvedValue(mockRelays)
            };

            const result = await nostrAuthService.getRelays();

            expect(result).toEqual(mockRelays);
        });

        it('should return null if getRelays not supported', async () => {
            window.nostr = {};

            const result = await nostrAuthService.getRelays();

            expect(result).toBeNull();
        });
    });

    describe('encrypt', () => {
        it('should encrypt using NIP-04', async () => {
            window.nostr = {
                nip04: {
                    encrypt: vi.fn().mockResolvedValue('encrypted')
                }
            };

            const result = await nostrAuthService.encrypt('pubkey', 'plaintext');

            expect(result).toBe('encrypted');
            expect(window.nostr.nip04.encrypt).toHaveBeenCalledWith('pubkey', 'plaintext');
        });

        it('should throw if NIP-04 not supported', async () => {
            window.nostr = {};

            await expect(nostrAuthService.encrypt('pubkey', 'plaintext')).rejects.toThrow(
                'NIP-04 encryption not supported by extension'
            );
        });

        it('should throw if no extension', async () => {
            delete window.nostr;

            await expect(nostrAuthService.encrypt('pubkey', 'plaintext')).rejects.toThrow(
                'No NOSTR extension available'
            );
        });
    });

    describe('decrypt', () => {
        it('should decrypt using NIP-04', async () => {
            window.nostr = {
                nip04: {
                    decrypt: vi.fn().mockResolvedValue('decrypted')
                }
            };

            const result = await nostrAuthService.decrypt('pubkey', 'ciphertext');

            expect(result).toBe('decrypted');
            expect(window.nostr.nip04.decrypt).toHaveBeenCalledWith('pubkey', 'ciphertext');
        });

        it('should throw if NIP-04 not supported', async () => {
            window.nostr = {};

            await expect(nostrAuthService.decrypt('pubkey', 'ciphertext')).rejects.toThrow(
                'NIP-04 decryption not supported by extension'
            );
        });
    });

    describe('isConnected', () => {
        it('should return true when pubkey and appState.nostr.connected are true', () => {
            nostrAuthService.pubkey = 'pubkey';
            appState.nostr.connected = true;

            expect(nostrAuthService.isConnected()).toBe(true);
        });

        it('should return false when pubkey is null', () => {
            nostrAuthService.pubkey = null;
            appState.nostr.connected = true;

            expect(nostrAuthService.isConnected()).toBe(false);
        });

        it('should return false when appState.nostr.connected is false', () => {
            nostrAuthService.pubkey = 'pubkey';
            appState.nostr.connected = false;

            expect(nostrAuthService.isConnected()).toBe(false);
        });
    });

    describe('getShortPubkey', () => {
        it('should return formatted short pubkey', () => {
            nostrAuthService.pubkey = '1234567890abcdef1234567890abcdef';

            const result = nostrAuthService.getShortPubkey();

            expect(result).toBe('12345678...90abcdef');
        });

        it('should return null when no pubkey', () => {
            nostrAuthService.pubkey = null;

            expect(nostrAuthService.getShortPubkey()).toBeNull();
        });
    });

    describe('calculateEventId', () => {
        const mockEvent = {
            pubkey: 'aabbccdd',
            created_at: 1700000000,
            kind: 1,
            tags: [],
            content: 'hello'
        };

        it('should use crypto.subtle when available', async () => {
            // crypto.subtle is available in vitest (Node secure context)
            const result = await nostrAuthService.calculateEventId(mockEvent);

            expect(result).toMatch(/^[0-9a-f]{64}$/);
        });

        it('should fall back to WASM sha256_hash when crypto.subtle is unavailable', async () => {
            // Temporarily remove crypto.subtle
            const originalSubtle = crypto.subtle;
            Object.defineProperty(crypto, 'subtle', {
                value: undefined,
                writable: true,
                configurable: true
            });

            // Enable WASM mock
            isWasmAvailable.mockReturnValue(true);

            const result = await nostrAuthService.calculateEventId(mockEvent);

            // WASM mock returns 32 zero bytes
            expect(result).toBe('00'.repeat(32));
            expect(mockWasmModule.sha256_hash).toHaveBeenCalled();

            // Restore
            Object.defineProperty(crypto, 'subtle', {
                value: originalSubtle,
                writable: true,
                configurable: true
            });
            isWasmAvailable.mockReturnValue(false);
        });

        it('should throw when neither crypto.subtle nor WASM is available', async () => {
            const originalSubtle = crypto.subtle;
            Object.defineProperty(crypto, 'subtle', {
                value: undefined,
                writable: true,
                configurable: true
            });

            isWasmAvailable.mockReturnValue(false);

            await expect(nostrAuthService.calculateEventId(mockEvent)).rejects.toThrow(
                'SHA-256 unavailable'
            );

            Object.defineProperty(crypto, 'subtle', {
                value: originalSubtle,
                writable: true,
                configurable: true
            });
        });

        it('should throw when WASM available but sha256_hash missing', async () => {
            const originalSubtle = crypto.subtle;
            Object.defineProperty(crypto, 'subtle', {
                value: undefined,
                writable: true,
                configurable: true
            });

            isWasmAvailable.mockReturnValue(true);
            const originalHash = mockWasmModule.sha256_hash;
            mockWasmModule.sha256_hash = 'not_a_function';

            await expect(nostrAuthService.calculateEventId(mockEvent)).rejects.toThrow(
                'SHA-256 unavailable'
            );

            // Restore
            mockWasmModule.sha256_hash = originalHash;
            Object.defineProperty(crypto, 'subtle', {
                value: originalSubtle,
                writable: true,
                configurable: true
            });
            isWasmAvailable.mockReturnValue(false);
        });
    });
});
