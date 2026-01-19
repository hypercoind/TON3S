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
        this.saveTimeout = null;
        // Auto-zen mode properties
        this.autoZenTimeout = null;
        this.autoZenDelay = 3000; // 3 seconds of typing triggers zen mode
        this.isTyping = false;
    }

    render() {
        this.container.innerHTML = `
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
    }

    bindEvents() {
        // Editor input events
        this.editorElement.addEventListener('input', this.handleInput.bind(this));
        this.editorElement.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.editorElement.addEventListener('paste', this.handlePaste.bind(this));

        // Auto-zen mode: track focus/blur
        this.editorElement.addEventListener('focus', this.handleEditorFocus.bind(this));
        this.editorElement.addEventListener('blur', this.handleEditorBlur.bind(this));

        // State subscriptions
        this.subscribe(
            appState.on(StateEvents.DOCUMENT_SELECTED, this.loadDocument.bind(this))
        );
    }

    /**
     * Load a document into the editor
     */
    loadDocument(doc) {
        // Clear auto-zen timer when switching documents
        this.clearAutoZenTimer();

        if (!doc) {
            this.editorElement.innerHTML = '<p><br></p>';
            return;
        }

        this.editorElement.innerHTML = doc.content || '<p><br></p>';
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
        this.resetAutoZenTimer();
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
     * Handle editor focus - start tracking typing
     */
    handleEditorFocus() {
        this.isTyping = true;
    }

    /**
     * Handle editor blur - stop tracking typing
     */
    handleEditorBlur() {
        this.isTyping = false;
        this.clearAutoZenTimer();
    }

    /**
     * Reset auto-zen timer on each input
     */
    resetAutoZenTimer() {
        // Don't trigger if already in zen mode
        if (appState.settings.zenMode) {
            return;
        }

        // Clear existing timer
        this.clearAutoZenTimer();

        // Start new timer - enter zen mode after continuous typing
        this.autoZenTimeout = setTimeout(() => {
            if (this.isTyping && !appState.settings.zenMode) {
                appState.toggleZenMode();
            }
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
