/**
 * TON3S Status Bar Component
 * Word count, save status, and privacy controls
 */

import { BaseComponent } from './BaseComponent.js';
import { appState } from '../state/AppState.js';
import { storageService } from '../services/StorageService.js';
import { exportService } from '../services/ExportService.js';
import { toast } from './Toast.js';

export class StatusBar extends BaseComponent {
    constructor(container) {
        super(container);
        this.previouslyFocusedElement = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="status">
                <div class="save-indicator" id="save-indicator" title="Saved" aria-live="polite" aria-atomic="true">
                    <svg class="save-icon-check" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="14" height="14">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <svg class="save-icon-saving" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="14" height="14" style="display:none;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.5"/>
                    </svg>
                </div>
                <div class="word-count" aria-live="polite" aria-atomic="true">
                    <span id="char-count">0 characters</span>
                    <span id="word-count">0 words</span>
                </div>
                <button class="privacy-btn" id="privacy-btn" aria-label="Privacy information">
                    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.9 16,12.4 16,13.5V16.5C16,17.6 15.6,18 14.5,18H9.5C8.4,18 8,17.6 8,16.5V13.5C8,12.4 8.6,11.9 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
                    </svg>
                </button>
            </div>
        `;

        this.renderPrivacyOverlay();
    }

    renderPrivacyOverlay() {
        // Check if overlay already exists
        if (document.getElementById('privacy-overlay')) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'privacy-overlay';
        overlay.id = 'privacy-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.innerHTML = `
            <div class="privacy-popup">
                <div class="privacy-header">
                    <h3>Privacy Information</h3>
                    <button class="privacy-close" id="privacy-close" aria-label="Close">&times;</button>
                </div>
                <div class="privacy-content">
                    <h4>Your Data</h4>
                    <ul>
                        <li><strong>Local storage:</strong> Notes and settings stored in browser's IndexedDB. Nothing sent to any server.</li>
                        <li><strong>No tracking:</strong> No analytics, cookies, or user tracking.</li>
                        <li><strong>NOSTR publishing:</strong> Optional. Content goes through our proxy to protect your IP.</li>
                    </ul>

                    <h4><br>Security Notes</h4>
                    <ul>
                        <li><strong>Shared computers:</strong> Other users can access your stored notes. Use private mode or clear data when finished.</li>
                        <li><strong>Private keys:</strong> If using direct key entry, keys are held in memory only and cleared on disconnect.</li>
                    </ul>

                    <div class="privacy-actions">
                        <div class="btn-wrapper export-wrapper">
                            <button class="btn privacy-export" id="privacy-export">Export</button>
                            <button class="btn-dropdown privacy-export-dropdown" id="privacy-export-dropdown" aria-label="Export options">
                                <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
                            </button>
                            <div class="dropdown-menu" id="export-dropdown-menu">
                                <div class="dropdown-item" data-action="export-all-json">Export All (JSON)</div>
                                <div class="dropdown-item" data-action="export-note-json">Export Current Note (JSON)</div>
                                <div class="dropdown-item" data-action="export-note-md">Export Current Note (Markdown)</div>
                            </div>
                        </div>
                        <button class="btn privacy-import" id="privacy-import">Import</button>
                        <input type="file" id="import-file-input" accept=".json,.md" style="display: none;">
                        <button class="btn privacy-clear" id="privacy-clear">Clear All Data</button>
                        <a href="https://github.com/hypercoind/TON3S" target="_blank" rel="noopener noreferrer" class="btn privacy-verify">View Source</a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    bindEvents() {
        // Privacy button
        this.$('#privacy-btn')?.addEventListener('click', () => {
            this.showPrivacyPopup();
        });

        // Privacy popup close
        document.getElementById('privacy-close')?.addEventListener('click', () => {
            this.hidePrivacyPopup();
        });

        // Privacy overlay click to close
        document.getElementById('privacy-overlay')?.addEventListener('click', e => {
            if (e.target.id === 'privacy-overlay') {
                this.hidePrivacyPopup();
            }
        });

        // Clear data button
        document.getElementById('privacy-clear')?.addEventListener('click', () => {
            this.showClearDataConfirm();
        });

        // Export dropdown toggle
        document.getElementById('privacy-export')?.addEventListener('click', () => {
            this.toggleExportDropdown();
        });
        document.getElementById('privacy-export-dropdown')?.addEventListener('click', () => {
            this.toggleExportDropdown();
        });

        // Export dropdown items
        document.getElementById('export-dropdown-menu')?.addEventListener('click', async e => {
            const action = e.target.dataset.action;
            if (action) {
                await this.handleExportAction(action);
                this.closeExportDropdown();
            }
        });

        // Import button
        document.getElementById('privacy-import')?.addEventListener('click', () => {
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

        // Close export dropdown when clicking outside
        document.addEventListener('click', e => {
            const exportWrapper = document.querySelector('.export-wrapper');
            if (exportWrapper && !exportWrapper.contains(e.target)) {
                this.closeExportDropdown();
            }
        });

        // Listen for editor count updates
        document.addEventListener('editor:counts', e => {
            this.updateCounts(e.detail);
        });

        // Escape to close privacy popup and focus trap
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                this.hidePrivacyPopup();
                this.closeExportDropdown();
            }
            // Handle focus trap for Tab key
            this.handleFocusTrap(e);
        });
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
     * Toggle export dropdown
     */
    toggleExportDropdown() {
        const dropdown = document.getElementById('export-dropdown-menu');
        dropdown?.classList.toggle('show');
    }

    /**
     * Close export dropdown
     */
    closeExportDropdown() {
        const dropdown = document.getElementById('export-dropdown-menu');
        dropdown?.classList.remove('show');
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
     * Show privacy popup
     */
    showPrivacyPopup() {
        // Store currently focused element to restore later
        this.previouslyFocusedElement = document.activeElement;

        const overlay = document.getElementById('privacy-overlay');
        overlay?.classList.add('show');

        // Focus the close button when modal opens
        setTimeout(() => {
            const closeBtn = document.getElementById('privacy-close');
            closeBtn?.focus();
        }, 100);
    }

    /**
     * Hide privacy popup
     */
    hidePrivacyPopup() {
        document.getElementById('privacy-overlay')?.classList.remove('show');

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
            this.hidePrivacyPopup();
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
     * Handle focus trap within privacy modal
     */
    handleFocusTrap(e) {
        const overlay = document.getElementById('privacy-overlay');
        if (!overlay?.classList.contains('show')) {
            return;
        }

        if (e.key !== 'Tab') {
            return;
        }

        const popup = overlay.querySelector('.privacy-popup');
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
