/**
 * TON3S Media Upload Proxy Route
 * Proxies file uploads to Blossom servers for IP privacy
 */

import { validateHttpsUrl, sanitizeErrorMessage } from '../utils/ssrf.js';

// Max file size through proxy: 10MB + multipart overhead
const MAX_FILE_SIZE = 11 * 1024 * 1024;

// Upstream request timeout
const UPSTREAM_TIMEOUT_MS = 60000;

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
        try {
            await validateHttpsUrl(blossomServer);
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

        // Forward to Blossom server
        const uploadUrl = `${blossomServer.replace(/\/$/, '')}/upload`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

        try {
            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    Authorization: authorization,
                    'Content-Type': file.mimetype || 'application/octet-stream',
                    'Content-Length': String(fileBuffer.length)
                },
                body: fileBuffer,
                signal: controller.signal
            });

            clearTimeout(timeout);

            const responseText = await response.text();

            if (!response.ok) {
                let msg = 'Blossom server error';
                try {
                    const body = JSON.parse(responseText);
                    msg = body.message || body.error || msg;
                } catch {
                    /* ignore */
                }
                return reply.status(response.status >= 500 ? 502 : response.status).send({
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
            clearTimeout(timeout);
            if (error.name === 'AbortError') {
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
