/**
 * TON3S Save Controls Component
 * Export options for Markdown and PDF
 */

import { BaseComponent } from './BaseComponent.js';
import { appState } from '../state/AppState.js';
import { exportService } from '../services/ExportService.js';

export class SaveControls extends BaseComponent {
    constructor(container) {
        super(container);
    }

    render() {
        this.container.innerHTML = `
            <div class="save-controls">
                <div class="btn-wrapper">
                    <button class="text-style-btn save-btn" id="save-btn" aria-label="Save document">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15S10.34 18 12 18 15 16.66 15 15 13.66 12 12 12ZM6 6H15V10H6V6Z"/>
                        </svg>
                        Save
                    </button>
                    <button class="btn-dropdown" id="save-dropdown" aria-label="Save options">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                        </svg>
                    </button>
                    <div class="dropdown-menu" id="save-dropdown-menu" role="menu">
                        <div class="dropdown-item" role="menuitem" tabindex="0" data-format="markdown">Markdown (.md)</div>
                        <div class="dropdown-item" role="menuitem" tabindex="0" data-format="pdf">PDF (.pdf)</div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Main save button
        this.$('#save-btn')?.addEventListener('click', () => {
            this.saveDocument('markdown');
        });

        // Dropdown toggle
        this.$('#save-dropdown')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Dropdown items
        this.$('#save-dropdown-menu')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const format = e.target.dataset.format;
                this.saveDocument(format);
                this.closeDropdown();
            }
        });

        // Close on outside click
        document.addEventListener('click', () => {
            this.closeDropdown();
        });
    }

    /**
     * Save document in specified format
     */
    saveDocument(format) {
        const doc = appState.currentDocument;
        if (!doc) {
            alert('No document selected.');
            return;
        }

        const content = doc.content;
        if (!content || content === '<p><br></p>') {
            alert('Document is empty. Nothing to save.');
            return;
        }

        // Prompt for filename
        let filename = prompt('Enter filename (without extension):', doc.title || 'document');
        if (filename === null) return;

        filename = filename.trim() || 'document';
        filename = filename.replace(/\.[^/.]+$/, ''); // Remove extension if provided

        try {
            switch (format) {
                case 'markdown':
                    exportService.exportAsMarkdown(content, filename);
                    break;
                case 'pdf':
                    exportService.exportAsPDF(content, filename);
                    break;
                default:
                    console.error('Unknown format:', format);
            }
        } catch (error) {
            alert(`Export failed: ${error.message}`);
        }
    }

    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        const menu = this.$('#save-dropdown-menu');
        menu?.classList.toggle('show');
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        const menu = this.$('#save-dropdown-menu');
        menu?.classList.remove('show');
    }

    /**
     * Open save dropdown (for keyboard shortcut)
     */
    openDropdown() {
        const menu = this.$('#save-dropdown-menu');
        menu?.classList.add('show');
    }
}

export default SaveControls;
