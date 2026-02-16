/**
 * TON3S v2.0 Main Entry Point
 * Privacy-focused writing application with NOSTR integration
 */

import './styles/main.css';

import { appState, StateEvents } from './state/AppState.js';
import { storageService } from './services/StorageService.js';
import { faviconService } from './services/FaviconService.js';
import { keyboardManager } from './utils/keyboard.js';
import { themes } from './data/themes.js';
import { fonts } from './data/fonts.js';

import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { Editor } from './components/Editor.js';
import { StatusBar } from './components/StatusBar.js';
import { NostrPanel } from './components/NostrPanel.js';
import { DonationPanel } from './components/DonationPanel.js';
import { nostrAuthService } from './services/NostrAuthService.js';

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
            // Initialize WASM signing module (non-blocking)
            nostrAuthService.initializeWasm().catch(() => {});

            // Initialize storage and migrate data
            await storageService.init();

            // Load settings
            await storageService.loadSettings();

            // Apply initial theme and font
            this.applyTheme();
            this.applyFont();
            this.applyZenMode();

            // Initialize favicon service (after theme is applied)
            faviconService.init();

            // Initialize mobile page navigation
            this.initMobilePageNav();

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
            this.showLoadingError(error);
            // Still hide loading after showing error briefly
            setTimeout(() => this.hideLoading(), 3000);
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

    /**
     * Show loading error with retry option
     */
    showLoadingError(_error) {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = loadingOverlay?.querySelector('.loading-text');
        const spinner = loadingOverlay?.querySelector('.spinner');

        if (loadingText) {
            loadingText.textContent = 'Error loading TON3S. Click to retry.';
            loadingText.style.cursor = 'pointer';
        }
        if (spinner) {
            spinner.style.display = 'none';
        }
        if (loadingOverlay) {
            loadingOverlay.style.cursor = 'pointer';
            loadingOverlay.addEventListener('click', () => {
                // Clear caches and reload
                if ('caches' in window) {
                    caches.keys().then(names => names.forEach(name => caches.delete(name)));
                }
                location.reload();
            });
        }
    }

    initMobilePageNav() {
        // Set initial mobile page class
        document.body.classList.add('mobile-page-editor');

        // Listen for page changes
        this.activePageHandler = page => {
            document.body.classList.remove(
                'mobile-page-editor',
                'mobile-page-notes',
                'mobile-page-nostr',
                'mobile-page-donate'
            );
            document.body.classList.add(`mobile-page-${page}`);
        };
        appState.on(StateEvents.ACTIVE_PAGE_CHANGED, this.activePageHandler);
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

        // Donation Panel
        const donationContainer = document.getElementById('donation-container');
        if (donationContainer) {
            this.components.donationPanel = new DonationPanel(donationContainer);
            this.components.donationPanel.init();
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
                await this.components.sidebar?.createNewNote();
                this.components.editor?.focus();
            },
            onSearch: () => {
                if (!appState.settings.sidebarOpen) {
                    appState.setSidebarOpen(true);
                }
                this.components.sidebar?.focusSearch();
            }
        });

        // Subscribe to zen mode changes
        // Simplified handler: just toggle CSS class, state remains intact
        this.zenModeHandler = zenMode => {
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
     * Setup mouse tracking to exit zen mode on significant movement
     */
    setupZenHoverTracking() {
        let lastX = 0;
        let lastY = 0;
        const MOVEMENT_THRESHOLD = 50; // Pixels of movement required to exit zen mode

        this.mouseMoveHandler = e => {
            if (appState.settings.zenMode) {
                // Calculate movement distance from last position
                const deltaX = Math.abs(e.clientX - lastX);
                const deltaY = Math.abs(e.clientY - lastY);
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                // Only exit zen mode if significant movement detected
                if (distance > MOVEMENT_THRESHOLD) {
                    appState.setZenMode(false);
                }
            } else {
                // Always track position when not in zen mode
                lastX = e.clientX;
                lastY = e.clientY;
                // Suppress zen entry while mouse is active
                if (this.components.editor) {
                    this.components.editor.clearAutoZenTimer();
                }
            }
        };
        document.addEventListener('mousemove', this.mouseMoveHandler);

        // Escape key resets app to default state
        this.escapeHandler = e => {
            if (e.key === 'Escape') {
                if (appState.settings.zenMode) {
                    appState.setZenMode(false);
                }
                if (appState.settings.sidebarOpen) {
                    appState.setSidebarOpen(false);
                }
                if (appState.settings.nostrPanelOpen) {
                    appState.setNostrPanelOpen(false);
                }
                if (appState.settings.donationPanelOpen) {
                    appState.setDonationPanelOpen(false);
                }
                if (appState.ui.searchQuery) {
                    appState.setSearchQuery('');
                }
                this.components.editor?.focus();
                this.components.editor?.moveCursorToEnd();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    initSecurity() {
        // Disable eval
        window.eval = function () {
            throw new Error('eval() is disabled for security');
        };

        // HTTPS warning
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            console.warn('TON3S should be served over HTTPS for security');
        }

        // Prevent drag and drop (except media drops on editor)
        this.dragOverHandler = e => {
            // Allow dragover inside editor (handled by Editor component)
            if (e.target.closest?.('.editor') && e.dataTransfer?.types?.includes('Files')) {
                return;
            }
            e.preventDefault();
        };
        this.dropHandler = e => {
            // Allow drops inside editor (handled by Editor component)
            if (e.target.closest?.('.editor') && e.dataTransfer?.types?.includes('Files')) {
                return;
            }
            e.preventDefault();
            return false;
        };
        document.addEventListener('dragover', this.dragOverHandler);
        document.addEventListener('drop', this.dropHandler);

        // Clear URL fragments (except accessibility anchors)
        if (location.hash) {
            const accessibilityHashes = ['#editor-container', '#main-content'];
            if (!accessibilityHashes.includes(location.hash)) {
                history.replaceState(null, null, location.pathname + location.search);
            }
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
        if (this.activePageHandler) {
            appState.off(StateEvents.ACTIVE_PAGE_CHANGED, this.activePageHandler);
        }
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }

        // Cleanup keyboard manager
        keyboardManager.destroy?.();

        // Cleanup favicon service
        faviconService.destroy?.();
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
