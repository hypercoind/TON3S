/**
 * TON3S Media Service
 * File validation, upload orchestration, dimension extraction
 */

import { appState } from '../state/AppState.js';
import { blossomService } from './BlossomService.js';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

class MediaService {
    /**
     * Check if a file is an allowed image type
     */
    isImage(file) {
        return ALLOWED_IMAGE_TYPES.has(file.type);
    }

    /**
     * Check if a file is an allowed video type
     */
    isVideo(file) {
        return ALLOWED_VIDEO_TYPES.has(file.type);
    }

    /**
     * Check if a file is a supported media type
     */
    isMedia(file) {
        return this.isImage(file) || this.isVideo(file);
    }

    /**
     * Validate a file for upload
     * @throws {Error} if invalid
     */
    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }
        if (!this.isMedia(file)) {
            throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
        }
        if (file.size === 0) {
            throw new Error('File is empty');
        }
    }

    /**
     * Get dimensions of an image file
     * @returns {Promise<string>} "WxH"
     */
    getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(`${img.naturalWidth}x${img.naturalHeight}`);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            img.src = url;
        });
    }

    /**
     * Get dimensions of a video file
     * @returns {Promise<string>} "WxH"
     */
    getVideoDimensions(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(url);
                resolve(`${video.videoWidth}x${video.videoHeight}`);
            };
            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load video metadata'));
            };
            video.src = url;
        });
    }

    /**
     * Get dimensions for any media file
     * @returns {Promise<string>} "WxH"
     */
    async getDimensions(file) {
        if (this.isImage(file)) {
            return this.getImageDimensions(file);
        }
        if (this.isVideo(file)) {
            return this.getVideoDimensions(file);
        }
        return '';
    }

    /**
     * Upload a file through BlossomService with state management
     * @returns {Promise<{descriptor: object, needsPrivacyWarning: boolean}>}
     */
    async uploadFile(file) {
        this.validateFile(file);

        const needsPrivacyWarning = blossomService.needsDirectUpload(file);

        appState.setMediaUploading(true);

        try {
            const [descriptor, dim] = await Promise.all([
                blossomService.upload(file, progress => {
                    appState.setMediaUploadProgress(progress);
                }),
                this.getDimensions(file).catch(() => '')
            ]);

            // Attach dimensions to descriptor
            descriptor.dim = dim;

            appState.mediaUploadCompleted(descriptor);
            return { descriptor, needsPrivacyWarning };
        } catch (error) {
            appState.mediaUploadFailed(error.message);
            throw error;
        }
    }
}

export const mediaService = new MediaService();
export { MediaService, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE };
export default mediaService;
