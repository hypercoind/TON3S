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

// Initialization state (using window to persist across module re-evaluations)
window.__TON3S_APP__ = window.__TON3S_APP__ || { instance: null, initialized: false };

class TON3SApp {
    constructor() {
        this.components = {};
        // Event handler references for cleanup
        this.mouseMoveHandler = null;
        this.dragOverHandler = null;
        this.dropHandler = null;
        this.zenModeHandler = null;
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

            // Load notes
            await this.loadNotes();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Initialize security measures
            this.initSecurity();

            // Hide loading overlay
            this.hideLoading();

            console.log('TON3S v2.0 initialized');
        } catch (error) {
            console.error('Failed to initialize TON3S:', error);
            // Still hide loading on error to show the app
            this.hideLoading();
        }
    }

    /**
     * Hide the loading overlay
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.setAttribute('aria-busy', 'false');
            // Remove from DOM after transition
            setTimeout(() => {
                loadingOverlay.remove();
            }, 300);
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

    async loadNotes() {
        const notes = await storageService.getAllNotes();
        appState.notes = notes;

        // Select first note or create one if none exist
        if (notes.length > 0) {
            appState.selectNote(notes[0].id);
        } else {
            const newNote = await storageService.createNote({
                title: 'Untitled Note',
                content: '<p><br></p>',
                plainText: '',
                tags: []
            });
            appState.selectNote(newNote.id);
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
            onNewNote: async () => {
                const note = await storageService.createNote({
                    title: 'Untitled Note',
                    content: '<p><br></p>',
                    plainText: '',
                    tags: []
                });
                appState.selectNote(note.id);
                this.components.editor?.focus();
            },
            onSearch: () => {
                this.components.sidebar?.focusSearch();
            }
        });

        // Subscribe to zen mode changes
        this.zenModeHandler = (zenMode) => {
            if (zenMode) {
                document.body.classList.add('zen-mode');
            } else {
                document.body.classList.remove('zen-mode');
            }
        };
        appState.on(StateEvents.ZEN_MODE_TOGGLED, this.zenModeHandler);

        // Setup zen mode hover tracking
        this.setupZenHoverTracking();
    }

    /**
     * Setup mouse tracking to exit zen mode on hover
     */
    setupZenHoverTracking() {
        this.mouseMoveHandler = () => {
            if (appState.settings.zenMode) {
                // Exit zen mode on mouse movement
                appState.setZenMode(false);
            }
        };
        document.addEventListener('mousemove', this.mouseMoveHandler);
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
        this.dragOverHandler = (e) => e.preventDefault();
        this.dropHandler = (e) => {
            e.preventDefault();
            return false;
        };
        document.addEventListener('dragover', this.dragOverHandler);
        document.addEventListener('drop', this.dropHandler);

        // Clear URL fragments
        if (location.hash) {
            history.replaceState(null, null, location.pathname + location.search);
        }
    }

    /**
     * Cleanup for HMR - remove all event listeners and destroy components
     */
    destroy() {
        // Destroy all components
        Object.values(this.components).forEach(component => {
            component.destroy?.();
        });
        this.components = {};

        // Remove event listeners
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.dragOverHandler) {
            document.removeEventListener('dragover', this.dragOverHandler);
        }
        if (this.dropHandler) {
            document.removeEventListener('drop', this.dropHandler);
        }
        if (this.zenModeHandler) {
            appState.off(StateEvents.ZEN_MODE_TOGGLED, this.zenModeHandler);
        }

        // Cleanup keyboard manager
        keyboardManager.destroy?.();
    }
}

// Initialize app when DOM is ready (with HMR support)
function initApp() {
    // Use DOM marker for initialization guard (persists across module re-evaluations)
    if (document.body?.hasAttribute('data-ton3s-initialized')) {
        return;
    }

    // Set DOM marker immediately
    if (document.body) {
        document.body.setAttribute('data-ton3s-initialized', 'true');
    }

    const state = window.__TON3S_APP__;
    state.initialized = true;
    state.instance = new TON3SApp();
    state.instance.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
    initApp();
}

// HMR cleanup
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        // Clear DOM marker to allow re-initialization
        document.body?.removeAttribute('data-ton3s-initialized');

        const state = window.__TON3S_APP__;
        state.initialized = false;
        if (state.instance) {
            state.instance.destroy();
            state.instance = null;
        }
    });
}

export default TON3SApp;
