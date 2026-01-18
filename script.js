const themes = [
    { class: 'theme-ton3s', name: 'TON3S', full: 'TON3S' },
    { class: 'theme-catppuccin-mocha', name: 'Catppuccin', full: 'Catppuccin Mocha' },
    { class: 'theme-catppuccin-macchiato', name: 'Macchiato', full: 'Catppuccin Macchiato' },
    { class: 'theme-catppuccin-frappe', name: 'Frappe', full: 'Catppuccin Frappe' },
    { class: 'theme-catppuccin-latte', name: 'Latte', full: 'Catppuccin Latte' },
    { class: 'theme-dracula', name: 'Dracula', full: 'Dracula' },
    { class: 'theme-dracula-soft', name: 'Dracula Soft', full: 'Dracula Soft' },
    { class: 'theme-gruvbox-dark', name: 'Gruvbox', full: 'Gruvbox Dark' },
    { class: 'theme-gruvbox-light', name: 'Gruvbox Lt', full: 'Gruvbox Light' },
    { class: 'theme-gruvbox-material', name: 'Gruvbox Mat', full: 'Gruvbox Material' },
    { class: 'theme-tokyo-night', name: 'Tokyo', full: 'Tokyo Night' },
    { class: 'theme-tokyo-night-storm', name: 'Tokyo Storm', full: 'Tokyo Night Storm' },
    { class: 'theme-tokyo-night-light', name: 'Tokyo Light', full: 'Tokyo Night Light' },
    { class: 'theme-nord', name: 'Nord', full: 'Nord' },
    { class: 'theme-nord-aurora', name: 'Nord Aurora', full: 'Nord Aurora' },
    { class: 'theme-solarized-dark', name: 'Solarized', full: 'Solarized Dark' },
    { class: 'theme-solarized-light', name: 'Solar Lt', full: 'Solarized Light' },
    { class: 'theme-monokai', name: 'Monokai', full: 'Monokai' },
    { class: 'theme-monokai-pro', name: 'Monokai Pro', full: 'Monokai Pro' },
    { class: 'theme-monokai-ristretto', name: 'Monokai Rist', full: 'Monokai Ristretto' },
    { class: 'theme-one-dark', name: 'One Dark', full: 'One Dark' },
    { class: 'theme-one-light', name: 'One Light', full: 'One Light' },
    { class: 'theme-one-dark-pro', name: 'One Dark Pro', full: 'One Dark Pro' },
    { class: 'theme-ayu-dark', name: 'Ayu', full: 'Ayu Dark' },
    { class: 'theme-ayu-mirage', name: 'Ayu Mirage', full: 'Ayu Mirage' },
    { class: 'theme-ayu-light', name: 'Ayu Light', full: 'Ayu Light' },
    { class: 'theme-material-darker', name: 'Material', full: 'Material Darker' },
    { class: 'theme-material-ocean', name: 'Ocean', full: 'Material Ocean' },
    { class: 'theme-material-palenight', name: 'Palenight', full: 'Material Palenight' },
    { class: 'theme-material-lighter', name: 'Material Lt', full: 'Material Lighter' },
    { class: 'theme-tomorrow-night', name: 'Tomorrow', full: 'Tomorrow Night' },
    { class: 'theme-tomorrow-night-bright', name: 'Tomorrow+', full: 'Tomorrow Night Bright' },
    { class: 'theme-tomorrow-night-blue', name: 'Tomorrow Blue', full: 'Tomorrow Night Blue' },
    { class: 'theme-base16-ocean', name: 'Base16 Ocean', full: 'Base16 Ocean' },
    { class: 'theme-base16-tomorrow', name: 'Base16', full: 'Base16 Tomorrow' },
    { class: 'theme-base16-onedark', name: 'Base16 One', full: 'Base16 OneDark' },
    { class: 'theme-base16-atelier', name: 'Base16 Atel', full: 'Base16 Atelier' },
    { class: 'theme-zenburn', name: 'Zenburn', full: 'Zenburn' },
    { class: 'theme-apprentice', name: 'Apprentice', full: 'Apprentice' },
    { class: 'theme-horizon-dark', name: 'Horizon', full: 'Horizon Dark' },
    { class: 'theme-horizon-bright', name: 'Horizon Br', full: 'Horizon Bright' },
    { class: 'theme-synthwave-84', name: 'Synthwave', full: 'Synthwave 84' },
    { class: 'theme-cyberpunk', name: 'Cyberpunk', full: 'Cyberpunk' },
    { class: 'theme-night-owl', name: 'Night Owl', full: 'Night Owl' },
    { class: 'theme-light-owl', name: 'Light Owl', full: 'Light Owl' },
    { class: 'theme-cobalt2', name: 'Cobalt2', full: 'Cobalt2' },
    { class: 'theme-palenight', name: 'Palenight', full: 'Palenight' },
    { class: 'theme-everforest-dark', name: 'Everforest', full: 'Everforest Dark' },
    { class: 'theme-everforest-light', name: 'Forest Lt', full: 'Everforest Light' },
    { class: 'theme-rose-pine', name: 'Rosé Pine', full: 'Rosé Pine' },
    { class: 'theme-rose-pine-moon', name: 'Pine Moon', full: 'Rosé Pine Moon' },
    { class: 'theme-rose-pine-dawn', name: 'Pine Dawn', full: 'Rosé Pine Dawn' },
    { class: 'theme-kanagawa', name: 'Kanagawa', full: 'Kanagawa' },
    { class: 'theme-kanagawa-wave', name: 'Kanagawa Wave', full: 'Kanagawa Wave' },
    { class: 'theme-kanagawa-lotus', name: 'Kanagawa Lotus', full: 'Kanagawa Lotus' },
    { class: 'theme-github-dark', name: 'GitHub Dark', full: 'GitHub Dark' },
    { class: 'theme-github-light', name: 'GitHub Light', full: 'GitHub Light' },
    { class: 'theme-vscode-dark', name: 'VS Dark', full: 'VS Code Dark' },
    { class: 'theme-vscode-light', name: 'VS Light', full: 'VS Code Light' },
    { class: 'theme-atom-one-dark', name: 'Atom One', full: 'Atom One Dark' },
    { class: 'theme-atom-one-light', name: 'Atom Light', full: 'Atom One Light' },
    { class: 'theme-high-contrast-dark', name: 'HC Dark', full: 'High Contrast Dark' },
    { class: 'theme-high-contrast-light', name: 'HC Light', full: 'High Contrast Light' },
    { class: 'theme-paper', name: 'Paper', full: 'Paper' },
    { class: 'theme-sepia', name: 'Sepia', full: 'Sepia' },
    { class: 'theme-midnight', name: 'Midnight', full: 'Midnight' },
    { class: 'theme-forest', name: 'Forest', full: 'Forest' },
    { class: 'theme-ocean-deep', name: 'Ocean Deep', full: 'Ocean Deep' },
    { class: 'theme-sunset', name: 'Sunset', full: 'Sunset' },
    { class: 'theme-aurora', name: 'Aurora', full: 'Aurora' },
    { class: 'theme-neon', name: 'Neon', full: 'Neon' }
];

const fonts = [
    { class: 'font-times', name: 'Times', full: 'Times New Roman' },
    { class: 'font-jetbrains', name: 'JetBrains', full: 'JetBrains Mono' },
    { class: 'font-fira', name: 'Fira Code', full: 'Fira Code' },
    { class: 'font-source', name: 'Source Code', full: 'Source Code Pro' },
    { class: 'font-ibm', name: 'IBM Plex', full: 'IBM Plex Mono' },
    { class: 'font-roboto', name: 'Roboto', full: 'Roboto Mono' },
    { class: 'font-space', name: 'Space', full: 'Space Mono' },
    { class: 'font-ubuntu', name: 'Ubuntu', full: 'Ubuntu Mono' },
    { class: 'font-inconsolata', name: 'Inconsolata', full: 'Inconsolata' },
    { class: 'font-cousine', name: 'Cousine', full: 'Cousine' },
    { class: 'font-overpass', name: 'Overpass', full: 'Overpass Mono' },
    { class: 'font-redhat', name: 'Red Hat', full: 'Red Hat Mono' },
    { class: 'font-monaco', name: 'Monaco', full: 'Monaco' },
    { class: 'font-menlo', name: 'Menlo', full: 'Menlo' },
    { class: 'font-consolas', name: 'Consolas', full: 'Consolas' },
    { class: 'font-cascadia', name: 'Cascadia', full: 'Cascadia Code' },
    { class: 'font-sf-mono', name: 'SF Mono', full: 'SF Mono' },
    { class: 'font-dejavu', name: 'DejaVu', full: 'DejaVu Sans Mono' },
    { class: 'font-liberation', name: 'Liberation', full: 'Liberation Mono' },
    { class: 'font-pt-mono', name: 'PT Mono', full: 'PT Mono' },
    { class: 'font-oxygen', name: 'Oxygen', full: 'Oxygen Mono' },
    { class: 'font-noto', name: 'Noto', full: 'Noto Sans Mono' },
    { class: 'font-recursive', name: 'Recursive', full: 'Recursive' },
    { class: 'font-cutive', name: 'Cutive', full: 'Cutive Mono' },
    { class: 'font-nova', name: 'Nova', full: 'Nova Mono' },
    { class: 'font-martian', name: 'Martian', full: 'Martian Mono' },
    { class: 'font-b612', name: 'B612', full: 'B612 Mono' }
];

let currentThemeIndex = 0;
let currentFontIndex = 0;
let unusedThemeIndices = [...Array(themes.length).keys()];
let unusedFontIndices = [...Array(fonts.length).keys()];
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
const MAX_CONTENT_SIZE = 1000000;

function throttledSave(key, value) {
    const now = Date.now();
    if (now - lastSaveTime < SAVE_THROTTLE_MS) {
        return;
    }
    lastSaveTime = now;

    try {
        if (typeof value === 'string' && value.length > MAX_CONTENT_SIZE) {
            console.warn('Content too large, not saving');
            return;
        }
        localStorage.setItem(key, value);

        // Update save indicator
        updateSaveIndicator();
    } catch (e) {
        console.error('Storage error:', e);
        // Fallback to in-memory storage if localStorage fails
        window[key] = value;
    }
}

// Update save indicator with human-readable timestamp
function updateSaveIndicator() {
    const indicator = document.getElementById('save-status');
    if (!indicator) return;

    const now = Date.now();
    const elapsed = now - lastSaveTime;

    if (elapsed < 1000) {
        indicator.textContent = 'Saved just now';
    } else if (elapsed < 60000) {
        const seconds = Math.floor(elapsed / 1000);
        indicator.textContent = `Saved ${seconds}s ago`;
    } else if (elapsed < 3600000) {
        const minutes = Math.floor(elapsed / 60000);
        indicator.textContent = `Saved ${minutes}m ago`;
    } else {
        indicator.textContent = 'Saved';
    }

    // Update every 10 seconds
    clearTimeout(window.saveIndicatorTimeout);
    window.saveIndicatorTimeout = setTimeout(updateSaveIndicator, 10000);
}

// Load saved content, theme, and font
window.addEventListener('load', () => {
    // Try localStorage first, fallback to in-memory storage
    const savedContent = localStorage.getItem('savedContent') || window.savedContent || '';
    const savedThemeIndex = parseInt(localStorage.getItem('savedThemeIndex')) || window.savedThemeIndex || 0;
    const savedFontIndex = parseInt(localStorage.getItem('savedFontIndex')) || window.savedFontIndex || 0;
    
    if (savedContent && typeof savedContent === 'string') {
        // For contenteditable, we save/load HTML
        editor.innerHTML = savedContent.slice(0, MAX_CONTENT_SIZE); // Limit content size
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
    
    // Dropdown button event listeners
    const themeDropdownBtn = document.getElementById('theme-dropdown');
    const fontDropdownBtn = document.getElementById('font-dropdown');
    
    if (themeDropdownBtn) {
        themeDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown('theme-dropdown-menu');
        });
    }
    
    if (fontDropdownBtn) {
        fontDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown('font-dropdown-menu');
        });
    }
    
    // Note: Auto-save is now handled in setupTextStyles for contenteditable
    // Enable tab key for indentation in contenteditable
    if (editor) {
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                
                // Insert tab character in contenteditable
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode('\t'));
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    // Trigger input event for auto-save
                    editor.dispatchEvent(new Event('input'));
                }
            }
        });
        
        // Prevent potential XSS through paste events
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            
            // Get plain text from clipboard
            const clipboardData = e.clipboardData || window.clipboardData;
            const text = clipboardData ? clipboardData.getData('text/plain') : '';
            
            // Insert as plain text
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Trigger input event for auto-save
                editor.dispatchEvent(new Event('input'));
                
                // Auto-scroll after paste
                setTimeout(() => autoScrollOnTyping(), 10);
            }
        });
    }
}

// Update character and word counts with security
function updateCounts() {
    if (!editor || !charCount || !wordCount) return;
    
    // For contenteditable, get the text content (without HTML tags)
    const text = editor.textContent || '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    // Sanitize output to prevent XSS
    charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

// Rotate through themes with random selection from unused options
function rotateTheme() {
    if (!themeBtn) return;
    
    const icon = themeBtn.querySelector('svg');
    if (icon) {
        icon.classList.add('rotating');
    }
    
    // Remove current theme from unused list if it exists
    const currentIndexPos = unusedThemeIndices.indexOf(currentThemeIndex);
    if (currentIndexPos > -1) {
        unusedThemeIndices.splice(currentIndexPos, 1);
    }
    
    // If no unused themes left, reset the list (excluding current theme)
    if (unusedThemeIndices.length === 0) {
        unusedThemeIndices = [...Array(themes.length).keys()].filter(i => i !== currentThemeIndex);
    }
    
    // Randomly select from unused themes
    const randomPos = Math.floor(Math.random() * unusedThemeIndices.length);
    currentThemeIndex = unusedThemeIndices[randomPos];
    
    applyTheme();
    throttledSave('savedThemeIndex', currentThemeIndex);
    
    if (icon) {
        setTimeout(() => {
            icon.classList.remove('rotating');
        }, 500);
    }
}

// Rotate through fonts with random selection from unused options
function rotateFont() {
    if (!fontBtn) return;
    
    const icon = fontBtn.querySelector('svg');
    if (icon) {
        icon.classList.add('pulsing');
    }
    
    // Remove current font from unused list if it exists
    const currentIndexPos = unusedFontIndices.indexOf(currentFontIndex);
    if (currentIndexPos > -1) {
        unusedFontIndices.splice(currentIndexPos, 1);
    }
    
    // If no unused fonts left, reset the list (excluding current font)
    if (unusedFontIndices.length === 0) {
        unusedFontIndices = [...Array(fonts.length).keys()].filter(i => i !== currentFontIndex);
    }
    
    // Randomly select from unused fonts
    const randomPos = Math.floor(Math.random() * unusedFontIndices.length);
    currentFontIndex = unusedFontIndices[randomPos];
    
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

// Dropdown functionality
function populateDropdowns() {
    const themeDropdown = document.getElementById('theme-dropdown-menu');
    const fontDropdown = document.getElementById('font-dropdown-menu');

    if (themeDropdown) {
        themeDropdown.innerHTML = themes.map((theme, index) =>
            `<div class="dropdown-item" role="menuitem" tabindex="0" data-index="${index}">${sanitizeInput(theme.full)}</div>`
        ).join('');

        themeDropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const index = parseInt(e.target.dataset.index);
                if (!isNaN(index) && index >= 0 && index < themes.length) {
                    currentThemeIndex = index;
                    applyTheme();
                    throttledSave('savedThemeIndex', currentThemeIndex);
                    closeDropdown('theme-dropdown-menu');
                }
            }
        });
    }

    if (fontDropdown) {
        fontDropdown.innerHTML = fonts.map((font, index) =>
            `<div class="dropdown-item" role="menuitem" tabindex="0" data-index="${index}">${sanitizeInput(font.full)}</div>`
        ).join('');

        fontDropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const index = parseInt(e.target.dataset.index);
                if (!isNaN(index) && index >= 0 && index < fonts.length) {
                    currentFontIndex = index;
                    applyFont();
                    throttledSave('savedFontIndex', currentFontIndex);
                    closeDropdown('font-dropdown-menu');
                }
            }
        });
    }
}

function toggleDropdown(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    
    // Close other dropdowns
    const allDropdowns = document.querySelectorAll('.dropdown-menu');
    allDropdowns.forEach(dropdown => {
        if (dropdown.id !== menuId) {
            dropdown.classList.remove('show');
        }
    });
    
    menu.classList.toggle('show');
}

function closeDropdown(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.remove('show');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.btn-wrapper')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Keyboard navigation for dropdowns (WCAG 2.1 AA compliance)
function setupDropdownKeyboardNav() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.addEventListener('keydown', (e) => {
            const items = Array.from(menu.querySelectorAll('.dropdown-item'));
            const currentIndex = items.indexOf(document.activeElement);

            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % items.length;
                    items[nextIndex].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                    items[prevIndex].focus();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    document.activeElement.click();
                    break;
                case 'Escape':
                    e.preventDefault();
                    closeAllDropdowns();
                    // Return focus to trigger button
                    const triggerBtn = document.getElementById(menu.id.replace('-menu', ''));
                    if (triggerBtn) triggerBtn.focus();
                    break;
            }
        });
    });
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });
}

// Zen Mode state
let zenModeEnabled = localStorage.getItem('zenMode') === 'true';

// Toggle Zen Mode
function toggleZenMode() {
    zenModeEnabled = !zenModeEnabled;
    if (zenModeEnabled) {
        document.body.classList.add('zen-mode');
    } else {
        document.body.classList.remove('zen-mode');
    }
    localStorage.setItem('zenMode', zenModeEnabled);
}

// Initialize Zen Mode state on load
if (zenModeEnabled) {
    document.body.classList.add('zen-mode');
}

// Comprehensive keyboard shortcuts system
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        // Escape to exit Zen mode
        if (e.key === 'Escape' && zenModeEnabled) {
            e.preventDefault();
            toggleZenMode();
            return;
        }

        // Keyboard shortcuts
        if (cmdOrCtrl && !e.shiftKey && !e.altKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    toggleDropdown('save-dropdown-menu');
                    break;
                case 't':
                    e.preventDefault();
                    rotateTheme();
                    break;
                case 'f':
                    // Only intercept if not in editor to allow browser find
                    if (document.activeElement !== editor) {
                        e.preventDefault();
                        rotateFont();
                    }
                    break;
                case '\\':
                    e.preventDefault();
                    toggleZenMode();
                    break;
            }
        }

        // F11 for full screen
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullScreen();
        }
    });
}

// Toggle full screen mode
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Privacy popup functionality
function setupPrivacyPopup() {
    const privacyBtn = document.getElementById('privacy-btn');
    const privacyOverlay = document.getElementById('privacy-overlay');
    const privacyClose = document.getElementById('privacy-close');
    const privacyClear = document.getElementById('privacy-clear');
    
    if (privacyBtn) {
        privacyBtn.addEventListener('click', () => {
            if (privacyOverlay) {
                privacyOverlay.classList.add('show');
            }
        });
    }
    
    if (privacyClose) {
        privacyClose.addEventListener('click', () => {
            if (privacyOverlay) {
                privacyOverlay.classList.remove('show');
            }
        });
    }
    
    if (privacyOverlay) {
        privacyOverlay.addEventListener('click', (e) => {
            if (e.target === privacyOverlay) {
                privacyOverlay.classList.remove('show');
            }
        });
    }
    
    if (privacyClear) {
        privacyClear.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all your stored data? This action cannot be undone.')) {
                // Clear localStorage
                try {
                    localStorage.removeItem('savedContent');
                    localStorage.removeItem('savedThemeIndex');
                    localStorage.removeItem('savedFontIndex');
                } catch (e) {
                    console.warn('Could not clear localStorage:', e);
                }
                
                // Clear in-memory storage as fallback
                window.savedContent = '';
                window.savedThemeIndex = 0;
                window.savedFontIndex = 0;
                
                // Reset UI to defaults
                if (editor) {
                    editor.innerHTML = '<p><br></p>';
                    updateCounts();
                }
                
                currentThemeIndex = 0;
                applyTheme();
                
                currentFontIndex = 0;
                applyFont();

                // Close popup
                if (privacyOverlay) {
                    privacyOverlay.classList.remove('show');
                }
                
                alert('All your data has been cleared successfully.');
            }
        });
    }
    
    // Close popup with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && privacyOverlay && privacyOverlay.classList.contains('show')) {
            privacyOverlay.classList.remove('show');
        }
    });
}

// Auto-scroll functionality when typing past bottom
function autoScrollOnTyping() {
    const selection = window.getSelection();
    if (!selection.rangeCount || !editor) return;
    
    // Get the current cursor position
    const range = selection.getRangeAt(0);
    let cursorNode = range.startContainer;
    
    // If cursor is in text node, get its parent element
    if (cursorNode.nodeType === Node.TEXT_NODE) {
        cursorNode = cursorNode.parentElement;
    }
    
    // Find the closest block element containing the cursor
    let blockElement = cursorNode;
    while (blockElement && blockElement !== editor && !['P', 'DIV'].includes(blockElement.tagName)) {
        blockElement = blockElement.parentElement;
    }
    
    if (!blockElement || blockElement === editor) return;
    
    // Get the position of the cursor block relative to the editor
    const editorRect = editor.getBoundingClientRect();
    const blockRect = blockElement.getBoundingClientRect();
    
    // Calculate if cursor is near or past the bottom of the visible area
    const cursorBottom = blockRect.bottom;
    const editorBottom = editorRect.bottom;
    const bufferSpace = 60; // Space to maintain at bottom for comfortable typing
    
    // If cursor is too close to or past the bottom, scroll to keep it visible
    if (cursorBottom > (editorBottom - bufferSpace)) {
        const scrollAmount = cursorBottom - (editorBottom - bufferSpace);
        editor.scrollTop += scrollAmount;
    }
}

// Visual text style functionality for contenteditable
function setupTextStyles() {
    const editor = document.querySelector('.editor');

    if (!editor) return;

    // MIGRATION: Convert any existing h1/h2 elements to p elements
    function migrateHeadingsToParagraphs() {
        const headings = editor.querySelectorAll('h1, h2');
        headings.forEach(heading => {
            const p = document.createElement('p');
            p.textContent = heading.textContent;
            heading.parentNode.replaceChild(p, heading);
        });
    }

    // Run migration on load
    migrateHeadingsToParagraphs();

    // Handle Enter key to create new paragraphs
    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Shift+Enter: Create line break within current block
            if (e.shiftKey) {
                document.execCommand('insertLineBreak');
                setTimeout(() => autoScrollOnTyping(), 10);
                return;
            }

            // Regular Enter: Create new paragraph
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const newP = document.createElement('p');
            newP.innerHTML = '<br>';

            const range = selection.getRangeAt(0);
            let currentBlock = range.startContainer;

            // Find current paragraph
            if (currentBlock.nodeType === Node.TEXT_NODE) {
                currentBlock = currentBlock.parentElement;
            }

            while (currentBlock && currentBlock !== editor && currentBlock.tagName !== 'P') {
                currentBlock = currentBlock.parentElement;
            }

            if (currentBlock && currentBlock !== editor) {
                currentBlock.parentNode.insertBefore(newP, currentBlock.nextSibling);
            } else {
                editor.appendChild(newP);
            }

            // Move cursor to new paragraph
            const newRange = document.createRange();
            newRange.setStart(newP, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            // Auto-scroll after creating new line
            setTimeout(() => autoScrollOnTyping(), 10);
        }
    });

    // Handle input events for persistence and auto-save
    editor.addEventListener('input', () => {
        // Ensure we always have proper paragraph elements
        if (editor.childNodes.length === 0) {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            editor.appendChild(p);
        }

        // Auto-save content
        throttledSave('savedContent', editor.innerHTML);

        // Update word/char counts
        updateCounts();

        // Auto-scroll when typing past bottom
        autoScrollOnTyping();
    });

    // Initialize with default paragraph if empty
    if (editor.innerHTML.trim() === '') {
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        editor.appendChild(p);
    }
}

// Save functionality
function setupSaveControls() {
    const saveBtn = document.getElementById('save-btn');
    const saveDropdownBtn = document.getElementById('save-dropdown');
    const saveDropdownMenu = document.getElementById('save-dropdown-menu');
    
    if (saveDropdownBtn) {
        saveDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown('save-dropdown-menu');
        });
    }
    
    if (saveDropdownMenu) {
        saveDropdownMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const format = e.target.dataset.format;
                saveDocument(format);
                closeDropdown('save-dropdown-menu');
            }
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            // Default to markdown if clicked directly
            saveDocument('markdown');
        });
    }
}

// Convert HTML content to markdown
function htmlToMarkdown(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    let markdown = '';

    // Process each paragraph element
    const blocks = tempDiv.querySelectorAll('p');
    blocks.forEach(block => {
        const text = block.textContent.trim();
        if (!text) return;

        markdown += text + '\n\n';
    });

    return markdown.trim();
}

// Parse HTML content for PDF generation
function parseContentForPDF(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const contentBlocks = [];

    // Process each paragraph element
    const blocks = tempDiv.querySelectorAll('p');
    blocks.forEach(block => {
        const text = block.textContent.trim();
        if (!text) return;

        contentBlocks.push({
            type: 'body',
            text: text,
            fontSize: 12,
            fontStyle: 'normal'
        });
    });

    return contentBlocks;
}

// Get current theme colors for PDF
function getThemeColors() {
    const body = document.body;
    const computedStyle = getComputedStyle(body);
    
    // Extract CSS custom properties
    const bg = computedStyle.getPropertyValue('--bg').trim();
    const fg = computedStyle.getPropertyValue('--fg').trim();
    const accent = computedStyle.getPropertyValue('--accent').trim();
    
    // Convert hex colors to RGB for jsPDF
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 }; // Default to black if parsing fails
    }
    
    return {
        text: hexToRgb(fg),
        accent: hexToRgb(accent),
        background: hexToRgb(bg)
    };
}

// Generate PDF using jsPDF
function generatePDF(contentBlocks) {
    // Check if jsPDF is available
    if (!window.jspdf) {
        console.error('jsPDF library not loaded');
        alert('PDF generation is not available. Please refresh the page and try again.');
        return null;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get theme colors
    const colors = getThemeColors();
    
    // Set default text color
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    
    let currentY = 30; // Starting Y position (more space for header)
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 7;
    const margin = 20;
    
    // Reset text color for content
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    
    contentBlocks.forEach(block => {
        // Check if we need a new page
        if (currentY > pageHeight - 40) {
            doc.addPage();
            currentY = 30;
        }

        // All text uses body style
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(12);

        // Add text with word wrapping
        const splitText = doc.splitTextToSize(block.text, doc.internal.pageSize.width - 2 * margin);
        doc.text(splitText, margin, currentY);

        // Calculate space used
        const linesUsed = Array.isArray(splitText) ? splitText.length : 1;
        currentY += (linesUsed * lineHeight) + 6;

        // Standard paragraph spacing
        currentY += 3;
    });
    
    // Add footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(
            `Page ${i} of ${pageCount}`, 
            doc.internal.pageSize.width / 2, 
            doc.internal.pageSize.height - 15, 
            { align: 'center' }
        );
    }
    
    return doc;
}

// Save document in specified format
function saveDocument(format) {
    if (!editor) {
        console.error('Editor not found');
        return;
    }
    
    const content = editor.innerHTML;
    const textContent = editor.textContent.trim();
    
    if (!textContent) {
        alert('Document is empty. Nothing to save.');
        return;
    }
    
    // Prompt user for filename
    const defaultExtension = format === 'markdown' ? 'md' : 'pdf';
    let filename = prompt(`Enter filename (without extension):`, 'document');
    
    // Handle user cancellation
    if (filename === null) {
        return;
    }
    
    // Clean up filename and ensure it's not empty
    filename = filename.trim();
    if (!filename) {
        filename = 'document';
    }
    
    // Remove any existing extension and add the correct one
    filename = filename.replace(/\.[^/.]+$/, '');
    filename = `${filename}.${defaultExtension}`;
    
    switch (format) {
        case 'markdown':
            const markdown = htmlToMarkdown(content);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            
            // Create and trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return;
        case 'pdf':
            // Generate PDF using jsPDF
            const contentBlocks = parseContentForPDF(content);
            if (contentBlocks.length === 0) {
                alert('No content to export to PDF.');
                return;
            }
            
            const doc = generatePDF(contentBlocks);
            if (doc) {
                doc.save(filename);
            }
            return; // Exit early for PDF
        default:
            return;
    }
}

// Initialize security measures and counts
initializeSecurity();
updateCounts();
populateDropdowns();
setupDropdownKeyboardNav(); // Enable keyboard navigation for accessibility
setupKeyboardShortcuts(); // Enable global keyboard shortcuts
setupPrivacyPopup();
setupTextStyles();
setupSaveControls();