# Contributing Guide

Guidelines for contributing to TON3S.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment (see [Development Guide](development.md))
4. Create a branch for your changes

## Types of Contributions

### Bug Reports

Found a bug? Please open an issue with:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

### Feature Requests

Have an idea? Open an issue describing:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Code Contributions

We welcome pull requests for:

- Bug fixes
- New features
- Performance improvements
- Documentation updates
- New themes or fonts

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `style/` - Theme/font additions

### 2. Make Changes

- Follow existing code patterns
- Keep changes focused and atomic
- Test your changes manually

### 3. Commit Changes

Write clear commit messages:

```bash
git commit -m "Add: New Solarized theme variant"
git commit -m "Fix: Editor paste handling on Safari"
git commit -m "Docs: Update Nostr guide with troubleshooting"
```

Commit message prefixes:
- `Add:` - New feature or content
- `Fix:` - Bug fix
- `Update:` - Enhancement to existing feature
- `Remove:` - Deleted code or feature
- `Refactor:` - Code restructuring
- `Docs:` - Documentation changes
- `Style:` - Formatting, themes, fonts

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Pull Request Guidelines

### PR Title

Use a clear, descriptive title:
- "Add Nord Light theme"
- "Fix Markdown export on Firefox"
- "Update keyboard shortcuts documentation"

### PR Description

Include:
- Summary of changes
- Related issue number (if applicable)
- Screenshots for UI changes
- Testing performed

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

## Code Style

### JavaScript

```javascript
// Use ES modules
import { something } from './module.js';

// Classes for components and services
class MyComponent extends BaseComponent {
  constructor() {
    super();
  }
}

// Async/await for async operations
async function loadData() {
  const data = await fetch('/api/data');
  return data.json();
}

// Single quotes for strings
const message = 'Hello, world';

// Semicolons required (Prettier `semi: true`)
const value = 42;
```

### CSS

```css
/* Use CSS custom properties for theming */
.my-element {
  background: var(--bg);
  color: var(--fg);
}

/* BEM-like naming */
.document-list { }
.document-list__item { }
.document-list__item--active { }

/* Mobile-first responsive design */
.sidebar {
  width: 100%;
}

@media (min-width: 768px) {
  .sidebar {
    width: 250px;
  }
}
```

### File Organization

- Components in `frontend/src/components/`
- Services in `frontend/src/services/`
- Utilities in `frontend/src/utils/`
- Styles in `frontend/src/styles/`
- Static data in `frontend/src/data/`

## Adding Themes

### 1. Add Theme Definition

In `frontend/src/data/themes.js`:

```javascript
export const themes = [
  // ... existing themes
  {
    class: 'theme-my-theme',     // CSS class name
    name: 'MyTheme',             // Short display name
    full: 'My Custom Theme'      // Full name for tooltip
  }
];
```

### 2. Add CSS Variables

In `frontend/src/styles/themes.css`:

```css
.theme-my-theme {
  --bg: #1a1a2e;      /* Background color */
  --fg: #eaeaea;      /* Text color */
  --accent: #e94560;  /* Accent/highlight color */
  --fg-dim: #888888;  /* Dimmed text color */
}
```

### Theme Guidelines

- Ensure sufficient contrast between `--bg` and `--fg`
- Test with both light and dark content
- Verify readability in all UI areas
- Include in appropriate category (e.g., Catppuccin variants together)

## Adding Fonts

### 1. Add Font Definition

In `frontend/src/data/fonts.js`:

```javascript
export const fonts = [
  // ... existing fonts
  {
    class: 'font-my-font',       // CSS class name
    name: 'MyFont',              // Short display name
    full: 'My Custom Font'       // Full name for tooltip
  }
];
```

### 2. Download Font Files

Download woff2 files (400 + 600 weights) to `frontend/public/fonts/`:

```bash
# Example: download from Google Fonts or font source
# Place files as: public/fonts/MyFont-Regular.woff2, public/fonts/MyFont-SemiBold.woff2
```

### 3. Add @font-face Declarations

In `frontend/src/styles/base.css`:

```css
@font-face {
    font-family: 'My Font';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/MyFont-Regular.woff2') format('woff2');
}
@font-face {
    font-family: 'My Font';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url('/fonts/MyFont-SemiBold.woff2') format('woff2');
}
```

### 4. Add Font Class

In `frontend/src/styles/fonts.css`:

```css
.font-my-font { --font: 'My Font', monospace; }
```

### Font Guidelines

- Use monospace or writing-optimized fonts
- Ensure good readability at default sizes
- Test with various content types
- Self-host all font files (no external CDN requests)

## Adding Features

### Planning

1. Open an issue to discuss the feature
2. Wait for maintainer feedback
3. Agree on implementation approach

### Implementation

1. Follow existing patterns (components, services, state)
2. Keep changes minimal and focused
3. Update documentation if needed
4. Add to manual testing checklist

### Example: Adding a New Export Format

1. Add export method in service:
```javascript
// In ExportService.js
exportNoteAsNewFormat(note) {
    const content = this.convertToNewFormat(note);
    const filename = `${this.sanitizeFilename(note.title || 'untitled')}.ext`;
    this.downloadFile(content, filename, 'text/newformat');
}
```

2. Add menu option in StatusBar settings popup and wire it to the export method.

Current export formats: JSON (single note, all notes) and Markdown (with YAML frontmatter).

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Feature works as intended
- [ ] No console errors
- [ ] Works in Chrome, Firefox, Safari
- [ ] Mobile responsive (if UI change)
- [ ] Existing features still work
- [ ] Theme/font changes look correct

### Browser Testing

Test in at least:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)

## Documentation

### When to Update Docs

- New features: Update user-guide.md
- API changes: Update architecture.md
- Setup changes: Update development.md or deployment.md
- New components: Update CLAUDE.md

### Documentation Style

- Clear, concise language
- Code examples where helpful
- Tables for structured information
- Step-by-step instructions for procedures

## Community Guidelines

### Be Respectful

- Treat everyone with respect
- Be patient with new contributors
- Give constructive feedback

### Be Helpful

- Answer questions when you can
- Share knowledge and experience
- Help review PRs

### Be Professional

- Focus on the code, not the person
- Accept feedback gracefully
- Acknowledge mistakes

## Questions?

- Open a GitHub issue for questions
- Tag with "question" label
- Check existing issues first

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to TON3S!
