#!/usr/bin/env node
/**
 * Generate PWA icons from SVG source
 * Run: npm run generate-icons
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Catppuccin Mocha theme colors
const colors = {
    accent: '#89b4fa',
    secondary: '#6c7086',
    circleColor: 'rgba(137, 180, 250, 0.7)'
};

/**
 * Generate SVG content for a given size
 * Design: Rounded square with horizontal lines, vertical bar, and decorative circles
 */
function generateSVG(size) {
    const scale = size / 80;
    const s = (v) => Math.round(v * scale);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">
  <!-- TON3S PWA Icon - Catppuccin Mocha Theme -->
  <!-- Rounded square border -->
  <rect x="${s(2)}" y="${s(2)}" width="${s(76)}" height="${s(76)}" rx="${s(14)}" stroke="${colors.secondary}" stroke-width="${s(2)}" fill="none"/>
  <!-- Horizontal lines -->
  <rect x="${s(10)}" y="${s(26)}" width="${s(60)}" height="${s(1)}" rx="${s(0.5)}" fill="${colors.accent}"/>
  <rect x="${s(10)}" y="${s(38)}" width="${s(60)}" height="${s(1)}" rx="${s(0.5)}" fill="${colors.secondary}"/>
  <rect x="${s(10)}" y="${s(50)}" width="${s(60)}" height="${s(1)}" rx="${s(0.5)}" fill="${colors.secondary}"/>
  <!-- Vertical bar -->
  <rect x="${s(21)}" y="${s(26)}" width="${s(3)}" height="${s(30)}" rx="${s(1.5)}" fill="${colors.accent}"/>
  <!-- Decorative circles -->
  <circle cx="${s(48)}" cy="${s(26)}" r="${s(4)}" fill="${colors.circleColor}"/>
  <circle cx="${s(56)}" cy="${s(38)}" r="${s(4)}" fill="${colors.circleColor}"/>
  <circle cx="${s(48)}" cy="${s(50)}" r="${s(4)}" fill="${colors.circleColor}"/>
</svg>`;
}

// Check if sharp is available
async function main() {
    let sharp;
    try {
        sharp = (await import('sharp')).default;
    } catch (e) {
        console.log('Sharp not installed. Generating SVG files only.');
        console.log('To generate PNG files, install sharp: npm install -D sharp');
        console.log('');

        // Generate SVG files as fallback
        const sizes = [192, 512, 180];
        const names = ['pwa-192x192.svg', 'pwa-512x512.svg', 'apple-touch-icon.svg'];

        for (let i = 0; i < sizes.length; i++) {
            const svg = generateSVG(sizes[i]);
            const path = join(publicDir, names[i]);
            writeFileSync(path, svg);
            console.log(`Generated: ${names[i]}`);
        }

        console.log('');
        console.log('SVG files generated. Convert to PNG using:');
        console.log('- Inkscape: inkscape -w 512 -h 512 icon.svg -o icon.png');
        console.log('- rsvg-convert: rsvg-convert -w 512 -h 512 icon.svg > icon.png');
        console.log('- Online tools: cloudconvert.com, convertio.co');
        return;
    }

    // Generate PNG files with sharp
    const icons = [
        { name: 'pwa-192x192.png', size: 192 },
        { name: 'pwa-512x512.png', size: 512 },
        { name: 'apple-touch-icon.png', size: 180 }
    ];

    console.log('Generating PWA icons...');

    for (const icon of icons) {
        const svg = generateSVG(icon.size);
        const pngBuffer = await sharp(Buffer.from(svg))
            .png()
            .toBuffer();

        const outputPath = join(publicDir, icon.name);
        writeFileSync(outputPath, pngBuffer);
        console.log(`Generated: ${icon.name} (${icon.size}x${icon.size})`);
    }

    console.log('Done!');
}

main().catch(console.error);
