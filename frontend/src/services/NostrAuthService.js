/**
 * TON3S NOSTR Auth Service
 * NIP-07 browser extension authentication and direct private key support
 * Supports nos2x, Alby, and other NIP-07 compatible extensions
 */

import { secp256k1 } from '@noble/curves/secp256k1';
import { bech32 } from '@scure/base';
import { appState, StateEvents } from '../state/AppState.js';

// Auth method types
const AuthMethod = {
    EXTENSION: 'extension',
    PRIVATE_KEY: 'private_key'
};

// Session timeout configuration (15 minutes in milliseconds)
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
// Warning before timeout (1 minute before)
const SESSION_WARNING_MS = 14 * 60 * 1000;

class NostrAuthService {
    constructor() {
        this.extension = null;
        this.pubkey = null;
        this.checkTimeout = null;
        this._privateKeyHex = null;
        this._authMethod = null;
        this._idleTimer = null;
        this._warningTimer = null;
        this._activityBound = false;
        this._visibilityBound = false;
        this._unloadBound = false;

        // Bind methods for event listeners
        this._handleActivity = this._handleActivity.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
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
     * Start the idle timeout timer (private key sessions only)
     */
    _startIdleTimer() {
        this._clearIdleTimer();
        this._clearWarningTimer();

        // Only apply timeout to private key sessions
        if (this._authMethod !== AuthMethod.PRIVATE_KEY || !this._privateKeyHex) {
            return;
        }

        // Warning timer fires 1 minute before timeout
        this._warningTimer = setTimeout(() => {
            console.log('[NOSTR] Session timeout warning');
            appState.emit(StateEvents.NOSTR_SESSION_WARNING);
        }, SESSION_WARNING_MS);

        // Actual timeout disconnects the session
        this._idleTimer = setTimeout(() => {
            if (this._authMethod === AuthMethod.PRIVATE_KEY && this._privateKeyHex) {
                console.log('[NOSTR] Session timeout - disconnecting for security');
                this.disconnect();
                appState.emit(StateEvents.NOSTR_SESSION_TIMEOUT);
            }
        }, SESSION_TIMEOUT_MS);
    }

    /**
     * Clear the idle timeout timer
     */
    _clearIdleTimer() {
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
            this._idleTimer = null;
        }
    }

    /**
     * Clear the warning timer
     */
    _clearWarningTimer() {
        if (this._warningTimer) {
            clearTimeout(this._warningTimer);
            this._warningTimer = null;
        }
    }

    /**
     * Reset idle timer on user activity (private key sessions only)
     */
    _handleActivity() {
        if (this._authMethod === AuthMethod.PRIVATE_KEY && this._privateKeyHex) {
            this._startIdleTimer();
        }
    }

    /**
     * Handle page visibility changes (private key sessions only)
     */
    _handleVisibilityChange() {
        if (document.hidden && this._authMethod === AuthMethod.PRIVATE_KEY && this._privateKeyHex) {
            // Tab went to background - emit event so UI can track
            appState.emit(StateEvents.NOSTR_TAB_HIDDEN);
        } else if (
            !document.hidden &&
            this._authMethod === AuthMethod.PRIVATE_KEY &&
            this._privateKeyHex
        ) {
            // Tab returned from background
            appState.emit(StateEvents.NOSTR_TAB_RETURNED);
        }
    }

    /**
     * Handle page unload - clear private key
     */
    _handleBeforeUnload() {
        if (this._privateKeyHex) {
            this._privateKeyHex = null;
        }
    }

    /**
     * Setup activity monitoring for idle timeout
     */
    _setupActivityMonitoring() {
        if (this._activityBound) {
            return;
        }

        // Reset timer on user activity
        document.addEventListener('keydown', this._handleActivity);
        document.addEventListener('click', this._handleActivity);
        document.addEventListener('mousemove', this._handleActivity);
        document.addEventListener('scroll', this._handleActivity);
        this._activityBound = true;
    }

    /**
     * Setup visibility change monitoring
     */
    _setupVisibilityMonitoring() {
        if (this._visibilityBound) {
            return;
        }

        document.addEventListener('visibilitychange', this._handleVisibilityChange);
        this._visibilityBound = true;
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
        if (this._activityBound) {
            document.removeEventListener('keydown', this._handleActivity);
            document.removeEventListener('click', this._handleActivity);
            document.removeEventListener('mousemove', this._handleActivity);
            document.removeEventListener('scroll', this._handleActivity);
            this._activityBound = false;
        }

        if (this._visibilityBound) {
            document.removeEventListener('visibilitychange', this._handleVisibilityChange);
            this._visibilityBound = false;
        }

        // Don't remove beforeunload - keep it for browser close protection
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
            // Parse and validate the private key
            const privateKeyHex = this.parsePrivateKey(keyInput);

            // Derive public key
            const pubkeyHex = this.derivePublicKey(privateKeyHex);

            // Store in memory only
            this._privateKeyHex = privateKeyHex;
            this._authMethod = AuthMethod.PRIVATE_KEY;
            this.pubkey = pubkeyHex;
            this.extension = null;

            // Setup security monitoring for private key sessions
            this._setupActivityMonitoring();
            this._setupVisibilityMonitoring();
            this._setupUnloadHandler();
            this._startIdleTimer();

            appState.setNostrConnected(this.pubkey, 'Private Key');
            console.log(
                `[NOSTR] Connected with private key, pubkey: ${this.pubkey.slice(0, 8)}...`
            );

            return {
                pubkey: this.pubkey,
                extension: 'Private Key'
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
     * Derive public key from private key hex
     */
    derivePublicKey(privateKeyHex) {
        try {
            const privateKeyBytes = this.hexToBytes(privateKeyHex);
            const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true);
            // Remove the prefix byte (02 or 03) for x-only pubkey
            const pubkeyHex = this.bytesToHex(publicKeyBytes.slice(1));
            return pubkeyHex;
        } catch {
            throw new Error('Failed to derive public key from private key');
        }
    }

    /**
     * Disconnect from NOSTR
     */
    disconnect() {
        // Clear timers and event listeners
        this._clearIdleTimer();
        this._clearWarningTimer();
        this._cleanupEventListeners();

        // Clear private key from memory
        if (this._privateKeyHex) {
            this._privateKeyHex = null;
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

        if (this._authMethod === AuthMethod.PRIVATE_KEY && this._privateKeyHex) {
            this.pubkey = this.derivePublicKey(this._privateKeyHex);
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
        if (!this._privateKeyHex) {
            throw new Error('No private key available');
        }

        // Reset idle timer on signing activity
        this._startIdleTimer();

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

        // Sign with Schnorr signature (BIP-340)
        const privateKeyBytes = this.hexToBytes(this._privateKeyHex);
        const eventIdBytes = this.hexToBytes(eventId);

        try {
            const signatureBytes = secp256k1.schnorr.sign(eventIdBytes, privateKeyBytes);
            event.sig = this.bytesToHex(signatureBytes);
            return event;
        } finally {
            // Zero out sensitive byte arrays after use
            this.secureZero(privateKeyBytes);
            this.secureZero(eventIdBytes);
        }
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
