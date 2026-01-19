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
        this.searchDebounceTimer = null;
        this.isResizing = false;
        this.minWidth = 200;
        this.maxWidth = 500;
        this.activeTagPopup = null;
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
                <div class="sidebar-resize-handle" role="separator" aria-orientation="vertical" aria-label="Resize sidebar" tabindex="0"></div>
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

        // Search input with debounce
        this.searchInput?.addEventListener('input', (e) => {
            const query = e.target.value;

            // Clear existing debounce timer
            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
            }

            // Debounce search to prevent UI jank
            this.searchDebounceTimer = setTimeout(() => {
                appState.setSearchQuery(query);
                this.renderDocumentList();
            }, 200);
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

        // Sidebar resize handle
        this.initResizeHandle();
    }

    /**
     * Initialize sidebar resize functionality
     */
    initResizeHandle() {
        const handle = this.$('.sidebar-resize-handle');
        const sidebar = this.$('.sidebar');
        if (!handle || !sidebar) return;

        const startResize = (e) => {
            e.preventDefault();
            this.isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
        };

        const doResize = (e) => {
            if (!this.isResizing) return;

            const newWidth = Math.min(this.maxWidth, Math.max(this.minWidth, e.clientX));
            sidebar.style.width = `${newWidth}px`;
            sidebar.style.minWidth = `${newWidth}px`;
        };

        const stopResize = () => {
            this.isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);

            // Save the width preference
            const width = parseInt(sidebar.style.width);
            if (width) {
                localStorage.setItem('ton3s-sidebar-width', width);
            }
        };

        handle.addEventListener('mousedown', startResize);

        // Keyboard resizing support
        handle.addEventListener('keydown', (e) => {
            const currentWidth = sidebar.offsetWidth;
            let newWidth = currentWidth;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                newWidth = Math.max(this.minWidth, currentWidth - 20);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                newWidth = Math.min(this.maxWidth, currentWidth + 20);
            }

            if (newWidth !== currentWidth) {
                sidebar.style.width = `${newWidth}px`;
                sidebar.style.minWidth = `${newWidth}px`;
                localStorage.setItem('ton3s-sidebar-width', newWidth);
            }
        });

        // Restore saved width
        const savedWidth = localStorage.getItem('ton3s-sidebar-width');
        if (savedWidth) {
            const width = parseInt(savedWidth);
            if (width >= this.minWidth && width <= this.maxWidth) {
                sidebar.style.width = `${width}px`;
                sidebar.style.minWidth = `${width}px`;
            }
        }
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
            const isSearching = appState.ui.searchQuery?.length > 0;
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const shortcut = isMac ? '⌘N' : 'Ctrl+N';

            listEl.innerHTML = `
                <div class="document-item-empty">
                    <svg class="empty-state-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="48" height="48">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    ${isSearching
                        ? `<p>No documents found</p><span class="empty-state-hint">Try a different search term</span>`
                        : `<p>No documents yet</p>
                           <span class="empty-state-hint">Press ${shortcut} or click below</span>
                           <button class="empty-state-create-btn" aria-label="Create your first document">
                               <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                   <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                               </svg>
                               Create your first document
                           </button>`
                    }
                </div>
            `;

            // Add click handler for the create button
            const createBtn = listEl.querySelector('.empty-state-create-btn');
            createBtn?.addEventListener('click', () => {
                this.createNewDocument();
            });
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
                    <div class="document-item-actions">
                        <button class="document-tag-btn" data-tag-id="${doc.id}" aria-label="Edit tags">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
                            </svg>
                        </button>
                        <button class="document-delete-btn" data-delete-id="${doc.id}" aria-label="Delete document">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        listEl.querySelectorAll('.document-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't select document if clicking action buttons
                if (e.target.closest('.document-item-actions')) return;
                const id = parseInt(item.dataset.id);
                appState.selectDocument(id);
            });

            // Context menu for delete
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, parseInt(item.dataset.id));
            });
        });

        // Add tag button handlers
        listEl.querySelectorAll('.document-tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const docId = parseInt(btn.dataset.tagId);
                this.showTagEditorPopup(btn, docId);
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
     * Show themed confirmation dialog for document deletion
     */
    confirmDelete(docId) {
        const doc = appState.documents.find(d => d.id === docId);
        const docTitle = doc?.title || 'Untitled';

        this.showConfirmModal({
            title: 'Delete Document',
            message: `Are you sure you want to delete "${sanitizeInput(docTitle)}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            danger: true,
            onConfirm: () => {
                storageService.deleteDocument(docId);
            }
        });
    }

    /**
     * Show tag editor popup for a document
     */
    showTagEditorPopup(button, docId) {
        // Close any existing popup
        this.closeTagEditorPopup();

        const doc = appState.documents.find(d => d.id === docId);
        if (!doc) return;

        const popup = document.createElement('div');
        popup.className = 'tag-editor-popup';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-label', 'Edit tags');

        const renderPopupContent = () => {
            const tags = doc.tags || [];
            popup.innerHTML = `
                <div class="tag-editor-header">
                    <span class="tag-editor-title">Tags</span>
                    <button class="tag-editor-close" aria-label="Close">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="tag-editor-tags">
                    ${tags.map(tag => `
                        <span class="tag-editor-tag">
                            ${sanitizeInput(tag)}
                            <button class="tag-editor-tag-remove" data-tag="${sanitizeInput(tag)}" aria-label="Remove tag ${sanitizeInput(tag)}">
                                <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="12" height="12">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </span>
                    `).join('')}
                </div>
                <input
                    type="text"
                    class="tag-editor-input"
                    placeholder="Add tag (Enter)"
                    aria-label="Add new tag"
                />
            `;

            // Bind events for the popup content
            popup.querySelector('.tag-editor-close').addEventListener('click', () => {
                this.closeTagEditorPopup();
            });

            popup.querySelectorAll('.tag-editor-tag-remove').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const tagToRemove = btn.dataset.tag;
                    const newTags = (doc.tags || []).filter(t => t !== tagToRemove);
                    await storageService.updateDocument(docId, { tags: newTags });
                    doc.tags = newTags;
                    renderPopupContent();
                });
            });

            const input = popup.querySelector('.tag-editor-input');
            input.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const newTag = input.value.trim().replace(/,/g, '');
                    if (newTag && !(doc.tags || []).includes(newTag)) {
                        const newTags = [...(doc.tags || []), newTag];
                        await storageService.updateDocument(docId, { tags: newTags });
                        doc.tags = newTags;
                        renderPopupContent();
                        popup.querySelector('.tag-editor-input').focus();
                    } else {
                        input.value = '';
                    }
                }
            });

            // Focus input after rendering
            setTimeout(() => input.focus(), 50);
        };

        renderPopupContent();
        document.body.appendChild(popup);

        // Position the popup near the button
        const buttonRect = button.getBoundingClientRect();
        const popupWidth = 240;
        const popupHeight = 200;

        let left = buttonRect.right + 8;
        let top = buttonRect.top;

        // Adjust if would go off-screen right
        if (left + popupWidth > window.innerWidth - 10) {
            left = buttonRect.left - popupWidth - 8;
        }

        // Adjust if would go off-screen bottom
        if (top + popupHeight > window.innerHeight - 10) {
            top = window.innerHeight - popupHeight - 10;
        }

        // Ensure minimum values
        left = Math.max(10, left);
        top = Math.max(10, top);

        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;

        // Show with animation
        requestAnimationFrame(() => popup.classList.add('show'));

        this.activeTagPopup = popup;

        // Close on outside click
        const handleOutsideClick = (e) => {
            if (!popup.contains(e.target) && !button.contains(e.target)) {
                this.closeTagEditorPopup();
                document.removeEventListener('click', handleOutsideClick);
            }
        };
        setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);

        // Close on Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeTagEditorPopup();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Close tag editor popup
     */
    closeTagEditorPopup() {
        if (this.activeTagPopup) {
            this.activeTagPopup.classList.remove('show');
            setTimeout(() => {
                this.activeTagPopup?.remove();
                this.activeTagPopup = null;
            }, 150);
        }
    }

    /**
     * Show a themed confirmation modal
     */
    showConfirmModal({ title, message, confirmLabel, cancelLabel, danger, onConfirm }) {
        // Remove any existing confirm modal
        document.querySelector('.confirm-overlay')?.remove();

        // Store previously focused element
        const previouslyFocused = document.activeElement;

        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'confirm-title');
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <h4 id="confirm-title">${title}</h4>
                <p>${message}</p>
                <div class="confirm-actions">
                    <button class="confirm-ok ${danger ? 'danger' : ''}">${confirmLabel}</button>
                    <button class="confirm-cancel">${cancelLabel}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Show with animation
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });

        const cancelBtn = overlay.querySelector('.confirm-cancel');
        const confirmBtn = overlay.querySelector('.confirm-ok');

        // Focus cancel button (safe action) by default
        setTimeout(() => cancelBtn.focus(), 50);

        const closeModal = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                // Restore focus
                if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                    previouslyFocused.focus();
                }
            }, 200);
        };

        // Cancel button
        cancelBtn.addEventListener('click', closeModal);

        // Confirm button
        confirmBtn.addEventListener('click', () => {
            closeModal();
            onConfirm?.();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // Keyboard handling
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeyDown);
            }
            // Focus trap
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
     * Show context menu for document actions
     */
    showContextMenu(e, docId) {
        // Remove any existing context menu
        document.querySelector('.context-menu')?.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu dropdown-menu show';
        menu.style.position = 'fixed';
        menu.innerHTML = `
            <div class="dropdown-item" data-action="delete">Delete Document</div>
        `;

        document.body.appendChild(menu);

        // Calculate position ensuring menu stays within viewport
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = e.clientX;
        let top = e.clientY;

        // Check right edge
        if (left + menuRect.width > viewportWidth - 10) {
            left = viewportWidth - menuRect.width - 10;
        }

        // Check bottom edge
        if (top + menuRect.height > viewportHeight - 10) {
            top = viewportHeight - menuRect.height - 10;
        }

        // Ensure minimum left and top
        left = Math.max(10, left);
        top = Math.max(10, top);

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
            menu.remove();
            this.confirmDelete(docId);
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
