/**
 * TON3S Editor Component
 * ContentEditable-based rich text editor
 */

import { BaseComponent } from './BaseComponent.js';
import { appState, StateEvents } from '../state/AppState.js';
import { storageService } from '../services/StorageService.js';
import { countWords, countCharacters } from '../utils/markdown.js';
import { sanitizeHtml } from '../utils/sanitizer.js';

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
            const interactiveElements = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'];
            if (interactiveElements.includes(activeElement?.tagName)) {
                return;
            }
            if (
                activeElement?.hasAttribute('contenteditable') &&
                activeElement !== this.editorElement
            ) {
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

            // Focus editor and move cursor to end
            this.editorElement.focus();
            this.moveCursorToEnd();
        };

        document.addEventListener('keydown', this.autoFocusHandler);
    }

    /**
     * Move cursor to end of editor content
     */
    moveCursorToEnd() {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(this.editorElement);
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

        if (!note) {
            this.editorElement.innerHTML = '<p><br></p>';
            return;
        }

        // Sanitize HTML content to prevent XSS
        this.editorElement.innerHTML = sanitizeHtml(note.content || '<p><br></p>');
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
        this.startAutoZenTimer();
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
        if (!selection.rangeCount) {
            return;
        }

        const newP = document.createElement('p');
        newP.innerHTML = '<br>';

        const range = selection.getRangeAt(0);
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
     * Handle editor blur - stop tracking typing
     */
    handleEditorBlur() {
        this.isTyping = false;
        this.clearAutoZenTimer();
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
        const text = this.editorElement.textContent || '';
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
        if (cursorNode) {
            cursorNode.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
