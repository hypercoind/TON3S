/**
 * TON3S NOSTR Auth Service
 * NIP-07 browser extension authentication
 * Supports nos2x, Alby, and other NIP-07 compatible extensions
 */

import { appState } from '../state/AppState.js';

class NostrAuthService {
    constructor() {
        this.extension = null;
        this.pubkey = null;
        this.checkTimeout = null;
    }

    /**
     * Check if a NIP-07 extension is available
     */
    hasExtension() {
        return typeof window.nostr !== 'undefined';
    }

    /**
     * Wait for extension to be available (some load async)
     */
    async waitForExtension(timeout = 3000) {
        if (this.hasExtension()) {
            return true;
        }

        return new Promise(resolve => {
            const checkInterval = 100;
            let elapsed = 0;

            const check = () => {
                if (this.hasExtension()) {
                    resolve(true);
                    return;
                }

                elapsed += checkInterval;
                if (elapsed >= timeout) {
                    resolve(false);
                    return;
                }

                setTimeout(check, checkInterval);
            };

            check();
        });
    }

    /**
     * Connect to the NOSTR extension and get public key
     */
    async connect() {
        try {
            const hasExtension = await this.waitForExtension();
            if (!hasExtension) {
                throw new Error('No NOSTR extension found. Install nos2x or Alby.');
            }

            // Get public key from extension
            this.pubkey = await window.nostr.getPublicKey();
            this.extension = window.nostr;

            // Detect extension type
            const extensionName = this.detectExtensionType();

            appState.setNostrConnected(this.pubkey, extensionName);
            console.log(
                `[NOSTR] Connected with ${extensionName}, pubkey: ${this.pubkey.slice(0, 8)}...`
            );

            return {
                pubkey: this.pubkey,
                extension: extensionName
            };
        } catch (error) {
            appState.setNostrError(error.message);
            throw error;
        }
    }

    /**
     * Disconnect from NOSTR
     */
    disconnect() {
        this.pubkey = null;
        this.extension = null;
        appState.setNostrDisconnected();
    }

    /**
     * Detect which NOSTR extension is installed
     */
    detectExtensionType() {
        if (!window.nostr) {
            return 'unknown';
        }

        // Check for Alby
        if (window.alby) {
            return 'Alby';
        }

        // Check for nos2x (typically just has the basic NIP-07 interface)
        if (window.nostr.getPublicKey && window.nostr.signEvent) {
            // nos2x doesn't have extra properties, it's minimal
            return 'nos2x';
        }

        return 'NIP-07 Extension';
    }

    /**
     * Get the user's public key
     */
    async getPublicKey() {
        if (this.pubkey) {
            return this.pubkey;
        }

        if (!this.hasExtension()) {
            throw new Error('No NOSTR extension available');
        }

        this.pubkey = await window.nostr.getPublicKey();
        return this.pubkey;
    }

    /**
     * Sign an event with the user's private key (via extension)
     */
    async signEvent(event) {
        if (!this.hasExtension()) {
            throw new Error('No NOSTR extension available');
        }

        return await window.nostr.signEvent(event);
    }

    /**
     * Get relays from extension (NIP-07)
     */
    async getRelays() {
        if (!this.hasExtension()) {
            return null;
        }

        if (typeof window.nostr.getRelays === 'function') {
            return await window.nostr.getRelays();
        }

        return null;
    }

    /**
     * Encrypt message (NIP-04)
     */
    async encrypt(pubkey, plaintext) {
        if (!this.hasExtension()) {
            throw new Error('No NOSTR extension available');
        }

        if (typeof window.nostr.nip04?.encrypt === 'function') {
            return await window.nostr.nip04.encrypt(pubkey, plaintext);
        }

        throw new Error('NIP-04 encryption not supported by extension');
    }

    /**
     * Decrypt message (NIP-04)
     */
    async decrypt(pubkey, ciphertext) {
        if (!this.hasExtension()) {
            throw new Error('No NOSTR extension available');
        }

        if (typeof window.nostr.nip04?.decrypt === 'function') {
            return await window.nostr.nip04.decrypt(pubkey, ciphertext);
        }

        throw new Error('NIP-04 decryption not supported by extension');
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.pubkey !== null && appState.nostr.connected;
    }

    /**
     * Get short pubkey for display
     */
    getShortPubkey() {
        if (!this.pubkey) {
            return null;
        }
        return `${this.pubkey.slice(0, 8)}...${this.pubkey.slice(-8)}`;
    }
}

// Singleton instance
export const nostrAuthService = new NostrAuthService();
export default nostrAuthService;
