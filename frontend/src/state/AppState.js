/**
 * TON3S App State
 * Reactive state management for the application
 */

import { StateEmitter } from './StateEmitter.js';
import { themes } from '../data/themes.js';
import { fonts } from '../data/fonts.js';

// Event types
export const StateEvents = {
    // Note events
    NOTE_CREATED: 'note:created',
    NOTE_UPDATED: 'note:updated',
    NOTE_DELETED: 'note:deleted',
    NOTE_SELECTED: 'note:selected',
    NOTES_LOADED: 'notes:loaded',

    // Settings events
    THEME_CHANGED: 'settings:theme',
    FONT_CHANGED: 'settings:font',
    PRE_ZEN_MODE: 'settings:preZenMode',
    ZEN_MODE_TOGGLED: 'settings:zenMode',
    SIDEBAR_TOGGLED: 'settings:sidebar',
    NOSTR_PANEL_TOGGLED: 'settings:nostrPanel',
    DONATION_PANEL_TOGGLED: 'settings:donationPanel',

    // NOSTR events
    NOSTR_CONNECTED: 'nostr:connected',
    NOSTR_DISCONNECTED: 'nostr:disconnected',
    NOSTR_PUBLISHED: 'nostr:published',
    NOSTR_ERROR: 'nostr:error',
    NOSTR_PUBLISHED_NOTE_ADDED: 'nostr:publishedNoteAdded',
    NOSTR_PUBLISHED_NOTES_CLEARED: 'nostr:publishedNotesCleared',

    // UI events
    SEARCH_CHANGED: 'ui:search',
    SAVE_STATUS_CHANGED: 'ui:saveStatus',
    LOADING_CHANGED: 'ui:loading',
    ACTIVE_PAGE_CHANGED: 'ui:activePage'
};

class AppState extends StateEmitter {
    constructor() {
        super();

        // Notes state
        this._notes = [];
        this._currentNoteId = null;

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
            sidebarOpen: false,
            nostrPanelOpen: false,
            donationPanelOpen: false,
            nostr: {
                enabled: false,
                defaultRelays: [
                    'wss://relay.damus.io',
                    'wss://nos.lol',
                    'wss://relay.primal.net',
                    'wss://relay.snort.social',
                    'wss://nostr.mom',
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

        // Ephemeral published notes (cleared on disconnect/refresh)
        this._publishedNotes = [];

        // UI state
        this._ui = {
            searchQuery: '',
            saveStatus: 'saved',
            lastSaveTime: null,
            loading: false,
            activeMobilePage: 'editor'
        };
    }

    // ==================
    // Note accessors
    // ==================

    get notes() {
        return this._notes;
    }

    set notes(notesArray) {
        this._notes = notesArray;
        this.emit(StateEvents.NOTES_LOADED, notesArray);
    }

    get currentNoteId() {
        return this._currentNoteId;
    }

    get currentNote() {
        return this._notes.find(n => n.id === this._currentNoteId) || null;
    }

    selectNote(id) {
        this._currentNoteId = id;
        this.emit(StateEvents.NOTE_SELECTED, this.currentNote);
    }

    addNote(note) {
        this._notes.unshift(note);
        this.emit(StateEvents.NOTE_CREATED, note);
    }

    updateNote(id, updates) {
        const index = this._notes.findIndex(n => n.id === id);
        if (index !== -1) {
            this._notes[index] = { ...this._notes[index], ...updates };
            this.emit(StateEvents.NOTE_UPDATED, this._notes[index]);
        }
    }

    deleteNote(id) {
        const index = this._notes.findIndex(n => n.id === id);
        if (index !== -1) {
            const deleted = this._notes.splice(index, 1)[0];
            this.emit(StateEvents.NOTE_DELETED, deleted);

            // If deleted note was selected, select another
            if (this._currentNoteId === id) {
                this._currentNoteId = this._notes[0]?.id || null;
                this.emit(StateEvents.NOTE_SELECTED, this.currentNote);
            }
        }
    }

    getFilteredNotes(query = '') {
        if (!query) {
            return this._notes;
        }

        const lowerQuery = query.toLowerCase();
        return this._notes.filter(note => {
            return (
                note.title?.toLowerCase().includes(lowerQuery) ||
                note.plainText?.toLowerCase().includes(lowerQuery) ||
                note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
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
            const unusedPos = this._settings.theme.unusedIndices.indexOf(
                this._settings.theme.currentIndex
            );
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
            theme.unusedIndices = [...Array(themes.length).keys()].filter(
                i => i !== theme.currentIndex
            );
        }

        // Pick random from unused
        const randomPos = Math.floor(Math.random() * theme.unusedIndices.length);
        theme.currentIndex = theme.unusedIndices[randomPos];

        this.emit(StateEvents.THEME_CHANGED, this.currentTheme);
    }

    setFont(index) {
        if (index >= 0 && index < fonts.length) {
            const unusedPos = this._settings.font.unusedIndices.indexOf(
                this._settings.font.currentIndex
            );
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
            font.unusedIndices = [...Array(fonts.length).keys()].filter(
                i => i !== font.currentIndex
            );
        }

        const randomPos = Math.floor(Math.random() * font.unusedIndices.length);
        font.currentIndex = font.unusedIndices[randomPos];

        this.emit(StateEvents.FONT_CHANGED, this.currentFont);
    }

    toggleZenMode() {
        this._settings.zenMode = !this._settings.zenMode;
        this.emit(StateEvents.ZEN_MODE_TOGGLED, this._settings.zenMode);
    }

    setZenMode(enabled) {
        if (this._settings.zenMode !== enabled) {
            // Block re-entry for 5 seconds after any zen exit
            if (enabled && this._zenExitTime && Date.now() - this._zenExitTime < 5000) {
                return;
            }

            // Emit PRE_ZEN_MODE before any changes so components can close popups
            if (enabled) {
                this.emit(StateEvents.PRE_ZEN_MODE);
            } else {
                this._zenExitTime = Date.now();
            }

            this._settings.zenMode = enabled;
            this.emit(StateEvents.ZEN_MODE_TOGGLED, enabled);
        }
    }

    toggleSidebar() {
        this._settings.sidebarOpen = !this._settings.sidebarOpen;
        this.emit(StateEvents.SIDEBAR_TOGGLED, this._settings.sidebarOpen);
    }

    setSidebarOpen(open) {
        if (this._settings.sidebarOpen !== open) {
            this._settings.sidebarOpen = open;
            this.emit(StateEvents.SIDEBAR_TOGGLED, open);
        }
    }

    toggleNostrPanel() {
        this._settings.nostrPanelOpen = !this._settings.nostrPanelOpen;
        this.emit(StateEvents.NOSTR_PANEL_TOGGLED, this._settings.nostrPanelOpen);
    }

    setNostrPanelOpen(open) {
        if (this._settings.nostrPanelOpen !== open) {
            this._settings.nostrPanelOpen = open;
            this.emit(StateEvents.NOSTR_PANEL_TOGGLED, open);
        }
    }

    toggleDonationPanel() {
        this._settings.donationPanelOpen = !this._settings.donationPanelOpen;
        this.emit(StateEvents.DONATION_PANEL_TOGGLED, this._settings.donationPanelOpen);
    }

    setDonationPanelOpen(open) {
        if (this._settings.donationPanelOpen !== open) {
            this._settings.donationPanelOpen = open;
            this.emit(StateEvents.DONATION_PANEL_TOGGLED, open);
        }
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
    // Published notes accessors (ephemeral)
    // ==================

    get publishedNotes() {
        return this._publishedNotes;
    }

    addPublishedNote({ eventId, title, publishedAt, relayUrl, kind }) {
        const note = { eventId, title, publishedAt, relayUrl, kind };
        this._publishedNotes.push(note);
        this.emit(StateEvents.NOSTR_PUBLISHED_NOTE_ADDED, note);
    }

    clearPublishedNotes() {
        this._publishedNotes = [];
        this.emit(StateEvents.NOSTR_PUBLISHED_NOTES_CLEARED);
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

    setActiveMobilePage(page) {
        if (this._ui.activeMobilePage !== page) {
            this._ui.activeMobilePage = page;
            this.emit(StateEvents.ACTIVE_PAGE_CHANGED, page);
        }
    }
}

// Singleton instance
export const appState = new AppState();
export { AppState };
export default appState;
