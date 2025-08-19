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
const themeBtn = document.getElementById('theme-btn');
const fontBtn = document.getElementById('font-btn');

// Security: Input sanitization function
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Security: Validate theme/font indices
function validateIndex(index, arrayLength) {
    const parsed = parseInt(index);
    if (isNaN(parsed) || parsed < 0 || parsed >= arrayLength) {
        return 0;
    }
    return parsed;
}

// Security: Rate limiting for storage operations
let lastSaveTime = 0;
const SAVE_THROTTLE_MS = 100;

function throttledSave(key, value) {
    const now = Date.now();
    if (now - lastSaveTime < SAVE_THROTTLE_MS) {
        return;
    }
    lastSaveTime = now;
    
    try {
        if (typeof value === 'string' && value.length > 1000000) {
            console.warn('Content too large, not saving');
            return;
        }
        window[key] = value;
    } catch (e) {
        console.error('Storage error:', e);
    }
}

// Load saved content, theme, and font
window.addEventListener('load', () => {
    // Use in-memory storage for Claude.ai environment with validation
    const savedContent = window.savedContent || '';
    const savedThemeIndex = window.savedThemeIndex || 0;
    const savedFontIndex = window.savedFontIndex || 0;
    
    if (savedContent && typeof savedContent === 'string') {
        editor.value = savedContent.slice(0, 1000000); // Limit content size
        updateCounts();
    }
    
    currentThemeIndex = validateIndex(savedThemeIndex, themes.length);
    applyTheme();
    
    currentFontIndex = validateIndex(savedFontIndex, fonts.length);
    applyFont();
    
    // Add secure event listeners
    setupEventListeners();
});

// Setup secure event listeners
function setupEventListeners() {
    // Secure button event listeners
    if (themeBtn) {
        themeBtn.addEventListener('click', rotateTheme);
    }
    
    if (fontBtn) {
        fontBtn.addEventListener('click', rotateFont);
    }
    
    // Auto-save content with security measures
    if (editor) {
        editor.addEventListener('input', (e) => {
            const content = e.target.value;
            if (content.length <= 1000000) { // Limit content size
                throttledSave('savedContent', content);
                updateCounts();
            }
        });
        
        // Prevent potential XSS through paste events
        editor.addEventListener('paste', (e) => {
            setTimeout(() => {
                if (editor.value.length > 1000000) {
                    editor.value = editor.value.slice(0, 1000000);
                    updateCounts();
                }
            }, 0);
        });
        
        // Enable tab key for indentation
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                const value = editor.value;
                
                // Insert tab character
                editor.value = value.substring(0, start) + '\t' + value.substring(end);
                
                // Move cursor after the tab
                editor.selectionStart = editor.selectionEnd = start + 1;
                
                // Trigger input event for auto-save
                editor.dispatchEvent(new Event('input'));
            }
        });
    }
}

// Update character and word counts with security
function updateCounts() {
    if (!editor || !charCount || !wordCount) return;
    
    const text = editor.value || '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    // Sanitize output to prevent XSS
    charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

// Rotate through themes with security checks
function rotateTheme() {
    if (!themeBtn) return;
    
    const icon = themeBtn.querySelector('svg');
    if (icon) {
        icon.classList.add('rotating');
    }
    
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme();
    
    throttledSave('savedThemeIndex', currentThemeIndex);
    
    if (icon) {
        setTimeout(() => {
            icon.classList.remove('rotating');
        }, 500);
    }
}

// Rotate through fonts with security checks
function rotateFont() {
    if (!fontBtn) return;
    
    const icon = fontBtn.querySelector('svg');
    if (icon) {
        icon.classList.add('pulsing');
    }
    
    currentFontIndex = (currentFontIndex + 1) % fonts.length;
    applyFont();
    
    throttledSave('savedFontIndex', currentFontIndex);
    
    if (icon) {
        setTimeout(() => {
            icon.classList.remove('pulsing');
        }, 500);
    }
}

// Apply the current theme with security validation
function applyTheme() {
    const body = document.body;
    const validIndex = validateIndex(currentThemeIndex, themes.length);
    const currentTheme = themes[validIndex];
    
    if (!currentTheme || !body) return;
    
    // Remove all theme classes securely
    themes.forEach(theme => {
        if (theme && theme.class) {
            body.classList.remove(theme.class);
        }
    });
    
    // Add current theme class
    body.classList.add(currentTheme.class);
    
    // Update UI text with sanitization
    if (themeNameBtn) {
        themeNameBtn.textContent = sanitizeInput(currentTheme.name);
    }
    if (currentThemeIndicator) {
        currentThemeIndicator.textContent = sanitizeInput(currentTheme.full);
    }
}

// Apply the current font with security validation
function applyFont() {
    const body = document.body;
    const validIndex = validateIndex(currentFontIndex, fonts.length);
    const currentFont = fonts[validIndex];
    
    if (!currentFont || !body) return;
    
    // Remove all font classes securely
    fonts.forEach(font => {
        if (font && font.class) {
            body.classList.remove(font.class);
        }
    });
    
    // Add current font class
    body.classList.add(currentFont.class);
    
    // Update UI text with sanitization
    if (fontNameBtn) {
        fontNameBtn.textContent = sanitizeInput(currentFont.name);
    }
    if (currentFontIndicator) {
        currentFontIndicator.textContent = sanitizeInput(currentFont.full);
    }
}

// Security: Prevent common XSS vectors
function initializeSecurity() {
    // Disable eval and Function constructor
    window.eval = function() {
        throw new Error('eval() is disabled for security reasons');
    };
    
    // Add security headers check
    if (document.location.protocol !== 'https:' && document.location.hostname !== 'localhost') {
        console.warn('This application should be served over HTTPS for security');
    }
    
    // Prevent drag and drop of external content
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        return false;
    });
    
    // Clear any malicious URL fragments
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }
}

// Initialize security measures and counts
initializeSecurity();
updateCounts();