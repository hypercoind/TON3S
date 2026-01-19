/**
 * TON3S NOSTR Panel Component
 * NOSTR connection status and publish controls
 */

import { BaseComponent } from './BaseComponent.js';
import { appState, StateEvents } from '../state/AppState.js';
import { nostrAuthService } from '../services/NostrAuthService.js';
import { nostrService } from '../services/NostrService.js';
import { storageService } from '../services/StorageService.js';

export class NostrPanel extends BaseComponent {
    constructor(container) {
        super(container);
        this.publishing = false;
    }

    render() {
        const { connected, pubkey, extension, error } = appState.nostr;
        const isVisible = appState.ui.nostrPanelVisible;

        this.container.innerHTML = `
            <div class="nostr-panel ${isVisible ? 'visible' : ''}">
                <div class="nostr-status">
                    <span class="nostr-status-indicator ${connected ? 'connected' : ''}"></span>
                    <span class="nostr-status-text">
                        ${connected ? `Connected via ${extension}` : 'Not connected'}
                    </span>
                </div>

                ${connected && pubkey ? `
                    <div class="nostr-pubkey" title="${pubkey}">
                        ${nostrAuthService.getShortPubkey()}
                    </div>
                ` : ''}

                ${error ? `
                    <div class="nostr-error">${error}</div>
                ` : ''}

                ${!connected ? `
                    <button class="nostr-publish-btn connect-nostr-btn">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                        Connect NOSTR
                    </button>
                ` : `
                    <button class="nostr-publish-btn publish-nostr-btn" ${this.publishing ? 'disabled' : ''}>
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
                        </svg>
                        ${this.publishing ? 'Publishing...' : 'Publish to NOSTR'}
                    </button>
                    <button class="nostr-publish-btn disconnect-nostr-btn" style="margin-top: 0.5rem; background: transparent; border: 1px solid var(--secondary);">
                        Disconnect
                    </button>
                `}

                ${this.getPublishStatus()}
            </div>
        `;
    }

    getPublishStatus() {
        const note = appState.currentNote;
        if (!note || !note.nostr?.published) return '';

        const publishedAt = new Date(note.nostr.publishedAt).toLocaleString();
        return `
            <div class="nostr-published-info" style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--fg-dim);">
                <span style="color: var(--accent);">Published</span>
                <br>${publishedAt}
                ${note.nostr.eventId ? `<br><code style="font-size: 0.65rem;">${note.nostr.eventId.slice(0, 16)}...</code>` : ''}
            </div>
        `;
    }

    bindEvents() {
        // Connect button
        this.container.addEventListener('click', async (e) => {
            if (e.target.closest('.connect-nostr-btn')) {
                await this.connectToNostr();
            }

            if (e.target.closest('.publish-nostr-btn')) {
                await this.publishNote();
            }

            if (e.target.closest('.disconnect-nostr-btn')) {
                this.disconnectFromNostr();
            }
        });

        // State subscriptions
        this.subscribe(
            appState.on(StateEvents.NOSTR_CONNECTED, () => this.render())
        );
        this.subscribe(
            appState.on(StateEvents.NOSTR_DISCONNECTED, () => this.render())
        );
        this.subscribe(
            appState.on(StateEvents.NOSTR_ERROR, () => this.render())
        );
        this.subscribe(
            appState.on(StateEvents.NOTE_SELECTED, () => this.render())
        );
        this.subscribe(
            appState.on(StateEvents.NOSTR_PUBLISHED, () => this.render())
        );
        this.subscribe(
            appState.on(StateEvents.NOSTR_PANEL_TOGGLED, () => this.render())
        );
    }

    async connectToNostr() {
        try {
            await nostrAuthService.connect();
            await nostrService.connect();
            this.render();
        } catch (error) {
            console.error('[NOSTR] Connection failed:', error);
            alert(`NOSTR connection failed: ${error.message}`);
        }
    }

    disconnectFromNostr() {
        nostrAuthService.disconnect();
        nostrService.disconnect();
        this.render();
    }

    async publishNote() {
        if (this.publishing) return;

        const note = appState.currentNote;
        if (!note) {
            alert('No note selected');
            return;
        }

        if (!note.plainText?.trim()) {
            alert('Note is empty');
            return;
        }

        this.publishing = true;
        this.render();

        try {
            const result = await nostrService.publishNote(note);
            console.log('[NOSTR] Published:', result);

            // Update note with publish info
            await storageService.markAsPublished(note.id, result.eventId);

            alert('Note published to NOSTR!');
        } catch (error) {
            console.error('[NOSTR] Publish failed:', error);
            alert(`Publish failed: ${error.message}`);
        } finally {
            this.publishing = false;
            this.render();
        }
    }
}

export default NostrPanel;
