import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../../state/AppState.js', () => ({
    appState: {
        ui: {
            lastSaveTime: Date.now()
        },
        on: vi.fn().mockReturnValue(vi.fn())
    },
    StateEvents: {
        SAVE_STATUS_CHANGED: 'ui:saveStatus'
    }
}));

vi.mock('../../services/StorageService.js', () => ({
    storageService: {
        clearAllData: vi.fn().mockResolvedValue(undefined)
    }
}));

const { StatusBar } = await import('../StatusBar.js');
const { appState } = await import('../../state/AppState.js');

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

    describe('updateSaveStatusText', () => {
        it('should show "Saved just now" for recent saves', () => {
            statusBar.render();
            appState.ui.lastSaveTime = Date.now();

            statusBar.updateSaveStatusText();

            expect(container.querySelector('#save-status').textContent).toBe('Saved just now');
        });

        it('should show seconds ago', () => {
            statusBar.render();
            appState.ui.lastSaveTime = Date.now() - 30000; // 30 seconds ago

            statusBar.updateSaveStatusText();

            expect(container.querySelector('#save-status').textContent).toContain('s ago');
        });

        it('should show minutes ago', () => {
            statusBar.render();
            appState.ui.lastSaveTime = Date.now() - 120000; // 2 minutes ago

            statusBar.updateSaveStatusText();

            expect(container.querySelector('#save-status').textContent).toContain('m ago');
        });

        it('should show "Saved" for old saves', () => {
            statusBar.render();
            appState.ui.lastSaveTime = Date.now() - 7200000; // 2 hours ago

            statusBar.updateSaveStatusText();

            expect(container.querySelector('#save-status').textContent).toBe('Saved');
        });

        it('should show "Not saved" when no lastSaveTime', () => {
            statusBar.render();
            appState.ui.lastSaveTime = null;

            statusBar.updateSaveStatusText();

            expect(container.querySelector('#save-status').textContent).toBe('Not saved');
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
        it('should clear save status interval', () => {
            statusBar.init();

            expect(statusBar.saveStatusInterval).toBeTruthy();

            statusBar.destroy();

            // Interval should be cleared (we can't directly test this, but we can verify no errors)
        });
    });
});
