/**
 * TON3S Blossom Service
 * BUD-01/02 file upload to Blossom servers
 */

import { appState } from '../state/AppState.js';
import { nostrAuthService } from './NostrAuthService.js';

// Files at or below this size go through the backend proxy for IP privacy
const PROXY_THRESHOLD = 10 * 1024 * 1024; // 10MB

class BlossomService {
    /**
     * Compute SHA-256 hash of a File
     * @returns {Promise<string>} hex-encoded hash
     */
    async hashFile(file) {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Create a kind:24242 auth event for Blossom upload (BUD-02)
     */
    async createAuthEvent(sha256hex) {
        const expiration = Math.floor(Date.now() / 1000) + 300; // 5 min

        const event = {
            kind: 24242,
            content: '',
            tags: [
                ['t', 'upload'],
                ['x', sha256hex],
                ['expiration', String(expiration)]
            ],
            created_at: Math.floor(Date.now() / 1000)
        };

        return nostrAuthService.signEvent(event);
    }

    /**
     * Upload a file to Blossom server
     * @param {File} file
     * @param {function} onProgress - (0-100)
     * @returns {Promise<{url, sha256, size, type}>} blob descriptor
     */
    async upload(file, onProgress) {
        const blossomServer = appState.blossomServer;
        if (!blossomServer) {
            throw new Error('No Blossom server configured');
        }

        const sha256hex = await this.hashFile(file);
        const authEvent = await this.createAuthEvent(sha256hex);
        const authHeader = `Nostr ${btoa(JSON.stringify(authEvent))}`;

        const useProxy = file.size <= PROXY_THRESHOLD;

        if (useProxy) {
            return this._uploadViaProxy(file, blossomServer, authHeader, onProgress);
        } else {
            return this._uploadDirect(file, blossomServer, authHeader, onProgress);
        }
    }

    /**
     * Upload through backend proxy (preserves IP privacy)
     */
    _uploadViaProxy(file, blossomServer, authHeader, onProgress) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('blossomServer', blossomServer);
            formData.append('authorization', authHeader);
            formData.append('file', file);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/media/upload');

            xhr.upload.addEventListener('progress', e => {
                if (e.lengthComputable && onProgress) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch {
                        reject(new Error('Invalid response from upload proxy'));
                    }
                } else {
                    let msg = 'Upload failed';
                    try {
                        const body = JSON.parse(xhr.responseText);
                        msg = body.error || body.message || msg;
                    } catch {
                        /* ignore */
                    }
                    reject(new Error(msg));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Upload network error')));
            xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));
            xhr.timeout = 60000;

            xhr.send(formData);
        });
    }

    /**
     * Upload directly to Blossom server (for large files, exposes IP)
     */
    _uploadDirect(file, blossomServer, authHeader, onProgress) {
        return new Promise((resolve, reject) => {
            const url = `${blossomServer.replace(/\/$/, '')}/upload`;

            const xhr = new XMLHttpRequest();
            xhr.open('PUT', url);
            xhr.setRequestHeader('Authorization', authHeader);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

            xhr.upload.addEventListener('progress', e => {
                if (e.lengthComputable && onProgress) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch {
                        reject(new Error('Invalid response from Blossom server'));
                    }
                } else {
                    let msg = 'Upload failed';
                    try {
                        const body = JSON.parse(xhr.responseText);
                        msg = body.message || msg;
                    } catch {
                        /* ignore */
                    }
                    reject(new Error(msg));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Upload network error')));
            xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));
            xhr.timeout = 300000; // 5 min for large files

            xhr.send(file);
        });
    }

    /**
     * Check if a file would use proxy or direct upload
     */
    needsDirectUpload(file) {
        return file.size > PROXY_THRESHOLD;
    }
}

export const blossomService = new BlossomService();
export { BlossomService, PROXY_THRESHOLD };
export default blossomService;
