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
        const isOpen = appState.settings.sidebarOpen;

        this.container.innerHTML = `
            <div class="sidebar ${isOpen ? 'open' : ''}">
                <div class="sidebar-header">
                    <span class="sidebar-title">Documents</span>
                    <button class="sidebar-collapse-btn" aria-label="Collapse sidebar">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
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
            <button class="sidebar-expand-tab ${isOpen ? '' : 'visible'}" aria-label="Expand sidebar">
                <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
            </button>
        `;

        this.searchInput = this.$('.search-input');
        this.renderDocumentList();
    }

    bindEvents() {
        // Sidebar collapse button
        this.$('.sidebar-collapse-btn')?.addEventListener('click', () => {
            appState.toggleSidebar();
        });

        // Sidebar expand tab
        this.$('.sidebar-expand-tab')?.addEventListener('click', () => {
            appState.toggleSidebar();
        });

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
                    <button class="document-delete-btn" data-delete-id="${doc.id}" aria-label="Delete document">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');

        // Add click handlers
        listEl.querySelectorAll('.document-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't select document if clicking delete button
                if (e.target.closest('.document-delete-btn')) return;
                const id = parseInt(item.dataset.id);
                appState.selectDocument(id);
            });

            // Context menu for delete
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, parseInt(item.dataset.id));
            });
        });

        // Add delete button handlers
        listEl.querySelectorAll('.document-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const docId = parseInt(btn.dataset.deleteId);
                this.confirmDelete(docId);
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
     * Show confirmation dialog and delete document
     */
    confirmDelete(docId) {
        if (confirm('Delete this document? This cannot be undone.')) {
            storageService.deleteDocument(docId);
        }
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
        const expandTab = this.$('.sidebar-expand-tab');

        if (sidebar) {
            sidebar.classList.toggle('open', isOpen);
        }
        if (expandTab) {
            expandTab.classList.toggle('visible', !isOpen);
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
