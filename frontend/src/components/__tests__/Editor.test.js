import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../state/AppState.js', () => ({
    StateEvents: {
        NOTE_SELECTED: 'note:selected',
        MEDIA_UPLOAD_PROGRESS: 'media:uploadProgress'
    },
    appState: {
        blossomServer: 'https://blossom.example.com',
        settings: { zenMode: false },
        on: vi.fn(),
        setZenMode: vi.fn()
    }
}));

vi.mock('../../services/StorageService.js', () => ({
    storageService: {
        updateNote: vi.fn()
    }
}));

vi.mock('../../services/MediaService.js', () => ({
    mediaService: {
        validateFile: vi.fn(),
        uploadFile: vi.fn(),
        isImage: vi.fn(file => file.type.startsWith('image/')),
        isMedia: vi.fn(() => true)
    }
}));

vi.mock('../../services/BlossomService.js', () => ({
    blossomService: {
        needsDirectUpload: vi.fn(() => false)
    }
}));

vi.mock('../../utils/markdown.js', () => ({
    countWords: vi.fn(() => 0),
    countCharacters: vi.fn(() => 0)
}));

vi.mock('../../utils/sanitizer.js', () => ({
    sanitizeHtml: vi.fn(input => input || '<p><br></p>')
}));

vi.mock('../../utils/device.js', () => ({
    shouldDisableAutoZen: vi.fn(() => false)
}));

vi.mock('../Toast.js', () => ({
    toast: {
        error: vi.fn(),
        warning: vi.fn()
    }
}));

import { Editor } from '../Editor.js';
import { appState } from '../../state/AppState.js';
import { mediaService } from '../../services/MediaService.js';

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe('Editor', () => {
    let container;
    let editor;
    let originalCreateObjectURL;
    let originalRevokeObjectURL;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        originalCreateObjectURL = URL.createObjectURL;
        originalRevokeObjectURL = URL.revokeObjectURL;
        URL.createObjectURL = vi.fn(() => 'blob:preview');
        URL.revokeObjectURL = vi.fn();

        editor = new Editor(container);
        editor.render();
    });

    afterEach(() => {
        editor.destroy();
        document.body.removeChild(container);
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it('cleans up upload progress listeners for concurrent uploads', async () => {
        const unsub1 = vi.fn();
        const unsub2 = vi.fn();
        appState.on.mockReturnValueOnce(unsub1).mockReturnValueOnce(unsub2);

        const firstUpload = deferred();
        const secondUpload = deferred();
        mediaService.uploadFile
            .mockImplementationOnce(() => firstUpload.promise)
            .mockImplementationOnce(() => secondUpload.promise);

        const file1 = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
        const file2 = new File(['b'], 'b.jpg', { type: 'image/jpeg' });

        const promise1 = editor._uploadAndInsert(file1);
        const promise2 = editor._uploadAndInsert(file2);

        expect(editor._uploadProgressUnsubs.size).toBe(2);

        firstUpload.resolve({
            descriptor: {
                url: 'https://blossom.example.com/a.jpg',
                type: 'image/jpeg'
            }
        });
        await promise1;

        expect(unsub1).toHaveBeenCalledTimes(1);
        expect(editor._uploadProgressUnsubs.size).toBe(1);

        secondUpload.reject(new Error('upload failed'));
        await promise2;

        expect(unsub2).toHaveBeenCalledTimes(1);
        expect(editor._uploadProgressUnsubs.size).toBe(0);
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });
});
