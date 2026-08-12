# Section Nav for ChatGPT — Release Notes

## 1.0.1

- Fixes bookmarks becoming unavailable after scrolling far away from the original answer.
- Uses stable response identifiers and structural heading locators instead of conversation-wide title matching.
- Restores virtualized targets through saved scroll anchors and bounded Turn-aware recovery.
- Prevents jumps to similarly named headings in other answers.
- Automatically upgrades compatible 1.0.0 bookmarks when their targets are available.

## 1.0.0

### Highlights

- Navigates h1, h2, and h3 sections inside the currently read ChatGPT answer.
- Tracks the active answer and active section with stable reading-band behavior.
- Supports smooth section jumps and temporary target highlighting.
- Saves section bookmarks locally with a conversation-specific Bookmark Drawer.
- Handles ChatGPT SPA navigation, streaming answers, lazy DOM updates, and light/dark themes.
- Adapts between Full, Compact, Mini, and hidden Rail modes without resizing ChatGPT content.

### Privacy

- No account, backend, analytics, telemetry, or remote code.
- No conversation content is uploaded to any server.
- Bookmark metadata is stored only in `chrome.storage.local` in the current browser profile.

### Permissions

- `storage`: persists section bookmarks locally.
- Site access is limited to `https://chatgpt.com/*` through the content-script match pattern.

### Known limitations

- ChatGPT DOM changes may require updates to `src/content/chatgptAdapter.ts`.
- A bookmarked target can be temporarily unavailable while ChatGPT has not mounted that answer in the DOM.
- Bookmarks do not sync across browsers or devices.

### Trademark notice

Section Nav for ChatGPT is an independent extension and is not affiliated with, endorsed by, or sponsored by OpenAI.
