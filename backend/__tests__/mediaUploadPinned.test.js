import { describe, it, expect, vi } from 'vitest';
import {
    buildPinnedUploadRequestOptions,
    uploadToPinnedBlossom
} from '../src/routes/mediaUpload.js';

describe('media upload pinning', () => {
    it('builds pinned request options with resolved IP and host header', () => {
        const parsedUrl = new URL('https://blossom.example.com/api/v1?token=test');

        const options = buildPinnedUploadRequestOptions({
            parsedUrl,
            resolvedIP: '93.184.216.34',
            authorization: 'Nostr abc',
            mimetype: 'image/png',
            contentLength: 123
        });

        expect(options.host).toBe('93.184.216.34');
        expect(options.servername).toBe('blossom.example.com');
        expect(options.path).toBe('/api/v1/upload?token=test');
        expect(options.headers.Host).toBe('blossom.example.com');
        expect(options.headers['Content-Type']).toBe('image/png');
        expect(options.headers['Content-Length']).toBe('123');
    });

    it('uses /upload when blossom URL has root pathname', () => {
        const parsedUrl = new URL('https://blossom.example.com/');
        const options = buildPinnedUploadRequestOptions({
            parsedUrl,
            resolvedIP: '93.184.216.34',
            authorization: 'Nostr abc',
            mimetype: undefined,
            contentLength: 5
        });

        expect(options.path).toBe('/upload');
        expect(options.headers['Content-Type']).toBe('application/octet-stream');
    });

    it('uploads and returns status + response body', async () => {
        const requestImpl = vi.fn((options, onResponse) => {
            const handlers = {};
            const responseHandlers = {};

            const response = {
                statusCode: 201,
                on(event, handler) {
                    responseHandlers[event] = handler;
                }
            };

            const request = {
                on(event, handler) {
                    handlers[event] = handler;
                    return request;
                },
                setTimeout() {},
                write() {},
                end() {
                    onResponse(response);
                    queueMicrotask(() => {
                        responseHandlers.data?.(Buffer.from('{"ok":true}'));
                        responseHandlers.end?.();
                    });
                },
                destroy(error) {
                    handlers.error?.(error);
                }
            };

            return request;
        });

        const result = await uploadToPinnedBlossom({
            requestOptions: {
                host: '93.184.216.34',
                path: '/upload',
                headers: {}
            },
            fileBuffer: Buffer.from('abc'),
            requestImpl
        });

        expect(requestImpl).toHaveBeenCalled();
        expect(result.statusCode).toBe(201);
        expect(result.responseText).toBe('{"ok":true}');
    });

    it('rejects with timeout error when upstream times out', async () => {
        const requestImpl = vi.fn((options, onResponse) => {
            const handlers = {};

            const request = {
                on(event, handler) {
                    handlers[event] = handler;
                    return request;
                },
                setTimeout(_ms, timeoutHandler) {
                    queueMicrotask(timeoutHandler);
                },
                write() {},
                end() {},
                destroy(error) {
                    handlers.error?.(error);
                }
            };

            return request;
        });

        await expect(
            uploadToPinnedBlossom({
                requestOptions: {
                    host: '93.184.216.34',
                    path: '/upload',
                    headers: {}
                },
                fileBuffer: Buffer.from('abc'),
                requestImpl
            })
        ).rejects.toThrow('UPSTREAM_TIMEOUT');
    });
});
