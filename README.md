# Section Nav for ChatGPT

[English](README.md) | [简体中文](README.zh-CN.md)

A Manifest V3 extension for Microsoft Edge and Chrome that adds lightweight heading navigation and local section bookmarks to the active ChatGPT answer.

## Installation

### Microsoft Edge Add-ons

Microsoft Edge users can install the extension directly from [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/section-nav-for-chatgpt/ibcdhgbcipkecehpaogbhfhacnaaafdd).

### Build from source

Requirements:

- Node.js 22.12 or newer
- npm 10 or newer

Install dependencies:

```bash
npm install
```

## Development

Start a watch build:

```bash
npm run dev
```

After each rebuild, refresh the extension on `edge://extensions` or `chrome://extensions`, then refresh the ChatGPT tab.

## Build

Run strict TypeScript checking and create the production extension bundle:

```bash
npm run build
```

The Edge/Chrome extension is written to `dist/`. Build the Firefox 142+ version separately:

```bash
npm run build:firefox
```

The Firefox extension is written to `dist-firefox/`.

## Load unpacked

### Microsoft Edge

1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this project's `dist/` directory.
5. Open or refresh `https://chatgpt.com/`.

### Google Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this project's `dist/` directory.
5. Open or refresh `https://chatgpt.com/`.

The extension derives text and surface colors from ChatGPT's computed page styles and follows page or system theme changes without relying on ChatGPT class names. Long Section Rails keep the active item visible, the Drawer exposes dialog semantics and keyboard focus, reduced-motion preferences are respected, and forced-colors mode receives explicit focus and border treatment.

## Repository contents

- `src/` contains the extension source code shared by Edge, Chrome, and Firefox.
- `manifest.json` is the Edge and Chrome Manifest V3 configuration.
- `manifest.firefox.json` is the Firefox Manifest V3 configuration.
- `assets/` and `public/icons/` contain editable branding and runtime icon assets.
- `packaging/` contains local installation instructions.
- Generated dependencies, builds, temporary packages, and release archives are excluded through `.gitignore`.

## Architecture

- `manifest.json` declares the Manifest V3 content script and limits page access to `https://chatgpt.com/*`.
- `manifest.firefox.json` adds the stable Gecko extension ID and Mozilla data-collection declaration.
- `src/content/index.tsx` is the content-script entry point and mounts React once.
- `src/content/extensionRoot.ts` creates the idempotent host and open Shadow DOM root.
- `src/content/chatgptAdapter.ts` contains all ChatGPT-specific selectors and DOM access methods.
- `src/content/answerTracker.ts` scores cached assistant messages against a viewport reading band and applies hysteresis before switching.
- `src/content/sectionParser.ts` parses only the active answer and creates stable section keys, IDs, levels, and relative depths.
- `src/content/sectionTracker.ts` tracks the current section against the viewport reading line without querying the DOM tree during scroll.
- `src/content/sectionNavigation.ts` performs offset-aware smooth scrolling and temporary target highlighting.
- `src/content/positionManager.ts` observes active-answer dimensions and viewport resize events, then selects Full, Compact, Mini, or hidden positioning.
- `src/content/bookmarkService.ts` validates and serializes `chrome.storage.local` bookmark operations.
- `src/content/bookmarkResolver.ts` resolves stored bookmarks through exact and compatibility fallbacks.
- `src/content/components/BookmarkDrawer.tsx` renders the current conversation's temporary bookmark list.
- `src/content/conversationRouteWatcher.ts` detects SPA Conversation Key changes and provides cleanup.
- `src/content/conversationWatcher.ts` debounces DOM mutations and separates active-answer updates from message-structure updates.
- `src/content/themeManager.ts` synchronizes computed ChatGPT colors into Shadow DOM CSS variables.
- `src/content/components/` contains the isolated React Section Rail components.
- `src/content/styles/extension.css` contains Shadow DOM-scoped rail styles.
- `src/shared/` contains reusable text normalization, hashing, and core data types.
- `src/content/App.tsx` composes the Section Rail UI.
- `vite.config.ts` emits a stable `content.js` filename and copies the extension manifest into `dist/`.

## DOM Adapter

All ChatGPT-specific selectors and DOM traversal are isolated in `src/content/chatgptAdapter.ts`. The adapter currently exposes conversation-key, conversation-container, assistant-message, message-ID, message-content, and heading lookup methods. Stable `data-*` and semantic selectors are preferred; the `.markdown` class is only a final content fallback.

## Bookmark storage

Bookmarks are stored under `chatgptSectionNav.bookmarks.v1` in `chrome.storage.local`. Records are isolated by Conversation Key and contain section metadata plus a short hashed answer fingerprint. No data is uploaded to a server.

## Known limitations

- Light/Dark Theme synchronization, long-list active-item visibility, reduced motion, and forced-colors support are included in version 1.0.0.
- ChatGPT DOM virtualization can make a bookmark target temporarily unavailable until its answer is mounted. This temporary state never deletes or invalidates the stored bookmark and is cleared when message structure changes or the conversation is re-entered.
- The extension currently matches only `https://chatgpt.com/*`.

If ChatGPT changes its DOM, `src/content/chatgptAdapter.ts` is the primary compatibility layer to update.

## License

This project is licensed under the [MIT License](LICENSE). Copyright (c) 2026 scandishoper.
