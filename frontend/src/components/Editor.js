/**
 * TON3S Editor Component
 * ContentEditable-based rich text editor
 */

import { BaseComponent } from './BaseComponent.js';
import { appState, StateEvents } from '../state/AppState.js';
import { storageService } from '../services/StorageService.js';
import { countWords, countCharacters } from '../utils/markdown.js';

export class Editor extends BaseComponent {
    constructor(container) {
        super(container);
        this.editorElement = null;
        this.titleInput = null;
        this.tagsContainer = null;
        this.tagInput = null;
        this.saveTimeout = null;
    }

    render() {
        this.container.innerHTML = `
            <input
                type="text"
                class="document-title-input"
                placeholder="Untitled Document"
                aria-label="Document title"
            />
            <div class="tags-container">
                <span class="tag-input-icon" aria-hidden="true">
                    <svg fill="currentColor" viewBox="0 0 24 24" width="14" height="14">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                </span>
                <input
                    type="text"
                    class="tag-input"
                    placeholder="Add tags (press Enter)"
                    aria-label="Add tags, press Enter to add"
                />
            </div>
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
            ></div>
        `;

        this.editorElement = this.$('.editor');
        this.titleInput = this.$('.document-title-input');
        this.tagsContainer = this.$('.tags-container');
        this.tagInput = this.$('.tag-input');
    }

    bindEvents() {
        // Editor input events
        this.editorElement.addEventListener('input', this.handleInput.bind(this));
        this.editorElement.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.editorElement.addEventListener('paste', this.handlePaste.bind(this));

        // Title input
        this.titleInput.addEventListener('input', this.handleTitleChange.bind(this));

        // Tag input
        this.tagInput.addEventListener('keydown', this.handleTagKeyDown.bind(this));

        // State subscriptions
        this.subscribe(
            appState.on(StateEvents.DOCUMENT_SELECTED, this.loadDocument.bind(this))
        );
    }

    /**
     * Load a document into the editor
     */
    loadDocument(doc) {
        if (!doc) {
            this.titleInput.value = '';
            this.editorElement.innerHTML = '<p><br></p>';
            this.renderTags([]);
            return;
        }

        this.titleInput.value = doc.title || '';
        this.editorElement.innerHTML = doc.content || '<p><br></p>';
        this.renderTags(doc.tags || []);
        this.updateCounts();
    }

    /**
     * Handle editor input
     */
    handleInput() {
        this.ensureParagraph();
        this.autoSave();
        this.updateCounts();
        this.autoScroll();
    }

    /**
     * Handle keydown in editor
     */
    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.insertParagraph();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.insertTab();
        }
    }

    /**
     * Handle paste events - strip HTML for security
     */
    handlePaste(e) {
        e.preventDefault();

        const clipboardData = e.clipboardData || window.clipboardData;
        const text = clipboardData ? clipboardData.getData('text/plain') : '';

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
     * Insert a new paragraph
     */
    insertParagraph() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const newP = document.createElement('p');
        newP.innerHTML = '<br>';

        const range = selection.getRangeAt(0);
        let currentBlock = range.startContainer;

        if (currentBlock.nodeType === Node.TEXT_NODE) {
            currentBlock = currentBlock.parentElement;
        }

        while (currentBlock && currentBlock !== this.editorElement && currentBlock.tagName !== 'P') {
            currentBlock = currentBlock.parentElement;
        }

        if (currentBlock && currentBlock !== this.editorElement) {
            currentBlock.parentNode.insertBefore(newP, currentBlock.nextSibling);
        } else {
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
     * Auto-save document
     */
    async autoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(async () => {
            const doc = appState.currentDocument;
            if (!doc) return;

            const content = this.editorElement.innerHTML;
            await storageService.updateDocument(doc.id, { content });
        }, 100);
    }

    /**
     * Handle title change
     */
    async handleTitleChange() {
        const doc = appState.currentDocument;
        if (!doc) return;

        const title = this.titleInput.value.trim() || 'Untitled';
        await storageService.updateDocument(doc.id, { title });
    }

    /**
     * Handle tag input keydown
     */
    async handleTagKeyDown(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tagValue = this.tagInput.value.trim().replace(/,/g, '');
            if (tagValue) {
                await this.addTag(tagValue);
                this.tagInput.value = '';
            }
        } else if (e.key === 'Backspace' && !this.tagInput.value) {
            await this.removeLastTag();
        }
    }

    /**
     * Add a tag to the document
     */
    async addTag(tag) {
        const doc = appState.currentDocument;
        if (!doc) return;

        const tags = [...(doc.tags || [])];
        if (!tags.includes(tag)) {
            tags.push(tag);
            await storageService.updateDocument(doc.id, { tags });
            this.renderTags(tags);
        }
    }

    /**
     * Remove a tag from the document
     */
    async removeTag(tag) {
        const doc = appState.currentDocument;
        if (!doc) return;

        const tags = (doc.tags || []).filter(t => t !== tag);
        await storageService.updateDocument(doc.id, { tags });
        this.renderTags(tags);
    }

    /**
     * Remove the last tag
     */
    async removeLastTag() {
        const doc = appState.currentDocument;
        if (!doc || !doc.tags?.length) return;

        const tags = [...doc.tags];
        tags.pop();
        await storageService.updateDocument(doc.id, { tags });
        this.renderTags(tags);
    }

    /**
     * Render tags in the container
     */
    renderTags(tags) {
        // Remove existing tag elements (keep input)
        this.tagsContainer.querySelectorAll('.document-tag').forEach(el => el.remove());

        // Add tag elements before input
        tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'document-tag';
            tagEl.innerHTML = `
                ${tag}
                <span class="remove-tag" data-tag="${tag}">&times;</span>
            `;
            tagEl.querySelector('.remove-tag').addEventListener('click', () => {
                this.removeTag(tag);
            });
            this.tagsContainer.insertBefore(tagEl, this.tagInput);
        });
    }

    /**
     * Update word and character counts
     */
    updateCounts() {
        const text = this.editorElement.textContent || '';
        const words = countWords(text);
        const chars = countCharacters(text);

        // Emit event for status bar to update
        document.dispatchEvent(new CustomEvent('editor:counts', {
            detail: { words, chars }
        }));
    }

    /**
     * Auto-scroll when typing near bottom
     */
    autoScroll() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        let cursorNode = range.startContainer;

        if (cursorNode.nodeType === Node.TEXT_NODE) {
            cursorNode = cursorNode.parentElement;
        }

        let blockElement = cursorNode;
        while (blockElement && blockElement !== this.editorElement && !['P', 'DIV'].includes(blockElement.tagName)) {
            blockElement = blockElement.parentElement;
        }

        if (!blockElement || blockElement === this.editorElement) return;

        const editorRect = this.editorElement.getBoundingClientRect();
        const blockRect = blockElement.getBoundingClientRect();
        const bufferSpace = 60;

        if (blockRect.bottom > (editorRect.bottom - bufferSpace)) {
            const scrollAmount = blockRect.bottom - (editorRect.bottom - bufferSpace);
            this.editorElement.scrollTop += scrollAmount;
        }
    }

    /**
     * Get current content
     */
    getContent() {
        return this.editorElement.innerHTML;
    }

    /**
     * Set content
     */
    setContent(html) {
        this.editorElement.innerHTML = html;
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
