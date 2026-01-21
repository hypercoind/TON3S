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

// Import after mocking
const { nostrAuthService } = await import('../NostrAuthService.js');
const { appState } = await import('../../state/AppState.js');

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
});
