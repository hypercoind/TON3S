import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../../state/AppState.js', () => ({
    appState: {
        ui: {
            lastSaveTime: Date.now()
        },
        currentNote: null,
        on: vi.fn().mockReturnValue(vi.fn())
    }
}));

vi.mock('../../services/StorageService.js', () => ({
    storageService: {
        clearAllData: vi.fn().mockResolvedValue(undefined)
    }
}));

vi.mock('../../services/ExportService.js', () => ({
    exportService: {
        exportAllAsJSON: vi.fn().mockResolvedValue(undefined),
        exportNoteAsJSON: vi.fn().mockResolvedValue(undefined),
        exportNoteAsMarkdown: vi.fn().mockResolvedValue(undefined),
        importFromFile: vi.fn().mockResolvedValue({ notesCount: 1 })
    }
}));

vi.mock('../Toast.js', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn()
    }
}));

const { StatusBar } = await import('../StatusBar.js');

describe('StatusBar', () => {
    let container;
    let statusBar;

    beforeEach(() => {
        // Create container
        container = document.createElement('div');
        document.body.appendChild(container);

        statusBar = new StatusBar(container);
    });

    afterEach(() => {
        statusBar.destroy();
        document.body.removeChild(container);

        // Remove any overlays
        document.querySelectorAll('.privacy-overlay, .confirm-overlay').forEach(el => el.remove());

        vi.clearAllMocks();
    });

    describe('render', () => {
        it('should render status bar with all elements', () => {
            statusBar.render();

            expect(container.querySelector('.status')).toBeTruthy();
            expect(container.querySelector('.word-count')).toBeTruthy();
            expect(container.querySelector('#char-count')).toBeTruthy();
            expect(container.querySelector('#word-count')).toBeTruthy();
            expect(container.querySelector('.save-indicator')).toBeTruthy();
            expect(container.querySelector('#privacy-btn')).toBeTruthy();
        });

        it('should render privacy overlay', () => {
            statusBar.render();

            expect(document.getElementById('privacy-overlay')).toBeTruthy();
        });

        it('should not duplicate privacy overlay on multiple renders', () => {
            statusBar.render();
            statusBar.render();

            expect(document.querySelectorAll('#privacy-overlay').length).toBe(1);
        });
    });

    describe('updateCounts', () => {
        it('should update word and character counts', () => {
            statusBar.render();

            statusBar.updateCounts({ words: 10, chars: 50 });

            expect(container.querySelector('#char-count').textContent).toBe('50 characters');
            expect(container.querySelector('#word-count').textContent).toBe('10 words');
        });

        it('should handle singular forms', () => {
            statusBar.render();

            statusBar.updateCounts({ words: 1, chars: 1 });

            expect(container.querySelector('#char-count').textContent).toBe('1 character');
            expect(container.querySelector('#word-count').textContent).toBe('1 word');
        });
    });

    describe('showPrivacyPopup', () => {
        it('should show privacy overlay', () => {
            statusBar.render();

            statusBar.showPrivacyPopup();

            expect(document.getElementById('privacy-overlay').classList.contains('show')).toBe(
                true
            );
        });

        it('should store previously focused element', () => {
            statusBar.render();
            const button = container.querySelector('#privacy-btn');
            button.focus();

            statusBar.showPrivacyPopup();

            expect(statusBar.previouslyFocusedElement).toBe(button);
        });
    });

    describe('hidePrivacyPopup', () => {
        it('should hide privacy overlay', () => {
            statusBar.render();
            statusBar.showPrivacyPopup();

            statusBar.hidePrivacyPopup();

            expect(document.getElementById('privacy-overlay').classList.contains('show')).toBe(
                false
            );
        });

        it('should restore focus to previously focused element', () => {
            statusBar.render();
            const button = container.querySelector('#privacy-btn');
            button.focus();
            statusBar.showPrivacyPopup();

            statusBar.hidePrivacyPopup();

            expect(document.activeElement).toBe(button);
        });
    });

    describe('destroy', () => {
        it('should clean up without errors', () => {
            statusBar.render();
            statusBar.bindEvents();

            // Should not throw
            expect(() => statusBar.destroy()).not.toThrow();
        });
    });
});
