/**
 * TON3S Header Component
 * Logo, theme/font controls, and navigation
 */

import { BaseComponent } from './BaseComponent.js';
import { appState, StateEvents } from '../state/AppState.js';
import { storageService } from '../services/StorageService.js';
import { themes, getThemesByCategory } from '../data/themes.js';
import { fonts } from '../data/fonts.js';
import { sanitizeInput } from '../utils/sanitizer.js';

export class Header extends BaseComponent {
    constructor(container) {
        super(container);
        this.activeDropdown = null;
        this.focusedIndex = -1;
    }

    /**
     * Render themes grouped by category
     */
    renderGroupedThemes() {
        const grouped = getThemesByCategory();
        return grouped
            .map(
                category => `
            <div class="dropdown-category" role="group" aria-label="${sanitizeInput(category.name)}">
                <div class="dropdown-category-header">${sanitizeInput(category.name)}</div>
                ${category.themes
                    .map(
                        theme =>
                            `<div class="dropdown-item" role="option" tabindex="-1" data-index="${theme.index}">${sanitizeInput(theme.full)}</div>`
                    )
                    .join('')}
            </div>
        `
            )
            .join('');
    }

    render() {
        const currentTheme = appState.currentTheme;
        const currentFont = appState.currentFont;

        this.container.innerHTML = `
            <div class="header">
                <div class="logo">TON3S</div>
                <div class="controls">
                    <div class="btn-wrapper">
                        <button class="btn font-btn" id="font-btn" aria-label="Change font">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 7V9H7L8.5 16H6.5L6 18H12L11.5 16H9.5L11 9H15V7H3ZM13 7V9H17V11H15V13H17V15C17 15.5304 16.7893 16.0391 16.4142 16.4142C16.0391 16.7893 15.5304 17 15 17H13V19H15C16.0609 19 17.0783 18.5786 17.8284 17.8284C18.5786 17.0783 19 16.0609 19 15V13C19 12.4696 18.7893 11.9609 18.4142 11.5858C18.0391 11.2107 17.5304 11 17 11C17.5304 11 18.0391 10.7893 18.4142 10.4142C18.7893 10.0391 19 9.53043 19 9V7H13Z"/>
                            </svg>
                            <span id="font-name">${sanitizeInput(currentFont.name)}</span>
                        </button>
                        <button class="btn-dropdown" id="font-dropdown" aria-label="Show all fonts" aria-haspopup="listbox" aria-expanded="false">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                            </svg>
                        </button>
                        <div class="dropdown-menu" id="font-dropdown-menu" role="listbox" aria-label="Font selection">
                            ${fonts
                                .map(
                                    (font, index) =>
                                        `<div class="dropdown-item" role="option" tabindex="-1" data-index="${index}">${sanitizeInput(font.full)}</div>`
                                )
                                .join('')}
                        </div>
                    </div>
                    <div class="btn-wrapper">
                        <button class="btn theme-btn" id="theme-btn" aria-label="Change theme">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.591a.75.75 0 101.06 1.06l1.591-1.591zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.591-1.591a.75.75 0 10-1.06 1.06l1.591-1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.591a.75.75 0 001.06 1.06l1.591-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06L6.166 5.106a.75.75 0 00-1.06 1.06l1.591 1.591z"/>
                            </svg>
                            <span id="theme-name">${sanitizeInput(currentTheme.name)}</span>
                        </button>
                        <button class="btn-dropdown" id="theme-dropdown" aria-label="Show all themes" aria-haspopup="listbox" aria-expanded="false">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                            </svg>
                        </button>
                        <div class="dropdown-menu" id="theme-dropdown-menu" role="listbox" aria-label="Theme selection">
                            ${this.renderGroupedThemes()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Theme rotation button
        this.$('#theme-btn')?.addEventListener('click', () => {
            this.rotateTheme();
        });

        // Font rotation button
        this.$('#font-btn')?.addEventListener('click', () => {
            this.rotateFont();
        });

        // Theme dropdown toggle
        const themeDropdownBtn = this.$('#theme-dropdown');
        themeDropdownBtn?.addEventListener('click', e => {
            e.stopPropagation();
            this.toggleDropdown('theme-dropdown-menu', themeDropdownBtn);
        });
        themeDropdownBtn?.addEventListener('keydown', e => {
            this.handleDropdownButtonKeydown(e, 'theme-dropdown-menu', themeDropdownBtn);
        });

        // Font dropdown toggle
        const fontDropdownBtn = this.$('#font-dropdown');
        fontDropdownBtn?.addEventListener('click', e => {
            e.stopPropagation();
            this.toggleDropdown('font-dropdown-menu', fontDropdownBtn);
        });
        fontDropdownBtn?.addEventListener('keydown', e => {
            this.handleDropdownButtonKeydown(e, 'font-dropdown-menu', fontDropdownBtn);
        });

        // Theme dropdown items and keyboard navigation
        const themeMenu = this.$('#theme-dropdown-menu');
        themeMenu?.addEventListener('click', e => {
            if (e.target.classList.contains('dropdown-item')) {
                const index = parseInt(e.target.dataset.index);
                this.setTheme(index);
                this.closeDropdown('theme-dropdown-menu');
                themeDropdownBtn?.focus();
            }
        });
        themeMenu?.addEventListener('keydown', e => {
            this.handleDropdownKeydown(e, 'theme-dropdown-menu', themeDropdownBtn, index =>
                this.setTheme(index)
            );
        });

        // Font dropdown items and keyboard navigation
        const fontMenu = this.$('#font-dropdown-menu');
        fontMenu?.addEventListener('click', e => {
            if (e.target.classList.contains('dropdown-item')) {
                const index = parseInt(e.target.dataset.index);
                this.setFont(index);
                this.closeDropdown('font-dropdown-menu');
                fontDropdownBtn?.focus();
            }
        });
        fontMenu?.addEventListener('keydown', e => {
            this.handleDropdownKeydown(e, 'font-dropdown-menu', fontDropdownBtn, index =>
                this.setFont(index)
            );
        });

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });

        // State subscriptions
        this.subscribe(appState.on(StateEvents.THEME_CHANGED, this.updateThemeDisplay.bind(this)));
        this.subscribe(appState.on(StateEvents.FONT_CHANGED, this.updateFontDisplay.bind(this)));
        // Close dropdowns before zen mode transition starts
        this.subscribe(appState.on(StateEvents.PRE_ZEN_MODE, this.closeAllDropdowns.bind(this)));
    }

    /**
     * Handle keydown on dropdown toggle button
     */
    handleDropdownButtonKeydown(e, menuId, button) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.toggleDropdown(menuId, button);
            // Focus first item when opening with keyboard
            const menu = document.getElementById(menuId);
            if (menu?.classList.contains('show')) {
                const items = menu.querySelectorAll('.dropdown-item');
                if (items.length > 0) {
                    this.focusedIndex = 0;
                    items[0].focus();
                }
            }
        }
    }

    /**
     * Handle keydown within dropdown menu
     */
    handleDropdownKeydown(e, menuId, button, onSelect) {
        const menu = document.getElementById(menuId);
        if (!menu) {
            return;
        }

        const items = menu.querySelectorAll('.dropdown-item');
        if (items.length === 0) {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusedIndex = Math.min(this.focusedIndex + 1, items.length - 1);
                items[this.focusedIndex].focus();
                // Scroll item into view
                items[this.focusedIndex].scrollIntoView({ block: 'nearest' });
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
                items[this.focusedIndex].focus();
                items[this.focusedIndex].scrollIntoView({ block: 'nearest' });
                break;

            case 'Home':
                e.preventDefault();
                this.focusedIndex = 0;
                items[0].focus();
                items[0].scrollIntoView({ block: 'nearest' });
                break;

            case 'End':
                e.preventDefault();
                this.focusedIndex = items.length - 1;
                items[this.focusedIndex].focus();
                items[this.focusedIndex].scrollIntoView({ block: 'nearest' });
                break;

            case 'Enter':
            case ' ': {
                e.preventDefault();
                const focusedItem = items[this.focusedIndex];
                if (focusedItem) {
                    const index = parseInt(focusedItem.dataset.index);
                    onSelect(index);
                    this.closeDropdown(menuId);
                    button?.focus();
                }
                break;
            }

            case 'Escape':
                e.preventDefault();
                this.closeDropdown(menuId);
                button?.focus();
                break;

            case 'Tab':
                // Close dropdown and allow normal tab behavior
                this.closeDropdown(menuId);
                break;
        }
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
        icon?.classList.add('pulsing');

        appState.rotateFont();
        this.applyFont();
        storageService.saveFontState();

        setTimeout(() => icon?.classList.remove('pulsing'), 500);
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

    updateThemeDisplay(theme) {
        const nameEl = this.$('#theme-name');
        if (nameEl) {
            nameEl.textContent = theme.name;
        }
    }

    updateFontDisplay(font) {
        const nameEl = this.$('#font-name');
        if (nameEl) {
            nameEl.textContent = font.name;
        }
    }

    toggleDropdown(menuId, button) {
        const menu = document.getElementById(menuId);
        if (!menu) {
            return;
        }

        const isOpening = !menu.classList.contains('show');

        // Close other dropdowns
        this.$$('.dropdown-menu').forEach(dropdown => {
            if (dropdown.id !== menuId) {
                dropdown.classList.remove('show');
            }
        });
        // Update aria-expanded for all dropdown buttons
        this.$$('.btn-dropdown').forEach(btn => {
            if (btn !== button) {
                btn.setAttribute('aria-expanded', 'false');
            }
        });

        menu.classList.toggle('show');
        button?.setAttribute('aria-expanded', isOpening ? 'true' : 'false');

        // Reset focused index when opening
        if (isOpening) {
            this.focusedIndex = -1;
            this.activeDropdown = menuId;
        } else {
            this.activeDropdown = null;
        }
    }

    closeDropdown(menuId) {
        const menu = document.getElementById(menuId);
        menu?.classList.remove('show');

        // Update aria-expanded
        const button =
            menuId === 'theme-dropdown-menu' ? this.$('#theme-dropdown') : this.$('#font-dropdown');
        button?.setAttribute('aria-expanded', 'false');

        this.activeDropdown = null;
        this.focusedIndex = -1;
    }

    closeAllDropdowns() {
        this.$$('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
        this.$$('.btn-dropdown').forEach(btn => {
            btn.setAttribute('aria-expanded', 'false');
        });
        this.activeDropdown = null;
        this.focusedIndex = -1;
    }
}

export default Header;
