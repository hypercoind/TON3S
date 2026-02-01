/**
 * TON3S Status Bar Component
 * Word count, save status, and settings controls
 */

import { BaseComponent } from './BaseComponent.js';
import { appState, StateEvents } from '../state/AppState.js';
import { storageService } from '../services/StorageService.js';
import { exportService } from '../services/ExportService.js';
import { toast } from './Toast.js';
import { themes, getThemesByCategory } from '../data/themes.js';
import { fonts } from '../data/fonts.js';

export class StatusBar extends BaseComponent {
    constructor(container) {
        super(container);
        this.previouslyFocusedElement = null;
        this.exportMode = false;
    }

    render() {
        this.container.innerHTML = `
            <div class="status">
                <div class="status-left">
                    <div class="word-count" aria-live="polite" aria-atomic="true">
                        <span id="char-count">0 characters</span>
                        <span id="word-count">0 words</span>
                    </div>
                </div>
                <div class="status-right">
                    <button class="settings-btn" id="settings-btn" aria-label="Settings">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        this.renderSettingsOverlay();
    }

    renderSettingsOverlay() {
        // Check if overlay already exists
        if (document.getElementById('settings-overlay')) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'settings-overlay';
        overlay.id = 'settings-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        overlay.innerHTML = this.getSettingsPopupHTML();

        document.body.appendChild(overlay);
    }

    getSettingsPopupHTML() {
        const currentThemeIndex = appState.settings.theme.currentIndex;
        const currentFontIndex = appState.settings.font.currentIndex;
        const groupedThemes = getThemesByCategory();

        return `
            <div class="settings-popup">
                <div class="settings-header">
                    <h3>Settings</h3>
                    <button class="settings-close" id="settings-close" aria-label="Close">&times;</button>
                </div>
                <div class="settings-content">
                    <div class="settings-section">
                        <h4>Theme</h4>
                        <select id="theme-select" class="settings-select" aria-label="Theme">
                            ${groupedThemes
                                .map(
                                    category => `
                                <optgroup label="${category.name}">
                                    ${category.themes
                                        .map(
                                            theme => `
                                        <option value="${theme.index}" ${theme.index === currentThemeIndex ? 'selected' : ''}>${theme.full}</option>
                                    `
                                        )
                                        .join('')}
                                </optgroup>
                            `
                                )
                                .join('')}
                        </select>
                    </div>

                    <div class="settings-section">
                        <h4>Font</h4>
                        <select id="font-select" class="settings-select" aria-label="Font">
                            ${fonts
                                .map(
                                    (font, index) => `
                                <option value="${index}" ${index === currentFontIndex ? 'selected' : ''}>${font.full}</option>
                            `
                                )
                                .join('')}
                        </select>
                    </div>

                    <details class="settings-section settings-privacy">
                        <summary><h4>Privacy & Data</h4></summary>
                        <div class="privacy-details">
                            <ul>
                                <li><strong>Local storage:</strong> Notes stored in browser's IndexedDB. Nothing sent to any server.</li>
                                <li><strong>No tracking:</strong> No analytics, cookies, or user tracking.</li>
                                <li><strong>NOSTR publishing:</strong> Optional. Content goes through proxy to protect your IP.</li>
                            </ul>
                        </div>
                    </details>

                    <div class="settings-actions">
                        ${this.getSettingsActionsHTML()}
                    </div>
                </div>
            </div>
        `;
    }

    getSettingsActionsHTML() {
        if (this.exportMode) {
            return `
                <button class="btn settings-action-btn disabled" id="settings-export">Export</button>
                <button class="btn settings-action-btn" data-action="export-all-json">All (JSON)</button>
                <button class="btn settings-action-btn" data-action="export-note-json">Note (JSON)</button>
                <button class="btn settings-action-btn" data-action="export-note-md">Note (MD)</button>
            `;
        }
        return `
            <button class="btn settings-action-btn" id="settings-export">Export</button>
            <button class="btn settings-action-btn" id="settings-import">Import</button>
            <input type="file" id="import-file-input" accept=".json,.md" style="display: none;">
            <button class="btn settings-action-btn settings-clear" id="settings-clear">Clear All Data</button>
            <a href="https://github.com/hypercoind/TON3S" target="_blank" rel="noopener noreferrer" class="btn settings-action-btn settings-verify">View Source</a>
        `;
    }

    updateSettingsActions() {
        const actionsContainer = document.querySelector('.settings-actions');
        if (!actionsContainer) {
            return;
        }

        // Add transitioning class to fade out
        actionsContainer.classList.add('transitioning');

        // Wait for fade-out, then swap content and fade in
        setTimeout(() => {
            actionsContainer.innerHTML = this.getSettingsActionsHTML();
            this.bindSettingsEvents();

            // Force reflow, then remove transitioning class to fade in
            actionsContainer.offsetHeight;
            actionsContainer.classList.remove('transitioning');
        }, 150);
    }

    updateSettingsPopup() {
        const overlay = document.getElementById('settings-overlay');
        if (overlay) {
            overlay.innerHTML = this.getSettingsPopupHTML();
            this.bindSettingsEvents();
        }
    }

    bindEvents() {
        // Settings button
        this.$('#settings-btn')?.addEventListener('click', () => {
            this.showSettingsPopup();
        });

        // Bind settings popup events
        this.bindSettingsEvents();

        // Sync dropdowns when theme/font changed externally (e.g. Header rotate buttons)
        this.subscribe(
            appState.on(StateEvents.THEME_CHANGED, () => {
                const sel = document.getElementById('theme-select');
                if (sel) {
                    sel.value = appState.settings.theme.currentIndex;
                }
            })
        );

        this.subscribe(
            appState.on(StateEvents.FONT_CHANGED, () => {
                const sel = document.getElementById('font-select');
                if (sel) {
                    sel.value = appState.settings.font.currentIndex;
                }
            })
        );

        // Listen for editor count updates
        document.addEventListener('editor:counts', e => {
            this.updateCounts(e.detail);
        });

        // Escape to close settings popup, exit export mode, and focus trap
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (this.exportMode) {
                    this.exportMode = false;
                    this.updateSettingsActions();
                } else {
                    this.hideSettingsPopup();
                }
            }
            // Handle focus trap for Tab key
            this.handleFocusTrap(e);
        });
    }

    bindSettingsEvents() {
        // Settings popup close
        document.getElementById('settings-close')?.addEventListener('click', () => {
            this.hideSettingsPopup();
        });

        // Settings overlay click to close
        document.getElementById('settings-overlay')?.addEventListener('click', e => {
            if (e.target.id === 'settings-overlay') {
                this.hideSettingsPopup();
            }
        });

        // Theme select
        document.getElementById('theme-select')?.addEventListener('change', e => {
            this.setTheme(parseInt(e.target.value));
        });

        // Font select
        document.getElementById('font-select')?.addEventListener('change', e => {
            this.setFont(parseInt(e.target.value));
        });

        // Clear data button
        document.getElementById('settings-clear')?.addEventListener('click', () => {
            this.showClearDataConfirm();
        });

        // Export button - toggle export mode or exit export mode
        document.getElementById('settings-export')?.addEventListener('click', () => {
            this.exportMode = !this.exportMode;
            this.updateSettingsActions();
        });

        // Export action buttons (when in export mode)
        document.querySelectorAll('.settings-action-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                if (action) {
                    await this.handleExportAction(action);
                    this.exportMode = false;
                    this.updateSettingsActions();
                }
            });
        });

        // Import button
        document.getElementById('settings-import')?.addEventListener('click', () => {
            document.getElementById('import-file-input')?.click();
        });

        // Import file input
        document.getElementById('import-file-input')?.addEventListener('change', async e => {
            const file = e.target.files?.[0];
            if (file) {
                await this.handleImport(file);
                e.target.value = ''; // Reset input
            }
        });
    }

    setTheme(index) {
        appState.setTheme(index);

        // Remove all theme classes and add new one
        themes.forEach(theme => {
            document.body.classList.remove(theme.class);
        });
        document.body.classList.add(themes[index].class);

        storageService.saveThemeState();

        // Update select value in popup
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = index;
        }
    }

    setFont(index) {
        appState.setFont(index);

        // Remove all font classes and add new one
        fonts.forEach(font => {
            document.body.classList.remove(font.class);
        });
        document.body.classList.add(fonts[index].class);

        storageService.saveFontState();

        // Update select value in popup
        const fontSelect = document.getElementById('font-select');
        if (fontSelect) {
            fontSelect.value = index;
        }
    }

    /**
     * Update word and character counts
     */
    updateCounts({ words, chars }) {
        const charEl = this.$('#char-count');
        const wordEl = this.$('#word-count');

        if (charEl) {
            charEl.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
        }
        if (wordEl) {
            wordEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Handle export action
     */
    async handleExportAction(action) {
        try {
            switch (action) {
                case 'export-all-json':
                    await exportService.exportAllAsJSON();
                    toast.success('All notes exported');
                    break;
                case 'export-note-json':
                    if (!appState.currentNote) {
                        toast.warning('No note selected');
                        return;
                    }
                    await exportService.exportNoteAsJSON(appState.currentNote);
                    toast.success('Note exported as JSON');
                    break;
                case 'export-note-md':
                    if (!appState.currentNote) {
                        toast.warning('No note selected');
                        return;
                    }
                    await exportService.exportNoteAsMarkdown(appState.currentNote);
                    toast.success('Note exported as Markdown');
                    break;
            }
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(`Export failed: ${error.message}`);
        }
    }

    /**
     * Handle import
     */
    async handleImport(file) {
        try {
            const result = await exportService.importFromFile(file);
            toast.success(`Imported ${result.notesCount} note(s)`);
            // Reload notes list
            window.location.reload();
        } catch (error) {
            console.error('Import failed:', error);
            toast.error(`Import failed: ${error.message}`);
        }
    }

    /**
     * Show settings popup
     */
    showSettingsPopup() {
        // Store currently focused element to restore later
        this.previouslyFocusedElement = document.activeElement;

        const overlay = document.getElementById('settings-overlay');
        overlay?.classList.add('show');

        // Focus the close button when modal opens
        setTimeout(() => {
            const closeBtn = document.getElementById('settings-close');
            closeBtn?.focus();
        }, 100);
    }

    /**
     * Hide settings popup
     */
    hideSettingsPopup() {
        document.getElementById('settings-overlay')?.classList.remove('show');

        // Reset export mode
        this.exportMode = false;

        // Restore focus to previously focused element
        if (
            this.previouslyFocusedElement &&
            typeof this.previouslyFocusedElement.focus === 'function'
        ) {
            this.previouslyFocusedElement.focus();
            this.previouslyFocusedElement = null;
        }
    }

    /**
     * Show confirmation for clearing all data
     */
    showClearDataConfirm() {
        // Remove any existing confirm modal
        document.querySelector('.confirm-overlay')?.remove();

        const previouslyFocused = document.activeElement;

        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.setAttribute('role', 'alertdialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'confirm-title');
        overlay.setAttribute('aria-describedby', 'confirm-desc');
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <h4 id="confirm-title">Clear All Data</h4>
                <p id="confirm-desc">This will permanently delete all notes and settings. This action cannot be undone.</p>
                <div class="confirm-actions">
                    <button class="confirm-ok danger">Clear All Data</button>
                    <button class="confirm-cancel">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        const cancelBtn = overlay.querySelector('.confirm-cancel');
        const confirmBtn = overlay.querySelector('.confirm-ok');

        setTimeout(() => cancelBtn.focus(), 50);

        const closeModal = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                    previouslyFocused.focus();
                }
            }, 200);
        };

        cancelBtn.addEventListener('click', closeModal);

        confirmBtn.addEventListener('click', async () => {
            closeModal();
            this.hideSettingsPopup();
            await storageService.clearAllData();
            window.location.reload();
        });

        overlay.addEventListener('click', e => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        const handleKeyDown = e => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeyDown);
            }
            if (e.key === 'Tab') {
                const focusables = overlay.querySelectorAll('button');
                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    /**
     * Handle focus trap within settings modal
     */
    handleFocusTrap(e) {
        const overlay = document.getElementById('settings-overlay');
        if (!overlay?.classList.contains('show')) {
            return;
        }

        if (e.key !== 'Tab') {
            return;
        }

        const popup = overlay.querySelector('.settings-popup');
        const focusableElements = popup.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
            return;
        }

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift+Tab: moving backwards
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab: moving forwards
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    destroy() {
        super.destroy();
    }
}

export default StatusBar;
