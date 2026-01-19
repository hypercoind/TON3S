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
        // Rotate theme
        this.register('theme', {
            key: 't',
            cmdOrCtrl: true,
            handler: () => appState.rotateTheme(),
            description: 'Change theme'
        });

        // New note
        this.register('new', {
            key: 'n',
            cmdOrCtrl: true,
            handler: callbacks.onNewNote || (() => {}),
            description: 'New note'
        });

        // Escape is now handled by individual modals/popups

        // Focus search
        this.register('search', {
            key: 'k',
            cmdOrCtrl: true,
            handler: callbacks.onSearch || (() => {}),
            description: 'Focus search'
        });

        // Help modal
        this.register('help', {
            key: '?',
            shift: true,
            cmdOrCtrl: true,
            handler: () => this.showHelpModal(),
            description: 'Show keyboard shortcuts'
        });
    }

    /**
     * Show help modal with keyboard shortcuts
     */
    showHelpModal() {
        // Remove existing modal
        document.querySelector('.help-modal-overlay')?.remove();

        const shortcuts = this.getShortcutsList();
        const previouslyFocused = document.activeElement;

        const overlay = document.createElement('div');
        overlay.className = 'help-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'help-modal-title');

        overlay.innerHTML = `
            <div class="help-modal">
                <div class="help-modal-header">
                    <h3 id="help-modal-title">Keyboard Shortcuts</h3>
                    <button class="help-modal-close" aria-label="Close">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="help-modal-content">
                    <table class="shortcuts-table">
                        <tbody>
                            ${shortcuts.map(shortcut => `
                                <tr>
                                    <td class="shortcut-keys"><kbd>${shortcut.keys}</kbd></td>
                                    <td class="shortcut-desc">${shortcut.description}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        const closeBtn = overlay.querySelector('.help-modal-close');
        setTimeout(() => closeBtn.focus(), 50);

        const closeModal = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                    previouslyFocused.focus();
                }
            }, 200);
        };

        closeBtn.addEventListener('click', closeModal);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }
}

// Singleton instance
export const keyboardManager = new KeyboardManager();
export default keyboardManager;
