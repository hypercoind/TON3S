/**
 * TON3S NOSTR Panel Component
 * NOSTR connection status and publish controls
 */

import { BaseComponent } from './BaseComponent.js';
import { appState, StateEvents } from '../state/AppState.js';
import { nostrAuthService } from '../services/NostrAuthService.js';
import { nostrService } from '../services/NostrService.js';
import { storageService } from '../services/StorageService.js';
import { exportService } from '../services/ExportService.js';
import { toast } from './Toast.js';
import { sanitizeInput } from '../utils/sanitizer.js';

export class NostrPanel extends BaseComponent {
    constructor(container) {
        super(container);
        this.publishing = false;
        this.showKeyInput = false;
        this.showExportDropdown = false;
    }

    render() {
        const { connected, pubkey, extension, error } = appState.nostr;
        const publishedNotes = appState.publishedNotes;
        const panelOpen = appState.settings.nostrPanelOpen;

        this.container.innerHTML = `
            <div class="nostr-panel${panelOpen ? ' nostr-panel-open' : ''}">
                <div class="nostr-icon-strip">
                    <button class="nostr-icon-strip-btn nostr-toggle-btn" aria-label="Toggle NOSTR panel" title="Toggle NOSTR panel">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                    </button>
                    <div class="nostr-connection-dot ${connected ? 'connected' : ''}" title="${connected ? 'Connected' : 'Not connected'}"></div>
                </div>
                <div class="nostr-panel-content">
                    <div class="nostr-panel-header">
                        <button class="nostr-collapse-btn" aria-label="Collapse panel" title="Collapse panel">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="nostr-status">
                        <span class="nostr-status-indicator ${connected ? 'connected' : ''}"></span>
                        <span class="nostr-status-text">
                            ${connected ? `Connected via ${extension}` : 'Not connected'}
                        </span>
                    </div>

                    ${
                        connected && pubkey
                            ? `
                        <div class="nostr-pubkey" title="${pubkey}">
                            ${nostrAuthService.getShortPubkey()}
                        </div>
                    `
                            : ''
                    }

                    ${
                        error
                            ? `
                        <div class="nostr-error">${sanitizeInput(error)}</div>
                    `
                            : ''
                    }

                    ${this.renderConnectionUI(connected)}

                    ${connected ? this.renderPublishedList(publishedNotes) : ''}
                </div>
            </div>
        `;
    }

    renderPublishedList(publishedNotes) {
        if (!publishedNotes || publishedNotes.length === 0) {
            return '';
        }

        const items = publishedNotes
            .map(note => {
                const time = new Date(note.publishedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                return `
                <a href="https://njump.me/${note.eventId}" target="_blank" rel="noopener noreferrer" class="published-note-item">
                    <span class="published-note-title">${sanitizeInput(note.title || 'Untitled')}</span>
                    <span class="published-note-time">${time}</span>
                </a>
            `;
            })
            .join('');

        return `
            <div class="published-notes-section">
                <div class="published-notes-header">
                    <span>Published this session (${publishedNotes.length})</span>
                    <div class="published-notes-export-wrapper">
                        <button class="published-notes-export-btn" title="Export published notes">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="14" height="14">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                        </button>
                        <div class="published-notes-dropdown ${this.showExportDropdown ? 'show' : ''}">
                            <button class="published-notes-dropdown-item export-json-btn">Export as JSON</button>
                            <button class="published-notes-dropdown-item export-md-btn">Export as Markdown</button>
                        </div>
                    </div>
                </div>
                <div class="published-notes-list">
                    ${items}
                </div>
            </div>
        `;
    }

    renderConnectionUI(connected) {
        if (connected) {
            return `
                <button class="nostr-publish-btn publish-nostr-btn" ${this.publishing ? 'disabled' : ''}>
                    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
                    </svg>
                    ${this.publishing ? 'Publishing...' : 'Publish to NOSTR'}
                </button>
                <button class="nostr-publish-btn disconnect-nostr-btn" style="margin-top: 0.5rem; background: transparent; border: 1px solid var(--secondary);">
                    Disconnect
                </button>
            `;
        }

        if (this.showKeyInput) {
            // Render modal as a separate overlay (injected into body)
            this.renderKeyModal();
            return `
                <button class="nostr-publish-btn connect-nostr-btn">
                    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    Connect Extension
                </button>
                <button class="nostr-publish-btn use-key-btn" style="margin-top: 0.5rem; background: transparent; border: 1px solid var(--secondary);">
                    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                    </svg>
                    Use Private Key
                </button>
            `;
        }

        return `
            <button class="nostr-publish-btn connect-nostr-btn">
                <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Connect Extension
            </button>
            <button class="nostr-publish-btn use-key-btn" style="margin-top: 0.5rem; background: transparent; border: 1px solid var(--secondary);">
                <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
                Use Private Key
            </button>
        `;
    }

    bindEvents() {
        // Connect button
        this.container.addEventListener('click', async e => {
            // Toggle panel button (in icon strip - opens panel)
            if (e.target.closest('.nostr-toggle-btn')) {
                appState.toggleNostrPanel();
                return;
            }

            // Collapse panel button (in panel content - closes panel)
            if (e.target.closest('.nostr-collapse-btn')) {
                appState.setNostrPanelOpen(false);
                return;
            }

            if (e.target.closest('.connect-nostr-btn')) {
                await this.connectToNostr();
            }

            if (e.target.closest('.publish-nostr-btn')) {
                await this.publishNote();
            }

            if (e.target.closest('.disconnect-nostr-btn')) {
                this.handleDisconnect();
            }

            if (e.target.closest('.use-key-btn')) {
                this.showKeyInputUI();
            }

            if (e.target.closest('.cancel-key-btn')) {
                this.hideKeyInputUI();
            }

            if (e.target.closest('.connect-key-btn')) {
                await this.connectWithKey();
            }

            // Export dropdown toggle
            if (e.target.closest('.published-notes-export-btn')) {
                this.showExportDropdown = !this.showExportDropdown;
                this.render();
            }

            // Export as JSON
            if (e.target.closest('.export-json-btn')) {
                exportService.exportPublishedNotesAsJSON(appState.publishedNotes);
                this.showExportDropdown = false;
                this.render();
            }

            // Export as Markdown
            if (e.target.closest('.export-md-btn')) {
                exportService.exportPublishedNotesAsMarkdown(appState.publishedNotes);
                this.showExportDropdown = false;
                this.render();
            }
        });

        // Close export dropdown when clicking outside
        document.addEventListener('click', e => {
            if (this.showExportDropdown && !e.target.closest('.published-notes-export-wrapper')) {
                this.showExportDropdown = false;
                this.render();
            }
        });

        // Handle Enter key in key input
        this.container.addEventListener('keydown', async e => {
            if (e.target.id === 'nostr-key-input' && e.key === 'Enter') {
                await this.connectWithKey();
            }
            if (e.target.id === 'nostr-key-input' && e.key === 'Escape') {
                this.hideKeyInputUI();
            }
        });

        // State subscriptions
        this.subscribe(appState.on(StateEvents.NOSTR_CONNECTED, () => this.render()));
        this.subscribe(appState.on(StateEvents.NOSTR_DISCONNECTED, () => this.render()));
        this.subscribe(appState.on(StateEvents.NOSTR_ERROR, () => this.render()));
        this.subscribe(appState.on(StateEvents.NOTE_SELECTED, () => this.render()));
        this.subscribe(appState.on(StateEvents.NOSTR_PUBLISHED_NOTE_ADDED, () => this.render()));
        this.subscribe(appState.on(StateEvents.NOSTR_PUBLISHED_NOTES_CLEARED, () => this.render()));
        this.subscribe(
            appState.on(StateEvents.NOSTR_PANEL_TOGGLED, isOpen => this.updatePanelState(isOpen))
        );
    }

    /**
     * Update panel open/closed state
     */
    updatePanelState(isOpen) {
        const panel = this.container.querySelector('.nostr-panel');
        if (panel) {
            panel.classList.toggle('nostr-panel-open', isOpen);
        }
    }

    /**
     * Render the key input modal overlay
     */
    renderKeyModal() {
        // Remove existing modal if any
        this.removeKeyModal();

        const overlay = document.createElement('div');
        overlay.className = 'nostr-key-overlay';
        overlay.id = 'nostr-key-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'nostr-key-modal-title');
        overlay.innerHTML = `
            <div class="nostr-key-modal">
                <div class="nostr-key-modal-header">
                    <h4 id="nostr-key-modal-title">Enter Private Key</h4>
                    <button class="nostr-key-modal-close cancel-key-btn" aria-label="Close">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <input type="password"
                       class="nostr-key-input"
                       id="nostr-key-input"
                       placeholder="nsec1... or hex key"
                       autocomplete="off"
                       spellcheck="false"
                       autocapitalize="off"
                       data-lpignore="true"
                       data-1p-ignore="true">
                <div class="nostr-key-actions">
                    <button class="nostr-publish-btn connect-key-btn">Connect</button>
                    <button class="nostr-publish-btn cancel-key-btn" style="background: transparent; border: 1px solid var(--secondary);">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Show with animation
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });

        // Add click handlers for the modal
        overlay.addEventListener('click', e => {
            // Close on backdrop click
            if (e.target === overlay) {
                this.hideKeyInputUI();
            }
            // Handle Cancel and X button clicks
            if (e.target.closest('.cancel-key-btn')) {
                this.hideKeyInputUI();
            }
            // Handle Connect button click
            if (e.target.closest('.connect-key-btn')) {
                this.connectWithKey();
            }
        });

        // Handle Enter key in the key input
        const input = overlay.querySelector('#nostr-key-input');
        input?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                this.connectWithKey();
            }
        });

        // Focus the input
        setTimeout(() => {
            const input = document.getElementById('nostr-key-input');
            input?.focus();
        }, 100);

        // Handle Escape key
        this._keyModalEscapeHandler = e => {
            if (e.key === 'Escape') {
                this.hideKeyInputUI();
            }
        };
        document.addEventListener('keydown', this._keyModalEscapeHandler);
    }

    /**
     * Remove the key input modal overlay
     */
    removeKeyModal() {
        const overlay = document.getElementById('nostr-key-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 200);
        }
        if (this._keyModalEscapeHandler) {
            document.removeEventListener('keydown', this._keyModalEscapeHandler);
            this._keyModalEscapeHandler = null;
        }
    }

    showKeyInputUI() {
        this.showKeyInput = true;
        this.render();
    }

    hideKeyInputUI() {
        this.showKeyInput = false;
        this.removeKeyModal();
        this.render();
    }

    async connectWithKey() {
        const input = document.getElementById('nostr-key-input');
        const key = input?.value?.trim();

        // Clear input immediately after reading for security
        if (input) {
            input.value = '';
        }

        if (!key) {
            toast.warning('Please enter a private key');
            return;
        }

        try {
            await nostrAuthService.connectWithPrivateKey(key);
            await nostrService.connect();
            toast.success('Connected to NOSTR');
            this.showKeyInput = false;
            this.removeKeyModal();
            this.render();
        } catch (error) {
            console.error('[NOSTR] Key connection failed:', error);
            toast.error(`Connection failed: ${error.message}`);
        }
    }

    async connectToNostr() {
        try {
            await nostrAuthService.connect();
            await nostrService.connect();
            toast.success('Connected to NOSTR');
            this.render();
        } catch (error) {
            console.error('[NOSTR] Connection failed:', error);
            toast.error(`NOSTR connection failed: ${error.message}`);
        }
    }

    /**
     * Handle disconnect with warning if published notes exist
     */
    handleDisconnect() {
        const publishedNotes = appState.publishedNotes;

        if (publishedNotes.length > 0) {
            this._showDisconnectWarning(publishedNotes.length);
        } else {
            this._performDisconnect();
        }
    }

    /**
     * Show disconnect warning modal
     */
    _showDisconnectWarning(count) {
        const overlay = document.createElement('div');
        overlay.className = 'disconnect-warning-overlay';
        overlay.id = 'disconnect-warning-overlay';
        overlay.innerHTML = `
            <div class="disconnect-warning-modal">
                <h4>Export Before Disconnecting?</h4>
                <p>You have <strong>${count}</strong> published note${count > 1 ? 's' : ''} this session. This list will be cleared when you disconnect.</p>
                <div class="disconnect-warning-actions">
                    <button class="disconnect-export-btn">Export & Disconnect</button>
                    <button class="disconnect-now-btn">Disconnect</button>
                    <button class="disconnect-cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        requestAnimationFrame(() => overlay.classList.add('show'));

        const closeOverlay = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelector('.disconnect-export-btn').addEventListener('click', () => {
            exportService.exportPublishedNotesAsJSON(appState.publishedNotes);
            this._performDisconnect();
            closeOverlay();
        });

        overlay.querySelector('.disconnect-now-btn').addEventListener('click', () => {
            this._performDisconnect();
            closeOverlay();
        });

        overlay.querySelector('.disconnect-cancel-btn').addEventListener('click', closeOverlay);

        overlay.addEventListener('click', e => {
            if (e.target === overlay) {
                closeOverlay();
            }
        });
    }

    /**
     * Perform the actual disconnect
     */
    _performDisconnect() {
        appState.clearPublishedNotes();
        nostrAuthService.disconnect();
        nostrService.disconnect();
        toast.info('Disconnected from NOSTR');
        this.render();
    }

    async publishNote() {
        if (this.publishing) {
            return;
        }

        const note = appState.currentNote;
        if (!note) {
            toast.warning('No note selected');
            return;
        }

        if (!note.plainText?.trim()) {
            toast.warning('Note is empty');
            return;
        }

        const noteId = note.id;
        const noteTitle = note.title || 'Untitled';

        this.publishing = true;
        this.render();

        try {
            const result = await nostrService.publishNote(note);
            console.log('[NOSTR] Published:', result);

            // Add to ephemeral published notes store
            appState.addPublishedNote({
                eventId: result.eventId,
                title: noteTitle,
                publishedAt: Date.now(),
                relayUrl: result.relayUrl || 'relay.damus.io',
                kind: 1
            });

            // Delete from persistent storage
            await storageService.deleteNote(noteId);

            // Select next note or create new one
            if (appState.notes.length > 0) {
                appState.selectNote(appState.notes[0].id);
            } else {
                const newNote = await storageService.createNote({
                    title: 'Untitled',
                    content: '<p><br></p>',
                    plainText: '',
                    tags: []
                });
                appState.selectNote(newNote.id);
            }

            toast.success('Published!');
        } catch (error) {
            console.error('[NOSTR] Publish failed:', error);
            toast.error(`Publish failed: ${error.message}`);
        } finally {
            this.publishing = false;
            this.render();
        }
    }
}

export default NostrPanel;
