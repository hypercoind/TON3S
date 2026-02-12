/**
 * TON3S Sidebar Component
 * Note list, search, and note management
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
        this.activeTagPopup = null;
    }

    render() {
        const noteCount = appState.notes?.length || 0;
        const sidebarOpen = appState.settings.sidebarOpen;

        this.container.innerHTML = `
            <div class="sidebar${sidebarOpen ? ' sidebar-open' : ''}">
                <div class="sidebar-icon-strip">
                    <button class="sidebar-icon-strip-btn sidebar-toggle-btn" aria-label="Toggle notes sidebar" title="Toggle notes sidebar">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                    </button>
                    <button class="sidebar-icon-strip-btn new-note-icon-btn" aria-label="New note" title="New note">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                    </button>
                    ${noteCount > 0 ? `<span class="sidebar-note-count">${noteCount}</span>` : ''}
                </div>
                <div class="sidebar-content">
                    <div class="sidebar-header">
                        <span class="sidebar-title">Notes</span>
                        <button class="sidebar-collapse-btn" aria-label="Collapse sidebar" title="Collapse sidebar">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="search-container">
                        <input
                            type="text"
                            class="search-input"
                            placeholder="Search notes..."
                            aria-label="Search notes"
                        />
                        <button class="search-clear-btn" aria-label="Clear search" style="display: none;">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="note-list" aria-live="polite"></div>
                    <div class="sidebar-actions">
                        <button class="new-note-btn" aria-label="Create new note">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                            New Note
                        </button>
                    </div>
                </div>

            </div>
        `;

        this.searchInput = this.$('.search-input');
        this.searchClearBtn = this.$('.search-clear-btn');
        this.renderNoteList();
    }

    bindEvents() {
        // Toggle sidebar button (in icon strip - opens sidebar)
        this.$('.sidebar-toggle-btn')?.addEventListener('click', () => {
            appState.toggleSidebar();
        });

        // Collapse sidebar button (in sidebar content - closes sidebar)
        this.$('.sidebar-collapse-btn')?.addEventListener('click', () => {
            appState.setSidebarOpen(false);
        });

        // New note button (in expanded sidebar)
        this.$('.new-note-btn')?.addEventListener('click', () => {
            this.createNewNote();
        });

        // New note button (in icon strip)
        this.$('.new-note-icon-btn')?.addEventListener('click', () => {
            this.createNewNote();
        });

        // Search input with debounce
        this.searchInput?.addEventListener('input', e => {
            const query = e.target.value;

            // Show/hide clear button based on input
            if (this.searchClearBtn) {
                this.searchClearBtn.style.display = query.length > 0 ? 'flex' : 'none';
            }

            // Clear existing debounce timer
            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
            }

            // Debounce search to prevent UI jank
            this.searchDebounceTimer = setTimeout(() => {
                appState.setSearchQuery(query);
                this.renderNoteList();
            }, 200);
        });

        // Search clear button
        this.searchClearBtn?.addEventListener('click', () => {
            if (this.searchInput) {
                this.searchInput.value = '';
                this.searchInput.focus();
            }
            if (this.searchClearBtn) {
                this.searchClearBtn.style.display = 'none';
            }
            appState.setSearchQuery('');
            this.renderNoteList();
        });

        // State subscriptions
        this.subscribe(appState.on(StateEvents.NOTES_LOADED, this.renderNoteList.bind(this)));
        this.subscribe(appState.on(StateEvents.NOTE_CREATED, this.renderNoteList.bind(this)));
        this.subscribe(appState.on(StateEvents.NOTE_UPDATED, this.renderNoteList.bind(this)));
        this.subscribe(appState.on(StateEvents.NOTE_DELETED, this.renderNoteList.bind(this)));
        this.subscribe(appState.on(StateEvents.NOTE_SELECTED, this.updateActiveNote.bind(this)));
        // Close tag popup before zen mode transition starts
        this.subscribe(appState.on(StateEvents.PRE_ZEN_MODE, this.closeTagEditorPopup.bind(this)));
        // Handle sidebar toggle
        this.subscribe(
            appState.on(StateEvents.SIDEBAR_TOGGLED, this.updateSidebarState.bind(this))
        );
    }

    /**
     * Render the note list
     */
    renderNoteList() {
        const listEl = this.$('.note-list');
        if (!listEl) {
            return;
        }

        const notes = appState.getFilteredNotes(appState.ui.searchQuery);
        const currentId = appState.currentNoteId;

        if (notes.length === 0) {
            const isSearching = appState.ui.searchQuery?.length > 0;

            if (isSearching) {
                listEl.innerHTML = `
                    <div class="note-item-empty">
                        <svg class="empty-state-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="48" height="48">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        <p>No notes found</p>
                        <span class="empty-state-hint">Try a different search term</span>
                    </div>
                `;
            } else {
                listEl.innerHTML = `
                    <div class="note-item-empty">
                        <svg class="empty-state-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="48" height="48">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        <p>Start writing</p>
                        <span class="empty-state-hint">Create your first note with the + button below</span>
                    </div>
                `;
            }
            return;
        }

        listEl.innerHTML = notes
            .map(note => {
                const isActive = note.id === currentId;
                const updatedAt = this.formatDate(note.updatedAt);
                const tags = (note.tags || []).slice(0, 3);

                return `
                <div class="note-item ${isActive ? 'active' : ''}"
                     data-id="${note.id}"
                     role="button"
                     tabindex="0"
                     aria-selected="${isActive}">
                    <div class="note-item-title">${sanitizeInput((note.title || 'Untitled').split('\n')[0])}</div>
                    <div class="note-item-meta">${updatedAt}</div>
                    ${
                        tags.length > 0
                            ? `
                        <div class="note-item-tags">
                            ${tags.map(tag => `<span class="tag">${sanitizeInput(tag)}</span>`).join('')}
                        </div>
                    `
                            : ''
                    }
                    <div class="note-item-actions">
                        <button class="note-tag-btn" data-tag-id="${note.id}" aria-label="Edit tags">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
                            </svg>
                        </button>
                        <button class="note-delete-btn" data-delete-id="${note.id}" aria-label="Delete note">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            })
            .join('');

        // Add click handlers
        listEl.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', e => {
                // Don't select note if clicking action buttons
                if (e.target.closest('.note-item-actions')) {
                    return;
                }
                const id = parseInt(item.dataset.id);
                appState.selectNote(id);
                // On mobile, return to editor after selecting a note
                if (window.innerWidth <= 1024) {
                    appState.setActiveMobilePage('editor');
                }
            });

            // Context menu for delete
            item.addEventListener('contextmenu', e => {
                e.preventDefault();
                this.showContextMenu(e, parseInt(item.dataset.id));
            });
        });

        // Add tag button handlers
        listEl.querySelectorAll('.note-tag-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const noteId = parseInt(btn.dataset.tagId);
                this.showTagEditorPopup(btn, noteId);
            });
        });

        // Add delete button handlers
        listEl.querySelectorAll('.note-delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const noteId = parseInt(btn.dataset.deleteId);
                this.confirmDelete(noteId);
            });
        });
    }

    /**
     * Update the active note highlight
     */
    updateActiveNote() {
        const currentId = appState.currentNoteId;

        this.$$('.note-item').forEach(item => {
            const isActive = parseInt(item.dataset.id) === currentId;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-selected', isActive);
        });
    }

    /**
     * Update sidebar open/closed state
     */
    updateSidebarState(isOpen) {
        const sidebar = this.$('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('sidebar-open', isOpen);
        }
    }

    /**
     * Create a new note (with tag prompt if current note is untagged)
     */
    async createNewNote() {
        const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
        if (currentNote && (!currentNote.tags || currentNote.tags.length === 0)) {
            this.showTagPromptModal(currentNote, () => this.doCreateNewNote());
        } else {
            this.doCreateNewNote();
        }
    }

    /**
     * Actually create the new note
     */
    async doCreateNewNote() {
        // Clear search so the new note is visible in the list
        if (appState.ui.searchQuery) {
            appState.setSearchQuery('');
            if (this.searchInput) {
                this.searchInput.value = '';
            }
            if (this.searchClearBtn) {
                this.searchClearBtn.style.display = 'none';
            }
        }

        const note = await storageService.createNote({
            title: 'Untitled Note',
            content: '<p><br></p>',
            plainText: '',
            tags: []
        });

        appState.selectNote(note.id);
    }

    /**
     * Show tag prompt modal before creating a new note
     */
    showTagPromptModal(note, onComplete) {
        // Remove any existing tag prompt
        document.querySelector('.tag-prompt-overlay')?.remove();

        const previouslyFocused = document.activeElement;
        const originalTags = [...(note.tags || [])];

        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay tag-prompt-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'tag-prompt-title');

        const renderContent = () => {
            const tags = note.tags || [];
            overlay.innerHTML = `
                <div class="confirm-dialog tag-prompt-dialog">
                    <h4 id="tag-prompt-title">Tag your note before moving on?</h4>
                    <div class="tag-editor-tags">
                        ${tags
                            .map(
                                tag => `
                            <span class="tag-editor-tag">
                                ${sanitizeInput(tag)}
                                <button class="tag-editor-tag-remove" data-tag="${sanitizeInput(tag)}" aria-label="Remove tag ${sanitizeInput(tag)}">
                                    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="12" height="12">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                </button>
                            </span>
                        `
                            )
                            .join('')}
                    </div>
                    <input
                        type="text"
                        class="tag-editor-input tag-prompt-input"
                        placeholder="Add tag (Enter)"
                        aria-label="Add new tag"
                    />
                    <span class="tag-prompt-hint"></span>
                    <div class="confirm-actions">
                        <button class="confirm-ok tag-prompt-done">Done</button>
                        <button class="confirm-cancel tag-prompt-skip">Skip</button>
                        <button class="confirm-cancel tag-prompt-cancel">Cancel</button>
                    </div>
                </div>
            `;

            // Bind tag remove buttons
            overlay.querySelectorAll('.tag-editor-tag-remove').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const tagToRemove = btn.dataset.tag;
                    const newTags = (note.tags || []).filter(t => t !== tagToRemove);
                    await storageService.updateNote(note.id, { tags: newTags });
                    note.tags = newTags;
                    renderContent();
                });
            });

            // Bind tag input
            const input = overlay.querySelector('.tag-prompt-input');
            const hint = overlay.querySelector('.tag-prompt-hint');

            const clearHint = () => {
                hint.textContent = '';
                hint.classList.remove('visible');
            };

            input.addEventListener('keydown', async e => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    clearHint();
                    const newTag = input.value.trim().replace(/,/g, '');
                    if (newTag && !(note.tags || []).includes(newTag)) {
                        const newTags = [...(note.tags || []), newTag];
                        await storageService.updateNote(note.id, { tags: newTags });
                        note.tags = newTags;
                        renderContent();
                        overlay.querySelector('.tag-prompt-input').focus();
                    } else {
                        input.value = '';
                    }
                }
            });

            input.addEventListener('input', () => {
                if (!input.value.trim()) {
                    clearHint();
                }
            });

            // Bind buttons
            overlay.querySelector('.tag-prompt-done').addEventListener('click', () => {
                if (input.value.trim()) {
                    hint.textContent = 'Press Enter to save your tag first';
                    hint.classList.add('visible');
                    input.focus();
                    return;
                }
                closeModal();
                onComplete();
            });

            overlay.querySelector('.tag-prompt-skip').addEventListener('click', () => {
                if ((note.tags || []).length > 0) {
                    hint.textContent = "You've already added tags \u2014 click Done to continue";
                    hint.classList.add('visible');
                    return;
                }
                closeModal();
                onComplete();
            });

            overlay.querySelector('.tag-prompt-cancel').addEventListener('click', () => {
                cancelModal();
            });

            // Close on overlay click
            overlay.addEventListener('click', e => {
                if (e.target === overlay) {
                    cancelModal();
                }
            });

            setTimeout(() => input.focus(), 50);
        };

        const closeModal = () => {
            overlay.classList.remove('show');
            document.removeEventListener('keydown', handleKeyDown);
            setTimeout(() => {
                overlay.remove();
                if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                    previouslyFocused.focus();
                }
            }, 200);
        };

        const cancelModal = async () => {
            if (JSON.stringify(note.tags || []) !== JSON.stringify(originalTags)) {
                await storageService.updateNote(note.id, { tags: originalTags });
                note.tags = originalTags;
            }
            closeModal();
            this.renderNoteList();
        };

        const handleKeyDown = e => {
            if (e.key === 'Escape') {
                cancelModal();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        renderContent();
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));
    }

    /**
     * Show themed confirmation dialog for note deletion
     */
    confirmDelete(noteId) {
        const note = appState.notes.find(n => n.id === noteId);
        const noteTitle = note?.title || 'Untitled';

        this.showConfirmModal({
            title: 'Delete Note',
            message: `Are you sure you want to delete "${sanitizeInput(noteTitle)}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            danger: true,
            onConfirm: async () => {
                await storageService.deleteNote(noteId);
                if (appState.notes.length === 0) {
                    this.doCreateNewNote();
                }
            }
        });
    }

    /**
     * Show tag editor popup for a note
     */
    showTagEditorPopup(button, noteId) {
        // Close any existing popup
        this.closeTagEditorPopup();

        const note = appState.notes.find(n => n.id === noteId);
        if (!note) {
            return;
        }

        const popup = document.createElement('div');
        popup.className = 'tag-editor-popup';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-label', 'Edit tags');

        const renderPopupContent = () => {
            const tags = note.tags || [];
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
                    ${tags
                        .map(
                            tag => `
                        <span class="tag-editor-tag">
                            ${sanitizeInput(tag)}
                            <button class="tag-editor-tag-remove" data-tag="${sanitizeInput(tag)}" aria-label="Remove tag ${sanitizeInput(tag)}">
                                <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="12" height="12">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </span>
                    `
                        )
                        .join('')}
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
                    const newTags = (note.tags || []).filter(t => t !== tagToRemove);
                    await storageService.updateNote(noteId, { tags: newTags });
                    note.tags = newTags;
                    renderPopupContent();
                });
            });

            const input = popup.querySelector('.tag-editor-input');
            input.addEventListener('keydown', async e => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const newTag = input.value.trim().replace(/,/g, '');
                    if (newTag && !(note.tags || []).includes(newTag)) {
                        const newTags = [...(note.tags || []), newTag];
                        await storageService.updateNote(noteId, { tags: newTags });
                        note.tags = newTags;
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
        const handleOutsideClick = e => {
            if (!popup.contains(e.target) && !button.contains(e.target)) {
                this.closeTagEditorPopup();
                document.removeEventListener('click', handleOutsideClick);
            }
        };
        setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);

        // Close on Escape
        const handleEscape = e => {
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

        // Sanitize all string inputs to prevent XSS
        const safeTitle = sanitizeInput(title);
        const safeMessage = sanitizeInput(message);
        const safeConfirmLabel = sanitizeInput(confirmLabel);
        const safeCancelLabel = sanitizeInput(cancelLabel);

        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'confirm-title');
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <h4 id="confirm-title">${safeTitle}</h4>
                <p>${safeMessage}</p>
                <div class="confirm-actions">
                    <button class="confirm-ok ${danger ? 'danger' : ''}">${safeConfirmLabel}</button>
                    <button class="confirm-cancel">${safeCancelLabel}</button>
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
        overlay.addEventListener('click', e => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // Keyboard handling
        const handleKeyDown = e => {
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
     * Show context menu for note actions
     */
    showContextMenu(e, noteId) {
        // Remove any existing context menu
        document.querySelector('.context-menu')?.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu dropdown-menu show';
        menu.style.position = 'fixed';
        menu.innerHTML = `
            <div class="dropdown-item" data-action="delete">Delete Note</div>
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
            this.confirmDelete(noteId);
        });

        // Close on outside click
        const closeMenu = event => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    /**
     * Format date for display
     */
    formatDate(timestamp) {
        if (!timestamp) {
            return '';
        }

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
