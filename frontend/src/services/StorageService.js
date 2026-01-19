/**
 * TON3S Storage Service
 * IndexedDB storage via Dexie.js for notes and settings
 */

import Dexie from 'dexie';
import { appState } from '../state/AppState.js';

// Database schema
class TON3SDatabase extends Dexie {
    constructor() {
        super('ton3s');

        // Version 1: Original documents table
        this.version(1).stores({
            documents: '++id, title, createdAt, updatedAt, *tags',
            settings: 'key'
        });

        // Version 2: Rename documents to notes
        this.version(2).stores({
            documents: null, // Delete old table
            notes: '++id, title, createdAt, updatedAt, *tags',
            settings: 'key'
        }).upgrade(async tx => {
            // Migrate data from documents to notes
            const oldTable = tx.table('documents');
            const newTable = tx.table('notes');
            const docs = await oldTable.toArray();
            if (docs.length > 0) {
                await newTable.bulkAdd(docs);
            }
        });

        this.notes = this.table('notes');
        this.settings = this.table('settings');
    }
}

class StorageService {
    constructor() {
        this.db = new TON3SDatabase();
        this.initialized = false;
        this.saveThrottleMs = 100;
        this.lastSaveTime = 0;
        this.maxContentSize = 1000000; // 1MB
    }

    /**
     * Initialize storage and migrate from localStorage if needed
     */
    async init() {
        if (this.initialized) return;

        try {
            await this.db.open();
            await this.migrateFromLocalStorage();
            this.initialized = true;
        } catch (error) {
            console.error('Storage initialization failed:', error);
            throw error;
        }
    }

    /**
     * Migrate data from localStorage (v1) to IndexedDB (v2)
     */
    async migrateFromLocalStorage() {
        // Check if migration already done
        const migrated = await this.getSetting('ton3s_migrated_v2');
        if (migrated) return;

        try {
            const savedContent = localStorage.getItem('savedContent');
            const savedThemeIndex = localStorage.getItem('savedThemeIndex');
            const savedFontIndex = localStorage.getItem('savedFontIndex');
            const zenMode = localStorage.getItem('zenMode');

            // Migrate content to a note
            if (savedContent && savedContent.trim()) {
                const plainText = this.extractPlainText(savedContent);
                const title = this.extractTitle(plainText) || 'Untitled Note';

                await this.createNote({
                    title,
                    content: savedContent,
                    plainText,
                    tags: ['migrated'],
                    nostr: {
                        published: false,
                        eventId: null,
                        publishedAt: null
                    }
                });
            }

            // Migrate settings
            if (savedThemeIndex !== null || savedFontIndex !== null || zenMode !== null) {
                const settings = {
                    theme: {
                        currentIndex: parseInt(savedThemeIndex) || 1,
                        unusedIndices: []
                    },
                    font: {
                        currentIndex: parseInt(savedFontIndex) || 1,
                        unusedIndices: []
                    },
                    zenMode: zenMode === 'true'
                };
                await this.saveSettings(settings);
            }

            // Mark migration as complete
            await this.setSetting('ton3s_migrated_v2', true);
            console.log('Migration from localStorage complete');
        } catch (error) {
            console.error('Migration failed:', error);
            // Don't throw - allow app to continue even if migration fails
        }
    }

    /**
     * Extract plain text from HTML content
     */
    extractPlainText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    /**
     * Extract title from plain text (first line or first 50 chars)
     */
    extractTitle(plainText) {
        const firstLine = plainText.split('\n')[0].trim();
        if (firstLine.length > 50) {
            return firstLine.substring(0, 47) + '...';
        }
        return firstLine || null;
    }

    // ==================
    // Note operations
    // ==================

    /**
     * Create a new note
     */
    async createNote(data) {
        const now = Date.now();
        const note = {
            title: data.title || 'Untitled',
            content: data.content || '<p><br></p>',
            plainText: data.plainText || '',
            tags: data.tags || [],
            createdAt: now,
            updatedAt: now,
            nostr: data.nostr || {
                published: false,
                eventId: null,
                publishedAt: null
            }
        };

        const id = await this.db.notes.add(note);
        const newNote = { ...note, id };
        appState.addNote(newNote);
        return newNote;
    }

    /**
     * Get a note by ID
     */
    async getNote(id) {
        return await this.db.notes.get(id);
    }

    /**
     * Get all notes
     */
    async getAllNotes() {
        return await this.db.notes
            .orderBy('updatedAt')
            .reverse()
            .toArray();
    }

    /**
     * Update a note (throttled)
     */
    async updateNote(id, updates) {
        const now = Date.now();

        // Throttle saves
        if (now - this.lastSaveTime < this.saveThrottleMs) {
            return;
        }
        this.lastSaveTime = now;

        // Validate content size
        if (updates.content && updates.content.length > this.maxContentSize) {
            console.warn('Content too large, not saving');
            return;
        }

        // Update plainText and auto-generate title if content changed
        if (updates.content) {
            updates.plainText = this.extractPlainText(updates.content);
            // Auto-generate title from first line of content
            const autoTitle = this.extractTitle(updates.plainText);
            updates.title = autoTitle || 'Untitled';
        }

        updates.updatedAt = now;

        await this.db.notes.update(id, updates);
        appState.updateNote(id, updates);
        appState.setSaveStatus('saved', now);

        return await this.getNote(id);
    }

    /**
     * Delete a note
     */
    async deleteNote(id) {
        await this.db.notes.delete(id);
        appState.deleteNote(id);
    }

    /**
     * Search notes by query
     */
    async searchNotes(query) {
        if (!query) {
            return await this.getAllNotes();
        }

        const lowerQuery = query.toLowerCase();
        return await this.db.notes
            .filter(note => {
                return note.title?.toLowerCase().includes(lowerQuery) ||
                       note.plainText?.toLowerCase().includes(lowerQuery) ||
                       note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
            })
            .toArray();
    }

    /**
     * Get notes by tag
     */
    async getNotesByTag(tag) {
        return await this.db.notes
            .where('tags')
            .equals(tag)
            .toArray();
    }

    /**
     * Mark note as published to NOSTR
     */
    async markAsPublished(id, eventId) {
        const updates = {
            nostr: {
                published: true,
                eventId,
                publishedAt: Date.now()
            }
        };
        await this.db.notes.update(id, updates);
        appState.updateNote(id, updates);
    }

    // ==================
    // Settings operations
    // ==================

    /**
     * Get a setting by key
     */
    async getSetting(key) {
        const setting = await this.db.settings.get(key);
        return setting?.value;
    }

    /**
     * Set a setting
     */
    async setSetting(key, value) {
        await this.db.settings.put({ key, value });
    }

    /**
     * Save all settings
     */
    async saveSettings(settings) {
        await this.db.settings.put({ key: 'appSettings', value: settings });
    }

    /**
     * Load all settings
     */
    async loadSettings() {
        const settings = await this.getSetting('appSettings');
        if (settings) {
            appState.loadSettings(settings);
        }
        return settings;
    }

    /**
     * Save theme state
     */
    async saveThemeState() {
        const { theme } = appState.settings;
        await this.setSetting('themeState', theme);
    }

    /**
     * Save font state
     */
    async saveFontState() {
        const { font } = appState.settings;
        await this.setSetting('fontState', font);
    }

    /**
     * Save zen mode state
     */
    async saveZenMode() {
        await this.setSetting('zenMode', appState.settings.zenMode);
    }

    // ==================
    // Utility methods
    // ==================

    /**
     * Clear all data (for privacy)
     */
    async clearAllData() {
        await this.db.notes.clear();
        await this.db.settings.clear();

        // Also clear localStorage legacy data
        localStorage.removeItem('savedContent');
        localStorage.removeItem('savedThemeIndex');
        localStorage.removeItem('savedFontIndex');
        localStorage.removeItem('zenMode');

        // Reset app state
        appState.notes = [];
        appState.selectNote(null);
    }

    /**
     * Export all notes as JSON
     */
    async exportData() {
        const notes = await this.getAllNotes();
        const settings = await this.getSetting('appSettings');

        return {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            notes,
            settings
        };
    }

    /**
     * Import data from JSON
     */
    async importData(data) {
        // Support both old 'documents' format and new 'notes' format
        const notesToImport = data.notes || data.documents;
        if (notesToImport && Array.isArray(notesToImport)) {
            for (const note of notesToImport) {
                await this.createNote(note);
            }
        }

        if (data.settings) {
            await this.saveSettings(data.settings);
            appState.loadSettings(data.settings);
        }
    }
}

// Singleton instance
export const storageService = new StorageService();
export default storageService;
