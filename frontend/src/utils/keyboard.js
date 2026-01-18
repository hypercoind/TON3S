/**
 * TON3S Keyboard Shortcuts
 * Global keyboard shortcut handling
 */

import { appState } from '../state/AppState.js';

class KeyboardManager {
    constructor() {
        this.shortcuts = new Map();
        this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        this.initialized = false;
    }

    /**
     * Initialize keyboard shortcuts
     */
    init() {
        if (this.initialized) return;

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.initialized = true;
    }

    /**
     * Register a keyboard shortcut
     * @param {Object} options - Shortcut options
     * @param {string} options.key - The key to listen for
     * @param {boolean} options.cmdOrCtrl - Require Cmd (Mac) or Ctrl (Windows)
     * @param {boolean} options.shift - Require Shift
     * @param {boolean} options.alt - Require Alt
     * @param {Function} options.handler - Handler function
     * @param {string} options.description - Description for help display
     */
    register(id, options) {
        this.shortcuts.set(id, options);
    }

    /**
     * Unregister a keyboard shortcut
     */
    unregister(id) {
        this.shortcuts.delete(id);
    }

    /**
     * Handle keydown events
     */
    handleKeyDown(e) {
        const cmdOrCtrl = this.isMac ? e.metaKey : e.ctrlKey;

        for (const [id, shortcut] of this.shortcuts) {
            const matches = (
                e.key.toLowerCase() === shortcut.key.toLowerCase() &&
                (shortcut.cmdOrCtrl ? cmdOrCtrl : !cmdOrCtrl) &&
                (shortcut.shift ? e.shiftKey : !e.shiftKey) &&
                (shortcut.alt ? e.altKey : !e.altKey)
            );

            if (matches) {
                e.preventDefault();
                try {
                    shortcut.handler(e);
                } catch (error) {
                    console.error(`Error in shortcut handler "${id}":`, error);
                }
                return;
            }
        }
    }

    /**
     * Get all registered shortcuts for display
     */
    getShortcutsList() {
        const list = [];
        for (const [id, shortcut] of this.shortcuts) {
            const keys = [];
            if (shortcut.cmdOrCtrl) keys.push(this.isMac ? '⌘' : 'Ctrl');
            if (shortcut.shift) keys.push(this.isMac ? '⇧' : 'Shift');
            if (shortcut.alt) keys.push(this.isMac ? '⌥' : 'Alt');
            keys.push(shortcut.key.toUpperCase());

            list.push({
                id,
                keys: keys.join('+'),
                description: shortcut.description || id
            });
        }
        return list;
    }

    /**
     * Setup default application shortcuts
     */
    setupDefaults(callbacks = {}) {
        // Save document
        this.register('save', {
            key: 's',
            cmdOrCtrl: true,
            handler: callbacks.onSave || (() => {}),
            description: 'Open save menu'
        });

        // Rotate theme
        this.register('theme', {
            key: 't',
            cmdOrCtrl: true,
            handler: () => appState.rotateTheme(),
            description: 'Change theme'
        });

        // Toggle zen mode
        this.register('zen', {
            key: '\\',
            cmdOrCtrl: true,
            handler: () => appState.toggleZenMode(),
            description: 'Toggle zen mode'
        });

        // New document
        this.register('new', {
            key: 'n',
            cmdOrCtrl: true,
            handler: callbacks.onNewDocument || (() => {}),
            description: 'New document'
        });

        // Escape to exit zen mode
        this.register('escape', {
            key: 'Escape',
            handler: () => {
                if (appState.settings.zenMode) {
                    appState.toggleZenMode();
                }
            },
            description: 'Exit zen mode'
        });

        // Toggle sidebar
        this.register('sidebar', {
            key: 'b',
            cmdOrCtrl: true,
            handler: () => appState.toggleSidebar(),
            description: 'Toggle sidebar'
        });

        // Focus search
        this.register('search', {
            key: 'k',
            cmdOrCtrl: true,
            handler: callbacks.onSearch || (() => {}),
            description: 'Focus search'
        });
    }
}

// Singleton instance
export const keyboardManager = new KeyboardManager();
export default keyboardManager;
