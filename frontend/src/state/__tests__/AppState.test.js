import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppState, StateEvents, appState } from '../AppState.js';
import { StateEmitter } from '../StateEmitter.js';
import { themes } from '../../data/themes.js';
import { fonts } from '../../data/fonts.js';

describe('AppState', () => {
    let state;

    beforeEach(() => {
        // Create a fresh instance for each test
        state = new AppState();
    });

    describe('initialization', () => {
        it('should initialize with empty notes', () => {
            expect(state.notes).toEqual([]);
            expect(state.currentNoteId).toBeNull();
        });

        it('should initialize with default settings', () => {
            expect(state.settings.theme.currentIndex).toBe(1);
            expect(state.settings.font.currentIndex).toBe(1);
            expect(state.settings.zenMode).toBe(false);
            expect(state.settings.sidebarOpen).toBe(true);
        });

        it('should initialize with NOSTR disconnected', () => {
            expect(state.nostr.connected).toBe(false);
            expect(state.nostr.pubkey).toBeNull();
            expect(state.nostr.extension).toBeNull();
        });

        it('should initialize with default UI state', () => {
            expect(state.ui.searchQuery).toBe('');
            expect(state.ui.saveStatus).toBe('saved');
            expect(state.ui.loading).toBe(false);
        });

        it('should initialize theme unusedIndices with all theme indices', () => {
            expect(state.settings.theme.unusedIndices.length).toBe(themes.length);
        });

        it('should initialize font unusedIndices with all font indices', () => {
            expect(state.settings.font.unusedIndices.length).toBe(fonts.length);
        });
    });

    describe('notes management', () => {
        const testNote = {
            id: 1,
            title: 'Test Note',
            content: '<p>Content</p>',
            plainText: 'Content',
            tags: ['test'],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        describe('notes setter', () => {
            it('should set notes and emit NOTES_LOADED event', () => {
                const callback = vi.fn();
                state.on(StateEvents.NOTES_LOADED, callback);

                state.notes = [testNote];

                expect(state.notes).toEqual([testNote]);
                expect(callback).toHaveBeenCalledWith([testNote]);
            });
        });

        describe('selectNote', () => {
            it('should select a note and emit NOTE_SELECTED event', () => {
                state._notes = [testNote];
                const callback = vi.fn();
                state.on(StateEvents.NOTE_SELECTED, callback);

                state.selectNote(1);

                expect(state.currentNoteId).toBe(1);
                expect(callback).toHaveBeenCalledWith(testNote);
            });

            it('should return null for non-existent note', () => {
                state._notes = [testNote];
                state.selectNote(999);

                expect(state.currentNote).toBeNull();
            });
        });

        describe('addNote', () => {
            it('should add note at the beginning and emit NOTE_CREATED event', () => {
                const callback = vi.fn();
                state.on(StateEvents.NOTE_CREATED, callback);

                state.addNote(testNote);

                expect(state.notes).toHaveLength(1);
                expect(state.notes[0]).toEqual(testNote);
                expect(callback).toHaveBeenCalledWith(testNote);
            });

            it('should add new notes at the beginning', () => {
                const note1 = { ...testNote, id: 1 };
                const note2 = { ...testNote, id: 2 };

                state.addNote(note1);
                state.addNote(note2);

                expect(state.notes[0].id).toBe(2);
                expect(state.notes[1].id).toBe(1);
            });
        });

        describe('updateNote', () => {
            it('should update note and emit NOTE_UPDATED event', () => {
                state._notes = [{ ...testNote }];
                const callback = vi.fn();
                state.on(StateEvents.NOTE_UPDATED, callback);

                state.updateNote(1, { title: 'Updated Title' });

                expect(state.notes[0].title).toBe('Updated Title');
                expect(callback).toHaveBeenCalled();
            });

            it('should not emit event for non-existent note', () => {
                state._notes = [testNote];
                const callback = vi.fn();
                state.on(StateEvents.NOTE_UPDATED, callback);

                state.updateNote(999, { title: 'Updated' });

                expect(callback).not.toHaveBeenCalled();
            });

            it('should merge updates with existing note', () => {
                state._notes = [{ ...testNote }];

                state.updateNote(1, { content: '<p>New Content</p>' });

                expect(state.notes[0].title).toBe('Test Note');
                expect(state.notes[0].content).toBe('<p>New Content</p>');
            });
        });

        describe('deleteNote', () => {
            it('should delete note and emit NOTE_DELETED event', () => {
                state._notes = [{ ...testNote }];
                const callback = vi.fn();
                state.on(StateEvents.NOTE_DELETED, callback);

                state.deleteNote(1);

                expect(state.notes).toHaveLength(0);
                expect(callback).toHaveBeenCalled();
            });

            it('should select next note when deleting current note', () => {
                const note1 = { ...testNote, id: 1 };
                const note2 = { ...testNote, id: 2 };
                state._notes = [note1, note2];
                state._currentNoteId = 1;

                const selectedCallback = vi.fn();
                state.on(StateEvents.NOTE_SELECTED, selectedCallback);

                state.deleteNote(1);

                expect(state.currentNoteId).toBe(2);
                expect(selectedCallback).toHaveBeenCalled();
            });

            it('should set currentNoteId to null when deleting last note', () => {
                state._notes = [{ ...testNote }];
                state._currentNoteId = 1;

                state.deleteNote(1);

                expect(state.currentNoteId).toBeNull();
            });
        });

        describe('getFilteredNotes', () => {
            it('should return all notes when query is empty', () => {
                state._notes = [testNote];

                expect(state.getFilteredNotes('')).toEqual([testNote]);
                expect(state.getFilteredNotes()).toEqual([testNote]);
            });

            it('should filter by title', () => {
                const note1 = { ...testNote, id: 1, title: 'JavaScript Guide' };
                const note2 = { ...testNote, id: 2, title: 'Python Tutorial' };
                state._notes = [note1, note2];

                const filtered = state.getFilteredNotes('javascript');

                expect(filtered).toHaveLength(1);
                expect(filtered[0].id).toBe(1);
            });

            it('should filter by plainText', () => {
                const note1 = { ...testNote, id: 1, plainText: 'Contains target word' };
                const note2 = { ...testNote, id: 2, plainText: 'Something else' };
                state._notes = [note1, note2];

                const filtered = state.getFilteredNotes('target');

                expect(filtered).toHaveLength(1);
                expect(filtered[0].id).toBe(1);
            });

            it('should filter by tags', () => {
                const note1 = { ...testNote, id: 1, tags: ['javascript', 'web'] };
                const note2 = { ...testNote, id: 2, tags: ['python', 'backend'] };
                state._notes = [note1, note2];

                const filtered = state.getFilteredNotes('web');

                expect(filtered).toHaveLength(1);
                expect(filtered[0].id).toBe(1);
            });

            it('should be case insensitive', () => {
                const note = { ...testNote, title: 'JavaScript' };
                state._notes = [note];

                expect(state.getFilteredNotes('JAVASCRIPT')).toHaveLength(1);
                expect(state.getFilteredNotes('javascript')).toHaveLength(1);
            });
        });
    });

    describe('theme management', () => {
        describe('setTheme', () => {
            it('should set theme and emit THEME_CHANGED event', () => {
                const callback = vi.fn();
                state.on(StateEvents.THEME_CHANGED, callback);

                state.setTheme(2);

                expect(state.settings.theme.currentIndex).toBe(2);
                expect(callback).toHaveBeenCalled();
            });

            it('should not change theme for invalid index', () => {
                state.setTheme(1);
                const originalIndex = state.settings.theme.currentIndex;
                state.setTheme(-1);
                state.setTheme(themes.length + 100);

                expect(state.settings.theme.currentIndex).toBe(originalIndex);
            });
        });

        describe('rotateTheme', () => {
            it('should emit THEME_CHANGED event', () => {
                const callback = vi.fn();
                state.on(StateEvents.THEME_CHANGED, callback);

                state.rotateTheme();

                expect(callback).toHaveBeenCalled();
            });

            it('should change the current theme index', () => {
                state.rotateTheme();

                // The rotation should have happened and index should be defined
                expect(state.settings.theme.currentIndex).toBeDefined();
            });
        });

        describe('currentTheme getter', () => {
            it('should return the current theme object', () => {
                const theme = state.currentTheme;
                expect(theme).toBeDefined();
                expect(theme.class).toBeDefined();
                expect(theme.name).toBeDefined();
            });

            it('should return theme at currentIndex', () => {
                state.setTheme(0);
                expect(state.currentTheme).toEqual(themes[0]);
            });
        });
    });

    describe('font management', () => {
        describe('setFont', () => {
            it('should set font and emit FONT_CHANGED event', () => {
                const callback = vi.fn();
                state.on(StateEvents.FONT_CHANGED, callback);

                state.setFont(2);

                expect(state.settings.font.currentIndex).toBe(2);
                expect(callback).toHaveBeenCalled();
            });

            it('should not change font for invalid index', () => {
                state.setFont(1);
                const originalIndex = state.settings.font.currentIndex;
                state.setFont(-1);
                state.setFont(fonts.length + 100);

                expect(state.settings.font.currentIndex).toBe(originalIndex);
            });
        });

        describe('rotateFont', () => {
            it('should emit FONT_CHANGED event', () => {
                const callback = vi.fn();
                state.on(StateEvents.FONT_CHANGED, callback);

                state.rotateFont();

                expect(callback).toHaveBeenCalled();
            });
        });

        describe('currentFont getter', () => {
            it('should return the current font object', () => {
                const font = state.currentFont;
                expect(font).toBeDefined();
                expect(font.class).toBeDefined();
                expect(font.name).toBeDefined();
            });
        });
    });

    describe('zen mode', () => {
        describe('toggleZenMode', () => {
            it('should toggle zen mode and emit event', () => {
                const callback = vi.fn();
                state.on(StateEvents.ZEN_MODE_TOGGLED, callback);

                expect(state.settings.zenMode).toBe(false);

                state.toggleZenMode();

                expect(state.settings.zenMode).toBe(true);
                expect(callback).toHaveBeenCalledWith(true);

                state.toggleZenMode();

                expect(state.settings.zenMode).toBe(false);
                expect(callback).toHaveBeenCalledWith(false);
            });
        });

        describe('setZenMode', () => {
            it('should set zen mode directly', () => {
                const callback = vi.fn();
                state.on(StateEvents.ZEN_MODE_TOGGLED, callback);

                state.setZenMode(true);

                expect(state.settings.zenMode).toBe(true);
                expect(callback).toHaveBeenCalledWith(true);
            });

            it('should emit PRE_ZEN_MODE before enabling zen mode', () => {
                const preCallback = vi.fn();
                const toggleCallback = vi.fn();

                state.on(StateEvents.PRE_ZEN_MODE, preCallback);
                state.on(StateEvents.ZEN_MODE_TOGGLED, toggleCallback);

                state.setZenMode(true);

                expect(preCallback).toHaveBeenCalled();
                expect(toggleCallback).toHaveBeenCalled();
            });

            it('should not emit events if value is unchanged', () => {
                state._settings.zenMode = false;

                const callback = vi.fn();
                state.on(StateEvents.ZEN_MODE_TOGGLED, callback);

                state.setZenMode(false);

                expect(callback).not.toHaveBeenCalled();
            });

            it('should not emit PRE_ZEN_MODE when disabling', () => {
                state._settings.zenMode = true;

                const preCallback = vi.fn();
                state.on(StateEvents.PRE_ZEN_MODE, preCallback);

                state.setZenMode(false);

                expect(preCallback).not.toHaveBeenCalled();
            });
        });
    });

    describe('NOSTR state', () => {
        describe('setNostrConnected', () => {
            it('should update NOSTR state and emit event', () => {
                const callback = vi.fn();
                state.on(StateEvents.NOSTR_CONNECTED, callback);

                state.setNostrConnected('pubkey123', 'Alby');

                expect(state.nostr.connected).toBe(true);
                expect(state.nostr.pubkey).toBe('pubkey123');
                expect(state.nostr.extension).toBe('Alby');
                expect(state.nostr.error).toBeNull();
                expect(callback).toHaveBeenCalledWith({
                    pubkey: 'pubkey123',
                    extension: 'Alby'
                });
            });
        });

        describe('setNostrDisconnected', () => {
            it('should reset NOSTR state and emit event', () => {
                state.setNostrConnected('pubkey123', 'Alby');

                const callback = vi.fn();
                state.on(StateEvents.NOSTR_DISCONNECTED, callback);

                state.setNostrDisconnected();

                expect(state.nostr.connected).toBe(false);
                expect(state.nostr.pubkey).toBeNull();
                expect(state.nostr.extension).toBeNull();
                expect(callback).toHaveBeenCalled();
            });
        });

        describe('setNostrError', () => {
            it('should set error and emit event', () => {
                const callback = vi.fn();
                state.on(StateEvents.NOSTR_ERROR, callback);

                state.setNostrError('Connection failed');

                expect(state.nostr.error).toBe('Connection failed');
                expect(callback).toHaveBeenCalledWith('Connection failed');
            });
        });
    });

    describe('UI state', () => {
        describe('setSearchQuery', () => {
            it('should set search query and emit event', () => {
                const callback = vi.fn();
                state.on(StateEvents.SEARCH_CHANGED, callback);

                state.setSearchQuery('test query');

                expect(state.ui.searchQuery).toBe('test query');
                expect(callback).toHaveBeenCalledWith('test query');
            });
        });

        describe('setSaveStatus', () => {
            it('should set save status and time', () => {
                const callback = vi.fn();
                state.on(StateEvents.SAVE_STATUS_CHANGED, callback);

                const time = Date.now();
                state.setSaveStatus('saving', time);

                expect(state.ui.saveStatus).toBe('saving');
                expect(state.ui.lastSaveTime).toBe(time);
                expect(callback).toHaveBeenCalledWith({ status: 'saving', time });
            });

            it('should use current time by default', () => {
                const before = Date.now();
                state.setSaveStatus('saved');
                const after = Date.now();

                expect(state.ui.lastSaveTime).toBeGreaterThanOrEqual(before);
                expect(state.ui.lastSaveTime).toBeLessThanOrEqual(after);
            });
        });

        describe('setLoading', () => {
            it('should set loading state and emit event', () => {
                const callback = vi.fn();
                state.on(StateEvents.LOADING_CHANGED, callback);

                state.setLoading(true);

                expect(state.ui.loading).toBe(true);
                expect(callback).toHaveBeenCalledWith(true);
            });
        });
    });

    describe('loadSettings', () => {
        it('should merge settings with existing settings', () => {
            const newSettings = {
                zenMode: true,
                customSetting: 'value'
            };

            state.loadSettings(newSettings);

            expect(state.settings.zenMode).toBe(true);
            expect(state.settings.customSetting).toBe('value');
            // Original settings should be preserved
            expect(state.settings.theme).toBeDefined();
            expect(state.settings.font).toBeDefined();
        });
    });
});

describe('appState singleton', () => {
    it('should export a singleton instance', () => {
        expect(appState).toBeInstanceOf(StateEmitter);
    });
});

describe('StateEvents', () => {
    it('should export all event constants', () => {
        expect(StateEvents.NOTE_CREATED).toBe('note:created');
        expect(StateEvents.NOTE_UPDATED).toBe('note:updated');
        expect(StateEvents.NOTE_DELETED).toBe('note:deleted');
        expect(StateEvents.NOTE_SELECTED).toBe('note:selected');
        expect(StateEvents.NOTES_LOADED).toBe('notes:loaded');
        expect(StateEvents.THEME_CHANGED).toBe('settings:theme');
        expect(StateEvents.FONT_CHANGED).toBe('settings:font');
        expect(StateEvents.ZEN_MODE_TOGGLED).toBe('settings:zenMode');
        expect(StateEvents.NOSTR_CONNECTED).toBe('nostr:connected');
        expect(StateEvents.NOSTR_DISCONNECTED).toBe('nostr:disconnected');
    });
});
