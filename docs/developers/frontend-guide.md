# Frontend Guide

## Key Directories

- `frontend/src/components/`: UI components (`Header`, `Sidebar`, `Editor`, `StatusBar`, `NostrPanel`, `DonationPanel`)
- `frontend/src/services/`: business logic and external integration
- `frontend/src/state/`: `AppState` + `StateEmitter` event model
- `frontend/src/utils/`: markdown conversion, keyboard handling, sanitization
- `frontend/src/data/`: themes, fonts, static config
- `frontend/src/styles/`: modular CSS files

## High-Impact Files

- `frontend/src/main.js`: app bootstrap, component wiring, keyboard setup
- `frontend/src/state/AppState.js`: state shape and event emission
- `frontend/src/components/Editor.js`: editor behavior, media insertion, auto-zen
- `frontend/src/components/StatusBar.js`: settings modal, import/export actions
- `frontend/src/services/`: external IO boundaries (storage, nostr, media)

## Entry Point

`frontend/src/main.js` initializes:

1. WASM signer loading (non-blocking)
2. IndexedDB and settings load
3. Theme/font/zen mode application
4. Component initialization
5. Note loading and keyboard shortcut wiring

## State Model

`AppState` is a singleton state container with event emission.

State areas:

- Notes
- Settings (theme/font/zen/panel states)
- Nostr session status
- Media upload status
- UI state (search, save status, mobile page)

## Core Services

- `StorageService`: note CRUD, settings persistence, migration
- `NostrAuthService`: extension and WASM-based signing
- `NostrService`: proxy socket session and relay messaging
- `BlossomService` / `MediaService`: media validation and upload handling
- `ExportService`: JSON/Markdown import/export

## Frontend Extension Patterns

### Add a component

1. Add class in `frontend/src/components/`.
2. Initialize from `main.js`.
3. Subscribe to relevant `StateEvents`.
4. Add styles under `frontend/src/styles/`.

### Add state event

1. Define event key in `StateEvents`.
2. Emit on mutation in `AppState`.
3. Subscribe in consumer component/service.

### Add theme/font

- Append entries in `frontend/src/data/themes.js` or `frontend/src/data/fonts.js`.
- Add required CSS variables or font-face declarations.

## Next Step

1. Use [Testing and Quality](testing-and-quality.md) to verify frontend changes.
2. If API/proxy behavior is involved, cross-check with [Backend Guide](backend-guide.md).
