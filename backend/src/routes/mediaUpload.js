/**
 * TON3S Media Upload Proxy Route
 * Proxies file uploads to Blossom servers for IP privacy
 */

import https from 'node:https';
import { validateHttpsUrl, sanitizeErrorMessage } from '../utils/ssrf.js';

// Max file size through proxy: 10MB + multipart overhead
const MAX_FILE_SIZE = 11 * 1024 * 1024;

// Upstream request timeout
const UPSTREAM_TIMEOUT_MS = 60000;

/**
 * Build pinned request options to prevent DNS rebinding between validation and upload.
 */
export function buildPinnedUploadRequestOptions({
    parsedUrl,
    resolvedIP,
    authorization,
    mimetype,
    contentLength
}) {
    const normalizedBasePath =
        parsedUrl.pathname === '/' ? '' : parsedUrl.pathname.replace(/\/$/, '');
    const uploadPath = `${normalizedBasePath}/upload${parsedUrl.search || ''}`;

    return {
        protocol: 'https:',
        host: resolvedIP,
        port: parsedUrl.port ? Number(parsedUrl.port) : 443,
        method: 'PUT',
        path: uploadPath,
        servername: parsedUrl.hostname,
        headers: {
            Host: parsedUrl.host,
            Authorization: authorization,
            'Content-Type': mimetype || 'application/octet-stream',
            'Content-Length': String(contentLength)
        }
    };
}

/**
 * Upload to Blossom using a pinned IP connection while preserving hostname TLS validation.
 */
export function uploadToPinnedBlossom({
    requestOptions,
    fileBuffer,
    timeoutMs = UPSTREAM_TIMEOUT_MS,
    requestImpl = https.request
}) {
    return new Promise((resolve, reject) => {
        const request = requestImpl(requestOptions, response => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => {
                resolve({
                    statusCode: response.statusCode || 502,
                    responseText: Buffer.concat(chunks).toString('utf8')
                });
            });
        });

        request.on('error', error => reject(error));
        request.setTimeout(timeoutMs, () => {
            request.destroy(new Error('UPSTREAM_TIMEOUT'));
        });
        request.write(fileBuffer);
        request.end();
    });
}

/**
 * Register media upload routes on a Fastify instance
 */
export async function mediaUploadRoutes(fastify) {
    fastify.post('/api/media/upload', async (request, reply) => {
        let parts;
        try {
            parts = await request.file();
        } catch (err) {
            return reply.status(400).send({ error: 'Invalid multipart request' });
        }

        if (!parts) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Collect fields from multipart stream
        const file = parts;
        const fields = {};

        // @fastify/multipart puts non-file fields on file.fields
        for (const [key, field] of Object.entries(file.fields || {})) {
            if (field && field.value !== undefined) {
                fields[key] = field.value;
            }
        }

        const blossomServer = fields.blossomServer;
        const authorization = fields.authorization;

        if (!blossomServer) {
            return reply.status(400).send({ error: 'Missing blossomServer field' });
        }

        if (!authorization) {
            return reply.status(400).send({ error: 'Missing authorization field' });
        }

        // SSRF validation on blossom server URL
        let parsedUrl;
        let resolvedIP;
        try {
            ({ parsed: parsedUrl, resolvedIP } = await validateHttpsUrl(blossomServer));
        } catch (error) {
            return reply.status(400).send({
                error: `Invalid Blossom server: ${sanitizeErrorMessage(error)}`
            });
        }

        // Read file into buffer
        const chunks = [];
        let totalSize = 0;
        for await (const chunk of file.file) {
            totalSize += chunk.length;
            if (totalSize > MAX_FILE_SIZE) {
                return reply.status(413).send({ error: 'File too large for proxy (max 10MB)' });
            }
            chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        try {
            const requestOptions = buildPinnedUploadRequestOptions({
                parsedUrl,
                resolvedIP,
                authorization,
                mimetype: file.mimetype,
                contentLength: fileBuffer.length
            });
            const { statusCode, responseText } = await uploadToPinnedBlossom({
                requestOptions,
                fileBuffer
            });

            if (statusCode < 200 || statusCode >= 300) {
                let msg = 'Blossom server error';
                try {
                    const body = JSON.parse(responseText);
                    msg = body.message || body.error || msg;
                } catch {
                    /* ignore */
                }
                return reply.status(statusCode >= 500 ? 502 : statusCode).send({
                    error: msg
                });
            }

            // Parse and return blob descriptor
            let descriptor;
            try {
                descriptor = JSON.parse(responseText);
            } catch {
                return reply.status(502).send({ error: 'Invalid response from Blossom server' });
            }

            return reply.send(descriptor);
        } catch (error) {
            if (error.message === 'UPSTREAM_TIMEOUT') {
                return reply.status(504).send({ error: 'Blossom server timeout' });
            }
            fastify.log.error('Media upload proxy error:', error);
            return reply.status(502).send({
                error: sanitizeErrorMessage(error)
            });
        }
    });
}

export default mediaUploadRoutes;
