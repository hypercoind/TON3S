/**
 * TON3S Header Component
 * Logo, theme/font controls, and navigation
 */

import { BaseComponent } from './BaseComponent.js';
import { appState, StateEvents } from '../state/AppState.js';
import { storageService } from '../services/StorageService.js';
import { themes } from '../data/themes.js';
import { fonts } from '../data/fonts.js';

export class Header extends BaseComponent {
    constructor(container) {
        super(container);
    }

    render() {
        this.container.innerHTML = `
            <div class="header">
                <div class="logo">TON3S</div>
                <div class="controls">
                    <button class="btn-icon-circle notes-btn" id="notes-btn" aria-label="Notes" title="Notes">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                    </button>
                    <button class="btn-icon-circle nostr-btn" id="nostr-btn" aria-label="NOSTR" title="NOSTR">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                    </button>
                    <button class="btn-icon-circle font-btn" id="font-btn" aria-label="Rotate font" title="Change font">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9.93 13.5h4.14L12 7.98zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"/>
                        </svg>
                    </button>
                    <button class="btn-icon-circle theme-btn" id="theme-btn" aria-label="Rotate theme" title="Change theme">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10a2.5 2.5 0 002.5-2.5c0-.61-.23-1.21-.64-1.67-.08-.09-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Notes button
        this.$('#notes-btn')?.addEventListener('click', () => {
            if (this.isMobile()) {
                const current = appState.ui.activeMobilePage;
                appState.setActiveMobilePage(current === 'notes' ? 'editor' : 'notes');
            } else {
                appState.toggleSidebar();
            }
        });

        // Nostr button
        this.$('#nostr-btn')?.addEventListener('click', () => {
            if (this.isMobile()) {
                const current = appState.ui.activeMobilePage;
                appState.setActiveMobilePage(current === 'nostr' ? 'editor' : 'nostr');
            } else {
                appState.toggleNostrPanel();
            }
        });

        // Theme rotation button
        this.$('#theme-btn')?.addEventListener('click', () => {
            this.rotateTheme();
        });

        // Font rotation button
        this.$('#font-btn')?.addEventListener('click', () => {
            this.rotateFont();
        });

        // Highlight active button on mobile page change
        this.subscribe(
            appState.on(StateEvents.ACTIVE_PAGE_CHANGED, page => {
                this.$('#notes-btn')?.classList.toggle('active', page === 'notes');
                this.$('#nostr-btn')?.classList.toggle('active', page === 'nostr');
            })
        );
    }

    isMobile() {
        return window.innerWidth <= 1024;
    }

    rotateTheme() {
        const icon = this.$('#theme-btn svg');
        icon?.classList.add('rotating');

        appState.rotateTheme();
        this.applyTheme();
        storageService.saveThemeState();

        setTimeout(() => icon?.classList.remove('rotating'), 500);
    }

    rotateFont() {
        const icon = this.$('#font-btn svg');
        icon?.classList.add('rotating');

        appState.rotateFont();
        this.applyFont();
        storageService.saveFontState();

        setTimeout(() => icon?.classList.remove('rotating'), 500);
    }

    setTheme(index) {
        appState.setTheme(index);
        this.applyTheme();
        storageService.saveThemeState();
    }

    setFont(index) {
        appState.setFont(index);
        this.applyFont();
        storageService.saveFontState();
    }

    applyTheme() {
        const currentTheme = appState.currentTheme;

        // Remove all theme classes
        themes.forEach(theme => {
            document.body.classList.remove(theme.class);
        });

        // Add current theme
        document.body.classList.add(currentTheme.class);
    }

    applyFont() {
        const currentFont = appState.currentFont;

        // Remove all font classes
        fonts.forEach(font => {
            document.body.classList.remove(font.class);
        });

        // Add current font
        document.body.classList.add(currentFont.class);
    }
}

export default Header;
