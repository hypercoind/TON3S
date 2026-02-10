/**
 * TON3S Editor Component
 * ContentEditable-based rich text editor with media support
 */

import { BaseComponent } from './BaseComponent.js';
import { appState, StateEvents } from '../state/AppState.js';
import { storageService } from '../services/StorageService.js';
import { mediaService } from '../services/MediaService.js';
import { blossomService } from '../services/BlossomService.js';
import { countWords, countCharacters } from '../utils/markdown.js';
import { sanitizeHtml } from '../utils/sanitizer.js';
import { toast } from './Toast.js';

export class Editor extends BaseComponent {
    constructor(container) {
        super(container);
        this.editorElement = null;
        this.fileInput = null;
        this.saveTimeout = null;
        // Auto-zen mode properties
        this.autoZenTimeout = null;
        this.autoZenDelay = 3000; // 3 seconds of typing triggers zen mode
        this.isTyping = false;
        this.savedRange = null;
        this._selectedMedia = null;
    }

    render() {
        this.container.innerHTML = `
            <input type="file" class="media-file-input" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm" style="display:none">
            <div
                class="editor"
                contenteditable="true"
                role="textbox"
                aria-multiline="true"
                aria-label="Writing area"
                spellcheck="true"
                data-placeholder="Write to inspire..."
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                data-empty="true"
            ></div>
        `;

        this.editorElement = this.$('.editor');
        this.fileInput = this.$('.media-file-input');
    }

    bindEvents() {
        // Editor input events
        this.editorElement.addEventListener('input', this.handleInput.bind(this));
        this.editorElement.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.editorElement.addEventListener('paste', this.handlePaste.bind(this));

        // Drag and drop for media
        this.editorElement.addEventListener('dragover', this.handleDragOver.bind(this));
        this.editorElement.addEventListener('drop', this.handleDrop.bind(this));

        // Media click selection
        this.editorElement.addEventListener('click', this.handleEditorClick.bind(this));

        // File input change
        this.fileInput.addEventListener('change', this.handleFileInputChange.bind(this));

        // Auto-zen mode: track focus/blur
        this.editorElement.addEventListener('focus', this.handleEditorFocus.bind(this));
        this.editorElement.addEventListener('blur', this.handleEditorBlur.bind(this));

        // State subscriptions
        this.subscribe(appState.on(StateEvents.NOTE_SELECTED, this.loadNote.bind(this)));

        // Auto-focus when typing anywhere
        this.setupAutoFocus();
    }

    /**
     * Setup auto-focus: typing anywhere focuses the editor
     */
    setupAutoFocus() {
        this.autoFocusHandler = e => {
            // Skip if focused on interactive element
            const activeElement = document.activeElement;
            const interactiveElements = ['INPUT', 'TEXTAREA', 'SELECT'];
            if (interactiveElements.includes(activeElement?.tagName)) {
                return;
            }
            if (activeElement?.hasAttribute('contenteditable')) {
                return;
            }
            if (activeElement?.closest('dialog')) {
                return;
            }

            // Skip if modifier keys held (preserve shortcuts)
            if (e.metaKey || e.ctrlKey || e.altKey) {
                return;
            }

            // Only handle printable characters (single character keys)
            if (e.key.length !== 1) {
                return;
            }

            // Focus editor
            this.editorElement.focus();

            // Restore saved cursor position, or move to end if empty
            if (this.savedRange && this.editorElement.textContent?.trim()) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(this.savedRange);
            } else if (!this.editorElement.textContent?.trim()) {
                this.moveCursorToEnd();
            }
            // Always clear — prevent stale range on subsequent keypresses
            this.savedRange = null;
        };

        document.addEventListener('keydown', this.autoFocusHandler);
    }

    /**
     * Move cursor to end of editor content
     */
    moveCursorToEnd() {
        const selection = window.getSelection();
        const range = document.createRange();
        const target = this.editorElement.lastElementChild || this.editorElement;
        range.selectNodeContents(target);
        range.collapse(false); // false = collapse to end
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Load a note into the editor
     */
    loadNote(note) {
        // Clear auto-zen timer when switching notes
        this.clearAutoZenTimer();
        this.savedRange = null;
        this._clearMediaSelection();

        if (!note) {
            this.editorElement.innerHTML = '<p><br></p>';
            this.updateEmptyState();
            return;
        }

        // Sanitize HTML content to prevent XSS
        this.editorElement.innerHTML = sanitizeHtml(note.content || '<p><br></p>');
        this.updateEmptyState();
        this.updateCounts();
        this.editorElement.focus();
        this.moveCursorToEnd();
    }

    /**
     * Handle editor input
     */
    handleInput() {
        this.ensureParagraph();
        this.updateEmptyState();
        this.autoSave();
        this.updateCounts();
        this.autoScroll();
        this.startAutoZenTimer();
    }

    /**
     * Handle keydown in editor
     */
    handleKeyDown(e) {
        // Cmd/Ctrl+Shift+U = open file picker for media upload
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'U') {
            e.preventDefault();
            this.openFilePicker();
            return;
        }

        // Delete/Backspace on selected media
        if (this._selectedMedia && (e.key === 'Backspace' || e.key === 'Delete')) {
            e.preventDefault();
            this._deleteSelectedMedia();
            return;
        }

        // Arrow key navigation around media
        if (this._selectedMedia && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
            e.preventDefault();
            this._navigateFromMedia('before');
            return;
        }
        if (this._selectedMedia && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
            e.preventDefault();
            this._navigateFromMedia('after');
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.insertParagraph();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.insertTab();
        }
    }

    /**
     * Handle paste events - check for images first, then strip HTML
     */
    handlePaste(e) {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) {
            return;
        }

        // Check for pasted files (images from clipboard)
        const files = clipboardData.files;
        if (files && files.length > 0) {
            for (const file of files) {
                if (mediaService.isMedia(file)) {
                    e.preventDefault();
                    this._uploadAndInsert(file);
                    return;
                }
            }
        }

        // Fall through to plain text paste
        e.preventDefault();
        const text = clipboardData.getData('text/plain') || '';

        const selection = window.getSelection();
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);

            this.editorElement.dispatchEvent(new Event('input'));
            setTimeout(() => this.autoScroll(), 10);
        }
    }

    /**
     * Handle dragover on editor - allow drop for media files
     */
    handleDragOver(e) {
        if (e.dataTransfer?.types?.includes('Files')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    }

    /**
     * Handle drop on editor - upload dropped media files
     */
    handleDrop(e) {
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) {
            return;
        }

        // Check if any are media files
        const mediaFiles = Array.from(files).filter(f => mediaService.isMedia(f));
        if (mediaFiles.length === 0) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        for (const file of mediaFiles) {
            this._uploadAndInsert(file);
        }
    }

    /**
     * Handle click on editor — media selection
     */
    handleEditorClick(e) {
        const media = e.target.closest('img, video');
        if (media && this.editorElement.contains(media)) {
            e.preventDefault();
            this._selectMedia(media);
        } else {
            this._clearMediaSelection();
        }
    }

    /**
     * Handle file input change
     */
    handleFileInputChange() {
        const files = this.fileInput.files;
        if (files && files.length > 0) {
            for (const file of files) {
                this._uploadAndInsert(file);
            }
        }
        // Reset so the same file can be re-selected
        this.fileInput.value = '';
    }

    /**
     * Open the hidden file picker
     */
    openFilePicker() {
        this.fileInput?.click();
    }

    // ==================
    // Media insertion
    // ==================

    /**
     * Upload file and insert into editor
     */
    async _uploadAndInsert(file) {
        try {
            mediaService.validateFile(file);
        } catch (err) {
            toast.error(err.message);
            return;
        }

        if (!appState.blossomServer) {
            toast.warning('Configure a Blossom server in the Nostr panel first');
            return;
        }

        // Show privacy warning for large files
        const needsDirectUpload = blossomService.needsDirectUpload(file);
        if (needsDirectUpload) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            const confirmed = await this._showPrivacyWarning(sizeMB);
            if (!confirmed) {
                return;
            }
        }

        // Insert upload placeholder
        const wrapper = this._insertUploadPlaceholder(file);

        try {
            const { descriptor } = await mediaService.uploadFile(file);

            // Replace placeholder with final element
            this._replaceWithMedia(wrapper, descriptor, file);
            this.handleInput();
        } catch (err) {
            // Remove placeholder on failure
            wrapper?.remove();
            toast.error(`Upload failed: ${err.message}`);
        }
    }

    /**
     * Insert upload progress placeholder at cursor position
     */
    _insertUploadPlaceholder(file) {
        const wrapper = document.createElement('div');
        wrapper.className = 'media-upload-wrapper';
        wrapper.contentEditable = 'false';

        if (mediaService.isImage(file)) {
            const preview = document.createElement('img');
            preview.src = URL.createObjectURL(file);
            preview.onload = () => URL.revokeObjectURL(preview.src);
            wrapper.appendChild(preview);
        }

        const progressBar = document.createElement('div');
        progressBar.className = 'upload-progress-bar';
        progressBar.style.width = '0%';
        wrapper.appendChild(progressBar);

        const label = document.createElement('div');
        label.className = 'upload-label';
        label.textContent = 'Uploading...';
        wrapper.appendChild(label);

        // Listen for progress updates
        const progressHandler = progress => {
            progressBar.style.width = `${progress}%`;
            label.textContent = `Uploading ${progress}%`;
        };
        this._uploadProgressUnsub = appState.on(StateEvents.MEDIA_UPLOAD_PROGRESS, progressHandler);

        // Insert at cursor or append
        const selection = window.getSelection();
        if (selection.rangeCount && this.editorElement.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            let block = range.startContainer;
            if (block.nodeType === Node.TEXT_NODE) {
                block = block.parentElement;
            }
            while (
                block &&
                block !== this.editorElement &&
                !['P', 'H1', 'H2'].includes(block.tagName)
            ) {
                block = block.parentElement;
            }
            if (block && block !== this.editorElement) {
                block.parentNode.insertBefore(wrapper, block.nextSibling);
            } else {
                this.editorElement.appendChild(wrapper);
            }
        } else {
            this.editorElement.appendChild(wrapper);
        }

        return wrapper;
    }

    /**
     * Replace upload placeholder with final media element
     */
    _replaceWithMedia(wrapper, descriptor, file) {
        // Cleanup progress listener
        if (this._uploadProgressUnsub) {
            this._uploadProgressUnsub();
            this._uploadProgressUnsub = null;
        }

        const url = descriptor.url;
        const isImage = mediaService.isImage(file);
        let el;

        if (isImage) {
            el = document.createElement('img');
            el.src = url;
            el.alt = '';
            el.loading = 'lazy';
        } else {
            el = document.createElement('video');
            el.src = url;
            el.controls = true;
            el.preload = 'metadata';
        }

        // Set data attributes for publishing
        if (descriptor.sha256) {
            el.setAttribute('data-sha256', descriptor.sha256);
        }
        if (descriptor.type || file.type) {
            el.setAttribute('data-mime', descriptor.type || file.type);
        }
        if (descriptor.dim) {
            el.setAttribute('data-dim', descriptor.dim);
        }
        el.setAttribute('data-blossom-url', url);

        // Replace wrapper with the media element + trailing paragraph
        const nextP = document.createElement('p');
        nextP.innerHTML = '<br>';

        if (wrapper.parentNode) {
            wrapper.parentNode.insertBefore(el, wrapper);
            wrapper.parentNode.insertBefore(nextP, el.nextSibling);
            wrapper.remove();
        } else {
            this.editorElement.appendChild(el);
            this.editorElement.appendChild(nextP);
        }

        // Move cursor to new paragraph
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(nextP, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    // ==================
    // Media selection
    // ==================

    _selectMedia(el) {
        this._clearMediaSelection();
        el.classList.add('selected');
        this._selectedMedia = el;
    }

    _clearMediaSelection() {
        if (this._selectedMedia) {
            this._selectedMedia.classList.remove('selected');
            this._selectedMedia = null;
        }
    }

    _deleteSelectedMedia() {
        const el = this._selectedMedia;
        if (!el) {
            return;
        }

        const next = el.nextElementSibling;
        el.remove();
        this._selectedMedia = null;

        // Move cursor to the next block
        if (next && this.editorElement.contains(next)) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.setStart(next, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        this.handleInput();
    }

    _navigateFromMedia(direction) {
        const el = this._selectedMedia;
        if (!el) {
            return;
        }

        const sibling = direction === 'before' ? el.previousElementSibling : el.nextElementSibling;
        this._clearMediaSelection();

        if (sibling) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(sibling);
            range.collapse(direction === 'before');
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    // ==================
    // Privacy warning dialog
    // ==================

    _showPrivacyWarning(sizeMB) {
        return new Promise(resolve => {
            const previouslyFocused = document.activeElement;

            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.innerHTML = `
                <div class="confirm-dialog">
                    <h4>Direct Upload</h4>
                    <p>This file (${sizeMB} MB) exceeds the proxy limit. It will upload directly to your Blossom server, which will see your IP address. Continue?</p>
                    <div class="confirm-actions">
                        <button class="confirm-ok">Continue</button>
                        <button class="confirm-cancel">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('show'));

            const cancelBtn = overlay.querySelector('.confirm-cancel');
            const confirmBtn = overlay.querySelector('.confirm-ok');
            setTimeout(() => cancelBtn.focus(), 50);

            const closeModal = result => {
                overlay.classList.remove('show');
                document.removeEventListener('keydown', handleKeyDown);
                setTimeout(() => {
                    overlay.remove();
                    if (previouslyFocused?.focus) {
                        previouslyFocused.focus();
                    }
                }, 200);
                resolve(result);
            };

            cancelBtn.addEventListener('click', () => closeModal(false));
            confirmBtn.addEventListener('click', () => closeModal(true));
            overlay.addEventListener('click', e => {
                if (e.target === overlay) {
                    closeModal(false);
                }
            });

            const handleKeyDown = e => {
                if (e.key === 'Escape') {
                    closeModal(false);
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
        });
    }

    // ==================
    // Original editor methods
    // ==================

    /**
     * Insert a new paragraph, splitting content at cursor position
     */
    insertParagraph() {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            return;
        }

        const range = selection.getRangeAt(0);
        range.deleteContents(); // Remove any selected text first

        let currentBlock = range.startContainer;
        if (currentBlock.nodeType === Node.TEXT_NODE) {
            currentBlock = currentBlock.parentElement;
        }
        while (
            currentBlock &&
            currentBlock !== this.editorElement &&
            currentBlock.tagName !== 'P'
        ) {
            currentBlock = currentBlock.parentElement;
        }

        const newP = document.createElement('p');

        if (currentBlock && currentBlock !== this.editorElement) {
            // Extract content from cursor to end of current block
            const afterRange = document.createRange();
            afterRange.setStart(range.startContainer, range.startOffset);
            if (currentBlock.lastChild) {
                afterRange.setEndAfter(currentBlock.lastChild);
            } else {
                afterRange.setEnd(currentBlock, currentBlock.childNodes.length);
            }
            const fragment = afterRange.extractContents();

            // If extracted fragment has content, use it; otherwise use <br>
            if (fragment.textContent.trim() || fragment.querySelector('br')) {
                newP.appendChild(fragment);
            } else {
                newP.innerHTML = '<br>';
            }

            // If current block is now empty, give it a <br>
            if (!currentBlock.textContent.trim() && !currentBlock.querySelector('br')) {
                currentBlock.innerHTML = '<br>';
            }

            currentBlock.parentNode.insertBefore(newP, currentBlock.nextSibling);
        } else {
            newP.innerHTML = '<br>';
            this.editorElement.appendChild(newP);
        }

        const newRange = document.createRange();
        newRange.setStart(newP, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        setTimeout(() => this.autoScroll(), 10);
    }

    /**
     * Insert a tab character
     */
    insertTab() {
        const selection = window.getSelection();
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode('\t'));
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
            this.editorElement.dispatchEvent(new Event('input'));
        }
    }

    /**
     * Update data-empty attribute for placeholder visibility
     */
    updateEmptyState() {
        const hasText = this.editorElement.textContent?.trim();
        const hasMedia = this.editorElement.querySelector('img, video');
        this.editorElement.setAttribute('data-empty', !hasText && !hasMedia);
    }

    /**
     * Ensure editor always has a paragraph
     */
    ensureParagraph() {
        if (this.editorElement.childNodes.length === 0) {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            this.editorElement.appendChild(p);
        }
    }

    /**
     * Auto-save note
     */
    async autoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(async () => {
            const note = appState.currentNote;
            if (!note) {
                return;
            }

            const content = this.editorElement.innerHTML;
            await storageService.updateNote(note.id, { content });
        }, 100);
    }

    /**
     * Handle editor focus - start tracking typing
     */
    handleEditorFocus() {
        this.isTyping = true;
    }

    /**
     * Handle editor blur - save cursor position for restore on re-focus
     */
    handleEditorBlur() {
        this.isTyping = false;
        this.clearAutoZenTimer();

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            this.savedRange = selection.getRangeAt(0).cloneRange();
        }
    }

    /**
     * Start auto-zen timer on input (only starts if not already running)
     */
    startAutoZenTimer() {
        // Only start timer if one isn't already running
        if (this.autoZenTimeout) {
            return;
        }

        // Start timer - enter zen mode after 3s of typing
        this.autoZenTimeout = setTimeout(() => {
            // Always activate zen mode after 3s of typing (allow re-entry)
            if (this.isTyping) {
                appState.setZenMode(true);
            }
            this.autoZenTimeout = null;
        }, this.autoZenDelay);
    }

    /**
     * Clear auto-zen timer
     */
    clearAutoZenTimer() {
        if (this.autoZenTimeout) {
            clearTimeout(this.autoZenTimeout);
            this.autoZenTimeout = null;
        }
    }

    /**
     * Update word and character counts
     */
    updateCounts() {
        // Use innerText to preserve block-level boundaries (adds newlines between blocks)
        const text = this.editorElement.innerText || '';
        const words = countWords(text);
        const chars = countCharacters(text);

        // Emit event for status bar to update
        document.dispatchEvent(
            new CustomEvent('editor:counts', {
                detail: { words, chars }
            })
        );
    }

    /**
     * Auto-scroll when typing near bottom
     * Scrolls the window since editor now extends indefinitely
     */
    autoScroll() {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            return;
        }

        const range = selection.getRangeAt(0);
        let cursorNode = range.startContainer;

        if (cursorNode.nodeType === Node.TEXT_NODE) {
            cursorNode = cursorNode.parentElement;
        }

        // Scroll cursor into view with smooth behavior
        // Safari fallback: older versions don't support options object
        if (cursorNode) {
            try {
                cursorNode.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } catch {
                cursorNode.scrollIntoView(false);
            }
        }
    }

    /**
     * Get current content
     */
    getContent() {
        return this.editorElement.innerHTML;
    }

    /**
     * Set content (sanitized)
     */
    setContent(html) {
        this.editorElement.innerHTML = sanitizeHtml(html);
        this.ensureParagraph();
    }

    /**
     * Focus the editor
     */
    focus() {
        this.editorElement.focus();
    }
}

export default Editor;
