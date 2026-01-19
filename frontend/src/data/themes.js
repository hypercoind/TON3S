/**
 * TON3S Theme Definitions
 * 72 themes with CSS custom property values, organized by category
 */

// Theme categories for grouping in UI
export const themeCategories = [
    { id: 'popular', name: 'Popular' },
    { id: 'dark', name: 'Dark' },
    { id: 'light', name: 'Light' },
    { id: 'highContrast', name: 'High Contrast' }
];

export const themes = [
    // Popular themes
    { class: 'theme-ton3s', name: 'TON3S', full: 'TON3S', category: 'popular' },
    { class: 'theme-catppuccin-mocha', name: 'Catppuccin', full: 'Catppuccin Mocha', category: 'popular' },
    { class: 'theme-dracula', name: 'Dracula', full: 'Dracula', category: 'popular' },
    { class: 'theme-nord', name: 'Nord', full: 'Nord', category: 'popular' },
    { class: 'theme-gruvbox-dark', name: 'Gruvbox', full: 'Gruvbox Dark', category: 'popular' },
    { class: 'theme-tokyo-night', name: 'Tokyo', full: 'Tokyo Night', category: 'popular' },
    { class: 'theme-one-dark', name: 'One Dark', full: 'One Dark', category: 'popular' },
    { class: 'theme-rose-pine', name: 'Rosé Pine', full: 'Rosé Pine', category: 'popular' },

    // Dark themes
    { class: 'theme-catppuccin-macchiato', name: 'Macchiato', full: 'Catppuccin Macchiato', category: 'dark' },
    { class: 'theme-catppuccin-frappe', name: 'Frappe', full: 'Catppuccin Frappe', category: 'dark' },
    { class: 'theme-dracula-soft', name: 'Dracula Soft', full: 'Dracula Soft', category: 'dark' },
    { class: 'theme-gruvbox-material', name: 'Gruvbox Mat', full: 'Gruvbox Material', category: 'dark' },
    { class: 'theme-tokyo-night-storm', name: 'Tokyo Storm', full: 'Tokyo Night Storm', category: 'dark' },
    { class: 'theme-nord-aurora', name: 'Nord Aurora', full: 'Nord Aurora', category: 'dark' },
    { class: 'theme-solarized-dark', name: 'Solarized', full: 'Solarized Dark', category: 'dark' },
    { class: 'theme-monokai', name: 'Monokai', full: 'Monokai', category: 'dark' },
    { class: 'theme-monokai-pro', name: 'Monokai Pro', full: 'Monokai Pro', category: 'dark' },
    { class: 'theme-monokai-ristretto', name: 'Monokai Rist', full: 'Monokai Ristretto', category: 'dark' },
    { class: 'theme-one-dark-pro', name: 'One Dark Pro', full: 'One Dark Pro', category: 'dark' },
    { class: 'theme-ayu-dark', name: 'Ayu', full: 'Ayu Dark', category: 'dark' },
    { class: 'theme-ayu-mirage', name: 'Ayu Mirage', full: 'Ayu Mirage', category: 'dark' },
    { class: 'theme-material-darker', name: 'Material', full: 'Material Darker', category: 'dark' },
    { class: 'theme-material-ocean', name: 'Ocean', full: 'Material Ocean', category: 'dark' },
    { class: 'theme-material-palenight', name: 'Palenight', full: 'Material Palenight', category: 'dark' },
    { class: 'theme-tomorrow-night', name: 'Tomorrow', full: 'Tomorrow Night', category: 'dark' },
    { class: 'theme-tomorrow-night-bright', name: 'Tomorrow+', full: 'Tomorrow Night Bright', category: 'dark' },
    { class: 'theme-tomorrow-night-blue', name: 'Tomorrow Blue', full: 'Tomorrow Night Blue', category: 'dark' },
    { class: 'theme-base16-ocean', name: 'Base16 Ocean', full: 'Base16 Ocean', category: 'dark' },
    { class: 'theme-base16-tomorrow', name: 'Base16', full: 'Base16 Tomorrow', category: 'dark' },
    { class: 'theme-base16-onedark', name: 'Base16 One', full: 'Base16 OneDark', category: 'dark' },
    { class: 'theme-base16-atelier', name: 'Base16 Atel', full: 'Base16 Atelier', category: 'dark' },
    { class: 'theme-zenburn', name: 'Zenburn', full: 'Zenburn', category: 'dark' },
    { class: 'theme-apprentice', name: 'Apprentice', full: 'Apprentice', category: 'dark' },
    { class: 'theme-horizon-dark', name: 'Horizon', full: 'Horizon Dark', category: 'dark' },
    { class: 'theme-synthwave-84', name: 'Synthwave', full: 'Synthwave 84', category: 'dark' },
    { class: 'theme-cyberpunk', name: 'Cyberpunk', full: 'Cyberpunk', category: 'dark' },
    { class: 'theme-night-owl', name: 'Night Owl', full: 'Night Owl', category: 'dark' },
    { class: 'theme-cobalt2', name: 'Cobalt2', full: 'Cobalt2', category: 'dark' },
    { class: 'theme-palenight', name: 'Palenight', full: 'Palenight', category: 'dark' },
    { class: 'theme-everforest-dark', name: 'Everforest', full: 'Everforest Dark', category: 'dark' },
    { class: 'theme-rose-pine-moon', name: 'Pine Moon', full: 'Rosé Pine Moon', category: 'dark' },
    { class: 'theme-kanagawa', name: 'Kanagawa', full: 'Kanagawa', category: 'dark' },
    { class: 'theme-kanagawa-wave', name: 'Kanagawa Wave', full: 'Kanagawa Wave', category: 'dark' },
    { class: 'theme-github-dark', name: 'GitHub Dark', full: 'GitHub Dark', category: 'dark' },
    { class: 'theme-vscode-dark', name: 'VS Dark', full: 'VS Code Dark', category: 'dark' },
    { class: 'theme-atom-one-dark', name: 'Atom One', full: 'Atom One Dark', category: 'dark' },
    { class: 'theme-midnight', name: 'Midnight', full: 'Midnight', category: 'dark' },
    { class: 'theme-forest', name: 'Forest', full: 'Forest', category: 'dark' },
    { class: 'theme-ocean-deep', name: 'Ocean Deep', full: 'Ocean Deep', category: 'dark' },
    { class: 'theme-aurora', name: 'Aurora', full: 'Aurora', category: 'dark' },
    { class: 'theme-neon', name: 'Neon', full: 'Neon', category: 'dark' },

    // Light themes
    { class: 'theme-catppuccin-latte', name: 'Latte', full: 'Catppuccin Latte', category: 'light' },
    { class: 'theme-gruvbox-light', name: 'Gruvbox Lt', full: 'Gruvbox Light', category: 'light' },
    { class: 'theme-tokyo-night-light', name: 'Tokyo Light', full: 'Tokyo Night Light', category: 'light' },
    { class: 'theme-solarized-light', name: 'Solar Lt', full: 'Solarized Light', category: 'light' },
    { class: 'theme-one-light', name: 'One Light', full: 'One Light', category: 'light' },
    { class: 'theme-ayu-light', name: 'Ayu Light', full: 'Ayu Light', category: 'light' },
    { class: 'theme-material-lighter', name: 'Material Lt', full: 'Material Lighter', category: 'light' },
    { class: 'theme-horizon-bright', name: 'Horizon Br', full: 'Horizon Bright', category: 'light' },
    { class: 'theme-light-owl', name: 'Light Owl', full: 'Light Owl', category: 'light' },
    { class: 'theme-everforest-light', name: 'Forest Lt', full: 'Everforest Light', category: 'light' },
    { class: 'theme-rose-pine-dawn', name: 'Pine Dawn', full: 'Rosé Pine Dawn', category: 'light' },
    { class: 'theme-kanagawa-lotus', name: 'Kanagawa Lotus', full: 'Kanagawa Lotus', category: 'light' },
    { class: 'theme-github-light', name: 'GitHub Light', full: 'GitHub Light', category: 'light' },
    { class: 'theme-vscode-light', name: 'VS Light', full: 'VS Code Light', category: 'light' },
    { class: 'theme-atom-one-light', name: 'Atom Light', full: 'Atom One Light', category: 'light' },
    { class: 'theme-paper', name: 'Paper', full: 'Paper', category: 'light' },
    { class: 'theme-sepia', name: 'Sepia', full: 'Sepia', category: 'light' },
    { class: 'theme-sunset', name: 'Sunset', full: 'Sunset', category: 'light' },

    // High contrast themes
    { class: 'theme-high-contrast-dark', name: 'HC Dark', full: 'High Contrast Dark', category: 'highContrast' },
    { class: 'theme-high-contrast-light', name: 'HC Light', full: 'High Contrast Light', category: 'highContrast' }
];

/**
 * Get themes grouped by category
 */
export function getThemesByCategory() {
    return themeCategories.map(cat => ({
        ...cat,
        themes: themes
            .map((theme, index) => ({ ...theme, index }))
            .filter(theme => theme.category === cat.id)
    }));
}

export default themes;
