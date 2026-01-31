/**
 * TON3S NOSTR Auth Service
 * NIP-07 browser extension authentication and direct private key support
 * Supports nos2x, Alby, and other NIP-07 compatible extensions
 */

import { bech32 } from '@scure/base';
import { appState } from '../state/AppState.js';
import { loadWasmModule, getWasmModule, isWasmAvailable } from './wasm-loader.js';

// Auth method types
const AuthMethod = {
    EXTENSION: 'extension',
    PRIVATE_KEY: 'private_key'
};

class NostrAuthService {
    constructor() {
        this.extension = null;
        this.pubkey = null;
        this.checkTimeout = null;
        this._authMethod = null;
        this._unloadBound = false;
        this._wasmReady = false;

        // Bind methods for event listeners
        this._handleBeforeUnload = this._handleBeforeUnload.bind(this);
    }

    /**
     * Zero out a Uint8Array to clear sensitive data from memory
     */
    secureZero(array) {
        if (array && array instanceof Uint8Array) {
            for (let i = 0; i < array.length; i++) {
                array[i] = 0;
            }
        }
    }

    /**
     * Check if a private key is available (either JS or WASM)
     */
    _hasPrivateKey() {
        if (!isWasmAvailable()) {
            return false;
        }
        try {
            return getWasmModule()?.is_key_loaded() ?? false;
        } catch {
            return false;
        }
    }

    /**
     * Handle page unload - warn user about losing Nostr session
     */
    _handleBeforeUnload(event) {
        // Check if user has active Nostr session (extension or private key)
        if (this.pubkey) {
            // Show browser's native confirmation dialog
            event.preventDefault();
            event.returnValue = true; // Required for Chrome/Safari
            return true; // Required for Firefox
        }

        // Clear private key from WASM memory
        if (isWasmAvailable()) {
            try {
                getWasmModule()?.clear_key();
            } catch {
                /* ignore */
            }
        }
    }

    /**
     * Setup beforeunload handler
     */
    _setupUnloadHandler() {
        if (this._unloadBound) {
            return;
        }

        window.addEventListener('beforeunload', this._handleBeforeUnload);
        this._unloadBound = true;
    }

    /**
     * Cleanup all event listeners
     */
    _cleanupEventListeners() {
        // beforeunload is kept for browser close protection / WASM key cleanup
    }

    /**
     * Initialize the WASM signing module (non-blocking)
     */
    async initializeWasm() {
        try {
            const mod = await loadWasmModule();
            if (mod) {
                this._wasmReady = true;
                console.log('[NOSTR] WASM signing module available');
            }
        } catch (error) {
            console.warn('[NOSTR] WASM init failed:', error.message);
        }
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
            this._authMethod = AuthMethod.EXTENSION;

            // Detect extension type
            const extensionName = this.detectExtensionType();

            // Setup beforeunload handler for session protection
            this._setupUnloadHandler();

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
     * Connect using a private key (nsec or hex format)
     */
    async connectWithPrivateKey(keyInput) {
        try {
            if (!this._wasmReady || !isWasmAvailable()) {
                throw new Error('WASM signing module not available. Cannot use private key.');
            }

            // Parse and validate the private key
            const privateKeyHex = this.parsePrivateKey(keyInput);

            // Key bytes go into WASM memory, never stored in JS
            const keyBytes = this.hexToBytes(privateKeyHex);
            const wasm = getWasmModule();
            wasm.import_key(keyBytes);
            // Zero the JS copy immediately
            this.secureZero(keyBytes);

            const pubkeyBytes = wasm.derive_pubkey();
            const pubkeyHex = this.bytesToHex(pubkeyBytes);

            this._authMethod = AuthMethod.PRIVATE_KEY;
            this.pubkey = pubkeyHex;
            this.extension = null;

            // Setup unload handler for WASM key cleanup
            this._setupUnloadHandler();

            appState.setNostrConnected(this.pubkey, 'Private Key (WASM)');
            console.log(
                `[NOSTR] Connected with Private Key (WASM), pubkey: ${this.pubkey.slice(0, 8)}...`
            );

            return {
                pubkey: this.pubkey,
                extension: 'Private Key (WASM)'
            };
        } catch (error) {
            appState.setNostrError(error.message);
            throw error;
        }
    }

    /**
     * Parse private key from nsec (bech32) or hex format
     */
    parsePrivateKey(input) {
        const trimmed = input.trim();

        // Check if it's nsec format (bech32)
        if (trimmed.startsWith('nsec1')) {
            try {
                const decoded = bech32.decode(trimmed, 1000);
                if (decoded.prefix !== 'nsec') {
                    throw new Error('Invalid nsec prefix');
                }
                const words = decoded.words;
                const bytes = bech32.fromWords(words);
                const hex = Array.from(bytes)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                return hex;
            } catch {
                throw new Error('Invalid nsec format');
            }
        }

        // Assume hex format
        const hexRegex = /^[0-9a-fA-F]{64}$/;
        if (!hexRegex.test(trimmed)) {
            throw new Error('Invalid private key format. Use nsec or 64-character hex.');
        }

        return trimmed.toLowerCase();
    }

    /**
     * Derive public key from WASM-stored private key
     */
    derivePublicKey() {
        if (!isWasmAvailable()) {
            throw new Error('WASM signing module not available');
        }
        const wasm = getWasmModule();
        if (!wasm.is_key_loaded()) {
            throw new Error('No private key loaded in WASM');
        }
        const pubkeyBytes = wasm.derive_pubkey();
        return this.bytesToHex(pubkeyBytes);
    }

    /**
     * Disconnect from NOSTR
     */
    disconnect() {
        this._cleanupEventListeners();

        // Clear private key from WASM memory
        if (isWasmAvailable()) {
            try {
                const wasm = getWasmModule();
                if (wasm?.is_key_loaded()) {
                    wasm.clear_key();
                }
            } catch {
                // Ignore cleanup errors
            }
        }
        this._authMethod = null;
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

        if (this._authMethod === AuthMethod.PRIVATE_KEY && this._hasPrivateKey()) {
            this.pubkey = this.derivePublicKey();
            return this.pubkey;
        }

        if (!this.hasExtension()) {
            throw new Error('No NOSTR extension available');
        }

        this.pubkey = await window.nostr.getPublicKey();
        return this.pubkey;
    }

    /**
     * Sign an event with the user's private key (via extension or direct)
     */
    async signEvent(event) {
        if (this._authMethod === AuthMethod.PRIVATE_KEY) {
            return await this.signEventDirect(event);
        }

        if (!this.hasExtension()) {
            throw new Error('No NOSTR extension available');
        }

        return await window.nostr.signEvent(event);
    }

    /**
     * Sign an event directly with the stored private key
     */
    async signEventDirect(event) {
        if (!this._hasPrivateKey()) {
            throw new Error('No private key available');
        }

        // Ensure pubkey is set
        if (!event.pubkey) {
            event.pubkey = this.pubkey;
        }

        // Ensure created_at is set
        if (!event.created_at) {
            event.created_at = Math.floor(Date.now() / 1000);
        }

        // Calculate event ID (SHA256 of serialized event)
        const eventId = await this.calculateEventId(event);
        event.id = eventId;

        // Sign via WASM: pass hash, get signature back
        const eventIdBytes = this.hexToBytes(eventId);
        const signatureBytes = getWasmModule().sign_hash(eventIdBytes);
        event.sig = this.bytesToHex(signatureBytes);
        return event;
    }

    /**
     * Calculate event ID (SHA256 of serialized event)
     */
    async calculateEventId(event) {
        const serialized = JSON.stringify([
            0,
            event.pubkey,
            event.created_at,
            event.kind,
            event.tags,
            event.content
        ]);

        const encoder = new TextEncoder();
        const data = encoder.encode(serialized);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        return this.bytesToHex(hashArray);
    }

    /**
     * Get relays from extension (NIP-07)
     */
    async getRelays() {
        if (this._authMethod === AuthMethod.PRIVATE_KEY) {
            // Return default relays when using private key
            return null;
        }

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
        if (this._authMethod === AuthMethod.PRIVATE_KEY) {
            throw new Error('NIP-04 encryption not supported with direct key entry');
        }

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
        if (this._authMethod === AuthMethod.PRIVATE_KEY) {
            throw new Error('NIP-04 decryption not supported with direct key entry');
        }

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
     * Get auth method
     */
    getAuthMethod() {
        return this._authMethod;
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

    /**
     * Convert hex string to Uint8Array
     */
    hexToBytes(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    /**
     * Convert Uint8Array to hex string
     */
    bytesToHex(bytes) {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

// Singleton instance
export const nostrAuthService = new NostrAuthService();
export default nostrAuthService;
