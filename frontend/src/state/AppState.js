/**
 * TON3S App State
 * Reactive state management for the application
 */

import { StateEmitter } from './StateEmitter.js';
import { themes } from '../data/themes.js';
import { fonts } from '../data/fonts.js';

// Event types
export const StateEvents = {
    // Document events
    DOCUMENT_CREATED: 'document:created',
    DOCUMENT_UPDATED: 'document:updated',
    DOCUMENT_DELETED: 'document:deleted',
    DOCUMENT_SELECTED: 'document:selected',
    DOCUMENTS_LOADED: 'documents:loaded',

    // Settings events
    THEME_CHANGED: 'settings:theme',
    FONT_CHANGED: 'settings:font',
    ZEN_MODE_TOGGLED: 'settings:zenMode',
    SIDEBAR_TOGGLED: 'settings:sidebar',

    // NOSTR events
    NOSTR_CONNECTED: 'nostr:connected',
    NOSTR_DISCONNECTED: 'nostr:disconnected',
    NOSTR_PUBLISHED: 'nostr:published',
    NOSTR_ERROR: 'nostr:error',

    // UI events
    SEARCH_CHANGED: 'ui:search',
    SAVE_STATUS_CHANGED: 'ui:saveStatus',
    LOADING_CHANGED: 'ui:loading'
};

class AppState extends StateEmitter {
    constructor() {
        super();

        // Documents state
        this._documents = [];
        this._currentDocumentId = null;

        // Settings state
        this._settings = {
            theme: {
                currentIndex: 1, // Default: Catppuccin Mocha
                unusedIndices: [...Array(themes.length).keys()]
            },
            font: {
                currentIndex: 1, // Default: JetBrains Mono
                unusedIndices: [...Array(fonts.length).keys()]
            },
            zenMode: false,
            sidebarOpen: true,
            nostr: {
                enabled: false,
                defaultRelays: [
                    'wss://relay.damus.io',
                    'wss://nos.lol',
                    'wss://relay.nostr.band'
                ],
                proxyUrl: '/ws/nostr'
            }
        };

        // NOSTR state
        this._nostr = {
            connected: false,
            pubkey: null,
            extension: null,
            error: null
        };

        // UI state
        this._ui = {
            searchQuery: '',
            saveStatus: 'saved',
            lastSaveTime: null,
            loading: false
        };
    }

    // ==================
    // Document accessors
    // ==================

    get documents() {
        return this._documents;
    }

    set documents(docs) {
        this._documents = docs;
        this.emit(StateEvents.DOCUMENTS_LOADED, docs);
    }

    get currentDocumentId() {
        return this._currentDocumentId;
    }

    get currentDocument() {
        return this._documents.find(d => d.id === this._currentDocumentId) || null;
    }

    selectDocument(id) {
        this._currentDocumentId = id;
        this.emit(StateEvents.DOCUMENT_SELECTED, this.currentDocument);
    }

    addDocument(doc) {
        this._documents.unshift(doc);
        this.emit(StateEvents.DOCUMENT_CREATED, doc);
    }

    updateDocument(id, updates) {
        const index = this._documents.findIndex(d => d.id === id);
        if (index !== -1) {
            this._documents[index] = { ...this._documents[index], ...updates };
            this.emit(StateEvents.DOCUMENT_UPDATED, this._documents[index]);
        }
    }

    deleteDocument(id) {
        const index = this._documents.findIndex(d => d.id === id);
        if (index !== -1) {
            const deleted = this._documents.splice(index, 1)[0];
            this.emit(StateEvents.DOCUMENT_DELETED, deleted);

            // If deleted document was selected, select another
            if (this._currentDocumentId === id) {
                this._currentDocumentId = this._documents[0]?.id || null;
                this.emit(StateEvents.DOCUMENT_SELECTED, this.currentDocument);
            }
        }
    }

    getFilteredDocuments(query = '') {
        if (!query) return this._documents;

        const lowerQuery = query.toLowerCase();
        return this._documents.filter(doc => {
            return doc.title?.toLowerCase().includes(lowerQuery) ||
                   doc.plainText?.toLowerCase().includes(lowerQuery) ||
                   doc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
        });
    }

    // ==================
    // Settings accessors
    // ==================

    get settings() {
        return this._settings;
    }

    get currentTheme() {
        return themes[this._settings.theme.currentIndex];
    }

    get currentFont() {
        return fonts[this._settings.font.currentIndex];
    }

    setTheme(index) {
        if (index >= 0 && index < themes.length) {
            // Remove from unused list
            const unusedPos = this._settings.theme.unusedIndices.indexOf(this._settings.theme.currentIndex);
            if (unusedPos > -1) {
                this._settings.theme.unusedIndices.splice(unusedPos, 1);
            }

            this._settings.theme.currentIndex = index;
            this.emit(StateEvents.THEME_CHANGED, this.currentTheme);
        }
    }

    rotateTheme() {
        const { theme } = this._settings;

        // Remove current from unused if present
        const currentPos = theme.unusedIndices.indexOf(theme.currentIndex);
        if (currentPos > -1) {
            theme.unusedIndices.splice(currentPos, 1);
        }

        // Reset if empty
        if (theme.unusedIndices.length === 0) {
            theme.unusedIndices = [...Array(themes.length).keys()]
                .filter(i => i !== theme.currentIndex);
        }

        // Pick random from unused
        const randomPos = Math.floor(Math.random() * theme.unusedIndices.length);
        theme.currentIndex = theme.unusedIndices[randomPos];

        this.emit(StateEvents.THEME_CHANGED, this.currentTheme);
    }

    setFont(index) {
        if (index >= 0 && index < fonts.length) {
            const unusedPos = this._settings.font.unusedIndices.indexOf(this._settings.font.currentIndex);
            if (unusedPos > -1) {
                this._settings.font.unusedIndices.splice(unusedPos, 1);
            }

            this._settings.font.currentIndex = index;
            this.emit(StateEvents.FONT_CHANGED, this.currentFont);
        }
    }

    rotateFont() {
        const { font } = this._settings;

        const currentPos = font.unusedIndices.indexOf(font.currentIndex);
        if (currentPos > -1) {
            font.unusedIndices.splice(currentPos, 1);
        }

        if (font.unusedIndices.length === 0) {
            font.unusedIndices = [...Array(fonts.length).keys()]
                .filter(i => i !== font.currentIndex);
        }

        const randomPos = Math.floor(Math.random() * font.unusedIndices.length);
        font.currentIndex = font.unusedIndices[randomPos];

        this.emit(StateEvents.FONT_CHANGED, this.currentFont);
    }

    toggleZenMode() {
        this._settings.zenMode = !this._settings.zenMode;
        this.emit(StateEvents.ZEN_MODE_TOGGLED, this._settings.zenMode);
    }

    toggleSidebar() {
        this._settings.sidebarOpen = !this._settings.sidebarOpen;
        this.emit(StateEvents.SIDEBAR_TOGGLED, this._settings.sidebarOpen);
    }

    loadSettings(settings) {
        this._settings = { ...this._settings, ...settings };
    }

    // ==================
    // NOSTR accessors
    // ==================

    get nostr() {
        return this._nostr;
    }

    setNostrConnected(pubkey, extension) {
        this._nostr.connected = true;
        this._nostr.pubkey = pubkey;
        this._nostr.extension = extension;
        this._nostr.error = null;
        this.emit(StateEvents.NOSTR_CONNECTED, { pubkey, extension });
    }

    setNostrDisconnected() {
        this._nostr.connected = false;
        this._nostr.pubkey = null;
        this._nostr.extension = null;
        this.emit(StateEvents.NOSTR_DISCONNECTED);
    }

    setNostrError(error) {
        this._nostr.error = error;
        this.emit(StateEvents.NOSTR_ERROR, error);
    }

    // ==================
    // UI accessors
    // ==================

    get ui() {
        return this._ui;
    }

    setSearchQuery(query) {
        this._ui.searchQuery = query;
        this.emit(StateEvents.SEARCH_CHANGED, query);
    }

    setSaveStatus(status, time = Date.now()) {
        this._ui.saveStatus = status;
        this._ui.lastSaveTime = time;
        this.emit(StateEvents.SAVE_STATUS_CHANGED, { status, time });
    }

    setLoading(loading) {
        this._ui.loading = loading;
        this.emit(StateEvents.LOADING_CHANGED, loading);
    }
}

// Singleton instance
export const appState = new AppState();
export default appState;
