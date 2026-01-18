# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TON3S is a minimalist, privacy-focused writing application that runs entirely in the browser. It's a single-page application built with pure HTML/CSS/JavaScript (no frameworks) with local-only data storage.

**Core Philosophy**: Privacy-first, distraction-free writing with extensive theme/font customization.

## Project Structure

```
TON3S/
├── index.html      # Main HTML structure with CSP headers
├── script.js       # All application logic (~1200 lines)
├── styles.css      # All styling including 70+ theme definitions
├── .htaccess       # Apache configuration for security headers
└── README.md       # User-facing documentation
```

## Architecture

### Single-Page Application Design
- **No build process**: Open `index.html` directly in browser
- **No dependencies** except jsPDF (loaded from CDN for PDF export)
- All state managed in vanilla JavaScript using localStorage

### Core Components

#### 1. Editor System (ContentEditable)
- Uses `contenteditable` div, not textarea
- Supports three text styles: Title (h1), Heading (h2), Body (p)
- HTML structure is stored, then converted to Markdown/PDF on export
- Auto-save on every input event (throttled to 100ms)
- Custom paste handler prevents XSS by stripping HTML

#### 2. Theme System
- 70+ themes defined as CSS classes in `styles.css`
- Each theme uses CSS custom properties: `--bg`, `--fg`, `--accent`, `--fg-dim`
- Theme classes applied to `<body>` element
- Random rotation through unused themes to avoid repetition
- Theme state tracked with `unusedThemeIndices` array

#### 3. Font System
- 27+ monospace/writing fonts defined as CSS classes
- Font classes applied to `<body>` element
- Similar random rotation system as themes
- Fonts loaded from Google Fonts (specified in CSS)

#### 4. Storage & Privacy
- **All data stored in localStorage**: `savedContent`, `savedThemeIndex`, `savedFontIndex`
- Fallback to in-memory storage if localStorage fails/disabled
- Size limit: 1MB max content (`MAX_CONTENT_SIZE`)
- Clear data button with confirmation
- No external analytics or tracking

#### 5. Export System
- **Markdown**: Converts h1/h2/p to markdown syntax (`#`, `##`, plain text)
- **PDF**: Uses jsPDF library, applies current theme colors to PDF
- Filename prompt with automatic extension handling

### Security Features

#### Input Sanitization
- `sanitizeInput()` function escapes HTML entities
- Paste events stripped to plain text only
- Custom properties validated before storage

#### Content Security Policy
Strict CSP headers in HTML:
- Scripts only from self + jsPDF CDN
- Fonts only from Google Fonts
- No inline scripts/styles
- Frame-ancestors none

#### Rate Limiting
- Storage operations throttled to prevent abuse
- 100ms minimum between saves

## Development Commands

Since this is a static site with no build process:

### Local Development
```bash
# Open in browser directly
open index.html

# Or serve with Python (for proper MIME types)
python3 -m http.server 8000

# Or serve with PHP
php -S localhost:8000
```

### Testing
No formal test suite. Manual testing workflow:
1. Test all text style buttons (Title, Heading, Body)
2. Test theme rotation (click theme button multiple times)
3. Test font rotation (click font button multiple times)
4. Test save as Markdown and PDF
5. Test privacy controls (view popup, clear data)
6. Test auto-save (refresh page, content should persist)
7. Test in private/incognito mode (should work without persistence)

## Key Implementation Details

### Text Style Application
- Text styles apply to current block element (paragraph)
- Enter key always creates new `<p>` tag and resets to body style
- Style buttons convert existing elements in-place (h1 ↔ h2 ↔ p)
- Selection spanning multiple blocks applies style to all blocks

### Auto-scroll Behavior
Custom auto-scroll when cursor approaches bottom of editor:
- Tracks cursor position in block elements
- Maintains 60px buffer at bottom
- Triggers on every input event and after paste

### Dropdown Menus
- Theme/font/save controls use custom dropdown system
- Populated dynamically from `themes` and `fonts` arrays
- Click outside to close
- Instant application on selection

### Random Theme/Font Rotation
Algorithm prevents immediate repetition:
```javascript
// Maintains array of unused indices
// When clicked: pick random from unused, remove from array
// When array empty: refill with all except current
```

## Code Conventions

### Naming
- Theme classes: `theme-{name}` (e.g., `theme-catppuccin-mocha`)
- Font classes: `font-{name}` (e.g., `font-jetbrains`)
- Data attributes for buttons: `data-style`, `data-format`, `data-index`

### CSS Custom Properties
Every theme must define:
```css
--bg: background color
--fg: foreground/text color
--accent: accent color for buttons/highlights
--fg-dim: dimmed text color
```

### Event Handling
- All event listeners added in `setupEventListeners()`
- Delegated events used for dropdown items
- Prevent default on paste/drop/drag for security

## Adding New Features

### Adding a New Theme
1. Add entry to `themes` array in `script.js`:
   ```javascript
   { class: 'theme-name', name: 'Short', full: 'Full Name' }
   ```
2. Define CSS class in `styles.css`:
   ```css
   .theme-name {
       --bg: #hexcolor;
       --fg: #hexcolor;
       --accent: #hexcolor;
       --fg-dim: #hexcolor;
   }
   ```

### Adding a New Font
1. Add entry to `fonts` array in `script.js`:
   ```javascript
   { class: 'font-name', name: 'Short', full: 'Full Name' }
   ```
2. Define CSS class in `styles.css`:
   ```css
   .font-name .editor {
       font-family: 'Font Name', monospace;
       font-size: 18px;
       line-height: 1.8;
   }
   ```
3. Import font in CSS if needed:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Font+Name&display=swap');
   ```

### Adding a New Export Format
1. Add dropdown item in `index.html`:
   ```html
   <div class="dropdown-item" data-format="newformat">Format Name</div>
   ```
2. Add case in `saveDocument()` function in `script.js`
3. Implement conversion function (see `htmlToMarkdown()` as example)

## Deployment

### Static Hosting
Deploy to any static host (GitHub Pages, Netlify, Vercel, etc.):
```bash
# No build required - deploy files as-is
git push origin main
```

### Security Headers
`.htaccess` provides Apache security headers. For other servers:
- **Nginx**: Convert headers to nginx config
- **Netlify**: Use `_headers` file
- **Vercel**: Use `vercel.json`

## Troubleshooting

### localStorage Not Working
- Check browser privacy settings
- Try incognito mode (localStorage may be disabled)
- Fallback to in-memory storage is automatic

### PDF Export Failing
- Verify jsPDF CDN is accessible
- Check browser console for CSP violations
- Ensure content has at least one non-empty block

### Themes Not Applying
- Verify theme class exists in `styles.css`
- Check that CSS custom properties are defined
- Clear browser cache if styles seem stale

### Auto-save Not Working
- Check localStorage quota (may be full)
- Verify throttle timing (100ms minimum between saves)
- Check browser console for storage errors
