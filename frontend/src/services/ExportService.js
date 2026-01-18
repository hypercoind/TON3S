/**
 * TON3S Export Service
 * Export documents to Markdown and PDF formats
 */

import { jsPDF } from 'jspdf';
import { htmlToMarkdown, parseContentForPDF } from '../utils/markdown.js';
import { sanitizeFilename } from '../utils/sanitizer.js';

class ExportService {
    /**
     * Export document as Markdown
     */
    exportAsMarkdown(content, filename = 'document') {
        const markdown = htmlToMarkdown(content);

        if (!markdown.trim()) {
            throw new Error('No content to export');
        }

        const cleanFilename = sanitizeFilename(filename);
        const blob = new Blob([markdown], { type: 'text/markdown' });
        this.downloadBlob(blob, `${cleanFilename}.md`);
    }

    /**
     * Export document as PDF
     */
    exportAsPDF(content, filename = 'document') {
        const contentBlocks = parseContentForPDF(content);

        if (contentBlocks.length === 0) {
            throw new Error('No content to export to PDF');
        }

        const colors = this.getThemeColors();
        const doc = this.generatePDF(contentBlocks, colors);

        const cleanFilename = sanitizeFilename(filename);
        doc.save(`${cleanFilename}.pdf`);
    }

    /**
     * Get current theme colors for PDF
     */
    getThemeColors() {
        const computedStyle = getComputedStyle(document.body);

        const bg = computedStyle.getPropertyValue('--bg').trim();
        const fg = computedStyle.getPropertyValue('--fg').trim();
        const accent = computedStyle.getPropertyValue('--accent').trim();

        return {
            text: this.hexToRgb(fg),
            accent: this.hexToRgb(accent),
            background: this.hexToRgb(bg)
        };
    }

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    /**
     * Generate PDF document
     */
    generatePDF(contentBlocks, colors) {
        const doc = new jsPDF();

        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);

        let currentY = 30;
        const pageHeight = doc.internal.pageSize.height;
        const lineHeight = 7;
        const margin = 20;

        contentBlocks.forEach(block => {
            // Check if we need a new page
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = 30;
            }

            doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(12);

            // Add text with word wrapping
            const splitText = doc.splitTextToSize(
                block.text,
                doc.internal.pageSize.width - 2 * margin
            );
            doc.text(splitText, margin, currentY);

            // Calculate space used
            const linesUsed = Array.isArray(splitText) ? splitText.length : 1;
            currentY += (linesUsed * lineHeight) + 6;
            currentY += 3; // Paragraph spacing
        });

        // Add footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(
                `Page ${i} of ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 15,
                { align: 'center' }
            );
        }

        return doc;
    }

    /**
     * Download a blob as a file
     */
    downloadBlob(blob, filename) {
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
     * Export all documents as JSON backup
     */
    async exportAllAsJSON(documents, filename = 'ton3s-backup') {
        const data = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            documents
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        this.downloadBlob(blob, `${sanitizeFilename(filename)}.json`);
    }

    /**
     * Import documents from JSON backup
     */
    parseImportJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.documents || !Array.isArray(data.documents)) {
                throw new Error('Invalid backup format');
            }

            return data.documents;
        } catch (error) {
            throw new Error(`Failed to parse import file: ${error.message}`);
        }
    }
}

// Singleton instance
export const exportService = new ExportService();
export default exportService;
