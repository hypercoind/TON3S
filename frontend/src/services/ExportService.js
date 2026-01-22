/**
 * TON3S Export Service
 * Export and import notes in JSON and Markdown formats
 */

import { storageService } from './StorageService.js';
import { htmlToMarkdown, markdownToHtml } from '../utils/markdown.js';

class ExportService {
    /**
     * Export all notes as JSON
     */
    async exportAllAsJSON() {
        const data = await storageService.exportData();
        const filename = `ton3s-export-${this.formatDate(new Date())}.json`;
        this.downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
    }

    /**
     * Export a single note as JSON
     */
    async exportNoteAsJSON(note) {
        const data = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            notes: [this.prepareNoteForExport(note)],
            settings: null
        };
        const filename = `${this.sanitizeFilename(note.title || 'untitled')}.json`;
        this.downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
    }

    /**
     * Export a single note as Markdown with YAML frontmatter
     */
    async exportNoteAsMarkdown(note) {
        const frontmatter = this.generateFrontmatter(note);
        const markdown = htmlToMarkdown(note.content);
        const content = `${frontmatter}\n${markdown}`;
        const filename = `${this.sanitizeFilename(note.title || 'untitled')}.md`;
        this.downloadFile(content, filename, 'text/markdown');
    }

    /**
     * Generate YAML frontmatter for a note
     */
    generateFrontmatter(note) {
        const lines = ['---'];

        // Title
        lines.push(`title: "${this.escapeYamlString(note.title || 'Untitled')}"`);

        // Tags
        if (note.tags && note.tags.length > 0) {
            const tagsJson = JSON.stringify(note.tags);
            lines.push(`tags: ${tagsJson}`);
        } else {
            lines.push('tags: []');
        }

        // Timestamps
        if (note.createdAt) {
            lines.push(`created: ${new Date(note.createdAt).toISOString()}`);
        }
        if (note.updatedAt) {
            lines.push(`updated: ${new Date(note.updatedAt).toISOString()}`);
        }

        // NOSTR info if published
        if (note.nostr?.published) {
            lines.push('nostr_published: true');
            if (note.nostr.eventId) {
                lines.push(`nostr_event_id: "${note.nostr.eventId}"`);
            }
            if (note.nostr.publishedAt) {
                lines.push(`nostr_published_at: ${new Date(note.nostr.publishedAt).toISOString()}`);
            }
        }

        lines.push('---');
        return lines.join('\n');
    }

    /**
     * Prepare note for export (clean up internal fields)
     */
    prepareNoteForExport(note) {
        return {
            id: note.id,
            title: note.title,
            content: note.content,
            plainText: note.plainText,
            tags: note.tags || [],
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            nostr: note.nostr || { published: false, eventId: null, publishedAt: null }
        };
    }

    /**
     * Import from file (JSON or Markdown)
     */
    async importFromFile(file) {
        const content = await this.readFile(file);
        const extension = file.name.split('.').pop().toLowerCase();

        if (extension === 'json') {
            return await this.importFromJSON(content);
        } else if (extension === 'md') {
            return await this.importFromMarkdown(content, file.name);
        } else {
            throw new Error('Unsupported file format. Use .json or .md files.');
        }
    }

    /**
     * Import from JSON content
     */
    async importFromJSON(content) {
        let data;
        try {
            data = JSON.parse(content);
        } catch {
            throw new Error('Invalid JSON format');
        }

        // Validate structure
        const notes = data.notes || data.documents;
        if (!notes || !Array.isArray(notes)) {
            throw new Error('Invalid export format: missing notes array');
        }

        // Import notes
        await storageService.importData(data);

        return { notesCount: notes.length };
    }

    /**
     * Import from Markdown content
     */
    async importFromMarkdown(content, filename) {
        const { frontmatter, body } = this.parseMarkdownWithFrontmatter(content);

        // Build note from parsed data
        const now = Date.now();
        const note = {
            title: frontmatter.title || this.titleFromFilename(filename),
            content: markdownToHtml(body),
            tags: frontmatter.tags || [],
            createdAt: frontmatter.created ? new Date(frontmatter.created).getTime() : now,
            updatedAt: frontmatter.updated ? new Date(frontmatter.updated).getTime() : now,
            nostr: {
                published: frontmatter.nostr_published || false,
                eventId: frontmatter.nostr_event_id || null,
                publishedAt: frontmatter.nostr_published_at
                    ? new Date(frontmatter.nostr_published_at).getTime()
                    : null
            }
        };

        // Create the note
        await storageService.createNote(note);

        return { notesCount: 1 };
    }

    /**
     * Parse Markdown with YAML frontmatter
     */
    parseMarkdownWithFrontmatter(content) {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
        const match = content.match(frontmatterRegex);

        if (!match) {
            // No frontmatter, treat entire content as body
            return { frontmatter: {}, body: content };
        }

        const frontmatterStr = match[1];
        const body = match[2].trim();

        // Parse YAML frontmatter (simple key: value parsing)
        const frontmatter = {};
        const lines = frontmatterStr.split('\n');

        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) {
                continue;
            }

            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();

            // Parse value
            if (value.startsWith('"') && value.endsWith('"')) {
                // Quoted string
                value = value.slice(1, -1);
            } else if (value.startsWith('[') && value.endsWith(']')) {
                // JSON array (for tags)
                try {
                    value = JSON.parse(value);
                } catch {
                    value = [];
                }
            } else if (value === 'true') {
                value = true;
            } else if (value === 'false') {
                value = false;
            }

            frontmatter[key] = value;
        }

        return { frontmatter, body };
    }

    /**
     * Read file as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Trigger file download
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    /**
     * Format date for filename
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Sanitize filename
     */
    sanitizeFilename(name) {
        return (
            name
                .replace(/[^a-z0-9\s-]/gi, '')
                .replace(/\s+/g, '-')
                .toLowerCase()
                .substring(0, 50) || 'untitled'
        );
    }

    /**
     * Extract title from filename
     */
    titleFromFilename(filename) {
        return (
            filename
                .replace(/\.[^.]+$/, '') // Remove extension
                .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
                .trim() || 'Untitled'
        );
    }

    /**
     * Escape string for YAML
     */
    escapeYamlString(str) {
        return str.replace(/"/g, '\\"');
    }
}

// Singleton instance
export const exportService = new ExportService();
export default exportService;
