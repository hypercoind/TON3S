const themes = [
    { class: 'theme-catppuccin-mocha', name: 'Catppuccin', full: 'Catppuccin Mocha' },
    { class: 'theme-catppuccin-macchiato', name: 'Macchiato', full: 'Catppuccin Macchiato' },
    { class: 'theme-catppuccin-frappe', name: 'Frappe', full: 'Catppuccin Frappe' },
    { class: 'theme-dracula', name: 'Dracula', full: 'Dracula' },
    { class: 'theme-gruvbox-dark', name: 'Gruvbox', full: 'Gruvbox Dark' },
    { class: 'theme-gruvbox-light', name: 'Gruvbox Lt', full: 'Gruvbox Light' },
    { class: 'theme-tokyo-night', name: 'Tokyo', full: 'Tokyo Night' },
    { class: 'theme-tokyo-night-storm', name: 'Tokyo Storm', full: 'Tokyo Night Storm' },
    { class: 'theme-nord', name: 'Nord', full: 'Nord' },
    { class: 'theme-solarized-dark', name: 'Solarized', full: 'Solarized Dark' },
    { class: 'theme-solarized-light', name: 'Solar Lt', full: 'Solarized Light' },
    { class: 'theme-monokai', name: 'Monokai', full: 'Monokai' },
    { class: 'theme-monokai-pro', name: 'Monokai Pro', full: 'Monokai Pro' },
    { class: 'theme-one-dark', name: 'One Dark', full: 'One Dark' },
    { class: 'theme-one-light', name: 'One Light', full: 'One Light' },
    { class: 'theme-ayu-dark', name: 'Ayu', full: 'Ayu Dark' },
    { class: 'theme-ayu-mirage', name: 'Ayu Mirage', full: 'Ayu Mirage' },
    { class: 'theme-ayu-light', name: 'Ayu Light', full: 'Ayu Light' },
    { class: 'theme-material-darker', name: 'Material', full: 'Material Darker' },
    { class: 'theme-material-ocean', name: 'Ocean', full: 'Material Ocean' },
    { class: 'theme-material-palenight', name: 'Palenight', full: 'Material Palenight' },
    { class: 'theme-tomorrow-night', name: 'Tomorrow', full: 'Tomorrow Night' },
    { class: 'theme-tomorrow-night-bright', name: 'Tomorrow+', full: 'Tomorrow Night Bright' },
    { class: 'theme-base16-ocean', name: 'Base16 Ocean', full: 'Base16 Ocean' },
    { class: 'theme-base16-tomorrow', name: 'Base16', full: 'Base16 Tomorrow' },
    { class: 'theme-zenburn', name: 'Zenburn', full: 'Zenburn' },
    { class: 'theme-apprentice', name: 'Apprentice', full: 'Apprentice' },
    { class: 'theme-horizon-dark', name: 'Horizon', full: 'Horizon Dark' },
    { class: 'theme-synthwave-84', name: 'Synthwave', full: 'Synthwave 84' },
    { class: 'theme-night-owl', name: 'Night Owl', full: 'Night Owl' },
    { class: 'theme-cobalt2', name: 'Cobalt2', full: 'Cobalt2' },
    { class: 'theme-palenight', name: 'Palenight', full: 'Palenight' },
    { class: 'theme-everforest-dark', name: 'Everforest', full: 'Everforest Dark' },
    { class: 'theme-everforest-light', name: 'Forest Lt', full: 'Everforest Light' },
    { class: 'theme-rose-pine', name: 'Rosé Pine', full: 'Rosé Pine' },
    { class: 'theme-rose-pine-moon', name: 'Pine Moon', full: 'Rosé Pine Moon' },
    { class: 'theme-rose-pine-dawn', name: 'Pine Dawn', full: 'Rosé Pine Dawn' }
];

const fonts = [
    { class: 'font-jetbrains', name: 'JetBrains', full: 'JetBrains Mono' },
    { class: 'font-fira', name: 'Fira Code', full: 'Fira Code' },
    { class: 'font-source', name: 'Source Code', full: 'Source Code Pro' },
    { class: 'font-ibm', name: 'IBM Plex', full: 'IBM Plex Mono' },
    { class: 'font-roboto', name: 'Roboto', full: 'Roboto Mono' },
    { class: 'font-space', name: 'Space', full: 'Space Mono' },
    { class: 'font-ubuntu', name: 'Ubuntu', full: 'Ubuntu Mono' },
    { class: 'font-inconsolata', name: 'Inconsolata', full: 'Inconsolata' },
    { class: 'font-cousine', name: 'Cousine', full: 'Cousine' },
    { class: 'font-anonymous', name: 'Anonymous', full: 'Anonymous Pro' },
    { class: 'font-overpass', name: 'Overpass', full: 'Overpass Mono' },
    { class: 'font-redhat', name: 'Red Hat', full: 'Red Hat Mono' },
    { class: 'font-monaco', name: 'Monaco', full: 'Monaco' },
    { class: 'font-menlo', name: 'Menlo', full: 'Menlo' },
    { class: 'font-consolas', name: 'Consolas', full: 'Consolas' }
];

let currentThemeIndex = 0;
let currentFontIndex = 0;
const editor = document.querySelector('.editor');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const themeNameBtn = document.getElementById('theme-name');
const fontNameBtn = document.getElementById('font-name');
const currentThemeIndicator = document.getElementById('current-theme');
const currentFontIndicator = document.getElementById('current-font');
const themeBtn = document.querySelector('.theme-btn');
const fontBtn = document.querySelector('.font-btn');

// Load saved content, theme, and font
window.addEventListener('load', () => {
    // Use in-memory storage for Claude.ai environment
    const savedContent = window.savedContent || '';
    const savedThemeIndex = window.savedThemeIndex || 0;
    const savedFontIndex = window.savedFontIndex || 0;
    
    if (savedContent) {
        editor.value = savedContent;
        updateCounts();
    }
    
    currentThemeIndex = parseInt(savedThemeIndex);
    applyTheme();
    
    currentFontIndex = parseInt(savedFontIndex);
    applyFont();
});

// Auto-save content
editor.addEventListener('input', () => {
    window.savedContent = editor.value;
    updateCounts();
});

// Update character and word counts
function updateCounts() {
    const text = editor.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

// Rotate through themes
function rotateTheme() {
    const icon = themeBtn.querySelector('svg');
    icon.classList.add('rotating');
    
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme();
    
    window.savedThemeIndex = currentThemeIndex;
    
    setTimeout(() => {
        icon.classList.remove('rotating');
    }, 500);
}

// Rotate through fonts
function rotateFont() {
    const icon = fontBtn.querySelector('svg');
    icon.classList.add('pulsing');
    
    currentFontIndex = (currentFontIndex + 1) % fonts.length;
    applyFont();
    
    window.savedFontIndex = currentFontIndex;
    
    setTimeout(() => {
        icon.classList.remove('pulsing');
    }, 500);
}

// Apply the current theme
function applyTheme() {
    const body = document.body;
    const currentTheme = themes[currentThemeIndex];
    
    // Remove all theme classes
    themes.forEach(theme => {
        body.classList.remove(theme.class);
    });
    
    // Add current theme class
    body.classList.add(currentTheme.class);
    
    // Update UI text
    themeNameBtn.textContent = currentTheme.name;
    currentThemeIndicator.textContent = currentTheme.full;
}

// Apply the current font
function applyFont() {
    const body = document.body;
    const currentFont = fonts[currentFontIndex];
    
    // Remove all font classes
    fonts.forEach(font => {
        body.classList.remove(font.class);
    });
    
    // Add current font class
    body.classList.add(currentFont.class);
    
    // Update UI text
    fontNameBtn.textContent = currentFont.name;
    currentFontIndicator.textContent = currentFont.full;
}

// Initialize on page load
updateCounts();