import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../../state/AppState.js', () => ({
    appState: {
        ui: {
            lastSaveTime: Date.now()
        },
        currentNote: null,
        themeIndex: 0,
        fontIndex: 0,
        setTheme: vi.fn(),
        setFont: vi.fn(),
        on: vi.fn().mockReturnValue(vi.fn())
    }
}));

vi.mock('../../services/StorageService.js', () => ({
    storageService: {
        clearAllData: vi.fn().mockResolvedValue(undefined),
        saveThemeState: vi.fn(),
        saveFontState: vi.fn()
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

vi.mock('../../data/themes.js', () => ({
    themes: [{ class: 'theme-test', name: 'Test', full: 'Test Theme' }],
    getThemesByCategory: () => [
        {
            name: 'Test',
            themes: [{ index: 0, class: 'theme-test', name: 'Test', full: 'Test Theme' }]
        }
    ]
}));

vi.mock('../../data/fonts.js', () => ({
    fonts: [{ class: 'font-test', name: 'Test', full: 'Test Font' }]
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
        document.querySelectorAll('.settings-overlay, .confirm-overlay').forEach(el => el.remove());

        vi.clearAllMocks();
    });

    describe('render', () => {
        it('should render status bar with all elements', () => {
            statusBar.render();

            expect(container.querySelector('.status')).toBeTruthy();
            expect(container.querySelector('.word-count')).toBeTruthy();
            expect(container.querySelector('#char-count')).toBeTruthy();
            expect(container.querySelector('#word-count')).toBeTruthy();
            expect(container.querySelector('#settings-btn')).toBeTruthy();
        });

        it('should render settings overlay', () => {
            statusBar.render();

            expect(document.getElementById('settings-overlay')).toBeTruthy();
        });

        it('should not duplicate settings overlay on multiple renders', () => {
            statusBar.render();
            statusBar.render();

            expect(document.querySelectorAll('#settings-overlay').length).toBe(1);
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

    describe('showSettingsPopup', () => {
        it('should show settings overlay', () => {
            statusBar.render();

            statusBar.showSettingsPopup();

            expect(document.getElementById('settings-overlay').classList.contains('show')).toBe(
                true
            );
        });

        it('should store previously focused element', () => {
            statusBar.render();
            const button = container.querySelector('#settings-btn');
            button.focus();

            statusBar.showSettingsPopup();

            expect(statusBar.previouslyFocusedElement).toBe(button);
        });
    });

    describe('hideSettingsPopup', () => {
        it('should hide settings overlay', () => {
            statusBar.render();
            statusBar.showSettingsPopup();

            statusBar.hideSettingsPopup();

            expect(document.getElementById('settings-overlay').classList.contains('show')).toBe(
                false
            );
        });

        it('should restore focus to previously focused element', () => {
            statusBar.render();
            const button = container.querySelector('#settings-btn');
            button.focus();
            statusBar.showSettingsPopup();

            statusBar.hideSettingsPopup();

            expect(document.activeElement).toBe(button);
        });

        it('should reset export mode', () => {
            statusBar.render();
            statusBar.exportMode = true;

            statusBar.hideSettingsPopup();

            expect(statusBar.exportMode).toBe(false);
        });
    });

    describe('export mode', () => {
        it('should toggle export mode', () => {
            statusBar.render();
            expect(statusBar.exportMode).toBe(false);

            statusBar.exportMode = true;
            statusBar.updateSettingsActions();

            expect(statusBar.exportMode).toBe(true);
        });

        it('should render export buttons when in export mode', async () => {
            statusBar.render();
            statusBar.exportMode = true;

            // Directly update the HTML to test the getSettingsActionsHTML method
            const actionsContainer = document.querySelector('.settings-actions');
            actionsContainer.innerHTML = statusBar.getSettingsActionsHTML();

            expect(actionsContainer.querySelector('[data-action="export-all-json"]')).toBeTruthy();
            expect(actionsContainer.querySelector('[data-action="export-note-json"]')).toBeTruthy();
            expect(actionsContainer.querySelector('[data-action="export-note-md"]')).toBeTruthy();
        });

        it('should render default buttons when not in export mode', () => {
            statusBar.render();
            statusBar.exportMode = false;

            const actionsContainer = document.querySelector('.settings-actions');
            actionsContainer.innerHTML = statusBar.getSettingsActionsHTML();

            expect(actionsContainer.querySelector('#settings-export')).toBeTruthy();
            expect(actionsContainer.querySelector('#settings-import')).toBeTruthy();
            expect(actionsContainer.querySelector('#settings-clear')).toBeTruthy();
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
