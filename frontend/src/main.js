/**
 * TON3S v2.0 Main Entry Point
 * Privacy-focused writing application with NOSTR integration
 */

import './styles/main.css';

import { appState, StateEvents } from './state/AppState.js';
import { storageService } from './services/StorageService.js';
import { keyboardManager } from './utils/keyboard.js';
import { themes } from './data/themes.js';
import { fonts } from './data/fonts.js';

import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { Editor } from './components/Editor.js';
import { StatusBar } from './components/StatusBar.js';
import { NostrPanel } from './components/NostrPanel.js';

class TON3SApp {
    constructor() {
        this.components = {};
    }

    async init() {
        try {
            // Initialize storage and migrate data
            await storageService.init();

            // Load settings
            await storageService.loadSettings();

            // Apply initial theme and font
            this.applyTheme();
            this.applyFont();
            this.applyZenMode();

            // Initialize UI components
            this.initComponents();

            // Load documents
            await this.loadDocuments();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Initialize security measures
            this.initSecurity();

            console.log('TON3S v2.0 initialized');
        } catch (error) {
            console.error('Failed to initialize TON3S:', error);
        }
    }

    initComponents() {
        // Header
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            this.components.header = new Header(headerContainer);
            this.components.header.init();
        }

        // Sidebar
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            this.components.sidebar = new Sidebar(sidebarContainer);
            this.components.sidebar.init();
        }

        // Editor
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            this.components.editor = new Editor(editorContainer);
            this.components.editor.init();
        }

        // Status Bar
        const statusContainer = document.getElementById('status-container');
        if (statusContainer) {
            this.components.statusBar = new StatusBar(statusContainer);
            this.components.statusBar.init();
        }

        // NOSTR Panel
        const nostrContainer = document.getElementById('nostr-container');
        if (nostrContainer) {
            this.components.nostrPanel = new NostrPanel(nostrContainer);
            this.components.nostrPanel.init();
        }
    }

    async loadDocuments() {
        const documents = await storageService.getAllDocuments();
        appState.documents = documents;

        // Select first document or create one if none exist
        if (documents.length > 0) {
            appState.selectDocument(documents[0].id);
        } else {
            const newDoc = await storageService.createDocument({
                title: 'Untitled Document',
                content: '<p><br></p>',
                plainText: '',
                tags: []
            });
            appState.selectDocument(newDoc.id);
        }
    }

    applyTheme() {
        const currentTheme = appState.currentTheme;

        themes.forEach(theme => {
            document.body.classList.remove(theme.class);
        });

        document.body.classList.add(currentTheme.class);
    }

    applyFont() {
        const currentFont = appState.currentFont;

        fonts.forEach(font => {
            document.body.classList.remove(font.class);
        });

        document.body.classList.add(currentFont.class);
    }

    applyZenMode() {
        if (appState.settings.zenMode) {
            document.body.classList.add('zen-mode');
        } else {
            document.body.classList.remove('zen-mode');
        }
    }

    setupKeyboardShortcuts() {
        keyboardManager.init();
        keyboardManager.setupDefaults({
            onNewDocument: async () => {
                const doc = await storageService.createDocument({
                    title: 'Untitled Document',
                    content: '<p><br></p>',
                    plainText: '',
                    tags: []
                });
                appState.selectDocument(doc.id);
                this.components.editor?.focus();
            },
            onSearch: () => {
                this.components.sidebar?.focusSearch();
            }
        });

        // Subscribe to zen mode changes
        appState.on(StateEvents.ZEN_MODE_TOGGLED, (zenMode) => {
            if (zenMode) {
                document.body.classList.add('zen-mode');
            } else {
                document.body.classList.remove('zen-mode');
            }
            storageService.saveZenMode();
        });
    }

    initSecurity() {
        // Disable eval
        window.eval = function() {
            throw new Error('eval() is disabled for security');
        };

        // HTTPS warning
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            console.warn('TON3S should be served over HTTPS for security');
        }

        // Prevent drag and drop
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            return false;
        });

        // Clear URL fragments
        if (location.hash) {
            history.replaceState(null, null, location.pathname + location.search);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new TON3SApp();
    app.init();
});

export default TON3SApp;
