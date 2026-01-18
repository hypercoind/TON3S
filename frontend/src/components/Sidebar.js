/**
 * TON3S Sidebar Component
 * Document list, search, and document management
 */

import { BaseComponent } from './BaseComponent.js';
import { appState, StateEvents } from '../state/AppState.js';
import { storageService } from '../services/StorageService.js';
import { sanitizeInput } from '../utils/sanitizer.js';

export class Sidebar extends BaseComponent {
    constructor(container) {
        super(container);
        this.searchInput = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="sidebar ${appState.settings.sidebarOpen ? 'open' : ''}">
                <div class="sidebar-header">
                    <span class="sidebar-title">Documents</span>
                </div>
                <div class="search-container">
                    <input
                        type="text"
                        class="search-input"
                        placeholder="Search documents..."
                        aria-label="Search documents"
                    />
                </div>
                <div class="document-list"></div>
                <div class="sidebar-actions">
                    <button class="new-document-btn" aria-label="Create new document">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        New Document
                    </button>
                </div>
            </div>
        `;

        this.searchInput = this.$('.search-input');
        this.renderDocumentList();
    }

    bindEvents() {
        // New document button
        this.$('.new-document-btn')?.addEventListener('click', () => {
            this.createNewDocument();
        });

        // Search input
        this.searchInput?.addEventListener('input', (e) => {
            appState.setSearchQuery(e.target.value);
            this.renderDocumentList();
        });

        // State subscriptions
        this.subscribe(
            appState.on(StateEvents.DOCUMENTS_LOADED, this.renderDocumentList.bind(this))
        );
        this.subscribe(
            appState.on(StateEvents.DOCUMENT_CREATED, this.renderDocumentList.bind(this))
        );
        this.subscribe(
            appState.on(StateEvents.DOCUMENT_UPDATED, this.renderDocumentList.bind(this))
        );
        this.subscribe(
            appState.on(StateEvents.DOCUMENT_DELETED, this.renderDocumentList.bind(this))
        );
        this.subscribe(
            appState.on(StateEvents.DOCUMENT_SELECTED, this.updateActiveDocument.bind(this))
        );
        this.subscribe(
            appState.on(StateEvents.SIDEBAR_TOGGLED, this.toggleSidebar.bind(this))
        );
    }

    /**
     * Render the document list
     */
    renderDocumentList() {
        const listEl = this.$('.document-list');
        if (!listEl) return;

        const documents = appState.getFilteredDocuments(appState.ui.searchQuery);
        const currentId = appState.currentDocumentId;

        if (documents.length === 0) {
            listEl.innerHTML = `
                <div class="document-item-empty">
                    <p>No documents yet</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = documents.map(doc => {
            const isActive = doc.id === currentId;
            const updatedAt = this.formatDate(doc.updatedAt);
            const tags = (doc.tags || []).slice(0, 3);

            return `
                <div class="document-item ${isActive ? 'active' : ''}"
                     data-id="${doc.id}"
                     role="button"
                     tabindex="0"
                     aria-selected="${isActive}">
                    <div class="document-item-title">${sanitizeInput(doc.title || 'Untitled')}</div>
                    <div class="document-item-meta">${updatedAt}</div>
                    ${tags.length > 0 ? `
                        <div class="document-item-tags">
                            ${tags.map(tag => `<span class="tag">${sanitizeInput(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Add click handlers
        listEl.querySelectorAll('.document-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                appState.selectDocument(id);
            });

            // Context menu for delete
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, parseInt(item.dataset.id));
            });
        });
    }

    /**
     * Update the active document highlight
     */
    updateActiveDocument() {
        const currentId = appState.currentDocumentId;

        this.$$('.document-item').forEach(item => {
            const isActive = parseInt(item.dataset.id) === currentId;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-selected', isActive);
        });
    }

    /**
     * Create a new document
     */
    async createNewDocument() {
        const doc = await storageService.createDocument({
            title: 'Untitled Document',
            content: '<p><br></p>',
            plainText: '',
            tags: []
        });

        appState.selectDocument(doc.id);
    }

    /**
     * Show context menu for document actions
     */
    showContextMenu(e, docId) {
        // Remove any existing context menu
        document.querySelector('.context-menu')?.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu dropdown-menu show';
        menu.style.position = 'fixed';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        menu.innerHTML = `
            <div class="dropdown-item" data-action="delete">Delete Document</div>
        `;

        document.body.appendChild(menu);

        menu.querySelector('[data-action="delete"]').addEventListener('click', async () => {
            if (confirm('Delete this document? This cannot be undone.')) {
                await storageService.deleteDocument(docId);
            }
            menu.remove();
        });

        // Close on outside click
        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar(isOpen) {
        const sidebar = this.$('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open', isOpen);
        }
    }

    /**
     * Format date for display
     */
    formatDate(timestamp) {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than a minute
        if (diff < 60000) {
            return 'Just now';
        }

        // Less than an hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins}m ago`;
        }

        // Less than a day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }

        // Less than a week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        }

        // Otherwise, show date
        return date.toLocaleDateString();
    }

    /**
     * Focus the search input
     */
    focusSearch() {
        this.searchInput?.focus();
    }
}

export default Sidebar;
