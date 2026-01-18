/**
 * TON3S Storage Service
 * IndexedDB storage via Dexie.js for documents and settings
 */

import Dexie from 'dexie';
import { appState } from '../state/AppState.js';

// Database schema
class TON3SDatabase extends Dexie {
    constructor() {
        super('ton3s');

        this.version(1).stores({
            documents: '++id, title, createdAt, updatedAt, *tags',
            settings: 'key'
        });

        this.documents = this.table('documents');
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

            // Migrate content to a document
            if (savedContent && savedContent.trim()) {
                const plainText = this.extractPlainText(savedContent);
                const title = this.extractTitle(plainText) || 'Untitled Document';

                await this.createDocument({
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
    // Document operations
    // ==================

    /**
     * Create a new document
     */
    async createDocument(data) {
        const now = Date.now();
        const doc = {
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

        const id = await this.db.documents.add(doc);
        const newDoc = { ...doc, id };
        appState.addDocument(newDoc);
        return newDoc;
    }

    /**
     * Get a document by ID
     */
    async getDocument(id) {
        return await this.db.documents.get(id);
    }

    /**
     * Get all documents
     */
    async getAllDocuments() {
        return await this.db.documents
            .orderBy('updatedAt')
            .reverse()
            .toArray();
    }

    /**
     * Update a document (throttled)
     */
    async updateDocument(id, updates) {
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

        // Update plainText if content changed
        if (updates.content) {
            updates.plainText = this.extractPlainText(updates.content);
        }

        updates.updatedAt = now;

        await this.db.documents.update(id, updates);
        appState.updateDocument(id, updates);
        appState.setSaveStatus('saved', now);

        return await this.getDocument(id);
    }

    /**
     * Delete a document
     */
    async deleteDocument(id) {
        await this.db.documents.delete(id);
        appState.deleteDocument(id);
    }

    /**
     * Search documents by query
     */
    async searchDocuments(query) {
        if (!query) {
            return await this.getAllDocuments();
        }

        const lowerQuery = query.toLowerCase();
        return await this.db.documents
            .filter(doc => {
                return doc.title?.toLowerCase().includes(lowerQuery) ||
                       doc.plainText?.toLowerCase().includes(lowerQuery) ||
                       doc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
            })
            .toArray();
    }

    /**
     * Get documents by tag
     */
    async getDocumentsByTag(tag) {
        return await this.db.documents
            .where('tags')
            .equals(tag)
            .toArray();
    }

    /**
     * Mark document as published to NOSTR
     */
    async markAsPublished(id, eventId) {
        const updates = {
            nostr: {
                published: true,
                eventId,
                publishedAt: Date.now()
            }
        };
        await this.db.documents.update(id, updates);
        appState.updateDocument(id, updates);
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
        await this.db.documents.clear();
        await this.db.settings.clear();

        // Also clear localStorage legacy data
        localStorage.removeItem('savedContent');
        localStorage.removeItem('savedThemeIndex');
        localStorage.removeItem('savedFontIndex');
        localStorage.removeItem('zenMode');

        // Reset app state
        appState.documents = [];
        appState.selectDocument(null);
    }

    /**
     * Export all documents as JSON
     */
    async exportData() {
        const documents = await this.getAllDocuments();
        const settings = await this.getSetting('appSettings');

        return {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            documents,
            settings
        };
    }

    /**
     * Import data from JSON
     */
    async importData(data) {
        if (data.documents && Array.isArray(data.documents)) {
            for (const doc of data.documents) {
                await this.createDocument(doc);
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
