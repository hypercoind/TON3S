/**
 * TON3S QR Code Service
 * Generates QR codes as inline SVG
 */

import qrcode from 'qrcode-generator';

class QRCodeService {
    /**
     * Generate an SVG QR code
     * @param {string} data - The data to encode
     * @param {number} size - The size of the QR code in pixels
     * @returns {string} - Inline SVG string
     */
    generateSVG(data, size = 200) {
        if (!data) {
            return '';
        }

        // Create QR code with error correction level M (medium)
        const qr = qrcode(0, 'M');
        qr.addData(data);
        qr.make();

        // Get the module count (number of cells)
        const moduleCount = qr.getModuleCount();
        const cellSize = size / moduleCount;

        // Build SVG path for all dark modules
        let path = '';
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    const x = col * cellSize;
                    const y = row * cellSize;
                    path += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}Z`;
                }
            }
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
            <rect width="100%" height="100%" fill="white"/>
            <path d="${path}" fill="black"/>
        </svg>`;
    }
}

// Singleton instance
export const qrCodeService = new QRCodeService();
export default qrCodeService;
