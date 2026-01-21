/**
 * TON3S Favicon Service
 * Dynamic favicon generation based on current theme
 */

import { appState, StateEvents } from '../state/AppState.js';

class FaviconService {
    constructor() {
        this.linkElement = null;
        this.unsubscribe = null;
    }

    /**
     * Initialize the favicon service
     */
    init() {
        // Get or create the favicon link element
        this.linkElement = document.querySelector('link[rel="icon"]');
        if (!this.linkElement) {
            this.linkElement = document.createElement('link');
            this.linkElement.rel = 'icon';
            this.linkElement.type = 'image/svg+xml';
            document.head.appendChild(this.linkElement);
        }

        // Subscribe to theme changes
        // Use requestAnimationFrame to ensure CSS class is applied before reading variables
        this.unsubscribe = appState.on(StateEvents.THEME_CHANGED, () => {
            requestAnimationFrame(() => this.updateFavicon());
        });

        // Update favicon with current theme
        this.updateFavicon();
    }

    /**
     * Get computed CSS variable values from current theme
     */
    getThemeColors() {
        const styles = getComputedStyle(document.body);
        return {
            accent: styles.getPropertyValue('--accent').trim(),
            secondary:
                styles.getPropertyValue('--secondary').trim() ||
                styles.getPropertyValue('--fg-dim').trim(),
            bg: styles.getPropertyValue('--bg').trim(),
            fg: styles.getPropertyValue('--fg').trim()
        };
    }

    /**
     * Adjust color opacity by converting to rgba
     * @param {string} hex - Hex color string
     * @param {number} opacity - Opacity value 0-1
     */
    hexToRgba(hex, opacity) {
        // Remove # if present
        hex = hex.replace('#', '');

        // Handle 3-digit hex
        if (hex.length === 3) {
            hex = hex
                .split('')
                .map(c => c + c)
                .join('');
        }

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    /**
     * Generate SVG string with current theme colors
     * Design: Rounded square with horizontal lines, vertical bar, and decorative circles
     */
    generateSVG() {
        const { accent, secondary } = this.getThemeColors();
        const circleColor = this.hexToRgba(accent, 0.7);

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
  <!-- Rounded square border -->
  <rect x="2" y="2" width="76" height="76" rx="14" stroke="${secondary}" stroke-width="2" fill="none"/>
  <!-- Horizontal lines -->
  <rect x="10" y="26" width="60" height="1" rx="0.5" fill="${accent}"/>
  <rect x="10" y="38" width="60" height="1" rx="0.5" fill="${secondary}"/>
  <rect x="10" y="50" width="60" height="1" rx="0.5" fill="${secondary}"/>
  <!-- Vertical bar -->
  <rect x="21" y="26" width="3" height="30" rx="1.5" fill="${accent}"/>
  <!-- Decorative circles -->
  <circle cx="48" cy="26" r="4" fill="${circleColor}"/>
  <circle cx="56" cy="38" r="4" fill="${circleColor}"/>
  <circle cx="48" cy="50" r="4" fill="${circleColor}"/>
</svg>`;
    }

    /**
     * Convert SVG to data URI and apply to favicon
     */
    updateFavicon() {
        if (!this.linkElement) {
            return;
        }

        const svg = this.generateSVG();
        const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        this.linkElement.href = dataUri;
    }

    /**
     * Cleanup subscriptions
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}

// Singleton instance
export const faviconService = new FaviconService();
export default faviconService;
